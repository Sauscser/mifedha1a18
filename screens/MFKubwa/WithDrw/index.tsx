import React, { useEffect, useState } from 'react';
import {  createFloatAdd, createFloatReduction, createSAgentWithdrawals, updateAgent, updateCompany, updateSAgent, updateSMAccount } from '../../../src/graphql/mutations';
import { getAgent, getBankAdmin, getCompany, getSAgent, getSMAccount } from '../../../src/graphql/queries';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const AdminWthdwl = props => {
  const [UsrPWd, setUsrPWd] = useState("");
  const [MFKPhn, setMFKPhn] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { nationality, ratesMap } = useExchange();
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
      const userNationality = accountDtl.data.getSMAccount.nationality;
      const names = accountDtl.data.getSMAccount.name;
      const fetchMFKDtls = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          const MFKDtl: any = await client.graphql({
            query: getSAgent,
            variables: {
              saPhoneContact: MFKPhn
            }
          });
          const saBalances = MFKDtl.data.getSAgent.saBalance;
          const pws = MFKDtl.data.getSAgent.pw;
          const names = MFKDtl.data.getSAgent.name;
          const statussssss = MFKDtl.data.getSAgent.status;
          const bankNames = MFKDtl.data.getSAgent.bankName;
          const bkAcNos = MFKDtl.data.getSAgent.bkAcNo;
          const amountForeign = Number(amount);
          if (!Number.isFinite(amountForeign) || amountForeign <= 0) {
            Alert.alert("Invalid amount", "Enter a valid withdrawal amount");
            setIsLoading(false);
            return;
          }
          const amountKsh = await convertForeignToKsh(amountForeign, userNationality || undefined);
          const CrtMFKWthdrwls = async () => {
            try {
              await client.graphql({
                query: createSAgentWithdrawals,
                variables: {
                  input: {
                    bankAdmnId: "BnkkAdmNatId",
                    saId: MFKPhn,
                    owner: userInfo.userId,
                    amount: String(Math.round(amountKsh)),
                    bankName: bankNames,
                    bkAcNo: bkAcNos,
                    status: 'AccountActive'
                  }
                }
              });
            } catch (error) {
              if (error) {
                Alert.alert("Withdrawal failed", "Please retry or contact support");
                return;
              }
            }
            await UpdateMFK();
            setIsLoading(false);
            Alert.alert("Withdrawal successful", names + ", You have withdrawn " + formatAmountSync(amountKsh, nationality, ratesMap));
          };
          const UpdateMFK = async () => {
            try {
              await client.graphql({
                query: updateSAgent,
                variables: {
                  input: {
                    saPhoneContact: MFKPhn,
                    saBalance: parseFloat(saBalances) - amountKsh
                  }
                }
              });
            } catch (error) {
              console.log(error);
              if (error) {
                Alert.alert("Update failed", "Please check your internet connection");
                return;
              }
            }
            setIsLoading(false);
          };
          if (amountKsh > parseFloat(saBalances)) {
            Alert.alert("Insufficient NSKubwa Balance");
            return;
          } else if (statussssss !== "AccountActive") {
            Alert.alert("NSKubwa Account is inactive");
            return;
          } else if (userInfo.userId !== owners) {
            Alert.alert("Please first create a main NSKubwa account");
            return;
          }
          if (UsrPWd !== pws) {
            Alert.alert("NSKubwa credentials are wrong; access denied");
            return;
          } else {
            await CrtMFKWthdrwls();
          }
        } catch (e) {
          console.log(e);
          if (e) {
            Alert.alert("Error", "Check your internet connection");
            return;
          }
        }
        setIsLoading(false);
      };
      await fetchMFKDtls();
    } catch (e) {
      console.log(e);
      if (e) {
        Alert.alert("Error", "Check your internet connection");
        return;
      }
    }
    setIsLoading(false);
    setAmount("");
    setUsrPWd("");
    setMFKPhn("");
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
    const MFKPhns = MFKPhn;
    if (!MFKPhns && MFKPhns !== "") {
      setMFKPhn("");
      return;
    }
    setMFKPhn(MFKPhns);
  }, [MFKPhn]);
  return <View>
      <View>
        
        <ScrollView>
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>Fill Account Details Below</Text>
          </View>
      

          <View style={styles.sendAmtView}>
            <TextInput placeholder="+2547xxxxxxxx" value={MFKPhn} onChangeText={setMFKPhn} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>NSKubwa Phone</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} value={amount} onChangeText={setAmount} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Amount</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput value={UsrPWd} onChangeText={setUsrPWd} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>NSKubwa PW</Text>
          </View>

          <TouchableOpacity onPress={fetchAcDtls} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>Click to Withdraw</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>;
};
export default AdminWthdwl;