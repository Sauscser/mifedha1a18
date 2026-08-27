import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getSMAccount, listPersonels } from '../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';

const client = generateClient();
const ChmSignIn = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [grpContact, setChmPhn] = useState('');
  const [nam, setName] = useState(null);
  const [phoneContacts, setPhoneContacts] = useState("");
  const [awsEmail, setAWSEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pword, setPW] = useState('');
  const [ChmNm, setChmNm] = useState('');
  const [ChmDesc, setChmDesc] = useState('');
  const [memberPhn, setmemberPhn] = useState('');
  const FetchGrpLonsSts = () => {
    safeNavigateFrom(navigation, 'VwBizLners', {
      ChmDesc
    });
  };
  const gtChmDtls = async () => {
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
          awsemail: attributes.email
        }
      });
      const signitoryPWs = compDtls.data.getSMAccount.pw;
      const owners = compDtls.data.getSMAccount.owner;
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
                  eq: ChmDesc
                }
              }
            }
          });
          if (signitoryPWs !== pword) {
            Alert.alert(t.wrongUserCredentials);
          } else if (UsrDtls.data.listPersonels.items.length < 1) {
            Alert.alert(t.youDoNotWorkHere);
            return;
          } else {
            FetchGrpLonsSts();
          }
        } catch (e) {
          console.log(e);
          if (e) {
            Alert.alert(t.retryOrUpdateApp);
            return;
          }
        }
        setIsLoading(false);
      };
      if (userInfo.userId !== owners) {
        Alert.alert(t.pleaseCreateMainAccount);
        return;
      } else {
        await ChckPersonelExistence();
      }
    } catch (e) {
      console.log(e);
      if (e) {
        Alert.alert(t.retryOrUpdateApp);
        return;
      }
    }
    setIsLoading(false);
    setChmPhn('');
    setPW('');
    setPhoneContacts("");
    setChmDesc("");
    setChmNm("");
    setmemberPhn("");
    setIsLoading(false);
  };
  useEffect(() => {
    const phoneContactss = phoneContacts;
    if (!phoneContactss && phoneContactss !== "") {
      setPhoneContacts("");
      return;
    }
    setPhoneContacts(phoneContactss);
  }, [phoneContacts]);
  useEffect(() => {
    const memberPhns = memberPhn;
    if (!memberPhns && memberPhns !== "") {
      setmemberPhn("");
      return;
    }
    setmemberPhn(memberPhns);
  }, [memberPhn]);
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
    const ChmPhns = grpContact;
    if (!ChmPhns && ChmPhns !== "") {
      setChmPhn("");
      return;
    }
    setChmPhn(ChmPhns);
  }, [grpContact]);
  useEffect(() => {
    const pws = pword;
    if (!pws && pws !== "") {
      setPW("");
      return;
    }
    setPW(pws);
  }, [pword]);
  return <View>
              <View style={styles.image}>
                <ScrollView>
           
                  <View style={styles.loanTitleView}>
                    <Text style={styles.title}>{t.fillDetailsBelow}</Text>
                  </View>
        
                  <View style={styles.sendLoanView}>
                    <TextInput placeholder={t.businessPhonePlaceholder} placeholderTextColor="#444" value={ChmDesc} onChangeText={setChmDesc} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.businessPhone}</Text>
                  </View>

                  
                  <View style={styles.sendLoanView}>
                    <TextInput value={pword} onChangeText={setPW} secureTextEntry={true} style={styles.sendLoanInput} editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>{t.mainAccountPassword}</Text>
                  </View>

                  <TouchableOpacity onPress={gtChmDtls} style={styles.sendLoanButton}>
                    <Text style={styles.sendLoanButtonText}>
                      {t.clickToView}
                    </Text>
                    {isLoading && <ActivityIndicator size="large" color="blue" />}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>;
};
export default ChmSignIn;