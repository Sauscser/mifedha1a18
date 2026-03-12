import React, { useEffect, useState } from 'react';
import { updateCompany, updateGroup } from '../../../../src/graphql/mutations';
import { getCompany, getGroup, getSMAccount } from '../../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { updateBankAdmin } from '../../../../src/graphql/mutations';
import { generateClient } from 'aws-amplify/api';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient();
const UpdtChm = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [SigntryPW, setSigntryPW] = useState("");
  const [groupCnt, setgroupCnt] = useState("");
  const [LnAcCod, setLnAcCod] = useState("");
  const [SMPW, setSMPW] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fetchChmAuthorDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const UsrDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const pws = UsrDtls.data.getSMAccount.pw;
      const owner = UsrDtls.data.getSMAccount.owner;
      const compDtls: any = await client.graphql({
        query: getGroup,
        variables: {
          grpContact: groupCnt
        }
      });
      const statuss = compDtls.data.getGroup.status;
      const owners = compDtls.data.getGroup.owner;
      const Admin1 = compDtls.data.getGroup.Admin1;
      const objectionStatus = compDtls.data.getGroup.objectionStatus;
      const Admin2 = compDtls.data.getGroup.Admin2;
      const Admin3 = compDtls.data.getGroup.Admin3;
      const updtChmDtls = async () => {
        await client.graphql({
          query: updateGroup,
          variables: {
            input: {
              grpContact: groupCnt,
              objReason: LnAcCod,
              objectionStatus: "Objected",
              objOfficer: attributes.email
            }
          }
        });
        Alert.alert(t.operationsStopped);
      };
      if (SMPW !== pws) {
        Alert.alert(t.wrongMainPW);
      } else if (user.userId !== owners && Admin1 !== attributes.email && Admin2 !== attributes.email && Admin3 !== attributes.email) {
        Alert.alert(t.unauthorized);
      } else if (objectionStatus === "Objected") {
        Alert.alert(t.alreadyObjected);
      } else if (statuss !== "AccountActive") {
        Alert.alert(t.inactiveAccount);
      } else if (user.userId !== owner) {
        Alert.alert(t.createMainAccount);
      } else {
        await updtChmDtls();
      }
    } catch (error) {
      console.log(error);
      Alert.alert(t.retryOrUpdate);
    } finally {
      setIsLoading(false);
      setgroupCnt("");
      setSigntryPW("");
      setSMPW("");
      setLnAcCod("");
    }
  };
  const { height, width } = Dimensions.get('window');
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'skyblue' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: Math.max(20, height * 0.04),
          minHeight: height
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 20,
          padding: width < 350 ? 14 : 28,
          width: width > 500 ? 420 : '94%',
          maxWidth: 500,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 5,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: width < 350 ? 18 : 24,
            fontWeight: 'bold',
            color: '#e29d58',
            textAlign: 'center',
            marginBottom: 24,
            letterSpacing: 0.5,
          }}>{t.fillChamaDetails}</Text>
          <View style={{ width: '100%', marginBottom: 18 }}>
            <Text style={{ fontSize: 15, color: '#1a237e', marginBottom: 6, marginLeft: 4 }}>{t.groupPhone}</Text>
            <TextInput
              placeholder="+2547xxxxxxxx"
              value={groupCnt}
              onChangeText={setgroupCnt}
              style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 10,
                height: width < 350 ? 40 : 48,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#222',
                borderWidth: 1,
                borderColor: '#e29d58',
                marginBottom: 2
              }}
              editable={!isLoading}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ width: '100%', marginBottom: 18 }}>
            <Text style={{ fontSize: 15, color: '#1a237e', marginBottom: 6, marginLeft: 4 }}>{t.reason}</Text>
            <TextInput
              value={LnAcCod}
              onChangeText={setLnAcCod}
              style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 10,
                height: width < 350 ? 40 : 48,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#222',
                borderWidth: 1,
                borderColor: '#e29d58',
                marginBottom: 2
              }}
              editable={!isLoading}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={{ width: '100%', marginBottom: 18 }}>
            <Text style={{ fontSize: 15, color: '#1a237e', marginBottom: 6, marginLeft: 4 }}>{t.signitoryUserPW}</Text>
            <TextInput
              value={SMPW}
              onChangeText={setSMPW}
              secureTextEntry
              style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 10,
                height: width < 350 ? 40 : 48,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#222',
                borderWidth: 1,
                borderColor: '#e29d58',
                marginBottom: 2
              }}
              editable={!isLoading}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            onPress={fetchChmAuthorDtls}
            style={{
              backgroundColor: isLoading ? '#b0bec5' : '#e29d58',
              borderRadius: 30,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
              marginBottom: 6,
              shadowColor: '#e29d58',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
              width: '100%'
            }}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{t.clickToUpdate}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
export default UpdtChm;