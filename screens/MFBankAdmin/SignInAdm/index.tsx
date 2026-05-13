import React, { useEffect, useState } from 'react';
import { createCompany } from '../../../src/graphql/mutations';
import { getBankAdmin, getCompany, getMiFedhaBankAdmin } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import styles from './styles';
import MFBankAdmin from "../../../screens/MFBankAdmin";

import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const AdminSignIn = props => {
  const navigation = useNavigation();
  const [AdmnId, setAdminId] = useState("");
  const [AdminPW, setAdminPW] = useState("");
  const [ownr, setownr] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
 
  
  const moveToAdminHm = () => {
  navigation.navigate("MFBankAdmin");
};



  const GoHome = () => {
    navigation.navigate('Homes');
  };

  
  const fetchUser = async () => {
    const userInfo = await getCurrentUser();
    setownr(userInfo.userId);
  };
  useEffect(() => {
    fetchUser();
  }, []);
  const fetchAdmnDts = async () => {
    try {
      const AdminDtls: any = await client.graphql({
        query: getMiFedhaBankAdmin,
        variables: {
          nationalid: AdmnId
        }
      });
      const pw1s = AdminDtls.data.getMiFedhaBankAdmin.pw;
      const owners = AdminDtls.data.getMiFedhaBankAdmin.owner;
      if (ownr !== owners) {
        Alert.alert("This is not your Admin account");
      } else if (AdminPW !== pw1s) {
        Alert.alert("Wrong credentials; access denied");
      } else {
        moveToAdminHm();
      }
    } catch (e) {
      if (e) console.log(e);
      if (e) {
        Alert.alert("Either you dont have Admin Ac or check your internet");
        return;
      }
    }
    setAdminId("");
    setAdminPW("");
  };
  useEffect(() => {
    const admId = AdmnId;
    if (!admId && admId !== "") {
      setAdminId("");
      return;
    }
    setAdminId(admId);
  }, [AdmnId]);
  useEffect(() => {
    const pws = AdminPW;
    if (!pws && pws !== "") {
      setAdminPW("");
      return;
    }
    setAdminPW(pws);
  }, [AdminPW]);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <TouchableOpacity onPress={GoHome} style={styles.goHome}>
            <Text style={styles.goHomeText}>Go Home</Text>
          </TouchableOpacity>
          <View style={styles.card}>
            <Text style={styles.title}>Admin Sign In</Text>
            <Text style={styles.label}>Admin Id</Text>
            <TextInput
              value={AdmnId}
              onChangeText={setAdminId}
              style={styles.input}
              placeholder="Enter Admin Id"
              placeholderTextColor="#b0b0b0"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Password</Text>
            <View style={{ width: '100%', position: 'relative', marginBottom: 16 }}>
              <TextInput
                value={AdminPW}
                onChangeText={setAdminPW}
                style={styles.input}
                placeholder="Enter Password"
                placeholderTextColor="#b0b0b0"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: 12, padding: 4 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={{ color: '#e29d58', fontWeight: 'bold' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={fetchAdmnDts} style={styles.button}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
export default AdminSignIn;

