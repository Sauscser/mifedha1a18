import React, { useState } from 'react';
import { useRoute } from '@react-navigation/core';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Alert, ScrollView, TextInput, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native';
import { createCvrdGroupLoans, updateChamaMembers, updateGroup, updateSMAccount, updateCompany, updateMiFedhaBankAdmin, updateChamaControlTable, updateReqLoanChama, updateAdvocate, createMessages, sendNotification } from '../../../../../src/graphql/mutations';
import { createLaonRepaymentNotification } from '../../../../../src/graphql/mutations';
import { getReqLoanChama, getSMAccount, getNotification, getChamaMembers, getGroup, getCompany, getChamaControlTable, getMiFedhaBankAdmin, getAdvocate } from '../../../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useExchange } from '../../../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';

import { translations } from './translation';
const client = generateClient();

const ChmCovLns = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const { ratesMap } = useExchange();
  const [state, setState] = useState({
    ChmPhn: '',
    RecNatId: '',
    RecPhn: '',
    SnderPW: '',
    RepaymtPeriod: '',
    amount: '',
    AmtExp: '',
    RecAccCode: '',
    SendrPhn: null,
    MmbrId: '',
    isLoading: false
  });
  const route = useRoute<any>();
  const [userNationality, setUserNationality] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const userCurrencyKey = nationalityToCode(userNationality) || userNationality || 'KE';
  const formatMoney = (amount: number) => formatAmountSync(amount || 0, userCurrencyKey, ratesMap);
  const setField = (field, value) => setState(prev => ({
    ...prev,
    [field]: value
  }));
  const fetchGraphQL = async (query: any, variables: Record<string, unknown>) => {
    try {
      const result: any = await client.graphql({
        query,
        variables
      });

      return result.data;
    } catch (e) {
      console.log(e);
      Alert.alert(t.alerts.accessDenied);
      setField('isLoading', false);
      throw e;
    }
  };
  const fetchChmLoanReq = async () => {
    if (state.isLoading) return;
    setField('isLoading', true);
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const {
        getReqLoanChama: loanReq
      } = await fetchGraphQL(getReqLoanChama, {
        id: route.params.id
      });
      const {
        loaneeEmail,
        loaneePhone,
        loaneeMemberId,
        chamaPhone,
        amount,
        repaymentAmt,
        repaymentPeriod,
        advLicNo,
        description,
        defaultPenalty,
        statusNumber,
        AdvEmail,
        dfltDeadLn,
        installmentAmount,
        paymentFrequency,
        status
      } = loanReq;
      const ChmNMmbrPhns = loaneeMemberId + chamaPhone;
      const {
        getSMAccount: senderAccount
      } = await fetchGraphQL(getSMAccount, {
        awsemail: attributes.email
      });
      setUserNationality(senderAccount?.nationality || null);
      if (state.SnderPW !== senderAccount.pw) {
        Alert.alert(t.alerts.wrongPassword);
        setField('isLoading', false);
        return;
      }
      const {
        getChamaMembers: chmMember
      } = await fetchGraphQL(getChamaMembers, {
        ChamaNMember: ChmNMmbrPhns
      });
      const {
        getGroup: group
      } = await fetchGraphQL(getGroup, {
        grpContact: chamaPhone
      });
      const {
        getCompany: company
      } = await fetchGraphQL(getCompany, {
        AdminId: "BaruchHabaB'ShemAdonai2"
      });
      const {
        getSMAccount: recAccount
      } = await fetchGraphQL(getSMAccount, {
        awsemail: loaneeEmail
      });

      const {
        getNotification: recAccountNotification
      } = await fetchGraphQL(getNotification, {
        awsemail: loaneeEmail
      });
      // --- Notification wiring: create laonrepaymentnotification after loan creation ---
      const createNotification = async () => {
        try {
          const dueDate = (() => {
            const crtn = new Date();
            return crtn;
          })();
          await client.graphql({
            query: createLaonRepaymentNotification,
            variables: {
              input: {
                loanId: route.params.id,
                userId: loaneeEmail,
                dueDate: new Date(),
                sent: false,
                notificationType: 'Loan Repayment Due',
                loanType: 'GrpLn',
                fcmToken: recAccountNotification?.firebaseKey || ''
              }
            }
          });
        } catch (err) {
          console.log('Failed to create laonrepaymentnotification:', err);
        }
      };
      const {
        getChamaControlTable: controlTable
      } = await fetchGraphQL(getChamaControlTable, {
        id: "EQUITYTABLEID"
      });
      const {
        getMiFedhaBankAdmin: bankAdmin
      } = await fetchGraphQL(getMiFedhaBankAdmin, {
        nationalid: group.BankAdminAcNu
      });
      if (status === 'Approved') {
        Alert.alert(t.alerts.alreadyGranted);
        setField('isLoading', false);
        return;
      }
      if (status !== 'Cleared') {
        Alert.alert(t.alerts.notCleared);
        setField('isLoading', false);
        return;
      }
      if (state.MmbrId === chamaPhone) {
        Alert.alert(t.alerts.cannotLoanSelf);
        setField('isLoading', false);
        return;
      }
      if (recAccount.acStatus !== 'AccountActive') {
        Alert.alert(t.alerts.receiverInactive);
        setField('isLoading', false);
        return;
      }
      const amountKes = parseFloat(amount) || 0;
      const repaymentAmountKes = parseFloat(repaymentAmt) || 0;
      const installmentAmountKes = parseFloat(installmentAmount) || 0;
      const ttlCovFeeAmount = (parseFloat(company.CoverageFee) || 0) * amountKes;
      const transFee = (parseFloat(company.userLoanTransferFee) || 0) * amountKes;
      const totalAmount = amountKes + ttlCovFeeAmount + transFee;
      const grpSync = amountKes + transFee;
      const grpSyncAdvocate = totalAmount;
      const createLoan = async (advRegNu = 'None', loanAmount = totalAmount, grpSyncAmount = grpSync) => {
        await client.graphql({
          query: createCvrdGroupLoans,
          variables: {
            input: {
              loanID: route.params.id,
              grpContact: chamaPhone,
              loaneePhn: loaneeEmail,
              loanerLoanee: chamaPhone + loaneePhone,
              loanerLoaneeAdv: chamaPhone + loaneePhone + advRegNu,
              repaymentPeriod,
              amountGiven: amountKes.toFixed(0),
              amountExpectedBack: loanAmount.toFixed(0),
              amountExpectedBackWthClrnc: loanAmount.toFixed(0),
              amountRepaid: 0,
              groupRedeemedLoan: 0,
              DefaultPenaltyChm: defaultPenalty,
              DefaultPenaltyChm2: 0,
              timeExpBack: parseFloat(repaymentPeriod),
              timeExpBack2: 61,
              crtnDate: new Date().getTime(),
              description,
              clearanceAmt: 0,
              clearanceAmt2: 0,
              lonBala: loanAmount.toFixed(0),
              advRegNu,
              loaneeName: recAccount.name,
              dfltDeadLn,
              LoanerName: group.grpName,
              memberId: ChmNMmbrPhns,
              status: 'LoanActive',
              lnType: 'GrpLn',
              interest: repaymentAmountKes.toFixed(0),
              dfltUpdate: new Date().getTime(),
              owner: user.userId,
              blOfficer: 'None',
              advEmail: advRegNu === 'None' ? 'None' : AdvEmail,
              installmentAmount: installmentAmountKes.toFixed(0),
              paymentFrequency
            }
          }
        });
      };
      if (advLicNo === 'None') {
        await createLoan();
        await createNotification();
      } else {
        const {
          getAdvocate: adv
        } = await fetchGraphQL(getAdvocate, {
          advregnu: advLicNo
        });
        await createLoan(advLicNo, totalAmount, grpSyncAdvocate);
        const advEarning = ttlCovFeeAmount * parseFloat(company.AdvCom);
        await client.graphql({
          query: updateAdvocate,
          variables: {
            input: {
              advregnu: advLicNo,
              advBal: (parseFloat(adv.advBal) + advEarning).toFixed(0),
              TtlEarnings: (parseFloat(adv.TtlEarnings) + advEarning).toFixed(0)
            }
          }
        });
        await createNotification();
      }
      await client.graphql({
        query: updateChamaMembers,
        variables: {
          input: {
            ChamaNMember: ChmNMmbrPhns,
            LonAmtGven: (parseFloat(chmMember.LonAmtGven) + amountKes).toFixed(0),
            GrossLnsGvn: (parseFloat(chmMember.GrossLnsGvn) + totalAmount).toFixed(0),
            LnBal: (parseFloat(chmMember.LnBal) + totalAmount).toFixed(0),
            loanStatus: 'LoanActive',
            blStatus: 'AccountNotBL'
          }
        }
      });
      await client.graphql({
        query: updateGroup,
        variables: {
          input: {
            grpContact: chamaPhone,
            TtlActvLonsTmsLnrChmCov: parseFloat(group.TtlActvLonsTmsLnrChmCov) + 1,
            TtlActvLonsAmtLnrChmCov: (parseFloat(group.TtlActvLonsAmtLnrChmCov) + grpSync).toFixed(0),
            grpBal: (parseFloat(group.grpBal) - grpSync).toFixed(0),
            GrpLoanOutSync: (parseFloat(group.GrpLoanOutSync) + grpSync).toFixed(0)
          }
        }
      });
      await client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: loaneeEmail,
            TtlActvLonsTmsLneeChmCov: parseFloat(recAccount.TtlActvLonsTmsLneeChmCov) + 1,
            TtlActvLonsAmtLneeChmCov: (parseFloat(recAccount.TtlActvLonsAmtLneeChmCov) + totalAmount).toFixed(0),
            balance: (parseFloat(recAccount.balance) + amountKes).toFixed(0),
            loanStatus: 'LoanActive',
            blStatus: 'AccountNotBL',
            loanAcceptanceCode: 'None'
          }
        }
      });
      const grossCompEarning = transFee;
      const bankAdminEarning = grossCompEarning * parseFloat(company.BankMifedhaSyncFee);
      const netCompEarning = grossCompEarning - bankAdminEarning;
      await client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            ttlCompCovEarnings: (parseFloat(company.ttlCompCovEarnings) + totalAmount).toFixed(0),
            AdvEarningBal: (parseFloat(company.AdvEarningBal) + ttlCovFeeAmount).toFixed(0),
            AdvEarning: (parseFloat(company.AdvEarning) + ttlCovFeeAmount).toFixed(0),
            companyEarningBal: (parseFloat(company.companyEarningBal) + netCompEarning).toFixed(0),
            companyEarning: (parseFloat(company.companyEarning) + netCompEarning).toFixed(0),
            ttlChmLnsInAmtCov: (parseFloat(company.ttlChmLnsInAmtCov) + totalAmount).toFixed(0),
            ttlChmLnsInTymsCov: parseFloat(company.ttlChmLnsInTymsCov) + 1
          }
        }
      });
      await client.graphql({
        query: updateMiFedhaBankAdmin,
        variables: {
          input: {
            nationalid: group.BankAdminAcNu,
            BankAdmBal: (parseFloat(bankAdmin.BankAdmBal) + bankAdminEarning).toFixed(0)
          }
        }
      });
      await client.graphql({
        query: updateChamaControlTable,
        variables: {
          input: {
            id: 'EQUITYTABLEID',
            GrpLoanOutEarnings: (parseFloat(controlTable.GrpLoanOutEarnings) + bankAdminEarning).toFixed(0),
            BankAdminEarnings: (parseFloat(controlTable.BankAdminEarnings) + bankAdminEarning).toFixed(0)
          }
        }
      });
      await client.graphql({
        query: updateReqLoanChama,
        variables: {
          input: {
            id: route.params.id,
            status: 'Approved'
          }
        }
      });
      // Use recipient's currency for notification (like Vw2GrantLnReqCov)
      const recUserCode = nationalityToCode(recAccount.nationality) || recAccount.nationality || 'KE';
      const formatRecipientMoney = (amt) => formatAmountSync(amt || 0, recUserCode, ratesMap);
      const notificationMessage = t.notifications.message
        .replace('{{groupName}}', group.grpName)
        .replace('{{amount}}', formatRecipientMoney(amountKes))
        .replace('{{totalAmount}}', formatRecipientMoney(totalAmount))
        .replace('{{interestAmount}}', formatRecipientMoney(repaymentAmountKes))
        .replace('{{repaymentPeriod}}', repaymentPeriod)
        .replace('{{transactionFee}}', formatRecipientMoney(transFee))
        .replace('{{advocateFee}}', advLicNo !== 'None' ? formatRecipientMoney(ttlCovFeeAmount * parseFloat(company.AdvCom)) : '0')
        .replace('{{installmentAmount}}', formatRecipientMoney(installmentAmountKes))
        .replace('{{paymentFrequency}}', paymentFrequency);

      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            senderEmail: loaneeEmail,
            messageBody: notificationMessage
          }
        }
      });
      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail: loaneeEmail,
          title: t.notifications.title,
          body: notificationMessage
        }
      });
      // Feedback to sender using translations
      const senderSuccessMsg = advLicNo !== 'None'
        ? t.alerts.successWithAdv
            .replace('{{transFee}}', formatRecipientMoney(transFee))
            .replace('{{advFee}}', formatRecipientMoney(ttlCovFeeAmount * parseFloat(company.AdvCom)))
        : t.alerts.successNoAdv
            .replace('{{transFee}}', formatRecipientMoney(transFee));
      Alert.alert(t.labels.header, senderSuccessMsg);
      setField('amount', '');
      setField('AmtExp', '');
      setField('SnderPW', '');
      setField('RepaymtPeriod', '');
      setField('RecAccCode', '');
      setField('ChmPhn', '');
      setField('MmbrId', '');
    } catch (e) {
      console.log(e);
    } finally {
      setField('isLoading', false);
    }
  };
  return <KeyboardAvoidingView style={{
    flex: 1,
    backgroundColor: '#f2f6fc'
  }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{t.labels.header}</Text>
        <Text style={styles.subHeaderText}>{t.labels.subHeader}</Text>
      </View>

      {/* Password Input Card */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>{t.labels.adminPassword}</Text>
      <TextInput placeholder={t.placeholders.password} value={state.SnderPW} secureTextEntry={!showPassword} onChangeText={text => setField('SnderPW', text)} // ✅ fixed
        style={styles.input} editable={!state.isLoading} // ✅ access isLoading from state
        />

        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Loan Button */}
    <TouchableOpacity onPress={fetchChmLoanReq} disabled={state.isLoading} // ✅ use state
      style={{
        marginTop: 30
      }}>
  <LinearGradient colors={['#e29d58', 'skyblue']} start={{
          x: 0,
          y: 0
        }} end={{
          x: 1,
          y: 0
        }} style={styles.buttonGradient}>
    <Text style={styles.buttonText}>{t.labels.loanButton}</Text>
    {state.isLoading && <ActivityIndicator size="small" color="#fff" style={{
            marginLeft: 10
          }} />}
  </LinearGradient>
      </TouchableOpacity>


    </ScrollView>
  </KeyboardAvoidingView>;
};
export default ChmCovLns;
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f2f6fc'
  },
  header: {
    marginBottom: 30,
    alignItems: 'center'
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e29d58'
  },
  subHeaderText: {
    fontSize: 16,
    color: 'skyblue',
    marginTop: 5,
    textAlign: 'center'
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative'
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9'
  },
  eyeIcon: {
    position: 'absolute',
    right: 25,
    top: 50
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 25
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});