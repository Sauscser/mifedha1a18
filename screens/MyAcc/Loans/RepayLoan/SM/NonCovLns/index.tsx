import React, { useEffect, useState } from 'react';
import { createMessages, createNonLoans, createSMLoansCovered, createSMLoansNonCovered, sendNotification, updateCompany, updateSMAccount, updateSMLoansCovered, updateSMLoansNonCovered } from '../../../../../../src/graphql/mutations';
import { getCompany, getSMAccount, getSMLoansCovered, getSMLoansNonCovered } from '../../../../../../src/graphql/queries';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useExchange } from '../../../../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../../src/utils/nationalityToCode';
const client = generateClient();
const RepayNonCovLnsss = props => {
  const [SnderPW, setSnderPW] = useState("");
  const [amounts, setAmount] = useState("");
  const [Desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const route = useRoute();
  const { nationality, ratesMap } = useExchange();
  const fetchSenderUsrDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const amountForeign = parseFloat(amounts);
    if (!Number.isFinite(amountForeign) || amountForeign <= 0) {
      Alert.alert("Enter a valid repayment amount");
      setIsLoading(false);
      return;
    }
    const currencyKey = nationalityToCode(nationality);
    const amountKes = await convertForeignToKsh(amountForeign, currencyKey);
    if (!Number.isFinite(amountKes) || amountKes <= 0) {
      Alert.alert("Unable to convert amount. Please try again.");
      setIsLoading(false);
      return;
    }
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const accountDtl: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const SenderUsrBal = accountDtl.data.getSMAccount.balance;
      const usrPW = accountDtl.data.getSMAccount.pw;
      const MaxTymsBLs = accountDtl.data.getSMAccount.MaxTymsBL;
      const usrAcActvStts = accountDtl.data.getSMAccount.acStatus;
      const owner = accountDtl.data.getSMAccount.owner;
      const TtlActvLonsAmtLneeCovs = accountDtl.data.getSMAccount.TtlActvLonsAmtLneeNonCov;
      const TtlClrdLonsTmsLneeCovs = accountDtl.data.getSMAccount.TtlClrdLonsTmsLneeNonCov;
      const TtlClrdLonsAmtLneeCovs = accountDtl.data.getSMAccount.TtlClrdLonsAmtLneeNonCov;
      const TtlBLLonsTmsLneeNonCovs = accountDtl.data.getSMAccount.TtlBLLonsTmsLneeNonCov;
      const TtlBLLonsAmtLneeNonCovs = accountDtl.data.getSMAccount.TtlBLLonsAmtLneeNonCov;
      const names = accountDtl.data.getSMAccount.name;
      const ttlNonLonsSentSMs = accountDtl.data.getSMAccount.ttlNonLonsSentSM;
      const nonLonLimits = accountDtl.data.getSMAccount.nonLonLimit;
      const ftchCvdSMLn = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          const RecAccountDtl: any = await client.graphql({
            query: getSMLoansNonCovered,
            variables: {
              id: route.params.id
            }
          });
          const DefaultPenaltySM2s = RecAccountDtl.data.getSMLoansNonCovered.DefaultPenaltySM2;
          const statusssss = RecAccountDtl.data.getSMLoansNonCovered.status;
          const amountExpectedBackWthClrncs = RecAccountDtl.data.getSMLoansNonCovered.amountExpectedBackWthClrnc;
          const loanerPhns = RecAccountDtl.data.getSMLoansNonCovered.loanerPhn;
          const amountrepaids = RecAccountDtl.data.getSMLoansNonCovered.amountrepaid;
          const LonBal = RecAccountDtl.data.getSMLoansNonCovered.lonBala;
          const amountExpectedBacks = RecAccountDtl.data.getSMLoansNonCovered.amountexpected;
          const ClranceAmt = parseFloat(amountExpectedBackWthClrncs) - parseFloat(amountExpectedBacks);
          const LonBalsss = parseFloat(amountExpectedBackWthClrncs) - parseFloat(amountrepaids);
          const fetchCompDtls = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            try {
              const CompDtls: any = await client.graphql({
                query: getCompany,
                variables: {
                  AdminId: "BaruchHabaB'ShemAdonai2"
                }
              });
              const UsrTransferFee = CompDtls.data.getCompany.userTransferFee;
              const CompPhoneContact = CompDtls.data.getCompany.phoneContact;
              const ttlSMLnsInClrdAmtCovs = CompDtls.data.getCompany.ttlSMLnsInClrdAmtNonCov;
              const ttlSMLnsInClrdTymsCovs = CompDtls.data.getCompany.ttlSMLnsInClrdTymsNonCov;
              const totalLnsRecovereds = CompDtls.data.getCompany.totalLnsRecovered;
              const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
              const companyEarnings = CompDtls.data.getCompany.companyEarning;
              const ttlNonLonssRecSMs = CompDtls.data.getCompany.ttlNonLonssRecSM;
              const ttlNonLonssSentSMs = CompDtls.data.getCompany.ttlNonLonssSentSM;
              const TotalTransacted = amountKes + parseFloat(UsrTransferFee) * amountKes + ClranceAmt;
              const maxBLss = CompDtls.data.getCompany.maxBLs;
              const fetchRecUsrDtls = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  const RecAccountDtl: any = await client.graphql({
                    query: getSMAccount,
                    variables: {
                      awsemail: loanerPhns
                    }
                  });
                  const RecUsrBal = RecAccountDtl.data.getSMAccount.balance;
                  const usrAcActvSttss = RecAccountDtl.data.getSMAccount.acStatus;
                  const ttlNonLonsRecSMs = RecAccountDtl.data.getSMAccount.ttlNonLonsRecSM;
                  const TtlActvLonsTmsLnrCovssss = RecAccountDtl.data.getSMAccount.TtlActvLonsTmsLnrNonCov;
                  const TtlActvLonsAmtLnrCovssss = RecAccountDtl.data.getSMAccount.TtlActvLonsAmtLnrNonCov;
                  const TtlClrdLonsTmsLneeCovssss = RecAccountDtl.data.getSMAccount.TtlClrdLonsTmsLnrNonCov;
                  const TtlClrdLonsAmtLneeCovssss = RecAccountDtl.data.getSMAccount.TtlClrdLonsAmtLnrNonCov;
                  const ttlDpstSMs = RecAccountDtl.data.getSMAccount.ttlDpstSM;
                  const TtlWthdrwnSMs = RecAccountDtl.data.getSMAccount.TtlWthdrwnSM;
                  const namess = RecAccountDtl.data.getSMAccount.name;
                  const TymsMyLnClrds = RecAccountDtl.data.getSMAccount.TymsMyLnClrd;
                  const MaxTymsIHvBLs = RecAccountDtl.data.getSMAccount.MaxTymsIHvBL;
                  const phonecontactz = RecAccountDtl.data.getSMAccount.phonecontact;
                  const updtSendrAcLonOvr1 = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateSMAccount,
                        variables: {
                          input: {
                            awsemail: attributes.email,
                            balance: (parseFloat(SenderUsrBal) - TotalTransacted).toFixed(0),
                            MaxTymsBL: 0,
                            TtlClrdLonsTmsLneeNonCov: 1 + parseFloat(TtlClrdLonsTmsLneeCovs),
                            TtlClrdLonsAmtLneeNonCov: (parseFloat(TtlClrdLonsAmtLneeCovs) + amountKes).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Repayment unsuccessful; Retry");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await updtSMCvLnLnOver();
                  };
                  const updtSendrAcLonOvr2 = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateSMAccount,
                        variables: {
                          input: {
                            awsemail: attributes.email,
                            balance: (parseFloat(SenderUsrBal) - TotalTransacted).toFixed(0),
                            MaxTymsBL: parseFloat(MaxTymsBLs) - 1,
                            TtlBLLonsTmsLneeNonCov: parseFloat(TtlBLLonsTmsLneeNonCovs) - 1,
                            TtlBLLonsAmtLneeNonCov: (parseFloat(TtlBLLonsAmtLneeNonCovs) - amountKes).toFixed(0),
                            TtlClrdLonsTmsLneeNonCov: 1 + parseFloat(TtlClrdLonsTmsLneeCovs),
                            TtlClrdLonsAmtLneeNonCov: (parseFloat(TtlClrdLonsAmtLneeCovs) + amountKes).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Repayment unsuccessful; Retry");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await updtSMCvLnLnOver();
                  };
                  const updtSMCvLnLnOver = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateSMLoansNonCovered,
                        variables: {
                          input: {
                            id: route.params.id,
                            amountrepaid: (amountKes + parseFloat(amountrepaids)).toFixed(0),
                            lonBala: (parseFloat(LonBal) - amountKes).toFixed(0),
                            amountExpectedBackWthClrnc: (parseFloat(amountExpectedBackWthClrncs) - ClranceAmt).toFixed(0),
                            status: "LoanCleared",
                            DefaultPenaltySM2: 0
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Retry or update app or call customer care");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await sendNonLnLnOver();
                  };
                  const sendNonLnLnOver = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: createNonLoans,
                        variables: {
                          input: {
                            senderPhn: attributes.email,
                            recPhn: loanerPhns,
                            RecName: namess,
                            SenderName: names,
                            amount: amountKes.toFixed(0),
                            description: Desc,
                            status: "SMLonRepayment",
                            owner: userInfo.userId
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Repayment unsuccessful; Retry");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await updtRecAcLonOver();
                  };
                  const updtRecAcLonOver = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateSMAccount,
                        variables: {
                          input: {
                            awsemail: loanerPhns,
                            balance: (parseFloat(RecUsrBal) + (amountKes + parseFloat(DefaultPenaltySM2s))).toFixed(0),
                            TymsMyLnClrd: parseFloat(TymsMyLnClrds) + 1,
                            TtlClrdLonsTmsLnrNonCov: parseFloat(TtlClrdLonsTmsLneeCovssss) + 1,
                            TtlClrdLonsAmtLnrNonCov: (parseFloat(TtlClrdLonsAmtLneeCovssss) + amountKes).toFixed(0),
                            MaxTymsIHvBL: parseFloat(MaxTymsIHvBLs) - 1
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Retry or update app or call customer care");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await updtCompLnOvr();
                  };
                  const updtCompLnOvr = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateCompany,
                        variables: {
                          input: {
                            AdminId: "BaruchHabaB'ShemAdonai2",
                            companyEarningBal: UsrTransferFee * amountKes + parseFloat(companyEarningBals) + ClranceAmt - parseFloat(DefaultPenaltySM2s),
                            companyEarning: UsrTransferFee * amountKes + parseFloat(companyEarnings) + ClranceAmt - parseFloat(DefaultPenaltySM2s),
                            totalLnsRecovered: parseFloat(totalLnsRecovereds) + amountKes,
                            ttlSMLnsInClrdAmtNonCov: parseFloat(ttlSMLnsInClrdAmtCovs) + amountKes,
                            ttlSMLnsInClrdTymsNonCov: parseFloat(ttlSMLnsInClrdTymsCovs) + 1
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Repayment unsuccessful; Retry");
                        return;
                      }
                    }
                    const formattedClearing = formatAmountSync(Number(ClranceAmt || 0), accountDtl.data.getSMAccount.nationality, ratesMap);
                    const formattedTxFee = formatAmountSync((parseFloat(UsrTransferFee) * amountKes), accountDtl.data.getSMAccount.nationality, ratesMap);
                    Alert.alert(`Cleared. Clearance charge: ${formattedClearing}. Transaction: ${formattedTxFee}`);
                    
                    // Send Firebase notification
                    const formattedAmt = formatAmountSync(amountKes, accountDtl.data.getSMAccount.nationality, ratesMap);
                    const repaymentMessage = `Hi ${namess}, your loan of ID ${route.params.id} has been repaid ${formattedAmt} by ${names}. For clarification call the loanee: ${attributes.phone_number}. Thank you. NiSenti`;
                    try {
                      const msgRes: any = await client.graphql({
                        query: createMessages,
                        variables: {
                          input: {
                            senderEmail: phonecontactz,
                            messageBody: repaymentMessage
                          }
                        }
                      });
                      if (msgRes?.data?.createMessages) {
                        await client.graphql({
                          query: sendNotification,
                          variables: {
                            riderEmail: phonecontactz,
                            title: 'NiSenti: Loan Repayment',
                            body: repaymentMessage
                          }
                        });
                      }
                    } catch (notifError) {
                      console.log('Notification error:', notifError);
                    }
                    
                    setIsLoading(false);
                  };
                  const repyCovLn = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateSMLoansNonCovered,
                        variables: {
                          input: {
                            id: route.params.id,
                            amountrepaid: (amountKes + parseFloat(amountrepaids)).toFixed(0),
                            lonBala: (parseFloat(LonBal) - amountKes).toFixed(0),
                            DefaultPenaltySM2: 0,
                            amountExpectedBackWthClrnc: (parseFloat(amountExpectedBackWthClrncs) - ClranceAmt).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Retry or update app or call customer care");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await sendCovLn();
                  };
                  const sendCovLn = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: createNonLoans,
                        variables: {
                          input: {
                            recPhn: loanerPhns,
                            senderPhn: attributes.email,
                            RecName: namess,
                            SenderName: names,
                            amount: amountKes.toFixed(0),
                            description: Desc,
                            status: "SMLonRepayment",
                            owner: userInfo.userId
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Repayment unsuccessful; Retry");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await updtSendrAc();
                  };
                  const updtSendrAc = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateSMAccount,
                        variables: {
                          input: {
                            awsemail: attributes.email,
                            balance: (parseFloat(SenderUsrBal) - TotalTransacted).toFixed(0),
                            TtlClrdLonsAmtLneeNonCov: (parseFloat(TtlClrdLonsAmtLneeCovs) + amountKes).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Retry or update app or call customer care");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await updtRecAc();
                  };
                  const updtRecAc = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateSMAccount,
                        variables: {
                          input: {
                            awsemail: loanerPhns,
                            balance: (parseFloat(RecUsrBal) + (amountKes + DefaultPenaltySM2s)).toFixed(0),
                            TtlClrdLonsAmtLnrNonCov: (parseFloat(TtlClrdLonsAmtLneeCovssss) + amountKes).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Retry or update app or call customer care");
                        return;
                      }
                    }
                    setIsLoading(false);
                    await updtComp();
                  };
                  const updtComp = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateCompany,
                        variables: {
                          input: {
                            AdminId: "BaruchHabaB'ShemAdonai2",
                            ttlSMLnsInClrdAmtNonCov: parseFloat(ttlSMLnsInClrdAmtCovs) + amountKes,
                            companyEarningBal: UsrTransferFee * amountKes + parseFloat(companyEarningBals) + ClranceAmt - DefaultPenaltySM2s,
                            companyEarning: UsrTransferFee * amountKes + parseFloat(companyEarnings) + ClranceAmt - DefaultPenaltySM2s,
                            totalLnsRecovered: parseFloat(totalLnsRecovereds) + amountKes
                          }
                        }
                      });
                    } catch (error) {
                      if (error) {
                        Alert.alert("Repayment unsuccessful; Retry");
                        return;
                      }
                    }
                    Alert.alert("Partially paid. Clearance: " + ClranceAmt.toFixed(2) + ". Transaction: " + (parseFloat(UsrTransferFee) * amountKes).toFixed(2));
                    
                    // Send Firebase notification
                    const repaymentMessage2 = 'Hi ' + namess + ', your loan of ID ' + route.params.id + ' has been repaid ' + formatAmountSync(amountKes, nationality || undefined, ratesMap) + ' by ' + names + '. For clarification call the loanee: ' + attributes.phone_number + '. Thank you. NiSenti';
                    try {
                      const msgRes: any = await client.graphql({
                        query: createMessages,
                        variables: {
                          input: {
                            senderEmail: phonecontactz,
                            messageBody: repaymentMessage2
                          }
                        }
                      });
                      if (msgRes?.data?.createMessages) {
                        await client.graphql({
                          query: sendNotification,
                          variables: {
                            riderEmail: phonecontactz,
                            title: 'NiSenti: Loan Repayment',
                            body: repaymentMessage2
                          }
                        });
                      }
                    } catch (notifError) {
                      console.log('Notification error:', notifError);
                    }
                    
                    setIsLoading(false);
                  };
                  if (userInfo.userId !== owner) {
                    Alert.alert("Please first create a main account");
                    return;
                  } else if (usrAcActvStts === "AccountInactive") {
                    Alert.alert('Sender account is inactive');
                    return;
                  } else if (usrAcActvSttss === "AccountInactive") {
                    Alert.alert('Receiver account is inactive');
                    return;
                  } else if (ClranceAmt > amountKes) {
                    Alert.alert("Too little repayment: at least " + ClranceAmt.toFixed(2));
                    return;
                  } else if (parseFloat(SenderUsrBal) < TotalTransacted) {
                    Alert.alert('Requested amount is more than you have in your account');
                    return;
                  } else if (attributes.email === loanerPhns) {
                    Alert.alert('You cannot Repay Yourself');
                  } else if (usrPW !== SnderPW) {
                    Alert.alert('Wrong password');
                    return;
                  } else if (parseFloat(ttlDpstSMs) === 0 && parseFloat(TtlWthdrwnSMs) === 0) {
                    Alert.alert('Loanee ID be verified through deposit at NSNdogo');
                  } else if (parseFloat(nonLonLimits) < amountKes) {
                    Alert.alert('Call ' + CompPhoneContact + ' to have your send Amount limit adjusted');
                    return;
                  } else if (amountKes > parseFloat(LonBal)) {
                    Alert.alert("Your Loan Balance is lesser: " + LonBal);
                  } else if (amountKes === parseFloat(LonBal) && parseFloat(MaxTymsBLs) === parseFloat(maxBLss)) {
                    updtSendrAcLonOvr1();
                  } else if (amountKes === parseFloat(LonBal) && parseFloat(MaxTymsBLs) > parseFloat(maxBLss)) {
                    updtSendrAcLonOvr2();
                  } else {
                    repyCovLn();
                  }
                } catch (e) {
                  if (e) {
                    Alert.alert("Retry or update app or call customer care");
                    return;
                  }
                }
                ;
              };
              await fetchRecUsrDtls();
            } catch (e) {
              if (e) {
                Alert.alert("Retry or update app or call customer care");
                return;
              }
            }
            setIsLoading(false);
          };
          await fetchCompDtls();
        } catch (e) {
          if (e) {
            Alert.alert("Retry or update app or call customer care");
            return;
          }
        }
        setIsLoading(false);
      };
      await ftchCvdSMLn();
    } catch (e) {
      if (e) {
        Alert.alert("Retry or update app or call customer care");
        return;
      }
    }
    ;
    setIsLoading(false);
    setAmount("");
    setDesc("");
    setSnderPW("");
  };
  useEffect(() => {
    const amt = amounts;
    if (!amt && amt !== "") {
      setAmount("");
      return;
    }
    setAmount(amt);
  }, [amounts]);
  useEffect(() => {
    const descr = Desc;
    if (!descr && descr !== "") {
      setDesc("");
      return;
    }
    setDesc(descr);
  }, [Desc]);
  useEffect(() => {
    const SnderPWss = SnderPW;
    if (!SnderPWss && SnderPWss !== "") {
      setSnderPW("");
      return;
    }
    setSnderPW(SnderPWss);
  }, [SnderPW]);
  return <View>
      <View style={styles.image}>
        <ScrollView>
         
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>Fill account Details Below</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} editable={true}></TextInput>
              
            <Text style={styles.sendAmtText}>Amount Sent</Text>
          </View>


          <View style={styles.sendAmtView}>
            <TextInput value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Loanee PassWord</Text>
          </View>

          
          
          <View style={styles.sendAmtViewDesc}>
            <TextInput multiline={true} value={Desc} onChangeText={setDesc} style={styles.sendAmtInputDesc} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Description</Text>
          </View>
          
          

          <TouchableOpacity onPress={fetchSenderUsrDtls} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>Send</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>

          
        </ScrollView>
      </View>
    </View>;
};
export default RepayNonCovLnsss;