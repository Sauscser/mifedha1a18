import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';


import { createBankAdmin, createChamaApply, createChamaApply2, updateCompany } from '../../../src/graphql/mutations';
import { getBankAdmin, getCompany, getMiFedhaBankAdmin, getSMAccount } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

const CreateAdminForm = () => {
  const navigation = useNavigation();
  const [BankAdminAccounts, setBankAdminAccounts] = useState("");
  const [ChamaAcNus, setChamaAcNus] = useState("");
  const [nationalId, setNationalid] = useState("");
  const [pword, setPW] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fetchUser = async () => {};
  useEffect(() => {
    fetchUser();
  }, []);
  const gtUsrDtls4AdminDtls = async () => {
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const resp = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      if ('data' in resp && resp.data && resp.data.getSMAccount) {
        const adminId = resp.data.getSMAccount.nationalid;
        const adminEml = resp.data.getSMAccount.awsemail;
        const gtCompDtls = async () => {
          try {
            const compDtls = await client.graphql({
              query: getMiFedhaBankAdmin,
              variables: {
                nationalid: adminId
              }
            });
            if ('data' in compDtls && compDtls.data && compDtls.data.getMiFedhaBankAdmin) {
              const bank = compDtls.data.getMiFedhaBankAdmin.bank;
              const pws = compDtls.data.getMiFedhaBankAdmin.pw;
              if (pws !== pword) {
                Alert.alert("Wrong Bank Admin Password");
                setIsLoading(false);
                return;
              }
              await client.graphql({
                query: createChamaApply2,
                variables: {
                  input: {
                    ChamaAdminEmail: nationalId,
                    bankAdminEmail: adminId,
                    BankAdminAccount: bank,
                    ChamaAcNu: ChamaAcNus,
                    mfnReg: 0,
                    status: "AccountActive"
                  }
                }
              });
              await client.graphql({
                query: updateCompany,
                variables: {
                  input: {
                    AdminId: "BaruchHabaB'ShemAdonai2"
                  }
                }
              });
              Alert.alert("Successful. Group admin may create group account");
            } else {
              Alert.alert("Could not fetch bank admin details");
            }
          } catch (error) {
            console.log(error);
            Alert.alert("Application unsuccessful; Retry or update app");
          } finally {
            setIsLoading(false);
            setNationalid("");
            setChamaAcNus("");
            setBankAdminAccounts("");
            setPW("");
          }
        };
        await gtCompDtls();
      } else {
        Alert.alert("Could not fetch user account details");
        setIsLoading(false);
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Check your internet");
      setIsLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <LinearGradient
        colors={["#e29d58", "#87ceeb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.headerBox}>
              <Text style={styles.title}>Fill Account Details Below</Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput
                value={nationalId}
                onChangeText={setNationalid}
                style={styles.input}
                placeholder="Chama Admin Email"
                placeholderTextColor="#888"
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputBox}>
              <TextInput
                value={ChamaAcNus}
                onChangeText={setChamaAcNus}
                style={styles.input}
                placeholder="Chama Account Number"
                placeholderTextColor="#888"
                editable={!isLoading}
              />
            </View>
            <View style={styles.inputBox}>
              <View style={{ width: '100%', position: 'relative' }}>
                <TextInput
                  value={pword}
                  onChangeText={setPW}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#888"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 16, top: 16, padding: 4 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={{ color: '#e29d58', fontWeight: 'bold' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              onPress={gtUsrDtls4AdminDtls}
              style={styles.button}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Click to Register Group</Text>
              {isLoading && <ActivityIndicator color={'#fff'} size="large" style={{ marginTop: 8 }} />}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBox: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e29d58',
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputBox: {
    width: '100%',
    marginBottom: 18,
    alignItems: 'center',
  },
  input: {
    width: 300,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#e29d58',
    color: '#222',
    marginBottom: 2,
    shadowColor: '#e29d58',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    width: 300,
    backgroundColor: '#e29d58',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#e29d58',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default CreateAdminForm;