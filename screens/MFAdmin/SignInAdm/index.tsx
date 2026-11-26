import React, { useEffect, useState } from 'react';
import { createCompany } from '../../../src/graphql/mutations';
import { getBankAdmin, getCompany } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
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
    safeNavigateFrom(navigation, 'MFAdminstrator');
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
      const AdminDtls: any = await client.graphql({
        query: getBankAdmin,
        variables: {
          nationalid: AdmnId
        }
      });
      const pw1s = AdminDtls.data.getBankAdmin.pw;
      const owners = AdminDtls.data.getBankAdmin.owner;
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
    } finally {
      setIsSigningIn(false);
    }
    setAdminId("");
    setAdminPW("");
  };
  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={90}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={GoHome} style={styles.homeButton} activeOpacity={0.75}>
        <Text style={styles.homeButtonText}>Go Home</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Admin sign in</Text>

      <View style={styles.card}>
        <View style={styles.accent} />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Admin ID</Text>
          <TextInput
            value={AdmnId}
            onChangeText={setAdminId}
            style={styles.input}
            placeholder="Enter your admin ID"
            placeholderTextColor="#8AA5AF"
            autoCapitalize="none"
            accessibilityLabel="Admin ID"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              value={AdminPW}
              onChangeText={setAdminPW}
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput]}
              placeholder="Enter your password"
              placeholderTextColor="#8AA5AF"
              autoCapitalize="none"
              accessibilityLabel="Password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(value => !value)}
              style={styles.passwordToggle}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={fetchAdmnDts}
          style={[styles.signInButton, isSigningIn && styles.signInButtonDisabled]}
          disabled={isSigningIn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ busy: isSigningIn, disabled: isSigningIn }}
        >
          {isSigningIn && <ActivityIndicator size="small" color="#123B4A" style={styles.signInIndicator} />}
          <Text style={styles.signInButtonText}>{isSigningIn ? 'Signing in...' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Authorized administrators only</Text>
    </KeyboardAwareScrollView>
  );
};
export default AdminSignIn;