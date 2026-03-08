import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { getCvrdGroupLoans, getSMAccount, getCompany, getGroup, getChamaMembers } from '../../../../../../src/graphql/queries';
import { updateSMAccount, updateCvrdGroupLoans, updateChamaMembers, updateGroup, updateCompany, createLoanRepayments, sendNotification, createMessages } from '../../../../../../src/graphql/mutations';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useExchange } from '../../../../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../../src/utils/nationalityToCode';
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const RepayCovChmLnsss = () => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [SnderPW, setSnderPW] = useState('');
  const [amounts, setAmount] = useState('');
  const [LnId, setLnId] = useState('');
  const [Desc, setDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const route = useRoute();
  const { nationality, ratesMap } = useExchange();
  const resetForm = () => {
    setAmount('');
    setDesc('');
    setSenderNatId('');
    setSnderPW('');
    setLnId('');
  };
  const notifyLoanRepayment = async ({
    isFullRepayment,
    loaneeEmail,
    grpName,
    amountPaid,
    loanBalanceAfter
  }) => {
    const messageBody = isFullRepayment ? `Your loan from ${grpName} has been fully repaid. Amount paid: ${formatAmountSync(Number(amountPaid), nationality || undefined, ratesMap)}. Your loan balance is now ${formatAmountSync(0, nationality || undefined, ratesMap)}.` : `A partial repayment of ${formatAmountSync(Number(amountPaid), nationality || undefined, ratesMap)} has been made to your loan from ${grpName}. Remaining loan balance: ${formatAmountSync(Number(loanBalanceAfter), nationality || undefined, ratesMap)}.`;
    const title = isFullRepayment ? 'NiSenti: Loan Fully Repaid' : 'NiSenti: Loan Partially Repaid';
    await client.graphql({
      query: createMessages,
      variables: {
        input: {
          senderEmail: loaneeEmail,
          messageBody
        }
      }
    });
    await client.graphql({
      query: sendNotification,
      variables: {
        riderEmail: loaneeEmail,
        title,
        body: messageBody
      }
    });
  };
  const ftchCvdSMLn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const amountForeign = parseFloat(amounts);
    if (!Number.isFinite(amountForeign) || amountForeign <= 0) {
      Alert.alert('Enter a valid amount');
      setIsLoading(false);
      return;
    }
    const currencyKey = nationalityToCode(nationality);
    const amountKes = await convertForeignToKsh(amountForeign, currencyKey);
    if (!Number.isFinite(amountKes) || amountKes <= 0) {
      Alert.alert('Unable to convert amount. Please try again.');
      setIsLoading(false);
      return;
    }
    try {
      const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();

      // 1️⃣ Fetch loan
      const loanResp: any = await client.graphql({
        query: getCvrdGroupLoans,
        variables: {
          loanID: route.params.loanID
        }
      });
      const loan = loanResp.data.getCvrdGroupLoans;
      const {
        amountExpectedBackWthClrnc,
        memberId,
        DefaultPenaltyChm2,
        grpContact,
        loaneePhn,
        amountExpectedBack,
        amountRepaid,
        clearanceAmt,
        interest,
        crtnDate
      } = loan;
      const ClranceAmt = parseFloat(clearanceAmt) + parseFloat(DefaultPenaltyChm2);
      const netLnBal = amountExpectedBack - amountRepaid;
      const daysElapsed = (new Date().getTime() - new Date(crtnDate).getTime()) / (1000 * 60 * 60 * 24);
      const LonBal1 = (netLnBal * Math.pow(1 + parseFloat(interest) / 36500, daysElapsed) + ClranceAmt).toFixed(0);
      const LonBalAfter = parseFloat(LonBal1) - amountKes;

      // 2️⃣ Fetch sender
      const senderResp: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: loaneePhn
        }
      });
      const sender = senderResp.data.getSMAccount;
      const {
        acStatus: senderStatus,
        MaxTymsBL,
        balance: senderBal,
        name: senderName,
        nonLonLimit
      } = sender;

      // 3️⃣ Fetch company
      const compResp: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const company = compResp.data.getCompany;
      const {
        chmLnRpymntFee,
        maxBLs,
        phoneContact
      } = company;
      const totalTransacted = amountKes + parseFloat(chmLnRpymntFee) * amountKes;

      // 4️⃣ Fetch receiver group
      const groupResp: any = await client.graphql({
        query: getGroup,
        variables: {
          grpContact
        }
      });
      const group = groupResp.data.getGroup;
      const {
        status: groupStatus,
        grpBal,
        tymsChmHvBL,
        GrpLoanRpymntSync,
        grpName
      } = group;

      // 5️⃣ Fetch member
      const memberResp: any = await client.graphql({
        query: getChamaMembers,
        variables: {
          ChamaNMember: memberId
        }
      });
      const member = memberResp.data.getChamaMembers;
      const {
        AmtRepaid
      } = member;

      // 6️⃣ All conditional checks
      if (senderStatus === 'AccountInactive') {
        Alert.alert('Sender account is inactive');
        return;
      }
      if (groupStatus === 'AccountInactive') {
        Alert.alert('Receiver account is inactive');
        return;
      }
      if (parseFloat(senderBal) < totalTransacted) {
        Alert.alert('Requested amount is more than your account balance');
        return;
      }
      if (parseFloat(nonLonLimit) < amountKes) {
        Alert.alert(`Call ${phoneContact} to adjust your send amount limit`);
        return;
      }
      if (ClranceAmt > amountKes) {
        Alert.alert(`At least pay clearance fee + default penalty: ${ClranceAmt}`);
        return;
      }
      if (amountKes > parseFloat(LonBal1)) {
        Alert.alert(`Your loan balance is lesser: ${LonBal1}`);
        return;
      }

      // 7️⃣ Repayment type
      const isFullRepayment = amountKes === parseFloat(LonBal1);
      const updateSenderAccountFull = async () => {
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: attributes.email,
              balance: (parseFloat(senderBal) - totalTransacted).toFixed(0),
              MaxTymsBL: 0
            }
          }
        });
      };
      const updateSenderAccountPartial = async () => {
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: attributes.email,
              balance: (parseFloat(senderBal) - totalTransacted).toFixed(0),
              MaxTymsBL: parseFloat(MaxTymsBL) - 1
            }
          }
        });
      };
      const updateChamaMemberLoan = async () => {
        await client.graphql({
          query: updateChamaMembers,
          variables: {
            input: {
              ChamaNMember: memberId,
              AmtRepaid: (parseFloat(AmtRepaid) + amountKes).toFixed(0),
              LnBal: LonBalAfter.toFixed(0)
            }
          }
        });
      };
      const updateLoan = async () => {
        await client.graphql({
          query: updateCvrdGroupLoans,
          variables: {
            input: {
              loanID: route.params.loanID,
              amountRepaid: (amountKes + parseFloat(amountRepaid)).toFixed(0),
              lonBala: LonBalAfter.toFixed(0),
              amountExpectedBackWthClrnc: LonBalAfter.toFixed(0),
              DefaultPenaltyChm2: 0,
              clearanceAmt: 0,
              status: isFullRepayment ? 'LoanCleared' : 'Active'
            }
          }
        });
      };
      const updateGroupAndCompany = async () => {
        await client.graphql({
          query: updateGroup,
          variables: {
            input: {
              grpContact,
              GrpLoanRpymntSync: (parseFloat(GrpLoanRpymntSync) + amountKes).toFixed(0),
              grpBal: (parseFloat(grpBal) + (amountKes - ClranceAmt)).toFixed(0)
            }
          }
        });
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "BaruchHabaB'ShemAdonai2",
              companyEarningBal: parseFloat(chmLnRpymntFee) * amountKes,
              companyEarning: parseFloat(chmLnRpymntFee) * amountKes
            }
          }
        });
      };
      const createRepaymentRecord = async () => {
        await client.graphql({
          query: createLoanRepayments,
          variables: {
            input: {
              senderPhn: loaneePhn,
              recPhn: grpContact,
              RecName: grpName,
              loanId3: route.params.loanID,
              SenderName: senderName,
              amount: amountKes.toFixed(0),
              description: Desc,
              status: 'ChmLonRepayment',
              owner: userInfo.userId
            }
          }
        });
      };

      // 8️⃣ Execute repayment updates
      if (isFullRepayment && parseFloat(MaxTymsBL) <= parseFloat(maxBLs)) {
        await updateSenderAccountFull();
      } else if (isFullRepayment && parseFloat(MaxTymsBL) > parseFloat(maxBLs)) {
        await updateSenderAccountPartial();
      } else {
        await updateChamaMemberLoan();
      }
      await updateLoan();
      await updateGroupAndCompany();
      await createRepaymentRecord();
      await notifyLoanRepayment({
        isFullRepayment,
        loaneeEmail: loaneePhn,
        // or email if different
        grpName,
        amountPaid: amountKes.toFixed(0),
        loanBalanceAfter: LonBalAfter.toFixed(0)
      });
      Alert.alert('Payment Successful', isFullRepayment ? `Loan fully repaid.\nClearance Fee: ${formatAmountSync(Number(ClranceAmt), nationality || undefined, ratesMap)}\nTransaction Fee: ${formatAmountSync(parseFloat(chmLnRpymntFee) * amountKes, nationality || undefined, ratesMap)}` : `Partial repayment successful.\nRemaining balance: ${formatAmountSync(Number(LonBalAfter), nationality || undefined, ratesMap)}`);
      resetForm();
    } catch (error) {
      console.log(error);
      Alert.alert('Retry or update app or call customer care');
    } finally {
      setIsLoading(false);
    }
  };
  return <LinearGradient colors={['#4B9CD3', '#1C1C1E']} // NiSenti gradient
  style={{
    flex: 1
  }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{
      flex: 1
    }}>
        <ScrollView contentContainerStyle={{
        padding: 20,
        flexGrow: 1,
        justifyContent: 'center'
      }}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>NiSenti Loan Repayment</Text>
            <Text style={styles.subHeaderText}>Fill account details below</Text>
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount Sent</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="Enter amount" value={amounts} onChangeText={setAmount} editable={!isLoading} />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput style={[styles.input, {
            height: 100,
            textAlignVertical: 'top'
          }]} placeholder="Enter description" multiline numberOfLines={4} value={Desc} onChangeText={setDesc} editable={!isLoading} />
          </View>

          {/* Send Button */}
          <TouchableOpacity style={styles.button} onPress={ftchCvdSMLn} disabled={isLoading}>
            {isLoading ? <ActivityIndicator size="small" color="#FFD700" /> : <Text style={styles.buttonText}>Send Payment</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>;
};
export default RepayCovChmLnsss;
const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 30,
    alignItems: 'center'
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e29d58' // accent
  },
  subHeaderText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 5
  },
  inputContainer: {
    marginBottom: 20
  },
  inputLabel: {
    color: '#e29d58',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500'
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  button: {
    backgroundColor: '#e29d58',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4
  },
  buttonText: {
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: 'bold'
  }
});