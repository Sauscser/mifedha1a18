import React, { useEffect, useState } from 'react';
import Communications from 'react-native-communications';
import { createSMLoansCovered, createNonLoans, updateCompany, updateSMAccount } from '../../../../src/graphql/mutations';
import { getCompany, getSMAccount, listCovCreditSellers, listCvrdGroupLoans, listSMLoansCovereds } from '../../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { convertForeignToKsh, formatAmountForUser } from '../../../../src/utils/exchange';
const client = generateClient();
const SMASendNonLns = props => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState("");
  const [amounts, setAmount] = useState("");
  const [Desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const SndChmMmbrMny = () => {
    navigation.navigate("AutomaticRepayAllTyps");
  };
  const fetchCvLnSM = async () => {
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    const amountForeign = parseFloat(amounts);
    if (!Number.isFinite(amountForeign) || amountForeign <= 0) {
      Alert.alert("Enter a valid amount");
      setIsLoading(false);
      return;
    }
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
                  const benefitsAmount = accountDtl.data.getSMAccount.benefitsAmount;
                  const senderNationality = accountDtl.data.getSMAccount.nationality;
                  const amountKes = await convertForeignToKsh(amountForeign, senderNationality);
                  if (!Number.isFinite(amountKes) || amountKes <= 0) {
                    Alert.alert("Unable to convert amount. Please try again.");
                    setIsLoading(false);
                    return;
                  }
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
                      const UsrTransferFeeAmt = UsrTransferFee * amountKes;
                      const UsrTransferFee2 = parseFloat(SenderUsrBal) - amountKes;
                      const TotalTransacted = amountKes + parseFloat(UsrTransferFee) * amountKes;
                      const TotalTransacted2 = amountKes + UsrTransferFee2;
                      const CompPhoneContact = CompDtls.data.getCompany.phoneContact;
                      const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
                      const companyEarnings = CompDtls.data.getCompany.companyEarning;
                      const ttlNonLonssRecSMs = CompDtls.data.getCompany.ttlNonLonssRecSM;
                      const ttlNonLonssSentSMs = CompDtls.data.getCompany.ttlNonLonssSentSM;
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
                                recPhn: attributes.email,
                                senderPhn: attributes.email,
                                amount: amountKes.toFixed(0),
                                description: Desc,
                                RecName: names,
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
                                balance: (parseFloat(SenderUsrBal) - TotalTransacted).toFixed(0),
                                benefitsAmount: parseFloat(benefitsAmount) + amountKes
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
                          const resp = await client.graphql({
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
                          if (resp?.data?.updateCompany) {
                            const formattedAmount = await formatAmountForUser(amountKes, senderNationality);
                            const formattedFee = await formatAmountForUser(UsrTransferFeeAmt, senderNationality);
                            Alert.alert(
                              `Boost Amount: ${formattedAmount}. Transaction fee: ${formattedFee}`
                            );
                          } else {
                            Alert.alert("Retry or update app or call customer care");
                            return;
                          }
                        } catch (error) {
                          console.log(error);
                        }
                        setIsLoading(false);
                      };
                      if (userInfo.userId !== owner) {
                        Alert.alert("Please first create a main account");
                        return;
                      } else if (usrAcActvStts !== "AccountActive") {
                        Alert.alert('Sender account is inactive');
                      } else if (TotalTransacted > SenderUsrBal) {
                        Alert.alert('Insufficient Funds');
                      } else if (usrPW !== SnderPW) {
                        Alert.alert('Wrong password');
                      } else if (userInfo.userId !== SenderSub) {
                        Alert.alert('Please send from your own  account');
                      } else if (parseFloat(loanLimits) < amountKes) {
                        Alert.alert('Call ' + CompPhoneContact + ' to have your send Amount limit adjusted');
                      } else if (Lonees1.data.listSMLoansCovereds.items.length > 0 || Lonees3.data.listCovCreditSellers.items.length > 0 || Lonees5.data.listCvrdGroupLoans.items.length > 0) {
                        SndChmMmbrMny();
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
  useEffect(() => {
    const SnderNatIds = SenderNatId;
    if (!SnderNatIds && SnderNatIds !== "") {
      setSenderNatId("");
      return;
    }
    setSenderNatId(SnderNatIds);
  }, [SenderNatId]);
  useEffect(() => {
    const amt = amounts;
    if (!amt && amt !== "") {
      setAmount("");
      return;
    }
    setAmount(amt);
  }, [amounts]);
  useEffect(() => {
    const RecNatIds = RecNatId;
    if (!RecNatIds && RecNatIds !== "") {
      setRecNatId("");
      return;
    }
    setRecNatId(RecNatIds);
  }, [RecNatId]);
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


          <View style={styles.sendAmtViewDesc}>
            <TextInput keyboardType={"decimal-pad"} value={amounts} onChangeText={setAmount} style={styles.sendAmtInputDesc} editable={true}></TextInput>
              
            <Text style={styles.sendAmtText}>Amount Sent</Text>
          </View>


          <View style={styles.sendAmtViewDesc}>
            <TextInput value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInputDesc} editable={true}></TextInput>
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