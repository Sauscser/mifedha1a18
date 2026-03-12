import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getChamaMembers, getGroup, getCompany, getSMAccount, getMiFedhaBankAdmin, getChamaControlTable } from '../../../src/graphql/queries';
import { createGroupNonLoans, updateChamaMembers, updateMiFedhaBankAdmin, updateChamaControlTable, updateCompany, updateSMAccount, updateGroup, createMessages, sendNotification } from '../../../src/graphql/mutations';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();
const themeColor = '#e29d59';
const SMASendNonLns = () => {
  // i18n translation pattern
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [senderNatId, setSenderNatId] = useState('');
  const [senderPW, setSenderPW] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userNationality, setUserNationality] = useState<string>(null);
  const route = useRoute();
  
  const { ratesMap } = useExchange();
  const userCode = nationalityToCode(userNationality);
  const userCurrencyKey = userCode || userNationality || undefined;
  const currencySymbol =
    (userCurrencyKey && ratesMap?.[userCurrencyKey]?.symbol) ||
    (userCode && ratesMap?.[userCode]?.symbol) ||
    (userNationality && ratesMap?.[userNationality]?.symbol) ||
    'KSh';

  // Parse amount input
  const parseAmountInput = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Handle money input with 2-decimal enforcement
  const handleMoneyInput = (setter: (value: string) => void) => (value: string) => {
    if (/^\d*(\.\d{0,2})?$/.test(value) || value === '') {
      setter(value);
    }
  };

  // Format to exactly 2 decimals on blur
  const formatMoneyOnBlur = (value: string, setter: (value: string) => void) => {
    const num = parseAmountInput(value);
    if (num > 0) {
      setter(num.toFixed(2));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const userData = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: attributes.email },
        });
        setUserNationality(userData.data.getSMAccount.nationality);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);
  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSenderPW('');
  };
  const showAlert = (message: string) => Alert.alert(message);
  const fetchChamaMemberDetails = async () => {
        // Validate ChamaNMember param
        if (!route.params || !('ChamaNMember' in route.params) || !route.params.ChamaNMember) {
          showAlert('Member ID is missing. Please retry from the previous screen.');
          return;
        }
    if (isLoading) return;
    
    // Parse amount input
    const amountForeign = parseAmountInput(amount);
    // Show confirmation dialog with user-input amount and currency symbol
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        t.confirmSendMoney,
        t.confirmSendMoneyBody.replace('{amount}', `${currencySymbol} ${amountForeign.toFixed(2)}`),
        [
          { text: t.cancel, style: 'cancel', onPress: () => resolve(false) },
          { text: t.send, onPress: () => resolve(true) }
        ]
      );
    });
    if (!confirmed) return;
    // Convert amount to KES for backend processing
    const amountInKES = await convertForeignToKsh(amountForeign, userCurrencyKey);

    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const memberData: any = await client.graphql({
        query: getChamaMembers,
        variables: {
          ChamaNMember: route.params.ChamaNMember
        }
      });
      const {
        groupContact,
        memberContact,
        NonLoanAcBal,
        ttlNonLonAcBal
      } = memberData.data.getChamaMembers;

      // Fetch group details
      const groupData: any = await client.graphql({
        query: getGroup,
        variables: {
          grpContact: groupContact
        }
      });
      const group = groupData.data.getGroup;
      if (group.status !== 'AccountActive') {
        showAlert(t.senderInactive);
        setIsLoading(false);
        return;
      }

      // Fetch receiver details
      const receiverData: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: memberContact
        }
      });
      const receiver = receiverData.data.getSMAccount;
      if (receiver.acStatus !== 'AccountActive') {
        showAlert(t.receiverInactive);
        setIsLoading(false);
        return;
      }
      if (parseFloat(receiver.balance) + amountInKES > parseFloat(receiver.MaxAcBal)) {
        showAlert(t.receiverWalletExceeded);
        setIsLoading(false);
        return;
      }
      const totalTransaction = amountInKES; // Simplified; add fees if needed

      if (parseFloat(group.grpBal) < totalTransaction) {
        showAlert(
          t.insufficientGroupBalance.replace('{amount}', formatAmountSync(parseFloat(group.grpBal), userCurrencyKey, ratesMap))
        );
        setIsLoading(false);
        return;
      }

      // Create Non-Loan transaction
            // Log all required fields before mutation
            console.log('Mutation input check:', {
              grpContact: groupContact,
              recipientPhn: memberContact,
              receiverName: receiver.name,
              SenderName: group.grpName,
              ReceiverEmail: receiver.memberContact,
              amountSent: Math.round(amountInKES),
              description: description || 'No description provided',
              memberId: route.params.ChamaNMember,
              senderEmail: attributes.email,
              confirm1: 'NO',
              confirm2: 'NO',
              signatory2: group.signatory2Email,
              signatory3: group.Signatory3Email,
              status: 'AccountActive',
              owner: user.userId
            });
            // Validate required fields
            const requiredFields = [
              { key: 'grpContact', value: groupContact },
              { key: 'recipientPhn', value: memberContact },
              { key: 'receiverName', value: receiver.name },
              { key: 'SenderName', value: group.grpName },
              { key: 'amountSent', value: Math.round(amountInKES) },
              { key: 'memberId', value: route.params.ChamaNMember },
              { key: 'senderEmail', value: attributes.email },
              { key: 'owner', value: user.userId }
            ];
            const missing = requiredFields.filter(f => f.value === null || f.value === undefined || f.value === '');
            if (missing.length > 0) {
              showAlert('Missing required field(s): ' + missing.map(f => f.key).join(', '));
              setIsLoading(false);
              return;
            }
      await client.graphql({
        query: createGroupNonLoans,
        variables: {
          input: {
            grpContact: groupContact,
            recipientPhn: memberContact,
            receiverName: receiver.name,
            SenderName: group.grpName,
            amountSent: Math.round(amountInKES),
            description: description || 'No description provided',
            memberId: route.params.ChamaNMember,
            senderEmail: attributes.email,
            confirm1: 'NO',
            confirm2: 'NO',
            signatory2: group.signatory2Email,
            signatory3: group.Signatory3Email,
            status: 'AccountActive',
            owner: user.userId
          }
        }
      });

      // Notify receiver
      const formattedAmount = formatAmountSync(amountInKES, userCurrencyKey, ratesMap);
      const notificationBody = t.notificationBody
        .replace('{receiverName}', receiver.name)
        .replace('{groupName}', group.grpName)
        .replace('{amount}', formattedAmount)
        .replace('{phone}', attributes.phone_number);
      
      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            senderEmail: receiver.awsemail,
            messageBody: notificationBody
          }
        }
      });
      
      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail: receiver.awsemail,
          title: t.notificationTitle,
          body: notificationBody
        }
      });
      
      showAlert(
        t.remittanceSuccess.replace('{amount}', `${currencySymbol} ${amountForeign.toFixed(2)}`)
      );
      resetForm();
    } catch (error) {
      console.log(error);
      showAlert(t.errorRetry);
    }
    setIsLoading(false);
  };
  return <View style={{
    flex: 1,
    backgroundColor: '#fff'
  }}>
      <ScrollView contentContainerStyle={{
      padding: 20
    }}>
        <Text style={{
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: themeColor
      }}>
          {t.fillAccountDetails}
        </Text>

        <View style={{
        marginBottom: 15
      }}>
          <TextInput
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={handleMoneyInput(setAmount)}
            onBlur={() => formatMoneyOnBlur(amount, setAmount)}
            placeholder={t.enterAmount}
            style={{
              borderWidth: 1,
              borderColor: themeColor,
              borderRadius: 8,
              padding: 12,
              fontSize: 16
            }}
          />
          <Text style={{ color: '#555', marginTop: 5 }}>
            {currencySymbol} {amount || '0.00'}
          </Text>
        </View>

        <View style={{
        marginBottom: 25
      }}>
          <TextInput multiline value={description} onChangeText={setDescription} placeholder={t.enterDescription} style={{
          borderWidth: 1,
          borderColor: themeColor,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          minHeight: 80,
          textAlignVertical: 'top'
        }} />
          <Text style={{
          color: '#555',
          marginTop: 5
        }}>{t.description}</Text>
        </View>

        <TouchableOpacity onPress={fetchChamaMemberDetails} style={{
        backgroundColor: themeColor,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
      }} disabled={isLoading}>
          {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold'
        }}>{t.send}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>;
};
export default SMASendNonLns;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  scrollViewContent: {
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e29d58',
    marginBottom: 20
  },
  inputContainer: {
    marginBottom: 15
  },
  input: {
    borderWidth: 1,
    borderColor: "#e29d58",
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  inputMultiline: {
    borderWidth: 1,
    borderColor: "#e29d58",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top' // ensures text aligns at the top
  },
  inputLabel: {
    color: '#555',
    marginTop: 5,
    fontSize: 14
  },
  sendButton: {
    backgroundColor: themeColor,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  activityIndicator: {
    marginLeft: 10
  }
});