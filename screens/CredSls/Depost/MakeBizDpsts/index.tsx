// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { createFloatReduction, updateAgent, updateBizna, updateCompany, updateSMAccount, createMessages, sendNotification } from '../../../../src/graphql/mutations';
import { getAgent, getBizna, getCompany, getSMAccount } from '../../../../src/graphql/queries';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const SMADepositForm = props => {
  const [nationalId, setNationalid] = useState("");
  const [agPWd, setAgPWd] = useState("");
  const [AgentPhn, setAgentPhn] = useState("");
  const [amount, setAmount] = useState("");
  const [UsrId, setUsrId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ownr, setownr] = useState(null);
  const { nationality, ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const userCurrencyKey = nationalityToCode(nationality);
  const currencySymbol = ratesMap?.[userCurrencyKey]?.symbol || 'KES';
  const fetchAcDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const accountDtl: any = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: nationalId
        }
      });
      const TtlEarnings = accountDtl.data.getBizna.TtlEarnings;
      const earningsBal = accountDtl.data.getBizna.earningsBal;
      const netEarnings = accountDtl.data.getBizna.netEarnings;
      const usrStts = accountDtl.data.getBizna.netEarnings;
      const names = accountDtl.data.getBizna.busName;
      const Admin1 = accountDtl.data.getBizna.Admin1;
      const AgentBal: any = await client.graphql({
        query: getAgent,
        variables: {
          phonecontact: AgentPhn
        }
      });
      const agtTtlFtOut = AgentBal.data.getAgent.TtlFltOut;
      const agtFltBl = AgentBal.data.getAgent.floatBal;
      const agPW = AgentBal.data.getAgent.pw;
      const agentNames = AgentBal.data.getAgent.name;
      const AgAcAct = AgentBal.data.getAgent.status;
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const ttlUsrDpsts = compDtls.data.getCompany.ttlUsrDep;
      const agentFloatOuts = compDtls.data.getCompany.agentFloatOut;
      const compDtlsxz: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: Admin1
        }
      });
      const nationalidz = compDtlsxz.data.getSMAccount.nationalid;
      const rawNationality = accountDtl.data.getBizna.Nationality || (attributes as any).nationality;
      const userCode = nationalityToCode(rawNationality) || rawNationality || 'KE';
      const userCurrency = nationalityToCode(rawNationality) || userCurrencyKey || 'KE';
      const enteredAmount = parseFloat(amount);
      if (Number.isNaN(enteredAmount) || enteredAmount <= 0) {
        Alert.alert(t.invalidAmountTitle, t.invalidAmountMessage);
        setIsLoading(false);
        return;
      }
      const amountKES = userCurrency
        ? await convertForeignToKsh(enteredAmount, userCurrency)
        : enteredAmount;

      // Validation checks
      if (usrStts === "AccountInactive") {
        Alert.alert(t.inactiveUserTitle);
        setIsLoading(false);
        return;
      }
      if (AgAcAct === "AccountInactive") {
        Alert.alert(t.inactiveAgentTitle);
        setIsLoading(false);
        return;
      }
      if (parseFloat(agtFltBl) < amountKES) {
        Alert.alert(t.insufficientBalanceTitle + ': ' + formatAmountSync(parseFloat(agtFltBl), userCode, ratesMap));
        setIsLoading(false);
        return;
      }
      if (agPW !== agPWd) {
        Alert.alert(t.accessDeniedTitle);
        setIsLoading(false);
        return;
      }

      // Create float reduction record
      await client.graphql({
        query: createFloatReduction,
        variables: {
          input: {
            depositerid: nationalId,
            agContact: AgentPhn,
            agentName: agentNames,
            userName: names,
            amount: amountKES.toFixed(2),
            status: 'AccountActive'
          }
        }
      });

      // Update Bizna balances
      await client.graphql({
        query: updateBizna,
        variables: {
          input: {
            BusKntct: nationalId,
            TtlEarnings: (parseFloat(TtlEarnings) + amountKES).toFixed(2),
            earningsBal: (parseFloat(earningsBal) + amountKES).toFixed(2),
            netEarnings: (parseFloat(netEarnings) + amountKES).toFixed(2)
          }
        }
      });

      // Update Agent balances
      await client.graphql({
        query: updateAgent,
        variables: {
          input: {
            phonecontact: AgentPhn,
            TtlFltOut: (parseFloat(agtTtlFtOut) + amountKES).toFixed(2),
            floatBal: (parseFloat(agtFltBl) - amountKES).toFixed(2)
          }
        }
      });

      // Update Company balances
      await client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            ttlUsrDep: parseFloat(ttlUsrDpsts) + amountKES,
            agentFloatOut: parseFloat(agentFloatOuts) + amountKES
          }
        }
      });
      Alert.alert(formatAmountSync(amountKES, userCode, ratesMap) + ' ' + t.depositSuccessPrefix + ' ' + names + t.depositSuccessSuffix);
      const depositMessage2 = t.depositMessagePrefix + ' ' + formatAmountSync(amountKES, userCode, ratesMap) + ' ' + t.depositMessageMiddle;
      try {
        const msgRes = await client.graphql({
          query: createMessages,
          variables: { input: { senderEmail: nationalId, messageBody: depositMessage2 }}
        });
        if (msgRes?.data?.createMessages) {
          await client.graphql({
            query: sendNotification,
            variables: { riderEmail: nationalId, title: t.notificationTitle, body: depositMessage2 }
          });
        }
      } catch (notifErr) {
        console.log('Notification error:', notifErr);
      }
    } catch (error) {
      console.log(error);
      Alert.alert(t.errorTitle);
    } finally {
      setIsLoading(false);
      setNationalid("");
      setAmount("");
      setAgPWd("");
      setAgentPhn("");
      setUsrId("");
    }
  };
  return <LinearGradient colors={['#e58d29', 'skyblue']} style={styles.gradientBackground}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t.fillAccountDetails}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.businessPhone}</Text>
          <TextInput placeholder={t.placeholderBusinessPhone} value={nationalId} onChangeText={setNationalid} style={styles.input} placeholderTextColor="#444" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.nsndogoPhone}</Text>
          <TextInput placeholder={t.placeholderAgentPhone} value={AgentPhn} onChangeText={setAgentPhn} style={styles.input} placeholderTextColor="#444" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{`${t.amountLabel} (${currencySymbol})`}</Text>
          <TextInput placeholder={`${t.placeholderAmount} ${currencySymbol}`} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={styles.input} placeholderTextColor="#444" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t.nsndogoPassword}</Text>
          <TextInput placeholder={t.placeholderPassword} secureTextEntry value={agPWd} onChangeText={setAgPWd} style={styles.input} placeholderTextColor="#444" />
        </View>

        <TouchableOpacity style={styles.button} onPress={fetchAcDtls}>
          <Text style={styles.buttonText}>{t.depositButton}</Text>
          {isLoading && <ActivityIndicator size="small" color="#fff" />}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>;
};
export default SMADepositForm;
const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1
  },
  container: {
    padding: 20,
    paddingBottom: 50
  },
  title: {
    fontSize: 22,
    color: '#ECF0F1',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    color: '#ECF0F1',
    marginBottom: 6,
    fontSize: 16
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold'
  },
  button: {
    backgroundColor: '#e58d29',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10
  }
});