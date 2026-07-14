import React, { useState } from 'react';
import { createNonLoans, updateCompany, updateSMAccount, updateBizna, createMessages, sendNotification } from '../../../src/graphql/mutations';
import { getBizna, getCompany, getSMAccount, listCovCreditSellers, listCvrdGroupLoans, listSMLoansCovereds } from '../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';

const client = generateClient();

const confirmSendTransfer = (amount: string, receiver: string, description: string, t: any, fmt: (template: string, vars: Record<string, string | number>) => string): Promise<boolean> => {
  return new Promise(resolve => {
    Alert.alert(
      t.confirmTransferTitle,
      fmt(t.confirmTransferMessage, { amount, receiver, description }),
      [
        { text: t.cancel, onPress: () => resolve(false), style: 'cancel' },
        { text: t.send, onPress: () => resolve(true) }
      ]
    );
  });
};

const SMASendNonLns = (props: any) => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState('');
  const [amounts, setAmount] = useState('');
  const [Desc, setDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fmt = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

  const SndChmMmbrMny = () => {
    navigation.navigate('AutomaticRepayAllTyps');
  };

  const NoBizBen = () => {
    navigation.navigate('PayCash');
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
              status: { eq: 'LoanBL' },
              lonBala: { gt: 0 },
              loaneeEmail: { eq: attributes.email }
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
                  status: { eq: 'LoanBL' },
                  lonBala: { gt: 0 },
                  buyerContact: { eq: SenderNatId }
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
                      status: { eq: 'LoanBL' },
                      lonBala: { gt: 0 },
                      loaneePhn: { eq: attributes.email }
                    }
                  }
                }
              });

              const fetchSenderUsrDtls = async () => {
                if (isLoading) return;
                setIsLoading(false);
                try {
                  const accountDtl: any = await client.graphql({
                    query: getBizna,
                    variables: { BusKntct: SenderNatId }
                  });

                  const SenderUsrBal = accountDtl.data.getBizna.netEarnings;
                  const bizBeneficiaryz = accountDtl.data.getBizna.bizBeneficiary;
                  const bizTypez = accountDtl.data.getBizna.bizType;
                  const name = accountDtl.data.getBizna.busName;
                  const ownerz = accountDtl.data.getBizna.owner;
                  const SenderAcstatus = accountDtl.data.getBizna.status;
                  const pw = accountDtl.data.getBizna.pw;

                  const fetchCompDtls = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      const CompDtls: any = await client.graphql({
                        query: getCompany,
                        variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
                      });

                      const UsrTransferFee = CompDtls.data.getCompany.userTransferFee;
                      const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
                      const companyEarnings = CompDtls.data.getCompany.companyEarning;
                      const ttlNonLonssRecSMs = CompDtls.data.getCompany.ttlNonLonssRecSM;
                      const ttlNonLonssSentSMs = CompDtls.data.getCompany.ttlNonLonssSentSM;

                      const amountInput = parseFloat(amounts);
                      if (!amountInput || amountInput <= 0) {
                        Alert.alert(t.enterValidAmount);
                        setIsLoading(false);
                        return;
                      }

                      const rawNationality = (attributes as any).nationality;
                      const userCode = nationalityToCode(rawNationality) || rawNationality || 'KE';

                      const amountKes = await convertForeignToKsh(amountInput, userCode);
                      if (!amountKes || amountKes <= 0) {
                        Alert.alert(t.unableConvertAmount);
                        setIsLoading(false);
                        return;
                      }

                      const UsrTransferFeeAmt = UsrTransferFee * amountKes;
                      const UsrTransferFee2 = parseFloat(SenderUsrBal) - amountKes;
                      const TotalTransacted = amountKes + UsrTransferFeeAmt;
                      const TotalTransacted2 = amountKes + UsrTransferFee2;

                      const fetchRecUsrDtls = async () => {
                        if (isLoading) return;
                        setIsLoading(true);
                        try {
                          const RecAccountDtl: any = await client.graphql({
                            query: getBizna,
                            variables: { BusKntct: RecNatId }
                          });
                          const RecUsrBal = RecAccountDtl.data.getBizna.netEarnings;
                          const bizBeneficiary = RecAccountDtl.data.getBizna.bizBeneficiary;
                          const bizType = RecAccountDtl.data.getBizna.bizType;
                          const namess = RecAccountDtl.data.getBizna.busName;
                          const RecAcstatus = RecAccountDtl.data.getBizna.status;
                          const receiverEmail = RecAccountDtl.data.getBizna.email;

                          const fetchSenderBizUsrDtls = async () => {
                            if (isLoading) return;
                            setIsLoading(false);
                            try {
                              const accountDtl7: any = await client.graphql({
                                query: getSMAccount,
                                variables: { awsemail: bizBeneficiaryz }
                              });
                              const SenderUsrBal7 = accountDtl7.data.getSMAccount.balance;

                              const fetchRecBizUsrDtls = async () => {
                                if (isLoading) return;
                                setIsLoading(false);
                                try {
                                  const accountDtl8: any = await client.graphql({
                                    query: getSMAccount,
                                    variables: { awsemail: bizBeneficiary }
                                  });
                                  const SenderUsrBal8 = accountDtl8.data.getSMAccount.balance;

                                  const sendSMNonLn = async () => {
                                    if (isLoading) return;
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
                                            fees: 0
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert(t.sendingUnsuccessful);
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtSendrAc();
                                  };

                                  const sendSMNonLn2 = async () => {
                                    if (isLoading) return;
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
                                            fees: 0
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      if (error) {
                                        Alert.alert(t.sendingUnsuccessful);
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtSendrAc2();
                                  };

                                  const updtSendrAc = async () => {
                                    if (isLoading) return;
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateBizna,
                                        variables: {
                                          input: {
                                            BusKntct: SenderNatId,
                                            netEarnings: (parseFloat(SenderUsrBal) - TotalTransacted).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert(t.checkInternet);
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtRecAc();
                                  };

                                  const updtSendrAc2 = async () => {
                                    if (isLoading) return;
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateBizna,
                                        variables: {
                                          input: {
                                            BusKntct: SenderNatId,
                                            netEarnings: (parseFloat(SenderUsrBal) - TotalTransacted2).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert(t.checkInternet);
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtRecAc2();
                                  };

                                  const updtRecAc = async () => {
                                    if (isLoading) return;
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateBizna,
                                        variables: {
                                          input: {
                                            BusKntct: RecNatId,
                                            netEarnings: (parseFloat(RecUsrBal) + amountKes).toFixed(0),
                                            earningsBal: (parseFloat(RecUsrBal) + amountKes).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert(t.checkInternet);
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtBenAc();
                                  };

                                  const updtBenAc = async () => {
                                    if (isLoading) return;
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateSMAccount,
                                        variables: {
                                          input: {
                                            awsemail: bizBeneficiaryz,
                                            balance: (UsrTransferFeeAmt * 0.3 + parseFloat(SenderUsrBal7)).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert(t.checkInternet);
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtRecBenAc();
                                  };

                                  const updtRecBenAc = async () => {
                                    if (isLoading) return;
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateSMAccount,
                                        variables: {
                                          input: {
                                            awsemail: bizBeneficiary,
                                            balance: (UsrTransferFeeAmt * 0.3 + parseFloat(SenderUsrBal8)).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert(t.checkInternet);
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtComp();
                                  };

                                  const updtRecAc2 = async () => {
                                    if (isLoading) return;
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateBizna,
                                        variables: {
                                          input: {
                                            BusKntct: RecNatId,
                                            netEarnings: (parseFloat(RecUsrBal) + amountKes).toFixed(0),
                                            earningsBal: (parseFloat(RecUsrBal) + amountKes).toFixed(0)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert(t.checkInternet);
                                        return;
                                      }
                                    }
                                    setIsLoading(false);
                                    await updtComp2();
                                  };

                                  const updtComp = async () => {
                                    if (isLoading) return;
                                    setIsLoading(true);
                                    try {
                                      await client.graphql({
                                        query: updateCompany,
                                        variables: {
                                          input: {
                                            AdminId: "BaruchHabaB'ShemAdonai2",
                                            companyEarningBal: UsrTransferFeeAmt * 0.4 + parseFloat(companyEarningBals),
                                            companyEarning: UsrTransferFeeAmt * 0.4 + parseFloat(companyEarnings),
                                            ttlNonLonssRecSM: amountKes + parseFloat(ttlNonLonssRecSMs),
                                            ttlNonLonssSentSM: amountKes + parseFloat(ttlNonLonssSentSMs)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert(t.checkInternet);
                                        return;
                                      }
                                    }
                                    const formattedAmount = formatAmountSync(amountKes, userCode, ratesMap);
                                    const formattedFee = formatAmountSync(UsrTransferFeeAmt, userCode, ratesMap);
                                    Alert.alert(t.successTitle, fmt(t.amountFee, { amount: formattedAmount, fee: formattedFee }));

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
                                    if (isLoading) return;
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
                                            ttlNonLonssSentSM: amountKes + parseFloat(ttlNonLonssSentSMs)
                                          }
                                        }
                                      });
                                    } catch (error) {
                                      console.log(error);
                                      if (error) {
                                        Alert.alert(t.checkInternet);
                                        return;
                                      }
                                    }
                                    const formattedAmount = formatAmountSync(amountKes, userCode, ratesMap);
                                    Alert.alert(fmt(t.insufficientFeesSent, { amount: formattedAmount }));

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

                                  if (userInfo.userId !== ownerz) {
                                    Alert.alert(t.unauthorizedPay);
                                    return;
                                  } else if (bizTypez === 'Public') {
                                    NoBizBen();
                                  } else if (RecAcstatus === 'AccountInactive') {
                                    Alert.alert(t.receiverInactive);
                                  } else if (SenderAcstatus === 'AccountInactive') {
                                    Alert.alert(t.senderInactive);
                                  } else if (UsrTransferFee2 < 0) {
                                    Alert.alert(t.requestedMoreThanBalance);
                                  } else if (pw !== SnderPW) {
                                    Alert.alert(t.wrongPassword);
                                  } else if (Lonees3.data.listCovCreditSellers.items.length > 0) {
                                    SndChmMmbrMny();
                                  } else {
                                    const formattedAmountDisplay = formatAmountSync(amountKes, userCode, ratesMap);
                                    const confirmed = await confirmSendTransfer(formattedAmountDisplay, namess, Desc, t, fmt);
                                    if (!confirmed) {
                                      setIsLoading(false);
                                      return;
                                    }

                                    if (UsrTransferFeeAmt > UsrTransferFee2 && UsrTransferFee2 > 0) {
                                      sendSMNonLn2();
                                    } else {
                                      sendSMNonLn();
                                    }
                                  }
                                } catch (e) {
                                  console.log(e);
                                  if (e) {
                                    Alert.alert(t.receiverDoesNotExist);
                                    return;
                                  }
                                }
                                setIsLoading(false);
                              };
                              await fetchRecBizUsrDtls();
                            } catch (e) {
                              console.log(e);
                              if (e) {
                                Alert.alert(t.receiverDoesNotExist);
                                return;
                              }
                            }
                            setIsLoading(false);
                          };
                          await fetchSenderBizUsrDtls();
                        } catch (e) {
                          console.log(e);
                          if (e) {
                            Alert.alert(t.receiverDoesNotExist);
                            return;
                          }
                        }
                        setIsLoading(false);
                      };
                      await fetchRecUsrDtls();
                    } catch (e) {
                      console.log(e);
                      if (e) {
                        Alert.alert(t.checkInternet);
                        return;
                      }
                    }
                    setIsLoading(false);
                  };
                  await fetchCompDtls();
                } catch (e) {
                  console.log(e);
                  if (e) {
                    Alert.alert(t.checkInternet);
                    return;
                  }
                }
                setIsLoading(false);
              };
              await fetchSenderUsrDtls();
            } catch (e) {
              console.log(e);
              if (e) {
                Alert.alert(t.checkInternet);
                return;
              }
            }
            setIsLoading(false);
          };
          await fetchCLChm();
        } catch (e) {
          console.log(e);
          if (e) {
            Alert.alert(t.checkInternet);
            return;
          }
        }
        setIsLoading(false);
      };
      await fetchCLCrdSl();
    } catch (e) {
      console.log(e);
      if (e) {
        Alert.alert(t.fillDetailsOrCheckInternet);
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

  return (
    <View>
      <View style={styles.image}>
        <ScrollView>
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>{t.fillAccountDetails}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput
              placeholder={t.sendingBusinessPhone}
              value={SenderNatId}
              onChangeText={setSenderNatId}
              style={styles.sendAmtInput}
              editable={true}
            />
            <Text style={styles.sendAmtText}>{t.sendingBusinessPhone}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput
              placeholder={t.receivingBusinessPhone}
              value={RecNatId}
              onChangeText={setRecNatId}
              style={styles.sendAmtInput}
              editable={true}
            />
            <Text style={styles.sendAmtText}>{t.receivingBusinessPhone}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput
              keyboardType={'decimal-pad'}
              value={amounts}
              onChangeText={setAmount}
              style={styles.sendAmtInput}
              editable={true}
            />
            <Text style={styles.sendAmtText}>{t.amountSent}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput
              value={SnderPW}
              onChangeText={setSnderPW}
              secureTextEntry={true}
              style={styles.sendAmtInput}
              editable={true}
            />
            <Text style={styles.sendAmtText}>{t.buyerPassword}</Text>
          </View>

          <View style={styles.sendAmtViewDesc}>
            <TextInput
              multiline={true}
              value={Desc}
              onChangeText={setDesc}
              style={styles.sendAmtInputDesc}
              editable={true}
            />
            <Text style={styles.sendAmtText}>{t.description}</Text>
          </View>

          <TouchableOpacity onPress={fetchCvLnSM} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>{t.send}</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default SMASendNonLns;