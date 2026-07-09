import React, { useEffect, useState } from 'react';
import { createReqLoanChama, createReqLoanCredSl, updateCompany, createMessages, sendNotification } from '../../../../src/graphql/mutations';
import { getAdvocate, getBizna, getCompany, getSMAccount, listPersonels } from '../../../../src/graphql/queries';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { createReqLoan } from '../../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const CreateBiz = props => {
  const [ChmPhn, setChmPhn] = useState('');
  const [awsEmail, setAWSEmail] = useState("");
  const [awsEmail2, setAWSEmail2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pword, setPW] = useState('');
  const [ChmDesc, setChmDesc] = useState('');
  const [ChmRegNo, setChmRegNo] = useState('');
  const [Sign2Phn, setSign2Phn] = useState("");
  const [itemPrys, setitemPrys] = useState('');
  const [itemTwn, setitemTwn] = useState('');
  const [lnPrsntg, setlnPrsntg] = useState('');
  const [rpymntPrd, setrpymntPrd] = useState('');
  const [ChmNm, setChmNm] = useState('');
  const [MmbaID, setMmbaID] = useState('');
  const [InstAmt, setInstAmt] = useState("");
  const [InstFreq, setInstFreq] = useState("");
  const route = useRoute();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fmt = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  const gtBizna = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const compDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: awsEmail
        }
      });
      const phonecontacts = compDtls.data.getSMAccount.phonecontact;
      const name = compDtls.data.getSMAccount.name;
      const gtPersonelMainAc = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        const userInfo = await getCurrentUser();
        try {
          const compDtls3: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: attributes.email
            }
          });
          const pws = compDtls3.data.getSMAccount.pw;
          const gtComp = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            const userInfo = await getCurrentUser();
            try {
              const compDtls: any = await client.graphql({
                query: getCompany,
                variables: {
                  AdminId: "BaruchHabaB'ShemAdonai2"
                }
              });
              const maxDefaultPen = compDtls.data.getCompany.maxDfltPen;
              const RecomDfltPnltyRate = parseFloat(lnPrsntg) * maxDefaultPen / 100;
              const DfltPnltyRate = parseFloat(MmbaID) * maxDefaultPen / 100;
              const gtBiznaInfo2 = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                const userInfo = await getCurrentUser();
                try {
                  const compDtlsx: any = await client.graphql({
                    query: getBizna,
                    variables: {
                      BusKntct: awsEmail2
                    }
                  });
                  const pwsz = compDtlsx.data.getBizna.pw;
                  const busNames = compDtlsx.data.getBizna.busName;
                  const ChckPersonelExistence = async () => {
                    try {
                      const UsrDtls: any = await client.graphql({
                        query: listPersonels,
                        variables: {
                          filter: {
                            phoneKontact: {
                              eq: attributes.email
                            },
                            BusinessRegNo: {
                              eq: awsEmail2
                            }
                          }
                        }
                      });
                      const amtrpayable = parseFloat(itemPrys) * Math.pow(1 + parseFloat(lnPrsntg) / 36500, 0);
                      const ExpInstmnt = amtrpayable / parseFloat(rpymntPrd);
                      const CreateNewSMAc2 = async () => {
                        if (isLoading) {
                          return;
                        }
                        setIsLoading(true);
                        try {
                          await client.graphql({
                            query: createReqLoanCredSl,
                            variables: {
                              input: {
                                loaneeEmail: awsEmail2,
                                businessNo: awsEmail,
                                loaneeName: busNames,
                                loaneePhone: awsEmail2,
                                amount: parseFloat(itemPrys).toFixed(2),
                                repaymentAmt: parseFloat(lnPrsntg).toFixed(2),
                                repaymentPeriod: rpymntPrd,
                                itemName: ChmDesc,
                                status: "AwaitingResponse",
                                owner: userInfo.userId,
                                statusNumber: 0,
                                AdvEmail: "None",
                                lnType: "Pal2Biz",
                                advLicNo: "None",
                                dfltDeadLn: 0,
                                loanerName: name,
                                loanerPhone: phonecontacts,
                                description: ChmNm,
                                defaultPenalty: MmbaID,
                                installmentAmount: InstAmt,
                                paymentFrequency: InstFreq
                              }
                            }
                          });
                        } catch (error) {
                          console.log(error);
                          if (error) {
                                Alert.alert(t.pleaseEnterDetailsCorrectly);
                            return;
                          }
                        }
                        Alert.alert(t.loanRequestSuccessful);
                        const loanReqMsg9 = "NiSenti. " + busNames + ' has requested ' + ' you to loan the business goods/services worth ' + itemPrys + '. Please go to your NiSenti' + ' app to view the loan details and thereafter' + ' grant me the request. Thank you.';
                        try {
                          const msgRes = await client.graphql({
                            query: createMessages,
                            variables: { input: { senderEmail: phonecontacts, messageBody: loanReqMsg9 }}
                          });
                          if (msgRes?.data?.createMessages) {
                            await client.graphql({
                              query: sendNotification,
                              variables: { riderEmail: phonecontacts, title: 'NiSenti: Credit Loan Request', body: loanReqMsg9 }
                            });
                          }
                        } catch (notifErr) {
                          console.log('Notification error:', notifErr);
                        }
                      };
                      const gtAdv = async () => {
                        if (isLoading) {
                          return;
                        }
                        setIsLoading(true);
                        const userInfo = await getCurrentUser();
                        try {
                          const compDtls6: any = await client.graphql({
                            query: getAdvocate,
                            variables: {
                              advregnu: Sign2Phn
                            }
                          });
                          const email = compDtls6.data.getAdvocate.email;
                          const phonecontact = compDtls6.data.getAdvocate.phonecontact;
                          const CreateNewSMAc = async () => {
                            if (isLoading) {
                              return;
                            }
                            setIsLoading(true);
                            try {
                              await client.graphql({
                                query: createReqLoanCredSl,
                                variables: {
                                  input: {
                                    loaneeEmail: awsEmail2,
                                    businessNo: awsEmail,
                                    loaneeName: busNames,
                                    loaneePhone: awsEmail2,
                                    amount: parseFloat(itemPrys).toFixed(2),
                                    repaymentAmt: parseFloat(lnPrsntg).toFixed(2),
                                    repaymentPeriod: rpymntPrd,
                                    itemName: ChmDesc,
                                    status: "AwaitingResponse",
                                    owner: userInfo.userId,
                                    statusNumber: 0,
                                    dfltDeadLn: 0,
                                    AdvEmail: email,
                                    advLicNo: Sign2Phn,
                                    lnType: "Pal2Biz",
                                    loanerName: name,
                                    loanerPhone: phonecontacts,
                                    description: ChmNm,
                                    defaultPenalty: MmbaID,
                                    installmentAmount: InstAmt,
                                    paymentFrequency: InstFreq
                                  }
                                }
                              });
                            } catch (error) {
                              console.log(error);
                              if (error) {
                                Alert.alert(t.pleaseEnterDetailsCorrectly);
                                return;
                              }
                            }
                            Alert.alert(t.loanRequestSuccessful);
                            const loanReqMsg10 = 'NiSenti. Greetings! ' + 'We ' + busNames + ', the loanee Business and ' + name + ', the Loaner' + ', request that you witness our loan contract on NiSenti app amounting to ' + itemPrys + ' repayable with ' + lnPrsntg + '% interest by the end of ' + rpymntPrd + ' days. Default penalty is ' + MmbaID + '. You can reach my loaner through ' + phonecontacts + '. You can also reach us through ' + awsEmail2 + '. Thank you.';
                            try {
                              const msgRes = await client.graphql({
                                query: createMessages,
                                variables: { input: { senderEmail: phonecontact, messageBody: loanReqMsg10 }}
                              });
                              if (msgRes?.data?.createMessages) {
                                await client.graphql({
                                  query: sendNotification,
                                  variables: { riderEmail: phonecontact, title: 'NiSenti: Witness Loan Contract', body: loanReqMsg10 }
                                });
                              }
                            } catch (notifErr) {
                              console.log('Notification error:', notifErr);
                            }
                          };
                          CreateNewSMAc();
                        } catch (e) {
                          if (e) {
                              Alert.alert(t.invalidAdvocateLicense);
                          }
                          console.error(e);
                        }
                        setIsLoading(false);
                      };
                      if (pws !== pword) {
                        Alert.alert(t.wrongUserPassword);
                      } else if (UsrDtls.data.listPersonels.items.length < 1) {
                        Alert.alert(t.businessMissingOrNoAccess);
                        return;
                      } else if (awsEmail === awsEmail2) {
                        Alert.alert(t.cannotBuyFromSelf);
                      } else if (parseFloat(rpymntPrd) < 1) {
                        Alert.alert(t.repaymentPeriodGreaterThanOneDay);
                      } else if (parseFloat(lnPrsntg) > 100) {
                        Alert.alert(t.interestExploits);
                      } else if (ExpInstmnt > parseFloat(InstAmt)) {
                        Alert.alert(fmt(t.installmentGreaterThan, { amount: (ExpInstmnt + 1).toFixed(0) }));
                      } else if (Sign2Phn != "") {
                        await gtAdv();
                      } else {
                        CreateNewSMAc2();
                      }
                    } catch (e) {
                      if (e) {
                        Alert.alert(t.errorUpdateOrContact);
                      }
                      console.error(e);
                    }
                    setIsLoading(false);
                  };
                  await ChckPersonelExistence();
                } catch (e) {
                  if (e) {
                    Alert.alert(t.errorUpdateOrContact);
                  }
                  console.error(e);
                }
                setIsLoading(false);
              };
              await gtBiznaInfo2();
            } catch (e) {
              if (e) {
                Alert.alert(t.errorUpdateOrContact);
              }
              console.error(e);
            }
            setIsLoading(false);
          };
          await gtComp();
        } catch (e) {
          if (e) {
            Alert.alert(t.errorUpdateOrContact);
          }
          console.error(e);
        }
        setIsLoading(false);
      };
      await gtPersonelMainAc();
    } catch (e) {
      if (e) {
        Alert.alert(t.errorUpdateOrContact);
      }
      console.error(e);
    }
    setIsLoading(false);
    setChmPhn('');
    setPW('');
    setAWSEmail("");
    setAWSEmail2("");
    setChmDesc("");
    setChmNm("");
    setChmRegNo("");
    setMmbaID("");
    setSign2Phn("");
    setrpymntPrd("");
    setlnPrsntg("");
    setitemTwn("");
    setitemPrys("");
    setInstAmt("");
    setInstFreq("");
  };
  useEffect(() => {
    const InstAmts = InstAmt;
    if (!InstAmts && InstAmts !== "") {
      setInstAmt("");
      return;
    }
    setInstAmt(InstAmts);
  }, [InstAmt]);
  useEffect(() => {
    const InstFreqs = InstFreq;
    if (!InstFreqs && InstFreqs !== "") {
      setInstFreq("");
      return;
    }
    setInstFreq(InstFreqs);
  }, [InstFreq]);
  useEffect(() => {
    const itemPryss = itemPrys;
    if (!itemPryss && itemPryss !== "") {
      setitemPrys("");
      return;
    }
    setitemPrys(itemPryss);
  }, [itemPrys]);
  useEffect(() => {
    const itemTwns = itemTwn;
    if (!itemTwns && itemTwns !== "") {
      setitemTwn("");
      return;
    }
    setitemTwn(itemTwns);
  }, [itemTwn]);
  useEffect(() => {
    const lnPrsntgs = lnPrsntg;
    if (!lnPrsntgs && lnPrsntgs !== "") {
      setlnPrsntg("");
      return;
    }
    setlnPrsntg(lnPrsntgs);
  }, [lnPrsntg]);
  useEffect(() => {
    const rpymntPrds = rpymntPrd;
    if (!rpymntPrds && rpymntPrds !== "") {
      setrpymntPrd("");
      return;
    }
    setrpymntPrd(rpymntPrds);
  }, [rpymntPrd]);
  useEffect(() => {
    const MmbaIDs = MmbaID;
    if (!MmbaIDs && MmbaIDs !== "") {
      setMmbaID("");
      return;
    }
    setMmbaID(MmbaIDs);
  }, [MmbaID]);
  useEffect(() => {
    const ChmRegNos = ChmRegNo;
    if (!ChmRegNos && ChmRegNos !== "") {
      setChmRegNo("");
      return;
    }
    setChmRegNo(ChmRegNos);
  }, [ChmRegNo]);
  useEffect(() => {
    const awsEmails = awsEmail;
    if (!awsEmails && awsEmails !== "") {
      setAWSEmail("");
      return;
    }
    setAWSEmail(awsEmails);
  }, [awsEmail]);
  useEffect(() => {
    const awsEmails2 = awsEmail2;
    if (!awsEmails2 && awsEmails2 !== "") {
      setAWSEmail2("");
      return;
    }
    setAWSEmail2(awsEmails2);
  }, [awsEmail2]);
  useEffect(() => {
    const ChmNms = ChmNm;
    if (!ChmNms && ChmNms !== "") {
      setChmNm("");
      return;
    }
    setChmNm(ChmNms);
  }, [ChmNm]);
  useEffect(() => {
    const ChmDescs = ChmDesc;
    if (!ChmDescs && ChmDescs !== "") {
      setChmDesc("");
      return;
    }
    setChmDesc(ChmDescs);
  }, [ChmDesc]);
  useEffect(() => {
    const ChmPhns = ChmPhn;
    if (!ChmPhns && ChmPhns !== "") {
      setChmPhn("");
      return;
    }
    setChmPhn(ChmPhns);
  }, [ChmPhn]);
  useEffect(() => {
    const pws = pword;
    if (!pws && pws !== "") {
      setPW("");
      return;
    }
    setPW(pws);
  }, [pword]);
  useEffect(() => {
    const Sign2Phns = Sign2Phn;
    if (!Sign2Phns && Sign2Phns !== "") {
      setSign2Phn("");
      return;
    }
    setSign2Phn(Sign2Phns);
  }, [Sign2Phn]);
  return <View>
              <View style={styles.image}>
                <ScrollView>
           
                  <View style={styles.loanTitleView}>
                    <Text style={styles.title}>{t.fillDetailsBelow}</Text>
                  </View>
        
                  
                  <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.emailAddressPlaceholder} value={awsEmail} onChangeText={setAWSEmail} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.emailAddressOfLoaner}</Text>
                  </View>

                  <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.businessPhonePlaceholder} value={awsEmail2} onChangeText={setAWSEmail2} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.loaneeBusinessPhone}</Text>
                  </View>

                  <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.advocateLicensePlaceholder} value={Sign2Phn} onChangeText={setSign2Phn} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.advocateLicenseNumber}</Text>
                  </View>
                  
                  <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.itemNamePlaceholder} value={ChmDesc} onChangeText={setChmDesc} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.serviceItemName}</Text>
                  </View>

                  <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.loanDescriptionPlaceholder} value={ChmNm} multiline={true} onChangeText={setChmNm} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.serviceItemDescription}</Text>
                  </View>

                  <View style={styles.sendLoanView}>
                    <TextInput keyboardType='decimal-pad' value={itemPrys} onChangeText={setitemPrys} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.loanAmount}</Text>
                  </View>

                  <View style={styles.sendLoanView}>
                    <TextInput keyboardType='decimal-pad' placeholder={t.interestRatePlaceholder} value={lnPrsntg} onChangeText={setlnPrsntg} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.monthlyInterestRate}</Text>
                  </View>

                  <View style={styles.sendLoanView}>
                    <TextInput keyboardType='decimal-pad' placeholder={t.repaymentDaysPlaceholder} value={rpymntPrd} onChangeText={setrpymntPrd} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.repaymentPeriod}</Text>
                  </View>

                  <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.paymentFrequencyPlaceholder} keyboardType='decimal-pad' value={InstFreq} onChangeText={setInstFreq} style={styles.sendLoanInput} editable={true}></TextInput>
                    
                  </View>         
                  
                    <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.installmentAmountPlaceholder} keyboardType='decimal-pad' value={InstAmt} onChangeText={setInstAmt} style={styles.sendLoanInput} editable={true}></TextInput>
                    
                  </View>

                          
                  
                  
                  <View style={styles.sendLoanView}>
                    <TextInput keyboardType='decimal-pad' value={MmbaID} onChangeText={setMmbaID} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.defaultPenalty}</Text>
                  </View>


                  <View style={styles.sendLoanView}>
                    <TextInput value={pword} onChangeText={setPW} secureTextEntry={true} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.userMainAcPassword}</Text>
                  </View>

                  <TouchableOpacity onPress={gtBizna} style={styles.sendLoanButton}>
                    <Text style={styles.sendLoanButtonText}>
                      {t.clickToRequest}
                    </Text>
                    {isLoading && <ActivityIndicator size="large" color="blue" />}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>;
};
export default CreateBiz;