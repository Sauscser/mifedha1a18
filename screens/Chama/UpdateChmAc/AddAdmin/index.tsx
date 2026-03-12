import React, { useEffect, useState } from 'react';
import { updateBizna, updateCompany, updateGroup, updateSMAccount, updateBankAdmin } from '../../../../src/graphql/mutations';
import { getGroup, getCompany, getSMAccount, listSMAccounts, listChamaMembers } from '../../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient();
const UpdtSMPW = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [SigntryPW, setSigntryPW] = useState("");
  const [groupCnt, setgroupCnt] = useState("");
  const [LnAcCod, setLnAcCod] = useState("");
  const [SMPW, setSMPW] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fetchSMDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const compDtls: any = await client.graphql({
        query: getGroup,
        variables: {
          grpContact: groupCnt
        }
      });
      const UsrDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const owners = compDtls.data.getGroup.owner;
      const AdminNo = compDtls.data.getGroup.AdminNo;
      const pw = compDtls.data.getGroup.signitoryPW;
      const UsrDtlx = UsrDtls.data.getSMAccount;

      // Check user existence
      const memberCheck: any = await client.graphql({
        query: listChamaMembers,
        variables: {
          filter: {
            and: {
              memberContact: {
                eq: LnAcCod
              }
            }
          }
        }
      });

      // ✅ Single reusable function for updating Admin slots
      const updateAdmin = async (slot: number, displayName: string) => {
        const fieldName = `Admin${slot}`;
        await client.graphql({
          query: updateGroup,
          variables: {
            input: {
              grpContact: groupCnt,
              [fieldName]: LnAcCod,
              AdminNo: parseFloat(AdminNo) + 1
            }
          }
        });
        Alert.alert(t.addAdminSuccess.replace('{name}', displayName).replace('{number}', (parseFloat(AdminNo) + 1).toString()));
      };

      // Example usage:
      // Call updateAdmin with the slot number you want to update
      // and the name you want to display in the alert.
      // For instance:
      await updateAdmin(1, UsrDtlx.name);
      // await updateAdmin(2, user.username);
      // await updateAdmin(3, user.username);
      // …and so on up to 16
    } catch (error) {
      console.log(error);
      Alert.alert(t.checkInternet);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: 'skyblue' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 28,
            width: '92%',
            maxWidth: 480,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 5,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#e29d58',
              textAlign: 'center',
              marginBottom: 28,
              letterSpacing: 0.5,
            }}
          >
            {t.fillDetails}
          </Text>
          <View style={{ width: '100%', marginBottom: 18 }}>
            <Text style={{ fontSize: 15, color: '#1a237e', marginBottom: 6, marginLeft: 4 }}>{t.groupPhone}</Text>
            <TextInput
              value={groupCnt}
              onChangeText={setgroupCnt}
              style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 10,
                height: 52,
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
            <Text style={{ fontSize: 15, color: '#1a237e', marginBottom: 6, marginLeft: 4 }}>{t.adminMainAccountEmail}</Text>
            <TextInput
              value={LnAcCod}
              onChangeText={setLnAcCod}
              style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 10,
                height: 52,
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
            <Text style={{ fontSize: 15, color: '#1a237e', marginBottom: 6, marginLeft: 4 }}>{t.groupAcPW}</Text>
            <TextInput
              value={SMPW}
              onChangeText={setSMPW}
              secureTextEntry
              style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 10,
                height: 52,
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
            onPress={fetchSMDtls}
            style={{
              backgroundColor: isLoading ? '#b0bec5' : '#e29d58',
              borderRadius: 30,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
              marginBottom: 6,
              shadowColor: '#e29d58',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2
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
    </View>
  );
};
export default UpdtSMPW;