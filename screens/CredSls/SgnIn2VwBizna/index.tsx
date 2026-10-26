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
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';
import { Ionicons } from '@expo/vector-icons';

const client = generateClient();
const MFNSignIn = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [MFNId, setMFNId] = useState("");
  const [MFNPW, setMFNPW] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
        safeNavigateFrom(navigation, 'VwBusAcss', {
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
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerAccent} />
            <Text style={styles.title}>{t.fillDetailsBelow}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.businessPhone}</Text>
            <TextInput
              placeholder={t.businessPhonePlaceholder}
              placeholderTextColor="#91A3AE"
              value={MFNId}
              onChangeText={setMFNId}
              style={styles.input}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={true}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.businessPassword}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={MFNPW}
                onChangeText={setMFNPW}
                secureTextEntry={!isPasswordVisible}
                style={[styles.input, styles.passwordInput]}
                placeholderTextColor="#91A3AE"
                autoCapitalize="none"
                editable={true}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(visible => !visible)}
                style={styles.passwordToggle}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={22} color="#385466" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={fetchMFNDts}
            style={styles.button}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{t.clickToView}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
export default MFNSignIn;