import React, { useEffect, useState } from 'react';
import { createFloatAdd, updateAgent, updateCompany, updateGroup, updateSAgent, updateSMAccount } from '../../../../src/graphql/mutations';
import { getAgent, getCompany, getGroup, getSAgent, getSMAccount } from '../../../../src/graphql/queries';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';

import { StyleSheet } from 'react-native';

const client = generateClient();
const SMADepositForm = props => {
    const { i18n } = useTranslation();
    const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const t = translations[lang] || translations.en;
  const [UsrPWd, setUsrPWd] = useState("");
  const [AgentPhn, setAgentPhn] = useState("");
  const [grpKntct, setgrpKntct] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userNationality, setUserNationality] = useState<string>(null);
  
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
  const fetchAcDtls = async () => {
    if (isLoading) return;
    
    // Convert amount to KES
    const amountForeign = parseAmountInput(amount);
    const amountInKES = typeof convertForeignToKsh === 'function' && convertForeignToKsh.length >= 2
      ? await convertForeignToKsh(amountForeign, userCurrencyKey)
      : await convertForeignToKsh(amountForeign);

    // Confirmation prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        t.confirmWithdrawal,
        t.confirmWithdrawalBody.replace('{{amount}}', formatAmountSync(amountInKES, userCurrencyKey)),
        [
          { text: t.cancel, style: 'cancel', onPress: () => resolve(false) },
          { text: t.confirm, onPress: () => resolve(true) }
        ]
      );
    });

    if (!confirmed) return;

    setIsLoading(true);
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const accountDtl: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const pws = accountDtl.data.getSMAccount.pw;
      const owner = accountDtl.data.getSMAccount.owner;
      const fetchChamaDtls = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
          const ChmAcDtl: any = await client.graphql({
            query: getGroup,
            variables: {
              grpContact: grpKntct
            }
          });
          const owners = ChmAcDtl.data.getGroup.Signatory3Email;
          const WithdrawCnfrmtn = ChmAcDtl.data.getGroup.WithdrawCnfrmtn;
          const WithdrawCnfrmtnAmt = ChmAcDtl.data.getGroup.WithdrawCnfrmtnAmt;
          const onChamaAc = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
              await client.graphql({
                query: updateGroup,
                variables: {
                  input: {
                    grpContact: grpKntct,
                    WithdrawCnfrmtn2: "YES",
                    WithdrawCnfrmtnAmt: Math.floor(amountInKES)
                  }
                }
              });
            } catch (error) {
              console.log(error);
              Alert.alert(t.checkInternet);
              return;
            }
            setIsLoading(false);
            Alert.alert(t.withdrawalConfirmed);
          };
          if (attributes.email !== owners) {
            Alert.alert(t.notAuthorised);
            return;
          } else if (WithdrawCnfrmtn === "NO") {
            Alert.alert(t.letSecondSignatoryConfirm);
            return;
          } else if (WithdrawCnfrmtnAmt !== Math.floor(amountInKES)) {
            Alert.alert(t.enterAmountAgreed.replace('{{expected}}', formatAmountSync(parseFloat(WithdrawCnfrmtnAmt), userCurrencyKey)));
            return;
          } else if (UsrPWd !== pws) {
            Alert.alert(t.credentialsWrong);
            return;
          } else {
            await onChamaAc();
          }
        } catch (error) {
          console.log(error);
          Alert.alert("Check your internet connection");
          return;
        } finally {
          setIsLoading(false);
        }
      };
      if (user.userId !== owner) {
        Alert.alert(t.pleaseCreateMain);
      } else {
        await fetchChamaDtls();
      }
    } catch (e) {
      console.log(e);
      Alert.alert(t.checkYourInternet);
      return;
    } finally {
      setIsLoading(false);
      setAmount("");
      setUsrPWd("");
      setgrpKntct("");
    }
  };
  return (
   
    <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
      <View style={styles.amountTitleView}>
        <Text style={styles.title}>{t.fillDetailsBelow}</Text>
      </View>

      <View style={styles.sendAmtView}>
        <Text style={styles.sendAmtText}>{t.chamaAccount}</Text>
        <TextInput
          placeholder={t.chamaAccountPlaceholder}
          value={grpKntct}
          onChangeText={setgrpKntct}
          style={styles.sendAmtInput}
          editable={!isLoading}
          autoCapitalize="none"
          numberOfLines={2}
          multiline
        />
      </View>

      <View style={styles.sendAmtView}>
        <Text style={styles.sendAmtText}>{t.amount}</Text>
        <TextInput
          keyboardType="decimal-pad"
          placeholder={t.amountPlaceholder}
          value={amount}
          onChangeText={handleMoneyInput(setAmount)}
          onBlur={() => formatMoneyOnBlur(amount, setAmount)}
          style={styles.sendAmtInput}
          editable={!isLoading}
          numberOfLines={2}
          multiline
        />
      </View>

      <View style={styles.sendAmtView}>
        <Text style={styles.sendAmtText}>{t.signatory3Pw}</Text>
        <TextInput
          placeholder={t.signatory3PwPlaceholder}
          value={UsrPWd}
          onChangeText={setUsrPWd}
          secureTextEntry={true}
          style={styles.sendAmtInput}
          editable={!isLoading}
          autoCapitalize="none"
          numberOfLines={2}
          multiline
        />
      </View>

      <TouchableOpacity
        onPress={fetchAcDtls}
        style={[styles.sendAmtButton, isLoading && { opacity: 0.6 }]}
        disabled={isLoading || !grpKntct || !amount || !UsrPWd}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.sendAmtButtonText}>{t.clickToConfirmWithdraw}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};
export default SMADepositForm;

const styles = StyleSheet.create({
  amountTitleView: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2471a3', // skyblue shade for title
    marginBottom: 8,
  },
  sendAmtView: {
    marginBottom: 18,
  },
  sendAmtText: {
    fontSize: 15,
    color: '#e29d58', // theme accent
    marginBottom: 6,
    fontWeight: '500',
    minWidth: 140, // ensure label doesn't wrap awkwardly
  },
  sendAmtInput: {
    borderWidth: 1,
    borderColor: '#b3d8f7', // light skyblue border
    borderRadius: 8,
    paddingHorizontal: 18, // increased padding
    paddingVertical: 16, // increased padding
    fontSize: 16,
    backgroundColor: '#f0f8ff', // very light skyblue
    color: '#222',
    minHeight: 48, // more height for larger text
    width: '100%', // take full width of parent
  },
  sendAmtButton: {
    backgroundColor: '#2471a3', // skyblue
    paddingVertical: 20, // increased padding
    paddingHorizontal: 32, // increased padding
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#e29d58',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 180, // ensure button text fits
    alignSelf: 'center',
  },
  sendAmtButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});