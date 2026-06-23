import React, { useEffect, useState } from 'react';
import { createCompany } from '../../../src/graphql/mutations';
import { getAgent, getBankAdmin, getBizna, getCompany, getSAgent } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const MFNSignIn = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [MFNId, setMFNId] = useState("");
  const [MFNPW, setMFNPW] = useState("");
  const fetchMFNDts = async () => {
    const userInfo = await getCurrentUser();
    try {
      const MFNDtls: any = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: MFNId
        }
      });
      const pw1s = MFNDtls.data.getBizna.pw;
      const owners = MFNDtls.data.getBizna.owner;
      const BusinessRegNos = MFNDtls.data.getBizna.BusKntct;
      const VwMFNAc = () => {
        navigation.navigate("VwBusAcss", {
          BusinessRegNos
        });
      };
      if (owners !== userInfo.userId) {
        Alert.alert(t.youDontOwnThisBusiness);
      } else if (MFNPW !== pw1s) {
        Alert.alert(t.wrongBusinessPassword);
      } else {
        VwMFNAc();
      }
    } catch (e) {
      if (e) {
        Alert.alert(t.businessDoesNotExistCheckInternet);
        return;
      }
      console.log(e);
    }
    setMFNId("");
    setMFNPW("");
  };
  useEffect(() => {
    const mfnID = MFNId;
    if (!mfnID && mfnID !== "") {
      setMFNId("");
      return;
    }
    setMFNId(mfnID);
  }, [MFNId]);
  useEffect(() => {
    const mfnPW = MFNPW;
    if (!mfnPW && mfnPW !== "") {
      setMFNPW("");
      return;
    }
    setMFNPW(mfnPW);
  }, [MFNPW]);
  return <View>
              <View style={styles.image}>
                <ScrollView>
                  <View style={styles.loanTitleView}>
                    <Text style={styles.title}>{t.fillDetailsBelow}</Text>
                  </View>
        
                  <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.businessPhonePlaceholder} value={MFNId} onChangeText={setMFNId} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.businessPhone}</Text>
                  </View>
        
                  <View style={styles.sendLoanView}>
                    <TextInput value={MFNPW} onChangeText={setMFNPW} secureTextEntry={true} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.businessPassword}</Text>
                  </View>
        
                  <TouchableOpacity onPress={fetchMFNDts} style={styles.sendLoanButton}>
                    <Text style={styles.sendLoanButtonText}>
                      {t.clickToView}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>;
};
export default MFNSignIn;