import React, { useEffect, useState } from 'react';
import { updateCompany, updateGroup, updateMiFedhaBankAdmin, updateSMAccount } from '../../../src/graphql/mutations';
import { getBankAdmin, getCompany, getSMAccount } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
import { updateBankAdmin } from '../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const UpdtMFAdmPW = props => {
  const navigation = useNavigation();
  const [SigntryPW, setSigntryPW] = useState("");
  const [AdminID, setAdminId] = useState("");
  const [LnAcCod, setLnAcCod] = useState("");
  const [NewAdmnPW, setNewAdmnPW] = useState("");
  const [OldAdmnPW, setOldAdmnPW] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fetchAdmnDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const compDtls: any = await client.graphql({
        query: getBankAdmin,
        variables: {
          nationalid: AdminID
        }
      });
      const pws = compDtls.data.getBankAdmin.pw;
      const owners = compDtls.data.getBankAdmin.owner;
      const acStatuss = compDtls.data.getBankAdmin.acStatus;
      const userDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const UserDtls = userDtls.data.getSMAccount;
      const updtAdmnDtls = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          await client.graphql({
            query: updateMiFedhaBankAdmin,
            variables: {
              input: {
                nationalid: AdminID,
                pw: NewAdmnPW
              }
            }
          });
        } catch (error) {
          if (error) {
            Alert.alert("Update unsuccessful; Retry");
            return;
          }
        }
        setIsLoading(false);
        Alert.alert(UserDtls.name + ", You have successfully updated your PassWord");
      };
      if (userInfo.sub !== owners) {
        Alert.alert("You are not the owner of this Admin A/c");
      } else if (acStatuss !== "AccountActive") {
        Alert.alert("This Admin Account is inactive");
      } else {
        updtAdmnDtls();
      }
    } catch (error) {
      if (error) {
        Alert.alert("Check internet; otherwise Chama doesnt exist");
        return;
      }
    }
    setIsLoading(false);
    setNewAdmnPW("");
    setSigntryPW("");
    setOldAdmnPW("");
    setAdminId("");
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
      <View style={styles.card}>
          <View style={styles.accent} />
          <Text style={styles.title}>Update Bank Admin Account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Admin ID</Text>
            <TextInput
              value={AdminID}
              onChangeText={setAdminId}
              style={styles.input}
              placeholder="Enter your admin ID"
              placeholderTextColor="#829DA8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Current password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={OldAdmnPW}
                onChangeText={setOldAdmnPW}
                secureTextEntry={!showCurrentPassword}
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your current password"
                placeholderTextColor="#829DA8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(visible => !visible)}
                style={styles.passwordToggle}
                accessibilityRole="button"
                accessibilityLabel={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                <Text style={styles.passwordToggleText}>{showCurrentPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={NewAdmnPW}
                onChangeText={setNewAdmnPW}
                secureTextEntry={!showNewPassword}
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter a new password"
                placeholderTextColor="#829DA8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(visible => !visible)}
                style={styles.passwordToggle}
                accessibilityRole="button"
                accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                <Text style={styles.passwordToggleText}>{showNewPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={fetchAdmnDtls}
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading && <ActivityIndicator color="#143D4D" size="small" style={{ marginRight: 10 }} />}
            <Text style={styles.buttonText}>{isLoading ? 'Updating...' : 'Update Account'}</Text>
          </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};
export default UpdtMFAdmPW;