import React, { useEffect, useState } from 'react';
import { createFloatAdd, updateAgent, updateCompany, updateGroup, updateSAgent, updateSMAccount } from '../../../src/graphql/mutations';
import { getAgent, getCompany, getGroup, getSAgent, getSMAccount } from '../../../src/graphql/queries';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient();
const SMADepositForm = props => {
  const [UsrPWd, setUsrPWd] = useState("");
  const [AgentPhn, setAgentPhn] = useState("");
  const [grpKntct, setgrpKntct] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchAcDtls = async () => {
    if (isLoading) return;
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
          const owners = ChmAcDtl.data.getGroup.signitory2Sub;
          const onChamaAc = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
              await client.graphql({
                query: updateGroup,
                variables: {
                  input: {
                    grpContact: grpKntct,
                    WithdrawCnfrmtn: "YES",
                    WithdrawCnfrmtnAmt: amount
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
        Alert.alert("Please first create main account");
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
    Alert.alert(t.pleaseCreateMain);
  };
  useEffect(() => {
    setgrpKntct(grpKntct || "");
  }, [grpKntct]);
  useEffect(() => {
    setAmount(amount || "");
  }, [amount]);
  useEffect(() => {
    setUsrPWd(UsrPWd || "");
  }, [UsrPWd]);
  useEffect(() => {
    setAgentPhn(AgentPhn || "");
  }, [AgentPhn]);

  };


  return (
    <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
      <View style={styles.amountTitleView}>
        <Text style={styles.title}>{t.fillDetailsBelow || 'Fill Details Below'}</Text>
      </View>

      <View style={styles.sendAmtView}>
        <Text style={styles.sendAmtText}>{t.chamaAccountLabel || 'Chama Account'}</Text>
        <TextInput
          value={grpKntct}
          onChangeText={setgrpKntct}
          style={styles.sendAmtInput}
          editable={!isLoading}
          placeholder={t.chamaAccountPlaceholder || 'Enter Chama Account'}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.sendAmtView}>
        <Text style={styles.sendAmtText}>{t.amountLabel || 'Amount'}</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          style={styles.sendAmtInput}
          editable={!isLoading}
          placeholder={t.amountPlaceholder || 'Enter Amount'}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.sendAmtView}>
        <Text style={styles.sendAmtText}>{t.signatory2PwLabel || 'Signatory2 User PW'}</Text>
        <TextInput
          value={UsrPWd}
          onChangeText={setUsrPWd}
          secureTextEntry={true}
          style={styles.sendAmtInput}
          editable={!isLoading}
          placeholder={t.signatory2PwPlaceholder || 'Enter Signatory2 Password'}
          autoCapitalize="none"
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
          <Text style={styles.sendAmtButtonText}>{t.confirmWithdrawButton || 'Click to confirm Withdraw'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};
export default SMADepositForm;

// Professional StyleSheet for the form UI
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  amountTitleView: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 8,
  },
  sendAmtView: {
    marginBottom: 18,
  },
  sendAmtText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
    fontWeight: '500',
  },
  sendAmtInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafbfc',
    color: '#222',
  },
  sendAmtButton: {
    backgroundColor: '#0077cc',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  sendAmtButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});