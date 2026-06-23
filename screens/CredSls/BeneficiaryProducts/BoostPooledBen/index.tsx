import React, { useState } from 'react';
import { createSMLoansCovered, createNonLoans, updateCompany, updateSMAccount, updateBizna } from '../../../../src/graphql/mutations';
import { getBizna, getCompany, getSMAccount } from '../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useNavigation } from '@react-navigation/native';
import { convertForeignToKsh, formatAmountSync } from '../../../../src/utils/exchange';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const SMASendNonLns = (props: any) => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState('');
  const [SendrPhn, setSendrPhn] = useState(null);
  const [amounts, setAmount] = useState('');
  const [Desc, setDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { ratesMap } = useExchange();
  const fetchSenderUsrDtls = async () => {
    if (isLoading) return;
    setIsLoading(false);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
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
      const benefitsAmount = accountDtl.data.getBizna.benefitsAmount;
      const status = accountDtl.data.getBizna.status;
      const senderNationality = accountDtl.data.getBizna.Nationality || (attributes as any).nationality;
      const userCode = nationalityToCode(senderNationality) || senderNationality || 'KE';
      const fetchCompDtls = async () => {
        if (isLoading) return;
        setIsLoading(true);
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
            Alert.alert(t.unableToConvert);
            setIsLoading(false);
            return;
          }

          const TotalTransacted = amountKes + UsrTransferFee * amountKes;
          const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
          const companyEarnings = CompDtls.data.getCompany.companyEarning;
          const ttlNonLonssRecSMs = CompDtls.data.getCompany.ttlNonLonssRecSM;
          const ttlNonLonssSentSMs = CompDtls.data.getCompany.ttlNonLonssSentSM;
          const sendSMNonLn = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
              await client.graphql({
                query: createNonLoans,
                variables: {
                  input: {
                    recPhn: SenderNatId,
                    senderPhn: SenderNatId,
                    amount: amountKes.toFixed(0),
                    description: Desc,
                    RecName: busNames,
                    SenderName: busNames,
                    status: 'BenefitBoost',
                    owner: userInfo.userId
                  }
                }
              });
            } catch (error) {
              Alert.alert(t.boostUnsuccessful);
              return;
            }
            setIsLoading(false);
            await updtSendrAc();
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
                    benefitsAmount: parseFloat(benefitsAmount) + amountKes,
                    netEarnings: (parseFloat(netEarningss) - TotalTransacted).toFixed(0)
                  }
                }
              });
            } catch (error) {
              Alert.alert(t.errorEnterDetails);
              return;
            }
            setIsLoading(false);
            await updtComp();
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
            const formattedFee = formatAmountSync((UsrTransferFee * amountKes), userCode, ratesMap);
            Alert.alert(t.successBoost, t.boostOfAmount + ' ' + formattedAmount + ' ' + t.successBoost + '. ' + 'Fees: ' + formattedFee);
          };
          if (status !== 'AccountActive') {
            Alert.alert(t.accountNotActive);
          } else if (parseFloat(netEarningss) < TotalTransacted) {
            Alert.alert(t.requestedMoreThanBalance);
          } else if (noBL > 0) {
            Alert.alert(t.clearLenders);
          } else if (usrPW !== SnderPW) {
            Alert.alert(t.wrongPassword);
          } else if (userInfo.userId !== SenderSub) {
            Alert.alert(t.notOwner);
          } else {
            await sendSMNonLn();
          }
        } catch (e) {
          Alert.alert('Retry or update app or call customer care');
          return;
        }
        setIsLoading(false);
      };
      await fetchCompDtls();
    } catch (e) {
      Alert.alert('Retry or update app or call customer care');
      return;
    }
    setIsLoading(false);
    setSenderNatId('');
    setAmount('');
    setRecNatId('');
    setDesc('');
    setSnderPW('');
  };
  return <View>
      <View style={styles.image}>
        <ScrollView>
         
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>{t.fillAccountDetails}</Text>
          </View>
          <View style={styles.sendAmtView}>
            <TextInput placeholder={t.businessPhonePlaceholder} value={SenderNatId} onChangeText={setSenderNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.businessPhone}</Text>
          </View>
          
          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} editable={true}></TextInput>
            
            <Text style={styles.sendAmtText}>{t.amountSent}</Text>
          </View>


          <View style={styles.sendAmtView}>
            <TextInput value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.businessPassword}</Text>
          </View>

          

          <View style={styles.sendAmtViewDesc}>
            <TextInput multiline={true} value={Desc} onChangeText={setDesc} style={styles.sendAmtInputDesc} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.description}</Text>
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