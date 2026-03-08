import React, { useEffect, useState } from 'react';
import { createMessages, createNonLoans, createSMLoansCovered, sendNotification, updateCompany, updateSMAccount } from '../../../../src/graphql/mutations';
import { getCompany, getSMAccount, listCovCreditSellers, listCvrdGroupLoans, listSMLoansCovereds } from '../../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { getUserNationalityByEmail, formatAmountForUser, formatAmountSync, convertForeignToKsh } from '../../../../src/utils/exchange';
import { generateClient } from "aws-amplify/api";
import { useExchange } from '../../../../src/contexts/ExchangeContext';
const client = generateClient();
const SMASendNonLns = props => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState("");
  const [amounts, setAmount] = useState("");
  const [Desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { ratesMap, nationality } = useExchange();
  const currencySymbol = (nationality && ratesMap?.[nationality]?.symbol) || 'KSh';
  const navigation = useNavigation();

  const parseAmountInput = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatUserInputAmount = (value: number) => `${currencySymbol} ${value.toFixed(2)}`;
  const SndChmMmbrMny = () => {
    navigation.navigate("AutomaticRepayAllTyps");
  };
  const fetchCvLnSM = async () => {
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const Lonees1: any = await client.graphql({
        query: listSMLoansCovereds,
        variables: {
          filter: {
            and: {
              status: {
                eq: "LoanBL"
              },
              lonBala: {
                gt: 0
              },
              loaneeEmail: {
                eq: attributes.email
              }
            }
          }
        }
      });
      const fetchCLCrdSl = async () => {
        setIsLoading(true);
        try {
          const Lonees3: any = await client.graphql({
            query: listCovCreditSellers,
            variables: {
              filter: {
                and: {
                  status: {
                    eq: "LoanBL"
                  },
                  lonBala: {
                    gt: 0
                  },
                  buyerContact: {
                    eq: attributes.email
                  }
                }
              }
            }
          });
          const fetchCLChm = async () => {
            setIsLoading(true);
            try {
              const Lonees5: any = await client.graphql({
                query: listCvrdGroupLoans,
                variables: {
                  filter: {
                    and: {
                      status: {
                        eq: "LoanBL"
                      },
                      lonBala: {
                        gt: 0
                      },
                      loaneePhn: {
                        eq: attributes.email
                      }
                    }
                  }
                }
              });
              const fetchSenderUsrDtls = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(false);
                try {
                  const accountDtl: any = await client.graphql({
                    query: getSMAccount,
                    variables: {
                      awsemail: attributes.email
                    }
                  });
                  const SenderUsrBal = accountDtl.data.getSMAccount.balance;
                  const usrPW = accountDtl.data.getSMAccount.pw;
                  const usrAcActvStts = accountDtl.data.getSMAccount.acStatus;
                  const SenderSub = accountDtl.data.getSMAccount.owner;
                  const ttlNonLonsSentSMs = accountDtl.data.getSMAccount.ttlNonLonsSentSM;
                  const loanLimits = accountDtl.data.getSMAccount.loanLimit;
                  const names = accountDtl.data.getSMAccount.name;
                  const owner = accountDtl.data.getSMAccount.owner;
                  const senderbeneficiary = accountDtl.data.getSMAccount.beneficiary;
                  const fetchSenderBeneficiaryUsrDtls = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(false);
                    try {
                      const accountDtl: any = await client.graphql({
                        query: getSMAccount,
                        variables: {
                          awsemail: senderbeneficiary
                        }
                      });
                      const SenderBeneficiarySenderUsrBal = accountDtl.data.getSMAccount.balance;
                      const senderbeneficiaryAmt = accountDtl.data.getSMAccount.beneficiaryAmt;
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
                          const senderNat = await getUserNationalityByEmail(attributes.email);
                          const amountForeign = parseAmountInput(amounts) ?? 0;
                          if (amountForeign <= 0) {
                            Alert.alert('Enter a valid amount');
                            setIsLoading(false);
                            return;
                          }
                          const amountKes = await convertForeignToKsh(amountForeign, senderNat);
                          const UsrTransferFeeAmt = UsrTransferFee * amountKes;
                          const UsrTransferFee2 = parseFloat(SenderUsrBal) - amountKes;
                          const TotalTransacted = amountKes + parseFloat(UsrTransferFee) * amountKes;
                          const TotalTransacted2 = amountKes + UsrTransferFee2;
                          const CompPhoneContact = CompDtls.data.getCompany.phoneContact;
                          const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
                          const companyEarnings = CompDtls.data.getCompany.companyEarning;
                          const ttlNonLonssRecSMs = CompDtls.data.getCompany.ttlNonLonssRecSM;
                          const ttlNonLonssSentSMs = CompDtls.data.getCompany.ttlNonLonssSentSM;
                          const fetchRecUsrDtls = async () => {
                            if (isLoading) {
                              return;
                            }
                            setIsLoading(true);
                            try {
                              const RecAccountDtl: any = await client.graphql({
                                query: getSMAccount,
                                variables: {
                                  awsemail: RecNatId
                                }
                              });
                              const RecUsrBal = RecAccountDtl.data.getSMAccount.balance;
                              const usrAcActvSttss = RecAccountDtl.data.getSMAccount.acStatus;
                              const ttlNonLonsRecSMs = RecAccountDtl.data.getSMAccount.ttlNonLonsRecSM;
                              const namess = RecAccountDtl.data.getSMAccount.name;
                              const ttlDpstSMs = RecAccountDtl.data.getSMAccount.ttlDpstSM;
                              const TtlWthdrwnSMs = RecAccountDtl.data.getSMAccount.TtlWthdrwnSM;
                              const MaxAcBals = RecAccountDtl.data.getSMAccount.MaxAcBal;
                              const phonecontact = RecAccountDtl.data.getSMAccount.phonecontact;
                              const receiverbeneficiary = RecAccountDtl.data.getSMAccount.beneficiary;
                              const fetchRecUsrDtlsBeneficiary = async () => {
                                if (isLoading) {
                                  return;
                                }
                                setIsLoading(true);
                                try {
                                  const RecAccountDtl: any = await client.graphql({
                                    query: getSMAccount,
                                    variables: {
                                      awsemail: receiverbeneficiary
                                    }
                                  });
                                  const RecBeneficiaryUsrBal = RecAccountDtl.data.getSMAccount.balance;
                                  const receiverbeneficiaryAmt = RecAccountDtl.data.getSMAccount.beneficiaryAmt;
                                  const sendSMNonLn = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: createNonLoans,
                                        variables: {
                                          input: {
                                            recPhn: RecNatId,
                                            senderPhn: attributes.email,
                                            amount: amountKes.toFixed(0),
                                            description: Desc,
                                            RecName: namess,
                                            SenderName: names,
                                            status: "SMNonLons",
                                            owner: userInfo.userId
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert("Sending unsuccessful; Retry");
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
                                            ttlNonLonsSentSM: (parseFloat(ttlNonLonsSentSMs) + amountKes).toFixed(0),
                                            balance: (parseFloat(SenderUsrBal) - TotalTransacted).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
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
                                            awsemail: RecNatId,
                                            ttlNonLonsRecSM: (parseFloat(ttlNonLonsRecSMs) + amountKes).toFixed(0),
                                            balance: (parseFloat(RecUsrBal) + amountKes).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert("Retry or update app or call customer care");
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtSendrBeneficiaryAc();
                                  };
                                  const updtSendrBeneficiaryAc = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateSMAccount,
                                        variables: {
                                          input: {
                                            awsemail: senderbeneficiary,
                                            balance: (parseFloat(UsrTransferFee) * amountKes * 0.3 + parseFloat(SenderBeneficiarySenderUsrBal)).toFixed(0),
                                            beneficiaryAmt: (parseFloat(UsrTransferFee) * amountKes * 0.3 + parseFloat(senderbeneficiaryAmt)).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert("Retry or update app or call customer care");
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtRecBeneficiaryAc();
                                  };
                                  const updtRecBeneficiaryAc = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateSMAccount,
                                        variables: {
                                          input: {
                                            awsemail: receiverbeneficiary,
                                            balance: (parseFloat(UsrTransferFee) * amountKes * 0.3 + parseFloat(RecBeneficiaryUsrBal)).toFixed(0),
                                            beneficiaryAmt: (parseFloat(UsrTransferFee) * amountKes * 0.3 + parseFloat(receiverbeneficiaryAmt)).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
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
                                            companyEarningBal: parseFloat(UsrTransferFee) * amountKes + parseFloat(companyEarningBals),
                                            companyEarning: parseFloat(UsrTransferFee) * amountKes + parseFloat(companyEarnings),
                                            ttlNonLonssRecSM: amountKes + parseFloat(ttlNonLonssRecSMs),
                                            ttlNonLonssSentSM: amountKes + parseFloat(ttlNonLonssSentSMs)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert("Retry or update app or call customer care");
                                        return;
                                      }
                                    }
                                    Alert.alert("Amount: " + formatUserInputAmount(amountForeign) + ". Transaction fee: " + formatAmountSync(UsrTransferFeeAmt, senderNat || nationality, ratesMap));
                                    
                                    // Send Firebase notification
                                    const transferMessage = 'Hi ' + namess + ', ' + names + ' has sent you a non loan of ' + formatUserInputAmount(amountForeign) + '. For clarification call the sender ' + attributes.phone_number + '. Thank you. NiSenti';
                                    try {
                                      const msgRes: any = await client.graphql({
                                        query: createMessages,
                                        variables: {
                                          input: {
                                            senderEmail: phonecontact,
                                            messageBody: transferMessage
                                          }
                                        }
                                      });
                                      if (msgRes?.data?.createMessages) {
                                        await client.graphql({
                                          query: sendNotification,
                                          variables: {
                                            riderEmail: phonecontact,
                                            title: 'NiSenti: Non-Loan Transfer',
                                            body: transferMessage
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
                                  } else if (usrAcActvStts !== "AccountActive") {
                                    Alert.alert('Sender account is inactive');
                                  } else if (usrAcActvSttss !== "AccountActive") {
                                    Alert.alert('Receiver account is inactive');
                                  } else if (SenderNatId === RecNatId) {
                                    Alert.alert('You cannot Send money to Yourself');
                                  } else if (parseFloat(ttlDpstSMs) === 0 && parseFloat(TtlWthdrwnSMs) === 0) {
                                    Alert.alert('Receiver ID be verified through deposit at NSNdogo');
                                  } else if (UsrTransferFee2 < 0) {
                                    Alert.alert('Requested amount is more than you have in your account');
                                  } else if (parseFloat(RecUsrBal) + amountKes > parseFloat(MaxAcBals)) {
                                    Alert.alert('Receiver Call customer care to have wallet capacity adjusted');
                                  } else if (usrPW !== SnderPW) {
                                    Alert.alert('Wrong password');
                                  } else if (userInfo.userId !== SenderSub) {
                                    Alert.alert('Please send from your own  account');
                                  } else if (parseFloat(loanLimits) < amountKes) {
                                    Alert.alert('Call ' + CompPhoneContact + ' to have your send Amount limit adjusted');
                                  } else if (Lonees1.data.listSMLoansCovereds.items.length > 0 || Lonees3.data.listCovCreditSellers.items.length > 0 || Lonees5.data.listCvrdGroupLoans.items.length > 0) {
                                    SndChmMmbrMny();
                                  } else if (UsrTransferFeeAmt > UsrTransferFee2) {
                                    Alert.alert('Insufficient Funds');
                                  } else {
                                    sendSMNonLn();
                                  }
                                } catch (e) {
                                  console.log(e);
                                  if (e) {
                                    Alert.alert("Retry or update app or call customer care");
                                    return;
                                  }
                                }
                                setIsLoading(false);
                              };
                              await fetchRecUsrDtlsBeneficiary();
                            } catch (e) {
                              console.log(e);
                              if (e) {
                                Alert.alert("Retry or update app or call customer care");
                                return;
                              }
                            }
                            setIsLoading(false);
                          };
                          await fetchRecUsrDtls();
                        } catch (e) {
                          console.log(e);
                          if (e) {
                            Alert.alert("Retry or update app or call customer care");
                            return;
                          }
                        }
                        setIsLoading(false);
                      };
                      await fetchCompDtls();
                    } catch (e) {
                      console.log(e);
                      if (e) {
                        Alert.alert("Retry or update app or call customer care");
                        return;
                      }
                    }
                    setIsLoading(false);
                  };
                  await fetchSenderBeneficiaryUsrDtls();
                } catch (e) {
                  console.log(e);
                  if (e) {
                    Alert.alert("Retry or update app or call customer care");
                    return;
                  }
                }
                setIsLoading(false);
              };
              await fetchSenderUsrDtls();
            } catch (e) {
              console.log(e);
              if (e) {
                Alert.alert("Retry or update app or call customer care");
                return;
              }
            }
            setIsLoading(false);
          };
          await fetchCLChm();
        } catch (e) {
          console.log(e);
          if (e) {
            Alert.alert("Retry or update app or call customer care");
            return;
          }
        }
        setIsLoading(false);
      };
      await fetchCLCrdSl();
    } catch (e) {
      console.log(e);
      if (e) {
        Alert.alert("Retry or update app or call customer care");
        return;
      }
    }
    ;
    setIsLoading(false);
    setSenderNatId('');
    setAmount("");
    setRecNatId('');
    setDesc("");
    setSnderPW("");
  };
  return <View>
      <View style={styles.image}>
        <ScrollView>
         
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>Fill account Details Below</Text>
          </View>

          

          <View style={styles.sendAmtView}>
            <TextInput placeholder="Receiver Email" value={RecNatId} onChangeText={setRecNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Receiver Email</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} placeholder={`${currencySymbol} Amount`} value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} editable={true}></TextInput>
              
            <Text style={styles.sendAmtText}>Amount Sent</Text>
          </View>


          <View style={styles.sendAmtView}>
            <TextInput value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Sender PassWord</Text>
          </View>

          

          <View style={styles.sendAmtViewDesc}>
            <TextInput multiline={true} value={Desc} onChangeText={setDesc} style={styles.sendAmtInputDesc} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Description</Text>
          </View>

          <TouchableOpacity onPress={fetchCvLnSM} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>Send</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>

          
        </ScrollView>
      </View>
    </View>;
};
export default SMASendNonLns;