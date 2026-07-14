import React, { useEffect, useState } from 'react';
import { updateBizna } from '../../../src/graphql/mutations';
import { getBizna } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const CreateBiz = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [ChmPhn, setChmPhn] = useState('');
  const [nam, setName] = useState<string | null>(null);
  const [awsEmail, setAWSEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pword, setPW] = useState('');
  const [ChmNm, setChmNm] = useState('');
  const [ChmDesc, setChmDesc] = useState('');
  const [ChmRegNo, setChmRegNo] = useState('');
  const [MmbaID, setMmbaID] = useState('');
  const [Sign2Phn, setSign2Phn] = useState('');
  const WorkerID = "00001" + ChmPhn;
  const fetchAcDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const accountDtl: any = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: ChmPhn
        }
      });
      const owners = accountDtl.data.getBizna.owner;
      const pw = accountDtl.data.getBizna.pw;
      const CreateNewSMAc = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
          await client.graphql({
            query: updateBizna,
            variables: {
              input: {
                BusKntct: ChmPhn,
                owner2email: attributes.email
              }
            }
          });
          Alert.alert(attributes.email + " has taken over " + accountDtl.data.getBizna.busName + " Business");
        } catch (error) {
          console.log(error);
          Alert.alert(t.errorUpdateAppCallCare);
        } finally {
          setIsLoading(false);
        }
      };
      if (pw !== pword) {
        Alert.alert(t.wrongBusinessPassword);
      } else if (userInfo.userId !== owners) {
        Alert.alert(t.notYourBusiness);
      } else {
        await CreateNewSMAc();
      }
    } catch (e) {
      console.log(e);
      Alert.alert(t.checkYourDetails);
    } finally {
      setIsLoading(false);
      setChmPhn('');
      setPW('');
      setAWSEmail("");
      setChmDesc("");
      setChmNm("");
      setChmRegNo("");
      setMmbaID("");
      setSign2Phn("");
    }
  };
  useEffect(() => {
    if (!MmbaID && MmbaID !== "") {
      setMmbaID("");
      return;
    }
    setMmbaID(MmbaID);
  }, [MmbaID]);
  useEffect(() => {
    if (!ChmRegNo && ChmRegNo !== "") {
      setChmRegNo("");
      return;
    }
    setChmRegNo(ChmRegNo);
  }, [ChmRegNo]);
  useEffect(() => {
    if (!awsEmail && awsEmail !== "") {
      setAWSEmail("");
      return;
    }
    setAWSEmail(awsEmail);
  }, [awsEmail]);
  useEffect(() => {
    if (!ChmNm && ChmNm !== "") {
      setChmNm("");
      return;
    }
    setChmNm(ChmNm);
  }, [ChmNm]);
  useEffect(() => {
    if (!ChmDesc && ChmDesc !== "") {
      setChmDesc("");
      return;
    }
    setChmDesc(ChmDesc);
  }, [ChmDesc]);
  useEffect(() => {
    if (!ChmPhn && ChmPhn !== "") {
      setChmPhn("");
      return;
    }
    setChmPhn(ChmPhn);
  }, [ChmPhn]);
  useEffect(() => {
    if (!pword && pword !== "") {
      setPW("");
      return;
    }
    setPW(pword);
  }, [pword]);
  useEffect(() => {
    if (!Sign2Phn && Sign2Phn !== "") {
      setSign2Phn("");
      return;
    }
    setSign2Phn(Sign2Phn);
  }, [Sign2Phn]);
  return <View style={{ flex: 1 }}>
      <View style={styles.image}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.loanTitleView}>
            <Text style={styles.title}>{t.fillBusinessDetailsBelow}</Text>
          </View>

          <View style={styles.sendLoanView}>
            <TextInput placeholder="+2547xxxxxxxx" value={ChmPhn} onChangeText={setChmPhn} style={styles.sendLoanInput} editable={true} />
            <Text style={styles.sendLoanText}>{t.businessPhone}</Text>
          </View>

          <View style={styles.sendLoanView}>
            <TextInput value={ChmNm} onChangeText={setChmNm} style={styles.sendLoanInput} editable={true} />
            <Text style={styles.sendLoanText}>{t.newOwnerEmail}</Text>
          </View>

          <View style={styles.sendLoanView}>
            <TextInput value={pword} onChangeText={setPW} secureTextEntry={true} style={styles.sendLoanInput} editable={true} />
            <Text style={styles.sendLoanText}>{t.businessPassword}</Text>
          </View>

          <TouchableOpacity onPress={fetchAcDtls} style={styles.sendLoanButton}>
            <Text style={styles.sendLoanButtonText}>
              {t.clickToHandOver}
            </Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>;
};
export default CreateBiz;