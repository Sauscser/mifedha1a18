import React, { useState, useEffect } from 'react';
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
  const [senderNatId, setSenderNatId] = useState('');
  const [senderPW, setSenderPW] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userNationality, setUserNationality] = useState<string>(null);
  const route = useRoute();
  
  const { ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(userNationality);

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
    if (isLoading) return;
    
    // Convert amount to KES
    const amountForeign = parseAmountInput(amount);
    const amountInKES = convertForeignToKsh(amountForeign, userCurrencyKey, ratesMap);

    // Confirmation prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Send Money',
        `You are about to send ${formatAmountSync(amountInKES, userCurrencyKey, ratesMap)} to this member. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Send', onPress: () => resolve(true) }
        ]
      );
    });

    if (!confirmed) return;

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
        showAlert('Sender account is inactive');
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
        showAlert('Receiver account is inactive');
        setIsLoading(false);
        return;
      }
      if (parseFloat(receiver.balance) + amountInKES > parseFloat(receiver.MaxAcBal)) {
        showAlert('Receiver wallet capacity exceeded. Contact customer care.');
        setIsLoading(false);
        return;
      }
      const totalTransaction = amountInKES; // Simplified; add fees if needed

      if (parseFloat(group.grpBal) < totalTransaction) {
        showAlert(`Insufficient group balance. Available: ${formatAmountSync(parseFloat(group.grpBal), userCurrencyKey, ratesMap)}`);
        setIsLoading(false);
        return;
      }

      // Create Non-Loan transaction
      await client.graphql({
        query: createGroupNonLoans,
        variables: {
          input: {
            grpContact: groupContact,
            recipientPhn: memberContact,
            receiverName: receiver.name,
            SenderName: group.grpName,
            amountSent: amountInKES.toFixed(0),
            description,
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
      const notificationBody = `Hi ${receiver.name}, ${group.grpName} has sent you ${formattedAmount}. Contact ${attributes.phone_number} for clarification.`;
      
      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            senderEmail: receiver.memberContact,
            messageBody: notificationBody
          }
        }
      });
      
      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail: receiver.memberContact,
          title: 'NiSenti: Money Received from Group',
          body: notificationBody
        }
      });
      
      showAlert(`Remittance of ${formattedAmount} successfully booked`);
      resetForm();
    } catch (error) {
      console.log(error);
      showAlert('Error! Retry or update app.');
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
          Fill Account Details Below
        </Text>

        <View style={{
        marginBottom: 15
      }}>
          <TextInput keyboardType="decimal-pad" value={amount} onChangeText={handleMoneyInput(setAmount)} onBlur={() => formatMoneyOnBlur(amount, setAmount)} placeholder="Enter Amount" style={{
          borderWidth: 1,
          borderColor: themeColor,
          borderRadius: 8,
          padding: 12,
          fontSize: 16
        }} />
          <Text style={{
          color: '#555',
          marginTop: 5
        }}>Amount Sent</Text>
        </View>

        <View style={{
        marginBottom: 25
      }}>
          <TextInput multiline value={description} onChangeText={setDescription} placeholder="Enter Description" style={{
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
        }}>Description</Text>
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
        }}>Send</Text>}
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