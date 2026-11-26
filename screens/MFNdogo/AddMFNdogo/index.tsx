import React, { useEffect, useState } from 'react';
import { updateSMAccount } from '../../../src/graphql/mutations';
import { getSMAccount } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
import { updateBankAdmin } from '../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const UpdtMFNPW = props => {
  const navigation = useNavigation();
  const [SigntryPW, setSigntryPW] = useState("");
  const [AdminID, setAdminId] = useState("");
  const [LnAcCod, setLnAcCod] = useState("");
  const [NewAdmnPW, setNewAdmnPW] = useState("");
  const [OldAdmnPW, setOldAdmnPW] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fetchMFNDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const MFNDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: AdminID
        }
      });
      const TtlClrdLonsAmtByrCovs = MFNDtls.data.getSMAccount.TtlClrdLonsAmtByrCov;
      await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      await client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: AdminID,
            TtlClrdLonsAmtByrCov: parseFloat(TtlClrdLonsAmtByrCovs) + parseFloat(OldAdmnPW)
          }
        }
      });
      setNewAdmnPW("");
      setSigntryPW("");
      setOldAdmnPW("");
      setAdminId("");
      Alert.alert("NSNdogo creation successfully authorised");
    } catch (error) {
      if (error) {
        console.log(error);
        Alert.alert("Retry or update app or call customer care");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <KeyboardAwareScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={80}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.accent} />
          <Text style={styles.title}>Approve a NiSenti Ndogo</Text>
          <Text style={styles.subtitle}>
            Enter the account email and number of NiSenti Ndogos to approve.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>User email</Text>
            <TextInput
              placeholder="Enter the user email"
              placeholderTextColor="#8AA5AF"
              value={AdminID}
              onChangeText={setAdminId}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Number of NiSenti Ndogos</Text>
            <TextInput
              placeholder="Enter the number to approve"
              placeholderTextColor="#8AA5AF"
              value={OldAdmnPW}
              onChangeText={setOldAdmnPW}
              style={styles.input}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            onPress={fetchMFNDtls}
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading && <ActivityIndicator color="#123B4A" size="small" style={styles.buttonIndicator} />}
            <Text style={styles.buttonText}>{isLoading ? 'Approving...' : 'Approve NiSenti Ndogo'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};
export default UpdtMFNPW;