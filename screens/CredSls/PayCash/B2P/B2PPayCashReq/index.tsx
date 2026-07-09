import React, { useEffect, useState } from 'react';
import { createSMLoansCovered, createNonLoans, updateCompany, updateSMAccount, updateBizna, createBizSlsReq, createMessages, sendNotification } from '../../../../../src/graphql/mutations';
import { getBizna, getCompany, getSMAccount, listCovCreditSellers, listCvrdGroupLoans, listPersonels, listSMLoansCovereds } from '../../../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Alert, ActivityIndicator, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { convertForeignToKsh } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const SMASendNonLns = props => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState("");
  const [amounts, setAmount] = useState("");
  const [Desc, setDesc] = useState("");
  const [AttendAdmin, setAttendAdmin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const SndChmMmbrMny = () => {
    navigation.navigate("AutomaticRepayAllTyps");
  };
  const fetchSenderUsrDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const accountDtl: any = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: SenderNatId
        }
      });
      const SenderUsrBal = accountDtl.data.getBizna.netEarnings;
      const bizBeneficiaryz = accountDtl.data.getBizna.bizBeneficiary;
      const name = accountDtl.data.getBizna.busName;
      const ownerz = accountDtl.data.getBizna.owner;
      const SenderAcstatus = accountDtl.data.getBizna.status;
      const pw = accountDtl.data.getBizna.pw;
      const amountInput = parseFloat(amounts);
      if (!Number.isFinite(amountInput) || amountInput <= 0) {
        Alert.alert(t.enterValidAmount);
        setIsLoading(false);
        return;
      }
      const rawNationality = accountDtl.data.getBizna.Nationality || accountDtl.data.getBizna.nationality;
      const senderCode = nationalityToCode(rawNationality) || rawNationality || 'KE';
      const amountKes = await convertForeignToKsh(amountInput, senderCode);
      if (!Number.isFinite(amountKes) || amountKes <= 0) {
        Alert.alert(t.unableConvertAmount);
        setIsLoading(false);
        return;
      }

      // Collect all Admin fields into an array
      const Admins = Array.from({
        length: 50
      }, (_, i) => accountDtl.data.getBizna[`Admin${i + 1}`]);
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const UsrDtls: any = await client.graphql({
        query: listPersonels,
        variables: {
          filter: {
            phoneKontact: {
              eq: attributes.email
            },
            BusinessRegNo: {
              eq: SenderNatId
            }
          }
        }
      });
      const RecAccountDtl: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: RecNatId
        }
      });
      const namess = RecAccountDtl.data.getSMAccount.name;
      const RecAcstatus = RecAccountDtl.data.getSMAccount.status;
      const accountDtl7: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: AttendAdmin
        }
      });
      const phonecontactxs = accountDtl7.data.getSMAccount.phonecontact;
      const namexs = accountDtl7.data.getSMAccount.name;
      const accountDtl7b: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const namezx = accountDtl7b.data.getSMAccount.name;
      const phonecontactzx = accountDtl7b.data.getSMAccount.phonecontact;
      const pwscx = accountDtl7b.data.getSMAccount.pw;
      async function sendSMNonLn() {
        await client.graphql({
          query: createBizSlsReq,
          variables: {
            input: {
              recPhn: RecNatId,
              senderPhn: SenderNatId,
              amount: amountKes.toFixed(0),
              description: Desc,
              RecName: namess,
              SenderName: name,
              status: "cashSales",
              owner: ownerz,
              attendingAdmin: AttendAdmin
            }
          }
        });
        const cashReqMsg1 = 'NiSenti. Hi ' + namexs + ', ' + namezx + ' of ' + name + ' business has requested to send ' + amounts + ' to ' + namess + '. Please proceed to authorise if it is a legitimate transaction ' + ' as per your business policies. For clarification reach the personnel through ' + phonecontactzx + '. Thank you.';
        try {
          const msgRes = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: phonecontactxs, messageBody: cashReqMsg1 }}
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: phonecontactxs, title: 'NiSenti: Cash Sale Approval Request', body: cashReqMsg1 }
            });
          }
        } catch (notifErr) {
          console.log('Notification error:', notifErr);
        }
      }

      // Conditional checks
      if (UsrDtls.data.listPersonels.items.length < 1) {
        Alert.alert(t.youDoNotWorkHere);
      } else if (RecAcstatus === "AccountInactive") {
        Alert.alert(t.receiverInactive);
      } else if (SnderPW !== pwscx) {
        Alert.alert(t.wrongPassword);
      } else if (SenderAcstatus === "AccountInactive") {
        Alert.alert(t.senderInactive);
      } else if (!Admins.includes(AttendAdmin)) {
        Alert.alert(t.adminNotInBusiness);
      } else {
        await sendSMNonLn();
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t.retryUpdateOrCall);
    } finally {
      setIsLoading(false);
      setSenderNatId('');
      setAmount("");
      setRecNatId('');
      setAttendAdmin("");
      setDesc("");
      setSnderPW("");
    }
  };
  return <View>
      <View style={styles.image}>
        <ScrollView>
         
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>{t.fillAccountDetails}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput placeholder={t.sendingBusinessPhone} value={SenderNatId} onChangeText={setSenderNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.sendingBusinessPhone}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput placeholder={t.receivingPersonEmail} value={RecNatId} onChangeText={setRecNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.receivingPersonEmail}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput placeholder={t.attendingAdminEmailPlaceholder} value={AttendAdmin} onChangeText={setAttendAdmin} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.attendingAdminEmail}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} editable={true}></TextInput>
              
            <Text style={styles.sendAmtText}>{t.amountSent}</Text>
          </View>


          <View style={styles.sendAmtView}>
            <TextInput value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>{t.mainAccountPassword}</Text>
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