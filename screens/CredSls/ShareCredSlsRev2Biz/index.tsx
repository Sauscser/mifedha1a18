import React, { useEffect, useState } from 'react';
import { createNonLoans, updateCompany, updateSMAccount, updateBizna, createMessages, sendNotification } from '../../../src/graphql/mutations';
import { getBizna, getCompany, getSMAccount } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, convertForeignToKsh, getUserNationalityByEmail } from '../../../src/utils/exchange';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const SMASendNonLns = props => {
  const [SenderNatId, setSenderNatId] = useState("");
  const [RecNatId, setRecNatId] = useState("");
  const [SnderPW, setSnderPW] = useState("");
  const [SendrPhn, setSendrPhn] = useState(null);
  const [amounts, setAmount] = useState("");
  const [Desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fmt = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  const fetchSenderUsrDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    try {
      const accountDtl: any = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: SenderNatId
        }
      });
      const netEarningss = accountDtl.data.getBizna.netEarnings;
      const usrPW = accountDtl.data.getBizna.pw;
      const busNames = accountDtl.data.getBizna.busName;
      const SenderSub = accountDtl.data.getBizna.owner;
      const noBL = accountDtl.data.getBizna.noBL;
      const SenderAcStatus = accountDtl.data.getBizna.status;
      const fetchCompDtls = async () => {
        try {
          const CompDtls: any = await client.graphql({
            query: getCompany,
            variables: {
              AdminId: "BaruchHabaB'ShemAdonai2"
            }
          });
          const UsrTransferFee = CompDtls.data.getCompany.biznaTransferFee;
          const CompPhoneContact = CompDtls.data.getCompany.phoneContact;
          const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
          const companyEarnings = CompDtls.data.getCompany.companyEarning;
          const ttlNonLonssRecSMs = CompDtls.data.getCompany.ttlNonLonssRecSM;
          const ttlNonLonssSentSMs = CompDtls.data.getCompany.ttlNonLonssSentSM;
          const fetchRecUsrDtls = async () => {
            try {
              const RecAccountDtl: any = await client.graphql({
                query: getBizna,
                variables: {
                  BusKntct: RecNatId
                }
              });
              const RecUsrBal = RecAccountDtl.data.getBizna.netEarnings;
              const usrAcActvSttss = RecAccountDtl.data.getBizna.status;
              const namess = RecAccountDtl.data.getBizna.busName;
              // determine seller and receiver nationalities and convert amounts
              let sellerNationality = null;
              let recNationality = null;
              try {
                const senderBiz = accountDtl.data.getBizna;
                if (senderBiz?.email) sellerNationality = await getUserNationalityByEmail(senderBiz.email);
                const recBiz = RecAccountDtl.data.getBizna;
                if (recBiz?.email) recNationality = await getUserNationalityByEmail(recBiz.email);
              } catch (e) {}
              const foreignAmount = parseFloat(amounts) || 0;
              const transferFeeForeign = parseFloat(UsrTransferFee || 0) * foreignAmount;
              const amountKes = await convertForeignToKsh(foreignAmount, sellerNationality);
              const feeKes = await convertForeignToKsh(transferFeeForeign, sellerNationality);
              const totalKes = Number(amountKes || 0) + Number(feeKes || 0);
              const sendSMNonLn = async () => {
                try {
                  await client.graphql({
                    query: createNonLoans,
                    variables: {
                      input: {
                        recPhn: RecNatId,
                        senderPhn: SenderNatId,
                        amount: amountKes.toFixed(2),
                        description: Desc,
                        RecName: namess,
                        SenderName: busNames,
                        status: "BiznaShareCash2Biz",
                        owner: userInfo.userId
                      }
                    }
                  });
                } catch (error) {
                  if (error) {
                    Alert.alert(t.revenueShareUnsuccessful);
                    return;
                  }
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
                        netEarnings: (parseFloat(netEarningss) - totalKes).toFixed(2)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    Alert.alert(t.errorEnterDetails);
                    return;
                  }
                }
                await updtRecAc();
              };
              const updtRecAc = async () => {
                try {
                  await client.graphql({
                    query: updateBizna,
                    variables: {
                      input: {
                        BusKntct: RecNatId,
                        netEarnings: (parseFloat(RecUsrBal) + Number(amountKes)).toFixed(2)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    Alert.alert(t.retryOrUpdate);
                    return;
                  }
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
                        companyEarningBal: Number(feeKes) + parseFloat(companyEarningBals),
                        companyEarning: Number(feeKes) + parseFloat(companyEarnings),
                        ttlNonLonssRecSM: Number(amountKes) + parseFloat(ttlNonLonssRecSMs),
                        ttlNonLonssSentSM: Number(amountKes) + parseFloat(ttlNonLonssSentSMs)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    Alert.alert(t.retryOrUpdateShort);
                    return;
                  }
                }
                const formattedAmount = formatAmountSync(Number(amountKes), recNationality, ratesMap);
                const bizNat = accountDtl.data.getBizna?.nationality || null;
                const formattedTxFee = formatAmountSync(Number(feeKes), bizNat, ratesMap);
                Alert.alert(fmt(t.amountTransaction, {
                  amount: formattedAmount,
                  fee: formattedTxFee
                }));
                const revShareMessage2 = `Confirmed. ${busNames} Business entity has sent you ${formattedAmount} to your NiSenti Business account. Please confirm this transaction record is on your NiSenti app. Thank you. NiSenti`;
                try {
                  const msgRes = await client.graphql({
                    query: createMessages,
                    variables: { input: { senderEmail: RecNatId, messageBody: revShareMessage2 }}
                  });
                  if (msgRes?.data?.createMessages) {
                    await client.graphql({
                      query: sendNotification,
                      variables: { riderEmail: RecNatId, title: t.revenueSharedTitle, body: revShareMessage2 }
                    });
                  }
                } catch (notifErr) {
                  console.log('Notification error:', notifErr);
                }
                setIsLoading(false);
              };
              if (usrAcActvSttss !== "AccountActive") {
                Alert.alert(t.receiverInactive);
              } else if (SenderNatId === RecNatId) {
                Alert.alert(t.cannotSendToSelf);
              } else if (parseFloat(netEarningss) < totalKes) {
                Alert.alert(t.requestedMoreThanBalance);
              } else if (noBL > 0) {
                Alert.alert(t.clearLenders);
              } else if (usrPW !== SnderPW) {
                Alert.alert(t.wrongPassword);
              } else if (userInfo.userId !== SenderSub) {
                Alert.alert(t.notOwner);
              } else {
                sendSMNonLn();
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
    ;
    setSenderNatId("");
    setAmount("");
    setRecNatId("");
    setDesc("");
    setSnderPW("");
    setIsLoading(false);
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
            <Text style={styles.title}>{t.fillAccountDetails}</Text>
          </View>
          <View style={styles.sendAmtView}>
            <TextInput placeholder={t.businessPhonePlaceholder} value={SenderNatId} onChangeText={setSenderNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.senderBusinessPhone}</Text>
          </View>
          

          <View style={styles.sendAmtView}>
            <TextInput placeholder={t.businessPhonePlaceholder} value={RecNatId} onChangeText={setRecNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.receiverBusinessNumber}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} editable={true}></TextInput>
              
            <Text style={styles.sendAmtText}>{t.amountSent}</Text>
          </View>


          

          

          <View style={styles.sendAmtViewDesc}>
            <TextInput multiline={true} value={Desc} onChangeText={setDesc} style={styles.sendAmtInputDesc} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.description}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.businessPassword}</Text>
          </View>
          
          <TouchableOpacity onPress={fetchSenderUsrDtls} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>{t.send}</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>

          
        </ScrollView>
      </View>
    </View>;
};
export default SMASendNonLns;