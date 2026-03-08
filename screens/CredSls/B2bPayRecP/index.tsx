import React, { useEffect, useState } from 'react';
import {
  createSMLoansCovered,
  createNonLoans,
  updateCompany,
  updateSMAccount,
  updateBizna,
  createMessages,
  sendNotification,
} from '../../../src/graphql/mutations';
import {
  getBizna,
  getCompany,
  getSMAccount,
  listCovCreditSellers,
  listCvrdGroupLoans,
  listSMLoansCovereds,
} from '../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useNavigation } from '@react-navigation/native';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import styles from './styles';

const client = generateClient();

const SMASendNonLns = (props: any) => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState('');
  const [amounts, setAmount] = useState('');
  const [Desc, setDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { ratesMap } = useExchange();

  const confirmSendTransfer = (amountDisplay: string, receiverBusiness: string, description: string) =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Transfer',
        `Send ${amountDisplay} to ${receiverBusiness}?\n\nDescription: ${description || 'N/A'}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Send', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });

  const SndChmMmbrMny = () => {
    navigation.navigate('AutomaticRepayAllTyps' as never);
  };

  const NoBizBen = () => {
    navigation.navigate('PayCash' as never);
  };

  const fetchCvLnSM = async () => {
    setIsLoading(true);

    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    const rawNationality = (attributes as any).nationality;
    const userCode = nationalityToCode(rawNationality) || rawNationality || 'KE';
    const amountInput = parseFloat(amounts);

    if (!Number.isFinite(amountInput) || amountInput <= 0) {
      Alert.alert('Enter a valid amount');
      setIsLoading(false);
      return;
    }

    const amountKes = await convertForeignToKsh(amountInput, userCode);
    if (!Number.isFinite(amountKes) || amountKes <= 0) {
      Alert.alert('Unable to convert amount. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const Lonees1: any = await client.graphql({
        query: listSMLoansCovereds,
        variables: {
          filter: {
            and: {
              status: { eq: 'LoanBL' },
              lonBala: { gt: 0 },
              loaneeEmail: { eq: attributes.email },
            },
          },
        },
      });

      const fetchCLCrdSl = async () => {
        setIsLoading(true);
        try {
          const Lonees3: any = await client.graphql({
            query: listCovCreditSellers,
            variables: {
              filter: {
                and: {
                  status: { eq: 'LoanBL' },
                  lonBala: { gt: 0 },
                  buyerContact: { eq: SenderNatId },
                },
              },
            },
          });

          const fetchCLChm = async () => {
            setIsLoading(true);
            try {
              const Lonees5: any = await client.graphql({
                query: listCvrdGroupLoans,
                variables: {
                  filter: {
                    and: {
                      status: { eq: 'LoanBL' },
                      lonBala: { gt: 0 },
                      loaneePhn: { eq: attributes.email },
                    },
                  },
                },
              });

              const fetchSenderUsrDtls = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(false);
                try {
                  const accountDtl: any = await client.graphql({
                    query: getBizna,
                    variables: { BusKntct: SenderNatId },
                  });

                  const SenderUsrBal = accountDtl.data.getBizna.netEarnings;
                  const bizBeneficiaryz = accountDtl.data.getBizna.bizBeneficiary;
                  const bizTypez = accountDtl.data.getBizna.bizType;
                  const name = accountDtl.data.getBizna.busName;
                  const ownerz = accountDtl.data.getBizna.owner;
                  const SenderAcstatus = accountDtl.data.getBizna.status;
                  const pw = accountDtl.data.getBizna.pw;
                  const noBL = accountDtl.data.getBizna.noBL;

                  const fetchCompDtls = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      const CompDtls: any = await client.graphql({
                        query: getCompany,
                        variables: {
                          AdminId: "BaruchHabaB'ShemAdonai2",
                        },
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

                      const fetchRecUsrDtls = async () => {
                        if (isLoading) {
                          return;
                        }
                        setIsLoading(true);
                        try {
                          const RecAccountDtl: any = await client.graphql({
                            query: getBizna,
                            variables: { BusKntct: RecNatId },
                          });
                          const RecUsrBal = RecAccountDtl.data.getBizna.netEarnings;
                          const bizBeneficiary = RecAccountDtl.data.getBizna.bizBeneficiary;
                          const bizType = RecAccountDtl.data.getBizna.bizType;
                          const namess = RecAccountDtl.data.getBizna.busName;
                          const RecAcstatus = RecAccountDtl.data.getBizna.status;
                          const receiverEmail = RecAccountDtl.data.getBizna.email;

                          const fetchSenderBizUsrDtls = async () => {
                            if (isLoading) {
                              return;
                            }
                            setIsLoading(false);
                            try {
                              const accountDtl7: any = await client.graphql({
                                query: getSMAccount,
                                variables: { awsemail: bizBeneficiaryz },
                              });

                              const SenderUsrBal7 = accountDtl7.data.getSMAccount.balance;

                              const fetchRecBizUsrDtls = async () => {
                                if (isLoading) {
                                  return;
                                }
                                setIsLoading(false);
                                try {
                                  const accountDtl7: any = await client.graphql({
                                    query: getSMAccount,
                                    variables: { awsemail: bizBeneficiary },
                                  });

                                  const SenderUsrBal8 = accountDtl7.data.getSMAccount.balance;

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
                                            senderPhn: SenderNatId,
                                            amount: amountKes.toFixed(0),
                                            description: Desc,
                                            RecName: namess,
                                            SenderName: name,
                                            status: 'cashSales',
                                            owner: ownerz,
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Sending unsuccessful; Retry');
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtSendrAc();
                                  };

                                  const sendSMNonLn2 = async () => {
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
                                            senderPhn: SenderNatId,
                                            amount: amountKes.toFixed(0),
                                            description: Desc,
                                            RecName: namess,
                                            SenderName: name,
                                            status: 'cashSales',
                                            owner: ownerz,
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Sending unsuccessful; Retry');
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtSendrAc2();
                                  };

                                  const updtSendrAc = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateBizna,
                                        variables: {
                                          input: {
                                            BusKntct: SenderNatId,
                                            netEarnings: (parseFloat(SenderUsrBal) - TotalTransacted).toFixed(0),
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Check your internet connection');
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtRecAc();
                                  };

                                  const updtSendrAc2 = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateBizna,
                                        variables: {
                                          input: {
                                            BusKntct: SenderNatId,
                                            netEarnings: (parseFloat(SenderUsrBal) - TotalTransacted2).toFixed(0),
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Check your internet connection');
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtRecAc2();
                                  };

                                  const updtRecAc = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateBizna,
                                        variables: {
                                          input: {
                                            BusKntct: RecNatId,
                                            netEarnings: (parseFloat(RecUsrBal) + amountKes).toFixed(0),
                                            earningsBal: (parseFloat(RecUsrBal) + amountKes).toFixed(0),
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Check your internet connection');
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtBenAc();
                                  };

                                  const updtBenAc = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateSMAccount,
                                        variables: {
                                          input: {
                                            awsemail: bizBeneficiaryz,
                                            balance: ((parseFloat(UsrTransferFee) * amountKes) * 0.3 + parseFloat(SenderUsrBal7)).toFixed(0),
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Check your internet connection');
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtRecBenAc();
                                  };

                                  const updtRecBenAc = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateSMAccount,
                                        variables: {
                                          input: {
                                            awsemail: bizBeneficiary,
                                            balance: ((parseFloat(UsrTransferFee) * amountKes) * 0.3 + parseFloat(SenderUsrBal8)).toFixed(0),
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Check your internet connection');
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtComp();
                                  };

                                  const updtRecAc2 = async () => {
                                    if (isLoading) {
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateBizna,
                                        variables: {
                                          input: {
                                            BusKntct: RecNatId,
                                            netEarnings: (parseFloat(RecUsrBal) + amountKes).toFixed(0),
                                            earningsBal: (parseFloat(RecUsrBal) + amountKes).toFixed(0),
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Check your internet connection');
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtComp2();
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
                                            companyEarningBal: (parseFloat(UsrTransferFee) * amountKes) * 0.4 + parseFloat(companyEarningBals),
                                            companyEarning: (parseFloat(UsrTransferFee) * amountKes) * 0.4 + parseFloat(companyEarnings),
                                            ttlNonLonssRecSM: amountKes + parseFloat(ttlNonLonssRecSMs),
                                            ttlNonLonssSentSM: amountKes + parseFloat(ttlNonLonssSentSMs),
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Check your internet connection');
                                        return;
                                      }
                                    }
                                    const formattedAmount = formatAmountSync(amountInput, userCode, ratesMap);
                                    const formattedFee = formatAmountSync(UsrTransferFeeAmt, userCode, ratesMap);
                                    
                                    Alert.alert(
                                      'Success',
                                      'Amount: ' + formattedAmount + '. Transaction fee: ' + formattedFee
                                    );

                                    // Send notification to receiver
                                    if (receiverEmail) {
                                      try {
                                        const notificationBody = `Confirmed. ${name} Business entity has sent you ${formattedAmount} to your NiSenti Business account. Please confirm this transaction record is on your NiSenti app. Thank you. NiSenti`;
                                        await client.graphql({
                                          query: createMessages,
                                          variables: {
                                            input: {
                                              senderEmail: receiverEmail,
                                              messageBody: notificationBody
                                            }
                                          }
                                        });
                                        await client.graphql({
                                          query: sendNotification,
                                          variables: {
                                            riderEmail: receiverEmail,
                                            title: 'NiSenti: Business Payment Received',
                                            body: notificationBody
                                          }
                                        });
                                      } catch (notifError) {
                                        console.log('Notification error:', notifError);
                                      }
                                    }
                                    setIsLoading(false);
                                  };

                                  const updtComp2 = async () => {
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
                                            companyEarningBal: UsrTransferFee2 + parseFloat(companyEarningBals),
                                            companyEarning: UsrTransferFee2 + parseFloat(companyEarnings),
                                            ttlNonLonssRecSM: amountKes + parseFloat(ttlNonLonssRecSMs),
                                            ttlNonLonssSentSM: amountKes + parseFloat(ttlNonLonssSentSMs),
                                          },
                                        },
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert('Check your internet connection');
                                        return;
                                      }
                                    }

                                    const formattedAmount2 = formatAmountSync(amountInput, userCode, ratesMap);
                                    
                                    Alert.alert(
                                      'Success',
                                      'Insufficient transaction fees? No worries! ' + formattedAmount2 + ' sent!'
                                    );

                                    // Send notification to receiver
                                    if (receiverEmail) {
                                      try {
                                        const notificationBody = `Confirmed. ${name} Business entity has sent you ${formattedAmount2} to your NiSenti Business account. Please confirm this transaction record is on your NiSenti app. Thank you. NiSenti`;
                                        await client.graphql({
                                          query: createMessages,
                                          variables: {
                                            input: {
                                              senderEmail: receiverEmail,
                                              messageBody: notificationBody
                                            }
                                          }
                                        });
                                        await client.graphql({
                                          query: sendNotification,
                                          variables: {
                                            riderEmail: receiverEmail,
                                            title: 'NiSenti: Business Payment Received',
                                            body: notificationBody
                                          }
                                        });
                                      } catch (notifError) {
                                        console.log('Notification error:', notifError);
                                      }
                                    }
                                    setIsLoading(false);
                                  };

                                  if (userInfo.userId !== ownerz) {
                                    Alert.alert('Unauthorised to pay on behalf of the business!');
                                    return;
                                  } else if (bizType === 'Public') {
                                    NoBizBen();
                                  } else if (RecAcstatus === 'AccountInactive') {
                                    Alert.alert('Receiver account is inactive');
                                  } else if (SenderAcstatus === 'AccountInactive') {
                                    Alert.alert('Sender account is inactive');
                                  } else if (UsrTransferFee2 < 0) {
                                    Alert.alert('Requested amount is more than you have in your account');
                                  } else if (pw !== SnderPW) {
                                    Alert.alert('Wrong password');
                                  } else if (Lonees3.data.listCovCreditSellers.items.length > 0) {
                                    SndChmMmbrMny();
                                  } else if (!(await confirmSendTransfer(formatAmountSync(amountInput, userCode, ratesMap), RecNatId, Desc))) {
                                    setIsLoading(false);
                                    return;
                                  } else if (UsrTransferFeeAmt > UsrTransferFee2 && UsrTransferFee2 > 0) {
                                    sendSMNonLn2();
                                  } else {
                                    sendSMNonLn();
                                  }
                                } catch (e) {
                                  if (e) {
                                    Alert.alert('Reciever does not exist');
                                    return;
                                  }
                                }
                                setIsLoading(false);
                              };
                              await fetchRecBizUsrDtls();
                            } catch (e) {
                              if (e) {
                                Alert.alert('Reciever does not exist');
                                return;
                              }
                            }
                            setIsLoading(false);
                          };
                          await fetchSenderBizUsrDtls();
                        } catch (e) {
                          if (e) {
                            Alert.alert('Reciever does not exist');
                            return;
                          }
                        }
                        setIsLoading(false);
                      };
                      await fetchRecUsrDtls();
                    } catch (e) {
                      if (e) {
                        Alert.alert('Check your internet connection');
                        return;
                      }
                    }
                    setIsLoading(false);
                  };
                  await fetchCompDtls();
                } catch (e) {
                  if (e) {
                    Alert.alert('Check your internet connection');
                    return;
                  }
                }
                setIsLoading(false);
              };

              await fetchSenderUsrDtls();
            } catch (e) {
              if (e) {
                Alert.alert('Check your internet connection');
                return;
              }
            }
            setIsLoading(false);
          };

          await fetchCLChm();
        } catch (e) {
          if (e) {
            Alert.alert('Check your internet connection');
            return;
          }
        }
        setIsLoading(false);
      };

      await fetchCLCrdSl();
    } catch (e) {
      if (e) {
        Alert.alert('Please fill details correctly or check your internet connection');
        return;
      }
    }

    setIsLoading(false);
    setSenderNatId('');
    setAmount('');
    setRecNatId('');
    setDesc('');
    setSnderPW('');
  };

  useEffect(() => {
    const SnderNatIds = SenderNatId;
    if (!SnderNatIds && SnderNatIds !== '') {
      setSenderNatId('');
      return;
    }
    setSenderNatId(SnderNatIds);
  }, [SenderNatId]);

  useEffect(() => {
    const amt = amounts;
    if (!amt && amt !== '') {
      setAmount('');
      return;
    }
    setAmount(amt);
  }, [amounts]);

  useEffect(() => {
    const RecNatIds = RecNatId;
    if (!RecNatIds && RecNatIds !== '') {
      setRecNatId('');
      return;
    }
    setRecNatId(RecNatIds);
  }, [RecNatId]);

  useEffect(() => {
    const descr = Desc;
    if (!descr && descr !== '') {
      setDesc('');
      return;
    }
    setDesc(descr);
  }, [Desc]);

  useEffect(() => {
    const SnderPWss = SnderPW;
    if (!SnderPWss && SnderPWss !== '') {
      setSnderPW('');
      return;
    }
    setSnderPW(SnderPWss);
  }, [SnderPW]);

  return (
    <View>
      <View style={styles.image}>
        <ScrollView>
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>Fill account Details Below</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput placeholder="Sending Business Phone" value={SenderNatId} onChangeText={setSenderNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Sending Business Phone</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput placeholder="Receiving Business Phone" value={RecNatId} onChangeText={setRecNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Receiving Business Phone</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={'decimal-pad'} value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Amount Sent</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Buyer PassWord</Text>
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
    </View>
  );
};

export default SMASendNonLns;