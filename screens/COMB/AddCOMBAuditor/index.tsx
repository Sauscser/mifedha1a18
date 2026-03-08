import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { createAuditor, createMessages, sendNotification } from '../../../src/graphql/mutations';
import { getSMAccount } from '../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import translations from './translation';
type AuditorRegistrationProps = {
  usr: string;
};
const client = generateClient();
const RegisterAuditor = ({
  usr
}: AuditorRegistrationProps) => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const navigation = useNavigation();

  // Form state
  const [auditorEmail, setAuditorEmail] = useState('');
  const [mainPassword, setMainPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verify main account credentials
  const checkUserExistence = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const accountRes: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const userData = accountRes?.data?.getSMAccount;
        if (!userData || userData.pw !== mainPassword) {
          Alert.alert(t.error, t.error_wrongPasswordOrAccountDoesNotExist);
          setIsLoading(false);
          return;
      }
      await registerAuditor();
    } catch (error: any) {
      console.error(error);
        Alert.alert(t.error, t.error_accessDeniedOrNetworkError);
      setIsLoading(false);
    }
  };

  // Register auditor in GraphQL
  const registerAuditor = async () => {
    try {
      const createdAt = new Date().toISOString();
      const AuditorDtl: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: auditorEmail
        }
      });
      const auditorData = AuditorDtl?.data?.getSMAccount;
        if (!auditorData) {
          Alert.alert(t.error, t.error_auditorEmailDoesNotExist);
          setIsLoading(false);
          return;
      }
      await client.graphql({
        query: createAuditor,
        variables: {
          input: {
            name: auditorData.name,
            email: auditorEmail,
            active: true,
            organization: usr,
            regions: [],
            createdAt,
            updatedAt: createdAt
          }
        }
      });

      // Send confirmation message
      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            senderEmail: auditorEmail,
            messageBody: t.messageBody.replace('{{usr}}', usr)
          }
        }
      });
      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail: auditorEmail,
          title: t.notificationTitle,
          body: t.notificationBody.replace('{{usr}}', usr)
        }
      });
        Alert.alert(t.successMsg_combOfficerRegisteredSuccessfully.replace('{{usr}}', usr));
      navigation.goBack();
      resetForm();
    } catch (error: any) {
      console.error(error);
        Alert.alert(t.error, t.error_failedToRegisterAuditorPleaseTryAgain);
    } finally {
      setIsLoading(false);
    }
  };
  const resetForm = () => {
    setAuditorEmail('');
    setMainPassword('');
    setShowPassword(false);
  };
  return <LinearGradient colors={['#e58d29', '#87ceeb']} style={{
    flex: 1
  }}>
      <ScrollView contentContainerStyle={{
      padding: 20
    }}>
        {/* Header */}
        <View style={ui.header}>
          <Text style={ui.headerTitle}>{t.headerTitle}</Text>
          <Text style={ui.headerSub}>{t.headerSub}</Text>
        </View>

        {/* Card */}
        <View style={ui.card}>
          <Text style={ui.label}>{t.emailLabel}</Text>
          <TextInput placeholder={t.emailPlaceholder} placeholderTextColor="#333" value={auditorEmail} onChangeText={setAuditorEmail} style={ui.input} keyboardType="email-address" autoCapitalize="none" />

          <Text style={ui.label}>{t.passwordLabel}</Text>
          <View style={ui.passwordRow}>
            <TextInput style={[ui.input, {
            flex: 1
          }]} placeholder={t.passwordPlaceholder} value={mainPassword} onChangeText={setMainPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
            <TouchableOpacity style={ui.eyeButton} onPress={() => setShowPassword(p => !p)}>
              <Text style={{
              color: '#fff',
              fontSize: 14
            }}>{showPassword ? t.hide : t.show}</Text>
            </TouchableOpacity>
          </View>

          {/* Button */}
          <TouchableOpacity onPress={checkUserExistence} disabled={isLoading}>
            <LinearGradient colors={['#e58d29', '#f2b66d']} style={ui.button}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={ui.buttonText}>{t.button}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>;
};
export default RegisterAuditor;
const ui = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSub: {
    fontSize: 14,
    color: '#f5f5f5',
    marginTop: 5
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  label: {
    color: '#333',
    fontSize: 13,
    marginBottom: 5,
    marginTop: 15
  },
  passwordRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center'
  },
  eyeButton: {
    marginLeft: 8,
    backgroundColor: '#e58d29',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#fafafa'
  },
  button: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});