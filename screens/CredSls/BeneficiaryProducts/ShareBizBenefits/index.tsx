import React, { useEffect, useState } from 'react';
import { createSMLoansCovered, createNonLoans, updateCompany, updateSMAccount, updateBizna, createBenefitShare2, updateLinkBeneficiary2, createMessages, sendNotification } from '../../../../src/graphql/mutations';
import { getBizna, getCompany, getLinkBeneficiary2, getSMAccount } from '../../../../src/graphql/queries';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { formatAmountSync, convertForeignToKsh } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const SMASendNonLns = props => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState('');
  const [SendrPhn, setSendrPhn] = useState(null);
  const [amounts, setAmount] = useState('');
  const [Desc, setDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const route = useRoute();
  const routeParams: any = route.params;
  const { ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fmt = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  const fetchBenProdUsrDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const accountDtlzx: any = await client.graphql({
        query: getLinkBeneficiary2,
        variables: {
          beneficiaryID: routeParams.beneficiaryID
        }
      });
      const {
        prodID: prodIDs,
        benefitsID: benefitsIDs,
        benefactorAc: benefactorAcs,
        benefactorPhone: benefactorPhones,
        beneficiaryAc: beneficiaryAcs,
        beneficiaryPhone: beneficiaryPhones,
        creatorEmail: creatorEmails,
        prodName: prodNames,
        creatorName: creatorNames,
        prodCost: prodCosts,
        benefitsAmount: benefitsAmounts,
        beneficiaryType: beneficiaryTypes,
        prodDesc: prodDescs,
        benefitStatus: benefitStatuss,
        amount: amountsx
      } = accountDtlzx.data.getLinkBeneficiary2;
      const fetchSenderUsrDtls = async () => {
        try {
          const accountDtl: any = await client.graphql({
            query: getBizna,
            variables: {
              BusKntct: SenderNatId
            }
          });
          const benefitsAmountsz = accountDtl.data.getBizna.benefitsAmount;
          const usrPW = accountDtl.data.getBizna.pw;
          const busNames = accountDtl.data.getBizna.busName;
          const SenderSub = accountDtl.data.getBizna.owner;
          const noBL = accountDtl.data.getBizna.noBL;
          const statuss = accountDtl.data.getBizna.status;
          const senderNationality = accountDtl.data.getBizna.Nationality || (attributes as any).nationality;
          const userCode = nationalityToCode(senderNationality) || senderNationality || 'KE';
          const fetchCompDtls = async () => {
            try {
              const CompDtls: any = await client.graphql({
                query: getCompany,
                variables: {
                  AdminId: "BaruchHabaB'ShemAdonai2"
                }
              });
              const UsrTransferFee = CompDtls.data.getCompany.biznaTransferFee;

              const amountInput = parseFloat(amounts);
              if (!amountInput || amountInput <= 0) {
                Alert.alert(t.enterValidAmount);
                setIsLoading(false);
                return;
              }

              const amountKes = await convertForeignToKsh(amountInput, userCode);
              if (!amountKes || amountKes <= 0) {
                Alert.alert(t.unableConvertAmount);
                setIsLoading(false);
                return;
              }

              const TotalTransacted = amountKes + UsrTransferFee * amountKes;
              const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
              const companyEarnings = CompDtls.data.getCompany.companyEarning;
              const ttlNonLonssRecSMs = CompDtls.data.getCompany.ttlNonLonssRecSM;
              const ttlNonLonssSentSMs = CompDtls.data.getCompany.ttlNonLonssSentSM;
              const fetchRecUsrDtls = async () => {
                try {
                  const RecAccountDtl: any = await client.graphql({
                    query: getBizna,
                    variables: {
                      BusKntct: benefactorPhones
                    }
                  });
                  const netEarnings = RecAccountDtl.data.getBizna.netEarnings;
                  const statussx = RecAccountDtl.data.getBizna.status;
                  const prodCreatorName = RecAccountDtl.data.getBizna.busName;
                  const sendSMNonLn = async () => {
                    try {
                      await client.graphql({
                        query: createBenefitShare2,
                        variables: {
                          input: {
                            benefitsID: busNames,
                            benefactorAc: benefactorAcs,
                            amount: amountKes.toFixed(0),
                            benefactorPhone: benefactorPhones,
                            beneficiaryAc: beneficiaryAcs,
                            beneficiaryPhone: beneficiaryPhones,
                            creatorEmail: attributes.email,
                            owner: userInfo.userId,
                            prodName: prodNames,
                            creatorName: creatorNames,
                            prodCost: prodCosts,
                            benefitsAmount: parseFloat(benefitsAmounts) + parseFloat(benefitsAmountsz),
                            beneficiaryType: SenderNatId,
                            prodDesc: prodCreatorName,
                            benefitStatus: benefitStatuss
                          }
                        }
                      });
                    } catch (error) {
                          Alert.alert(t.sharingUnsuccessfulRetry);
                      return;
                    }
                    await updtSendrAc();
                  };
                  const updtSendrAc = async () => {
                    try {
                      await client.graphql({
                        query: updateBizna,
                        variables: {
                          input: {
                            BusKntct: SenderNatId,
                            benefitsAmount: (parseFloat(benefitsAmountsz) - TotalTransacted).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                        Alert.alert(t.errorEnterDetails);
                      return;
                    }
                    await updtLinkedBenefits();
                  };
                  const updtLinkedBenefits = async () => {
                    try {
                      await client.graphql({
                        query: updateLinkBeneficiary2,
                        variables: {
                          input: {
                            beneficiaryID: routeParams.beneficiaryID,
                            benefitsAmount: (parseFloat(benefitsAmounts) + amountKes).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                        Alert.alert(t.retryOrUpdate);
                      return;
                    }
                    await updtRecAc();
                  };
                  const updtRecAc = async () => {
                    try {
                      await client.graphql({
                        query: updateBizna,
                        variables: {
                          input: {
                            BusKntct: benefactorPhones,
                            netEarnings: (parseFloat(netEarnings) + amountKes).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                        Alert.alert(t.retryOrUpdate);
                      return;
                    }
                    await updtComp();
                  };
                  const updtComp = async () => {
                    try {
                      await client.graphql({
                        query: updateCompany,
                        variables: {
                          input: {
                            AdminId: "BaruchHabaB'ShemAdonai2",
                            companyEarningBal: UsrTransferFee * amountKes + parseFloat(companyEarningBals),
                            companyEarning: UsrTransferFee * amountKes + parseFloat(companyEarnings),
                            ttlNonLonssRecSM: amountKes + parseFloat(ttlNonLonssRecSMs),
                            ttlNonLonssSentSM: amountKes + parseFloat(ttlNonLonssSentSMs)
                          }
                        }
                      });
                    } catch (error) {
                        Alert.alert(t.checkInternet);
                      return;
                    }
                    const formattedAmount = formatAmountSync(amountKes, userCode, ratesMap);
                    const formattedTxFee = formatAmountSync((UsrTransferFee * amountKes), userCode, ratesMap);
                      Alert.alert(t.success, fmt(t.amountTxFee, {
                        amount: formattedAmount,
                        fee: formattedTxFee
                      }));
                    const benefitMessage1 = `Confirmed. ${busNames} Benefactor has sent you ${formattedAmount} as Benefits. Please confirm this transaction record is on your NiSenti app. Thank you. NiSenti`;
                    try {
                      const msgRes: any = await client.graphql({
                        query: createMessages,
                        variables: { input: { senderEmail: beneficiaryPhones, messageBody: benefitMessage1 }}
                      });
                      if (msgRes?.data?.createMessages) {
                        await client.graphql({
                          query: sendNotification,
                            variables: { riderEmail: beneficiaryPhones, title: t.benefitsSharedTitle, body: benefitMessage1 }
                        });
                      }
                    } catch (notifErr) {
                      console.log('Notification error:', notifErr);
                    }
                    setIsLoading(false);
                  };
                  if (statuss !== 'AccountActive') {
                    Alert.alert(t.beneficiaryInactive);
                  } else if (statussx !== 'AccountActive') {
                    Alert.alert(t.benefactorInactive);
                  } else if (parseFloat(benefitsAmountsz) < TotalTransacted) {
                    Alert.alert(t.requestedMoreThanBenefits);
                  } else if (benefitStatuss !== 'Active') {
                    Alert.alert(t.linkageNotActive);
                  } else if (noBL > 0) {
                    Alert.alert(t.clearLenders);
                  } else if (usrPW !== SnderPW) {
                    Alert.alert(t.wrongBusinessPassword);
                  } else if (userInfo.userId !== SenderSub) {
                    Alert.alert(t.doNotOwnBusiness);
                  } else {
                    await sendSMNonLn();
                  }
                } catch (e) {
                  console.log(e);
                  if (e) {
                    Alert.alert(t.retryOrUpdate);
                    return;
                  }
                }
              };
              await fetchRecUsrDtls();
            } catch (e) {
              console.log(e);
              if (e) {
                Alert.alert(t.retryOrUpdate);
                return;
              }
            }
          };
          await fetchCompDtls();
        } catch (e) {
          console.log(e);
          if (e) {
            Alert.alert(t.retryOrUpdate);
            return;
          }
        }
      };
      await fetchSenderUsrDtls();
    } catch (e) {
      console.log(e);
      if (e) {
        Alert.alert(t.retryOrUpdate);
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
  return <LinearGradient colors={['#e58d29', 'skyblue']} start={[0, 0]} end={[1, 1]} style={{
    flex: 1
  }}>
                                <View style={styles.container}>
                                  <ScrollView>
              
                        <View style={styles.formContainer}>
                          <TextInput placeholder={t.myBusinessPhoneNumber} value={SenderNatId} onChangeText={setSenderNatId} style={styles.input} editable={true}></TextInput>

                            <TextInput placeholder={t.amountToShare} value={amounts} onChangeText={setAmount} style={styles.input} keyboardType={"decimal-pad"} editable={true}></TextInput>


                          
                          
                         <View style={styles.passwordContainer}>
                                                                       <TextInput placeholder={t.businessCompanyPassword} style={styles.passwordInput} value={SnderPW} onChangeText={setSnderPW} secureTextEntry={!isPasswordVisible} placeholderTextColor="#ccc" />
                                                                     <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                                                    <Ionicons name={isPasswordVisible ? 'eye' : 'eye-off'} size={24} color="gray" />
                                                                     </TouchableOpacity>
                                                                     </View>
                           
                                                                    
                        <TouchableOpacity onPress={fetchBenProdUsrDtls} style={styles.button}>
                          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.locationText}>{t.submit}</Text>}
                                                </TouchableOpacity>
                                              </View>
                                            </ScrollView>
                                          </View>
                                        </LinearGradient>;
};
const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  container: {
    flex: 1,
    padding: 20
  },
  loanTitleView: {
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    borderRadius: 5,
    paddingLeft: 10
  },
  button: {
    backgroundColor: '#e58d29',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20
  },
  locationContainer: {
    marginVertical: 10
  },
  locationText: {
    fontSize: 16,
    color: '#333'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    height: 50
  },
  passwordInput: {
    flex: 1,
    padding: 12
  }
});
export default SMASendNonLns;