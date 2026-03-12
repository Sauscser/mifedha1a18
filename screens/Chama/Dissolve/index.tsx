import React, { useEffect, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { deleteGroup, updateCompany } from '../../../src/graphql/mutations';
import { getCompany, getGroup, getSMAccount } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient();
const DissolveChm = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [SigntryPW, setSigntryPW] = useState("");
  const [groupCnt, setgroupCnt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ownr, setownr] = useState<string | null>(null);
  const fetchUser = async () => {
    const user = await getCurrentUser();
    setownr(user.userId); // ✅ sub comes from getCurrentUser().userId
  };
  useEffect(() => {
    fetchUser();
  }, []);
  const fetchCompDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const ttlActiveChms = compDtls.data.getCompany.ttlActiveChm;
      const ttlInactvChms = compDtls.data.getCompany.ttlInactvChm;
      const ftchChmDtls = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
          const grpDtls: any = await client.graphql({
            query: getGroup,
            variables: {
              grpContact: groupCnt
            }
          });
          const signitoryPWs = grpDtls.data.getGroup.signitoryPW;
          const grpNames = grpDtls.data.getGroup.grpName;
          const owners = grpDtls.data.getGroup.owner;
          const ttlNonLonsRecChms = grpDtls.data.getGroup.ttlNonLonsRecChm;
          const ttlNonLonsSentChms = grpDtls.data.getGroup.ttlNonLonsSentChm;
          const grpBals = grpDtls.data.getGroup.grpBal;
          const ttlGrpMemberss = grpDtls.data.getGroup.ttlGrpMembers;
          const usrDtls: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: attributes.email
            }
          });
          const awsEmails = usrDtls.data.getSMAccount.name;
          const updateComp = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
              await client.graphql({
                query: updateCompany,
                variables: {
                  input: {
                    AdminId: "BaruchHabaB'ShemAdonai2",
                    ttlActiveChm: parseFloat(ttlActiveChms) - 1,
                    ttlInactvChm: parseFloat(ttlInactvChms) + 1
                  }
                }
              });
            } catch (error) {
              Alert.alert(t.dissolutionUnsuccessful);
              return;
            }
            setIsLoading(false);
            await updtChmDtls();
          };
          if (ttlNonLonsRecChms > ttlNonLonsSentChms) {
            Alert.alert(t.chamaHasMembersMoney);
            return;
          } else if (signitoryPWs !== SigntryPW) {
            Alert.alert(t.wrongSignitoryPassword);
            return;
          } else if (ownr !== owners) {
            Alert.alert(t.notAuthor);
            return;
          } else if (parseFloat(ttlGrpMemberss) > 0) {
            Alert.alert(t.deregisterAllMembers);
            return;
          } else if (grpBals > 1) {
            Alert.alert(t.chamaHasMoney);
            return;
          } else {
            await updateComp();
          }
          const updtChmDtls = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
              await client.graphql({
                query: deleteGroup,
                variables: {
                  input: {
                    grpContact: groupCnt
                  }
                }
              });
            } catch (error) {
              console.log(error);
              Alert.alert(t.errorAccessDenied);
            }
            setIsLoading(false);
            Alert.alert(t.dissolvedSuccess.replace('{user}', awsEmails).replace('{group}', grpNames));
          };
        } catch (e) {
          Alert.alert(t.errorAccessDenied);
          return;
        }
      };
      await ftchChmDtls();
    } catch (e) {
      Alert.alert(t.errorAccessDenied);
      return;
    }
    setIsLoading(false);
    setgroupCnt("");
    setSigntryPW("");
  };
  const { height, width } = Dimensions.get('window');
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f6fafd' }}
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
          borderRadius: 18,
          padding: width < 350 ? 12 : 24,
          width: width > 500 ? 420 : '94%',
          maxWidth: 500,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
          marginBottom: 24
        }}>
          <Text style={{
            fontSize: width < 350 ? 18 : 24,
            fontWeight: 'bold',
            color: '#1a237e',
            textAlign: 'center',
            marginBottom: 18
          }}>{t.fillChamaDetails}</Text>

          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 16, color: '#1a237e', marginBottom: 6, marginLeft: 4 }}>{t.chamaAccountNumber}</Text>
            <TextInput
              placeholder="+2547xxxxxxxx"
              value={groupCnt}
              onChangeText={setgroupCnt}
              style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 10,
                height: width < 350 ? 44 : 56,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#222',
                borderWidth: 1,
                borderColor: '#c5cae9',
                marginBottom: 2
              }}
              editable={!isLoading}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 16, color: '#1a237e', marginBottom: 6, marginLeft: 4 }}>{t.chamaPassword}</Text>
            <TextInput
              value={SigntryPW}
              onChangeText={setSigntryPW}
              secureTextEntry
              style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 10,
                height: width < 350 ? 44 : 56,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#222',
                borderWidth: 1,
                borderColor: '#c5cae9',
                marginBottom: 2
              }}
              editable={!isLoading}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            onPress={fetchCompDtls}
            style={{
              backgroundColor: isLoading ? '#b0bec5' : '#3949ab',
              borderRadius: 30,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
              marginBottom: 6,
              shadowColor: '#3949ab',
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
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{t.clickToDissolve}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
export default DissolveChm;