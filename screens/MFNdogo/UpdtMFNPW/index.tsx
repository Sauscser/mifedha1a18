import React, { useState } from 'react';
import { updateAgent } from '../../../src/graphql/mutations';
import { getAgent, getSMAccount } from '../../../src/graphql/queries';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const UpdtMFNPW = props => {
  const [AdminID, setAdminId] = useState("");
  const [NewAdmnPW, setNewAdmnPW] = useState("");
  const [OldAdmnPW, setOldAdmnPW] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fetchMFNDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const MFNDtls: any = await client.graphql({
        query: getAgent,
        variables: {
          phonecontact: AdminID
        }
      });
      const pws = MFNDtls.data.getAgent.pw;
      const owners = MFNDtls.data.getAgent.owner;
      const acStatuss = MFNDtls.data.getAgent.status;
      const userDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const UserDtls = userDtls.data.getSMAccount;
      if (pws !== OldAdmnPW) {
        Alert.alert("Wrong Old Password; call HR");
      } else if (userInfo.sub !== owners) {
        Alert.alert("You are not the owner of this NSNdogo A/c");
      } else if (acStatuss !== "AccountActive") {
        Alert.alert("This NSNdogo Account is inactive");
      } else {
        try {
          await client.graphql({
            query: updateAgent,
            variables: {
              input: {
                phonecontact: AdminID,
                pw: NewAdmnPW
              }
            }
          });
        } catch (error) {
          console.log(error);
          Alert.alert("Update unsuccessful; Retry");
          return;
        }
        Alert.alert(UserDtls.name + ", You have successfully updated your PassWord");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Retry or update app or call customer care");
    } finally {
      setIsLoading(false);
      setNewAdmnPW("");
      setOldAdmnPW("");
      setAdminId("");
    }
  };
  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={48}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.accent} />
        <Text style={styles.title}>Update NiSenti Ndogo Account</Text>
        <Text style={styles.subtitle}>Verify your account and enter a new password.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>NSNdogo Phone</Text>
          <TextInput
            placeholder="+2547xxxxxxxx"
            placeholderTextColor="#829DA8"
            value={AdminID}
            onChangeText={setAdminId}
            style={styles.input}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Current password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              value={OldAdmnPW}
              onChangeText={setOldAdmnPW}
              secureTextEntry={!showOldPassword}
              style={[styles.input, styles.passwordInput]}
              placeholder="Enter your current password"
              placeholderTextColor="#829DA8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowOldPassword(visible => !visible)}
              style={styles.passwordToggle}
              accessibilityRole="button"
              accessibilityLabel={showOldPassword ? 'Hide current password' : 'Show current password'}
            >
              <Text style={styles.passwordToggleText}>{showOldPassword ? 'Hide' : 'Show'}</Text>
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
          onPress={fetchMFNDtls}
          style={[styles.button, isLoading && styles.buttonDisabled]}
          disabled={isLoading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ busy: isLoading, disabled: isLoading }}
        >
          {isLoading && <ActivityIndicator color="#143D4D" size="small" style={styles.buttonIndicator} />}
          <Text style={styles.buttonText}>{isLoading ? 'Updating...' : 'Update Account'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};
export default UpdtMFNPW;