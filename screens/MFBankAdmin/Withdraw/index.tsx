import React, { useEffect, useState } from 'react';
import { createFloatAdd, createFloatReduction, createMFBankWithdrawals, updateAgent, updateCompany, updateSAgent, updateSMAccount } from '../../../src/graphql/mutations';
import { getAgent, getBankAdmin, getCompany, getMiFedhaBankAdmin, getSAgent, getSMAccount } from '../../../src/graphql/queries';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const AdminWthdwl = props => {
  const [UsrPWd, setUsrPWd] = useState("");
  const [BnkkAdmNatId, setBnkkAdmNatId] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fetchAcDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const accountDtl: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const usrBala = accountDtl.data.getSMAccount.balance;
      const usrStts = accountDtl.data.getSMAccount.acStatus;
      const owners = accountDtl.data.getSMAccount.owner;
      const names = accountDtl.data.getSMAccount.name;
      const fetchAdmnDtls = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          const AdmnDtl: any = await client.graphql({
            query: getMiFedhaBankAdmin,
            variables: {
              nationalid: BnkkAdmNatId
            }
          });
          const BankAdmBals = AdmnDtl.data.getMiFedhaBankAdmin.BankAdmBal;
          const pws = AdmnDtl.data.getMiFedhaBankAdmin.pw;
          const names = AdmnDtl.data.getMiFedhaBankAdmin.name;
          const statussssss = AdmnDtl.data.getMiFedhaBankAdmin.status;
          const BankAcNu = AdmnDtl.data.getMiFedhaBankAdmin.BankAcNu;
          const CrtAdmnWthdrwls = async () => {
            try {
              await client.graphql({
                query: createMFBankWithdrawals,
                variables: {
                  input: {
                    bankAdmnId: "NiSenti Agent",
                    bankName: "Aquity",
                    bkAcNo: BankAcNu,
                    owner: userInfo.userId,
                    amount: amount,
                    status: 'AccountActive'
                  }
                }
              });
            } catch (error) {
              if (error) {
                Alert.alert("Withdrawal unsuccessful; Retry");
                return;
              }
            }
            setIsLoading(false);
            Alert.alert(names + ", You have transfer Ksh. " + amount + " to your SM account");
            setIsLoading(false);
          };
          if (parseFloat(amount) > parseFloat(BankAdmBals)) {
            Alert.alert("Insufficient Admin Balance");
            return;
          } else if (usrStts !== "AccountActive") {
            Alert.alert("User Account has been deactivated");
            return;
          } else if (statussssss !== "AccountActive") {
            Alert.alert("Admin Account is inactive");
            return;
          } else if (userInfo.userId !== owners) {
            Alert.alert("You cannot withdraw from another Admin's account");
            return;
          }
          if (UsrPWd !== pws) {
            Alert.alert("Admin credentials are wrong; access denied");
            return;
          } else {
            await CrtAdmnWthdrwls();
          }
        } catch (e) {
          if (e) {
            Alert.alert("Check your internet connection");
            return;
          }
        }
        setIsLoading(false);
      };
      if (userInfo.userId !== owners) {
        Alert.alert("Please first create main account");
      } else {
        await fetchAdmnDtls();
      }
    } catch (e) {
      if (e) {
        Alert.alert("Check your internet connection");
        return;
      }
    }
    setIsLoading(false);
    setAmount("");
    setUsrPWd("");
    setBnkkAdmNatId("");
  };
  useEffect(() => {
    const amt = amount;
    if (!amt && amt !== "") {
      setAmount("");
      return;
    }
    setAmount(amt);
  }, [amount]);
  useEffect(() => {
    const UsrPWdss = UsrPWd;
    if (!UsrPWdss && UsrPWdss !== "") {
      setUsrPWd("");
      return;
    }
    setUsrPWd(UsrPWdss);
  }, [UsrPWd]);
  useEffect(() => {
    const BnkkAdmNatIds = BnkkAdmNatId;
    if (!BnkkAdmNatIds && BnkkAdmNatIds !== "") {
      setBnkkAdmNatId("");
      return;
    }
    setBnkkAdmNatId(BnkkAdmNatIds);
  }, [BnkkAdmNatId]);
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.accent} />
          <Text style={styles.title}>Withdraw Earnings</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Bank Admin ID</Text>
            <TextInput
              value={BnkkAdmNatId}
              onChangeText={setBnkkAdmNatId}
              style={styles.input}
              placeholder="Enter bank admin ID"
              placeholderTextColor="#829DA8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor="#829DA8"
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Main account password</Text>
            <TextInput
              value={UsrPWd}
              onChangeText={setUsrPWd}
              secureTextEntry
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#829DA8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            onPress={fetchAcDtls}
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading && <ActivityIndicator size="small" color="#143D4D" style={{ marginRight: 10 }} />}
            <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Withdraw Earnings'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
export default AdminWthdwl;