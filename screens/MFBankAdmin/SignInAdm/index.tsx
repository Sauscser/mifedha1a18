import React, { useEffect, useState } from 'react';
import { createCompany } from '../../../src/graphql/mutations';
import { getBankAdmin, getCompany, getMiFedhaBankAdmin } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import MFBankAdmin from "../../../screens/MFBankAdmin";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';

const client = generateClient();
const AdminSignIn = props => {
  const navigation = useNavigation();
  const [AdmnId, setAdminId] = useState("");
  const [AdminPW, setAdminPW] = useState("");
  const [ownr, setownr] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
 
  
  const moveToAdminHm = () => {
  safeNavigateFrom(navigation, 'MFBankAdmin');
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
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
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
    } finally {
      setIsSigningIn(false);
    }
  };
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={24}
      keyboardShouldPersistTaps="handled"
    >
        <View style={[styles.container, { minHeight: '100%', paddingVertical: 24 }]}>
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
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
            />
            <Text style={styles.label}>Password</Text>
            <View style={{ width: '100%', position: 'relative', marginBottom: 16 }}>
              <TextInput
                value={AdminPW}
                onChangeText={setAdminPW}
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter Password"
                placeholderTextColor="#b0b0b0"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
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
            <TouchableOpacity
              onPress={fetchAdmnDts}
              style={[styles.button, isSigningIn && styles.buttonDisabled]}
              disabled={isSigningIn}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ busy: isSigningIn, disabled: isSigningIn }}
            >
              {isSigningIn && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />}
              <Text style={styles.buttonText}>{isSigningIn ? 'Signing In...' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>
        </View>
    </KeyboardAwareScrollView>
  );
};
export default AdminSignIn;
