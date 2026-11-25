import React, { useEffect, useState } from 'react';
import { deleteChamaMembers, deletePersonel, updateGroup } from '../../../src/graphql/mutations';
import { getBizna, getChamaMembers, getGroup, getSMAccount } from '../../../src/graphql/queries';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import { updateBankAdmin } from '../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const DeregChmMmbr = props => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const navigation = useNavigation();
  const [SigntryPW, setSigntryPW] = useState("");
  const [ChmMmbrId, setChmMmbrId] = useState("");
  const [grpContact, setChmPhn] = useState('');
  const [nam, setName] = useState(null);
  const [phoneContacts, setPhoneContacts] = useState("");
  const [awsEmail, setAWSEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pword, setPW] = useState('');
  const [isBusinessPasswordVisible, setIsBusinessPasswordVisible] = useState(false);
  const [MmberId, setMmberId] = useState('');
  const [ChmDesc, setChmDesc] = useState('');
  const [memberPhn, setmemberPhn] = useState('');
  const ChmNMmbrPhns = MmberId + grpContact;
  const route = useRoute();
  const ftchChmDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    try {
      const compDtls: any = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: grpContact
        }
      });
      const signitoryPWs = compDtls.data.getBizna.pw;
      const owners = compDtls.data.getBizna.owner;
      const updateChmMmbrAc = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          await client.graphql({
            query: deletePersonel,
            variables: {
              input: {
                workerId: ChmNMmbrPhns
              }
            }
          });
        } catch (error) {
          if (error) {
            Alert.alert(t.removalUnsuccessfulRetry);
            return;
          }
        }
        setIsLoading(false);
        Alert.alert(t.workerRemoved);
      };
      if (signitoryPWs !== pword) {
        Alert.alert(t.wrongAdminPassword);
      } else if (owners !== userInfo.userId) {
        Alert.alert(t.notAuthorisedDeregisterWorker);
      } else {
        updateChmMmbrAc();
      }
    } catch (error) {
      if (error) {
        console.log(error);
        Alert.alert(t.unsuccessfulRetry);
        return;
      }
    }
    setIsLoading(false);
    setMmberId("");
    setSigntryPW("");
    setChmPhn('');
    setPW('');
    setPhoneContacts("");
    setChmDesc("");
    setmemberPhn("");
  };
  useEffect(() => {
    const ChmMmbrIds = MmberId;
    if (!ChmMmbrIds && ChmMmbrIds !== "") {
      setMmberId("");
      return;
    }
    setMmberId(ChmMmbrIds);
  }, [MmberId]);
  useEffect(() => {
    const SigntryPWs = SigntryPW;
    if (!SigntryPWs && SigntryPWs !== "") {
      setSigntryPW("");
      return;
    }
    setSigntryPW(SigntryPWs);
  }, [SigntryPW]);
  useEffect(() => {
    const memberPhns = memberPhn;
    if (!memberPhns && memberPhns !== "") {
      setmemberPhn("");
      return;
    }
    setmemberPhn(memberPhns);
  }, [memberPhn]);
  useEffect(() => {
    const phoneContactss = phoneContacts;
    if (!phoneContactss && phoneContactss !== "") {
      setPhoneContacts("");
      return;
    }
    setPhoneContacts(phoneContactss);
  }, [phoneContacts]);
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
  return (
    <LinearGradient colors={['#87ceeb', '#29e58d']} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>−</Text>
            </View>
            <Text style={styles.headerTitle}>{t.clickToDeregister}</Text>
            <Text style={styles.headerSubtitle}>{t.fillDetailsBelow}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formIntro}>{t.fillDetailsBelow}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.businessPhone}</Text>
              <TextInput
                placeholder={t.businessPhonePlaceholder}
                placeholderTextColor="#8a98a5"
                value={grpContact}
                onChangeText={setChmPhn}
                style={styles.input}
                editable={!isLoading}
                autoCapitalize="none"
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.personnelWorkId}</Text>
              <TextInput
                placeholder={t.personnelWorkId}
                placeholderTextColor="#8a98a5"
                value={MmberId}
                onChangeText={setMmberId}
                style={styles.input}
                editable={!isLoading}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.businessACPW}</Text>
              <View style={styles.passwordInputRow}>
                <TextInput
                  placeholder={t.businessACPW}
                  placeholderTextColor="#8a98a5"
                  value={pword}
                  onChangeText={setPW}
                  secureTextEntry={!isBusinessPasswordVisible}
                  style={styles.passwordInput}
                  editable={!isLoading}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setIsBusinessPasswordVisible(visible => !visible)}
                  style={styles.passwordVisibilityButton}
                  accessibilityRole="button"
                  accessibilityLabel={isBusinessPasswordVisible ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={isBusinessPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#1688a8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={ftchChmDtls}
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t.clickToDeregister}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};
export default DeregChmMmbr;