import React, { useEffect, useState } from 'react';
import { createSMLoansCovered, createNonLoans, updateCompany, updateSMAccount, updateBizna } from '../../../../../src/graphql/mutations';
import { getBizna, getCompany, getSMAccount, listCovCreditSellers, listCvrdGroupLoans, listSMLoansCovereds } from '../../../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { convertForeignToKsh } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const SMASendNonLns = () => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState('');
  const [amounts, setAmount] = useState('');
  const [Desc, setDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fmt = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  const navigation = useNavigation();
  const SndChmMmbrMny = () => navigation.navigate('AutomaticRepayAllTyps');
  const fetchCvLnSM = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const amountInput = parseFloat(amounts);
      if (!Number.isFinite(amountInput) || amountInput <= 0) {
        Alert.alert(t.enterValidAmount);
        return;
      }
      const rawNationality = (attributes as any).nationality;
      const senderCode = nationalityToCode(rawNationality) || rawNationality || 'KE';
      const amountKes = await convertForeignToKsh(amountInput, senderCode);
      if (!Number.isFinite(amountKes) || amountKes <= 0) {
        Alert.alert(t.unableConvertAmount);
        return;
      }

      // Loan checks
      const [loan1, loan2, loan3] = await Promise.all([client.graphql({
        query: listSMLoansCovereds,
        variables: {
          filter: {
            status: {
              eq: 'LoanBL'
            },
            lonBala: {
              gt: 0
            },
            loaneeEmail: attributes.email
          }
        }
      }), client.graphql({
        query: listCovCreditSellers,
        variables: {
          filter: {
            status: {
              eq: 'LoanBL'
            },
            lonBala: {
              gt: 0
            },
            buyerContact: attributes.email
          }
        }
      }), client.graphql({
        query: listCvrdGroupLoans,
        variables: {
          filter: {
            status: {
              eq: 'LoanBL'
            },
            lonBala: {
              gt: 0
            },
            loaneePhn: attributes.email
          }
        }
      })]);
      const hasLoan = (loan1 as any).data.listSMLoansCovereds.items.length > 0 || (loan2 as any).data.listCovCreditSellers.items.length > 0 || (loan3 as any).data.listCvrdGroupLoans.items.length > 0;
      if (hasLoan) {
        SndChmMmbrMny();
        return;
      }

      // Sender account
      const senderRes = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const sender = senderRes.data.getSMAccount;
      if (!sender) throw new Error('Sender account not found');
      const {
        pw,
        acStatus,
        owner,
        balance,
        loanLimit,
        name
      } = sender;
      if (pw !== SnderPW) return Alert.alert(t.wrongPassword);
      if (acStatus !== 'AccountActive') return Alert.alert(t.senderInactive);
      if (userInfo.userId !== owner) return Alert.alert(t.sendFromOwnAccount);
      if (parseFloat(loanLimit) < amountKes) return Alert.alert(t.sendLimitExceeded);

      // Company
      const compRes = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const company = compRes.data.getCompany;
      if (!company) throw new Error('Company not found');
      const {
        userTransferFee,
        companyEarningBal,
        companyEarning,
        ttlNonLonssRecSM,
        ttlNonLonssSentSM
      } = company;
      const fee = parseFloat(userTransferFee || 0) * amountKes;
      const totalDebit = amountKes + fee;
      if (parseFloat(balance) < totalDebit) return Alert.alert(t.insufficientBalance);

      // Recipient
      const recRes = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: RecNatId
        }
      });
      const rec = recRes.data.getBizna;
      if (!rec) throw new Error('Recipient business not found');
      const recipientName = rec.busName;

      // Transaction
      await client.graphql({
        query: createNonLoans,
        variables: {
          input: {
            recPhn: RecNatId,
            senderPhn: attributes.email,
            amount: amountKes.toFixed(0),
            description: Desc,
            RecName: recipientName,
            SenderName: name,
            status: 'cashSales',
            owner: userInfo.userId
          }
        }
      });
      await Promise.all([client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: attributes.email,
            ttlNonLonsSentSM: (parseFloat(sender.ttlNonLonsSentSM) + amountKes).toFixed(0),
            balance: (parseFloat(balance) - totalDebit).toFixed(0)
          }
        }
      }), client.graphql({
        query: updateBizna,
        variables: {
          input: {
            BusKntct: RecNatId,
            netEarnings: (parseFloat(rec.netEarnings) + amountKes).toFixed(0),
            earningsBal: (parseFloat(rec.netEarnings) + amountKes).toFixed(0)
          }
        }
      }), client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            companyEarningBal: fee + parseFloat(companyEarningBal),
            companyEarning: fee + parseFloat(companyEarning),
            ttlNonLonssRecSM: amountKes + parseFloat(ttlNonLonssRecSM),
            ttlNonLonssSentSM: amountKes + parseFloat(ttlNonLonssSentSM)
          }
        }
      })]);
      Alert.alert(fmt(t.successTransactionFee, {
        fee: fee.toFixed(0)
      }));
    } catch (e) {
      console.error(e);
      Alert.alert(t.transactionFailedRetry);
    } finally {
      setIsLoading(false);
      setSenderNatId('');
      setAmount('');
      setRecNatId('');
      setDesc('');
      setSnderPW('');
    }
  };
  return <View style={styles.root}>
      <ScrollView>
        <View style={styles.amountTitleView}>
          <Text style={styles.title}>{t.fillAccountDetails}</Text>
        </View>

        <View style={styles.sendAmtView}>
          <TextInput placeholder={t.businessPhone} value={RecNatId} onChangeText={setRecNatId} style={styles.sendAmtInput} />
          <Text style={styles.sendAmtText}>{t.businessPhone}</Text>
        </View>

        <View style={styles.sendAmtView}>
          <TextInput keyboardType="numeric" placeholder={t.amount} value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} />
          <Text style={styles.sendAmtText}>{t.amount}</Text>
        </View>

        <View style={styles.sendAmtView}>
          <TextInput placeholder={t.description} value={Desc} onChangeText={setDesc} style={styles.sendAmtInput} />
          <Text style={styles.sendAmtText}>{t.description}</Text>
        </View>

        <View style={styles.sendAmtView}>
          <TextInput placeholder={t.password} secureTextEntry value={SnderPW} onChangeText={setSnderPW} style={styles.sendAmtInput} />
          <Text style={styles.sendAmtText}>{t.password}</Text>
        </View>

        <TouchableOpacity style={styles.sendAmtButton} disabled={isLoading} onPress={fetchCvLnSM}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendAmtButtonText}>{t.send}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>;
};
export default SMASendNonLns;