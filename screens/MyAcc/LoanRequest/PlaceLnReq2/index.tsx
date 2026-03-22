import React, { useEffect, useState } from 'react';
import { updateCompany, createMessages, sendNotification } from '../../../../src/graphql/mutations';
import { getAdvocate, getBizna, getCompany, getSMAccount } from '../../../../src/graphql/queries';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { createReqLoan } from '../../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
const client = generateClient();
const CreateBiz = props => {
  // State for showing converted KES values
  const [itemPrysKes, setItemPrysKes] = useState('');
  const [instAmtKes, setInstAmtKes] = useState('');
  const [mmbaIdKes, setMmbaIdKes] = useState('');
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  // Helper to format any KES value for user display
  const [ChmPhn, setChmPhn] = useState('');
  const [nam, setName] = useState(null);
  const [awsEmail, setAWSEmail] = useState("");
  const [itemPrys, setitemPrys] = useState('');
  const [lnPrsntg, setlnPrsntg] = useState('');
  const [rpymntPrd, setrpymntPrd] = useState('');
  const [pword, setPW] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ChmNm, setChmNm] = useState('');
  const [ChmDesc, setChmDesc] = useState('');
  const [ChmRegNo, setChmRegNo] = useState('');
  const [MmbaID, setMmbaID] = useState('');
  const [Sign2Phn, setSign2Phn] = useState("");
  const [InstAmt, setInstAmt] = useState("");
  const [InstFreq, setInstFreq] = useState("");
  const [itemTwn, setitemTwn] = useState('');
  const route = useRoute();
  const { nationality, ratesMap } = useExchange();
  const formatUserAmount = (amountKes) => formatAmountSync(amountKes, nationalityToCode(nationality), ratesMap);

  // Update KES values when user input changes (now after all state/vars)
  useEffect(() => {
    const updateKES = async () => {
      if (itemPrys && nationality && Number.isFinite(parseFloat(itemPrys))) {
        const kes = await convertForeignToKsh(parseFloat(itemPrys), nationalityToCode(nationality));
        setItemPrysKes(Number.isFinite(kes) ? kes.toFixed(2) : '');
      } else {
        setItemPrysKes('');
      }
    };
    updateKES();
  }, [itemPrys, nationality]);
  useEffect(() => {
    const updateKES = async () => {
      if (InstAmt && nationality && Number.isFinite(parseFloat(InstAmt))) {
        const kes = await convertForeignToKsh(parseFloat(InstAmt), nationalityToCode(nationality));
        setInstAmtKes(Number.isFinite(kes) ? kes.toFixed(2) : '');
      } else {
        setInstAmtKes('');
      }
    };
    updateKES();
  }, [InstAmt, nationality]);
  useEffect(() => {
    const updateKES = async () => {
      if (MmbaID && nationality && Number.isFinite(parseFloat(MmbaID))) {
        const kes = await convertForeignToKsh(parseFloat(MmbaID), nationalityToCode(nationality));
        setMmbaIdKes(Number.isFinite(kes) ? kes.toFixed(2) : '');
      } else {
        setMmbaIdKes('');
      }
    };
    updateKES();
  }, [MmbaID, nationality]);
  // (Removed duplicate variable and hook declarations)
  const gtBizna = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    const amountForeign = parseFloat(itemPrys);
    const installmentForeign = parseFloat(InstAmt);
    const defaultPenaltyForeign = parseFloat(MmbaID);
    if (!Number.isFinite(amountForeign) || amountForeign <= 0) {
      Alert.alert("Enter a valid loan amount");
      setIsLoading(false);
      return;
    }
    if (!Number.isFinite(installmentForeign) || installmentForeign <= 0) {
      Alert.alert("Enter a valid installment amount");
      setIsLoading(false);
      return;
    }
    if (!Number.isFinite(defaultPenaltyForeign) || defaultPenaltyForeign < 0) {
      Alert.alert("Enter a valid default penalty");
      setIsLoading(false);
      return;
    }
    const currencyKey = nationalityToCode(nationality);
    // Always convert user input to KES for backend writes
    const [amountKes, installmentKes, defaultPenaltyKes] = await Promise.all([
      convertForeignToKsh(amountForeign, currencyKey),
      convertForeignToKsh(installmentForeign, currencyKey),
      convertForeignToKsh(defaultPenaltyForeign, currencyKey)
    ]);
    if (!Number.isFinite(amountKes) || amountKes <= 0 || !Number.isFinite(installmentKes) || installmentKes <= 0 || !Number.isFinite(defaultPenaltyKes) || defaultPenaltyKes < 0) {
      Alert.alert("Unable to convert amount. Please try again.");
      setIsLoading(false);
      return;
    }
    try {
      const compDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const pws = compDtls.data.getSMAccount.pw;
      const phonecontactsz = compDtls.data.getSMAccount.phonecontact;
      const name = compDtls.data.getSMAccount.name;
      const ownerz = compDtls.data.getSMAccount.owner;
      const Int = (parseFloat(lnPrsntg) - amountKes) * 100 / (parseFloat(lnPrsntg) * parseFloat(rpymntPrd));
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
          const DfltPnltyRate = defaultPenaltyKes * maxDefaultPen / 100;
          const gtLnerDtls = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            const userInfo = await getCurrentUser();
            try {
              const compDtls3: any = await client.graphql({
                query: getBizna,
                variables: {
                  BusKntct: awsEmail
                }
              });
              const namez = compDtls3.data.getBizna.busName;
              const phonecontacts = compDtls3.data.getBizna.email;
              const amtrpayable = amountKes * Math.pow(1 + parseFloat(lnPrsntg) / 36500, 0);
              const ExpInstmnt = amtrpayable / parseFloat(rpymntPrd);
              const CreateNewSMAc2 = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  setIsLoading(true);
                  const userInfo = await getCurrentUser();
                  let email = "None";
                  let phonecontact = phonecontacts;
                  try {
                    const compDtls5: any = await client.graphql({
                      query: getAdvocate,
                      variables: {
                        advregnu: Sign2Phn
                      }
                    });
                    if (compDtls5?.data?.getAdvocate) {
                      email = compDtls5.data.getAdvocate.email || "None";
                      phonecontact = compDtls5.data.getAdvocate.phonecontact || phonecontacts;
                    }
                  } catch (e) {
                    // If advocate not found, leave email as "None"
                  }
                  const CreateNewSMAc = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: createReqLoan,
                        variables: {
                          input: {
                            loaneeEmail: attributes.email,
                            loanerEmail: awsEmail,
                            loaneeName: name,
                            loaneePhone: phonecontacts,
                            AdvEmail: email,
                            advLicNo: Sign2Phn,
                            dfltDeadLn: 0,
                            loanerName: namez,
                            loanerPhone: awsEmail,
                            lnType: "Biz2Pal",
                            // All backend writes use KES
                            amount: amountKes.toFixed(2),
                            repaymentAmt: parseFloat(lnPrsntg).toFixed(2),
                            repaymentPeriod: rpymntPrd,
                            status: "AwaitingResponse",
                            statusNumber: 0,
                            owner: userInfo.userId,
                            description: ChmRegNo,
                            defaultPenalty: defaultPenaltyKes.toFixed(2),
                            installmentAmount: installmentKes.toFixed(2),
                            paymentFrequency: InstFreq,
                            confirm1: "NO",
                            confirm2: "NO"
                          }
                        }
                      });
                      Alert.alert("Loan Request Successful");
                      // All user-facing messages use user's currency and symbol
                      const loanReqMessage4 = 'NiSenti. Greetings! ' + 'We ' + name + ', the loanee and ' + namez + ', the loaner humbly' + ' request that you witness our loan contract on NiSenti app amounting to ' + formatUserAmount(amountKes) + ' repayable with ' + lnPrsntg + '% interest by the end of ' + rpymntPrd + ' days. Default penalty is ' + formatUserAmount(defaultPenaltyKes) + '. You can reach my loaner through ' + awsEmail + '. You can also reach me through ' + phonecontacts + '. Thank you.';
                      try {
                        const msgRes = await client.graphql({
                          query: createMessages,
                          variables: { input: { senderEmail: phonecontact, messageBody: loanReqMessage4 }}
                        });
                        if ((msgRes as any)?.data?.createMessages) {
                          await client.graphql({
                            query: sendNotification,
                            variables: { riderEmail: phonecontact, title: 'NiSenti: Witness Loan Contract', body: loanReqMessage4 }
                          });
                        }
                      } catch (notifErr) {
                        console.log('Notification error:', notifErr);
                      }
                    } catch (error) {
                      console.log(error);
                      if (error) {
                        Alert.alert("Please enter details correctly");
                        return;
                      }
                    }
                  };
                  await CreateNewSMAc();
                } catch (e) {
                  if (e) {
                    Alert.alert("Error! Please enter advocate license correctly");
                  }
                  return;
                }
              };
              if (pword !== pws) {
                Alert.alert("Wrong User password");
              } else if (parseFloat(lnPrsntg) > 100) {
                Alert.alert("Interest exploits you; enter lesser repayment amount");
              } else if (parseFloat(rpymntPrd) < 1) {
                Alert.alert("Enter repayment Period greater than 1 day");
              } else if (ExpInstmnt > installmentKes) {
                // Show amount in user's currency and symbol
                Alert.alert("Enter Installment greater than " + formatUserAmount(ExpInstmnt + 1));
              } else if (Sign2Phn != "") {
                await CreateNewSMAc2(); // Call the correct function in scope
              } else {
                await CreateNewSMAc2();
              }
            } catch (e) {
              if (e) {
                Alert.alert("Retry or update app or call customer care");
              }
              console.error(e);
            }
          };
          await gtLnerDtls();
        } catch (e) {
          if (e) {
            Alert.alert("Retry or update app or call customer care");
          }
          console.error(e);
        }
        setIsLoading(false);
      };
      await gtComp();
    } catch (e) {
      if (e) {
        Alert.alert("Retry or update app or call customer care");
      }
      console.error(e);
    }
    setIsLoading(false);
    setChmPhn('');
    setPW('');
    setAWSEmail("");
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
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.image}>
        <KeyboardAwareScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          style={{ flex: 1 }}
          enableOnAndroid={true}
          extraScrollHeight={32}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t.fillDetails}</Text>
          <View style={styles.sendLoanView}>
            <TextInput placeholder={t.companyAccountNumber} value={awsEmail} onChangeText={setAWSEmail} style={styles.sendLoanInput} editable={true} />
            <Text style={styles.sendLoanText}>{t.companyAccountNumber}</Text>
          </View>
          <View style={styles.sendLoanView}>
            <TextInput placeholder={t.advocateLicense} value={Sign2Phn} onChangeText={setSign2Phn} style={styles.sendLoanInput} editable={true} />
            <Text style={styles.sendLoanText}>{t.advocateLicense}</Text>
          </View>
          <View style={styles.sendLoanView}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Show user's currency symbol before input */}
              <Text style={{ fontSize: 16, marginRight: 4 }}>
                {ratesMap && nationalityToCode(nationality) && ratesMap[nationalityToCode(nationality)] ? ratesMap[nationalityToCode(nationality)].symbol : 'Ksh'}
              </Text>
              <TextInput
                keyboardType='decimal-pad'
                value={itemPrys}
                onChangeText={setitemPrys}
                style={[styles.sendLoanInput, { flex: 1 }]}
                editable={true}
                placeholder={t.loanAmount}
              />
            </View>
            <Text style={styles.sendLoanText}>{t.loanAmount}</Text>
            {/* Removed KES conversion display for user localization */}
          </View>
          <View style={styles.sendLoanView}>
            <TextInput keyboardType='decimal-pad' placeholder={t.annualInterest} value={lnPrsntg} onChangeText={setlnPrsntg} style={styles.sendLoanInput} editable={true} />
            <Text style={styles.sendLoanText}>{t.annualInterest}</Text>
          </View>
          <View style={styles.sendLoanView}>
            <TextInput keyboardType='decimal-pad' placeholder={t.repaymentPeriod} value={rpymntPrd} onChangeText={setrpymntPrd} style={styles.sendLoanInput} editable={true} />
            <Text style={styles.sendLoanText}>{t.repaymentPeriod}</Text>
          </View>
          <View style={styles.sendLoanView}>
            <TextInput placeholder={t.paymentFrequency} keyboardType='decimal-pad' value={InstFreq} onChangeText={setInstFreq} style={styles.sendLoanInput} editable={true} />
          </View>
          <View style={styles.sendLoanView}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Show user's currency symbol before input */}
              <Text style={{ fontSize: 16, marginRight: 4 }}>
                {ratesMap && nationalityToCode(nationality) && ratesMap[nationalityToCode(nationality)] ? ratesMap[nationalityToCode(nationality)].symbol : 'Ksh'}
              </Text>
              <TextInput
                placeholder={t.installmentAmount}
                keyboardType='decimal-pad'
                value={InstAmt}
                onChangeText={setInstAmt}
                style={[styles.sendLoanInput, { flex: 1 }]}
                editable={true}
              />
            </View>
            {/* Removed KES conversion display for user localization */}
          </View>
          <View style={styles.sendLoanView}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Show user's currency symbol before input */}
              <Text style={{ fontSize: 16, marginRight: 4 }}>
                {ratesMap && nationalityToCode(nationality) && ratesMap[nationalityToCode(nationality)] ? ratesMap[nationalityToCode(nationality)].symbol : 'Ksh'}
              </Text>
              <TextInput
                keyboardType='decimal-pad'
                placeholder={t.defaultPenalty}
                value={MmbaID}
                onChangeText={setMmbaID}
                style={[styles.sendLoanInput, { flex: 1 }]}
                editable={true}
              />
            </View>
            <Text style={styles.sendLoanText}>{t.defaultPenalty}</Text>
            {/* Removed KES conversion display for user localization */}
          </View>
          <View style={styles.sendLoanView}>
            <TextInput placeholder={t.loanDescription} value={ChmRegNo} multiline={true} onChangeText={setChmRegNo} style={styles.sendLoanInput} editable={true} />
            <Text style={styles.sendLoanText}>{t.loanDescription}</Text>
          </View>
          <View style={styles.sendLoanView}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={pword}
                onChangeText={setPW}
                secureTextEntry={!showPassword}
                style={[styles.sendLoanInput, { flex: 1 }]}
                editable={true}
                placeholder={t.userPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                style={{ marginLeft: 8 }}
              >
                <Text style={{ color: '#e28d58', fontSize: 16 }}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sendLoanText}>{t.userPassword}</Text>
          </View>
          <TouchableOpacity onPress={gtBizna} style={styles.sendLoanButton}>
            <Text style={styles.sendLoanButtonText}>Click to Request</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
};
export default CreateBiz;


const styles = StyleSheet.create({
  image: {
    flex: 1,
    backgroundColor: 'skyblue', // main background
    padding: 16,
  },
  loanTitleView: {
    marginVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e28d58', // accent color
  },
  sendLoanView: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f8ff', // light skyblue tint
    borderWidth: 1,
    borderColor: '#e28d58',
  },
  sendLoanInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e28d58',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  sendLoanText: {
    marginTop: 6,
    fontSize: 14,
    color: '#e28d58',
    fontWeight: '500',
  },
  sendLoanButton: {
    marginTop: 20,
    backgroundColor: '#e28d58',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendLoanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
