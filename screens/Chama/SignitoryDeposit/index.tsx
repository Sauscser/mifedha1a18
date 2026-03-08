// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { createFloatReduction, updateAgent, updateCompany, updateGroup } from '../../../src/graphql/mutations';
import { getAgent, getCompany, getGroup, getSMAccount } from '../../../src/graphql/queries';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import styles from './styles';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();
const SMADepositForm = props => {
  const [nationalId, setNationalid] = useState("");
  const [agPWd, setAgPWd] = useState("");
  const [AgentPhn, setAgentPhn] = useState("");
  const [amount, setAmount] = useState("");
  const [UsrId, setUsrId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ownr, setownr] = useState(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  
  const { ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(userNationality);

  // Parse amount input
  const parseAmountInput = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Handle money input with 2-decimal enforcement
  const handleMoneyInput = (setter: (value: string) => void) => (value: string) => {
    if (/^\d*(\.\d{0,2})?$/.test(value) || value === '') {
      setter(value);
    }
  };

  // Format to exactly 2 decimals on blur
  const formatMoneyOnBlur = (value: string, setter: (value: string) => void) => {
    const num = parseAmountInput(value);
    if (num > 0) {
      setter(num.toFixed(2));
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setownr(user.userId);
      
      try {
        const attributes = await fetchUserAttributes();
        const userData = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: attributes.email },
        });
        setUserNationality(userData.data.getSMAccount.nationality);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUser();
  }, []);
  const fetchAcDtls = async () => {
    if (isLoading) return;
    
    // Convert amount to KES
    const amountForeign = parseAmountInput(amount);
    const amountInKES = convertForeignToKsh(amountForeign, userCurrencyKey, ratesMap);

    // Confirmation prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Deposit',
        `You are about to deposit ${formatAmountSync(amountInKES, userCurrencyKey, ratesMap)} to the chama account. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Deposit', onPress: () => resolve(true) }
        ]
      );
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const ChamaDtl: any = await client.graphql({
        query: getGroup,
        variables: {
          grpContact: nationalId
        }
      });
      const {
        grpBal,
        ttlDpst,
        status,
        grpName,
        SignitoryNatid
      } = ChamaDtl.data.getGroup;
      const AgentBal: any = await client.graphql({
        query: getAgent,
        variables: {
          phonecontact: AgentPhn
        }
      });
      const {
        TtlFltOut,
        floatBal,
        pw,
        name,
        status: AgStatus
      } = AgentBal.data.getAgent;
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const {
        ttlUsrDep,
        agentFloatOut
      } = compDtls.data.getCompany;

      // Validation checks
      if (status === "AccountInactive") {
        Alert.alert("User Account is inactive");
      } else if (SignitoryNatid !== UsrId) {
        Alert.alert("Depositer ID is wrong");
      } else if (AgStatus === "AccountInactive") {
        Alert.alert("NSNdogo Account is Inactive");
      } else if (parseFloat(floatBal) < amountInKES) {
        Alert.alert(`Insufficient NSNdogo Balance: ${formatAmountSync(parseFloat(floatBal), userCurrencyKey, ratesMap)}`);
      } else if (pw !== agPWd) {
        Alert.alert("NSNdogo access denied");
      } else {
        // Create Float Reduction
        await client.graphql({
          query: createFloatReduction,
          variables: {
            input: {
              depositerid: nationalId,
              agContact: AgentPhn,
              agentName: name,
              userName: grpName,
              amount: amountInKES.toFixed(0),
              status: 'AccountActive'
            }
          }
        });

        // Update Group
        await client.graphql({
          query: updateGroup,
          variables: {
            input: {
              grpContact: nationalId,
              grpBal: (parseFloat(grpBal) + amountInKES).toFixed(0),
              ttlDpst: (parseFloat(ttlDpst) + amountInKES).toFixed(0)
            }
          }
        });

        // Update Agent
        await client.graphql({
          query: updateAgent,
          variables: {
            input: {
              phonecontact: AgentPhn,
              TtlFltOut: (parseFloat(TtlFltOut) + amountInKES).toFixed(0),
              floatBal: (parseFloat(floatBal) - amountInKES).toFixed(0)
            }
          }
        });

        // Update Company
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "BaruchHabaB'ShemAdonai2",
              ttlUsrDep: parseFloat(ttlUsrDep) + amountInKES,
              agentFloatOut: parseFloat(agentFloatOut) + amountInKES
            }
          }
        });
        
        Alert.alert(`${formatAmountSync(amountInKES, userCurrencyKey, ratesMap)} deposited in ${grpName}'s account`);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error! Please check your internet connection or retry.");
    } finally {
      setIsLoading(false);
      setNationalid("");
      setAmount("");
      setAgPWd("");
      setAgentPhn("");
      setUsrId("");
    }
  };
  useEffect(() => {
    const UsrIds = UsrId;
    if (!UsrIds && UsrIds !== "") {
      setUsrId("");
      return;
    }
    setUsrId(UsrIds);
  }, [UsrId]);
  useEffect(() => {
    const usId = nationalId;
    if (!usId && usId !== "") {
      setNationalid("");
      return;
    }
    setNationalid(usId);
  }, [nationalId]);
  useEffect(() => {
    const amt = amount;
    if (!amt && amt !== "") {
      setAmount("");
      return;
    }
    setAmount(amt);
  }, [amount]);
  useEffect(() => {
    const pws = agPWd;
    if (!pws && pws !== "") {
      setAgPWd("");
      return;
    }
    setAgPWd(pws);
  }, [agPWd]);
  useEffect(() => {
    const agphn = AgentPhn;
    if (!agphn && agphn !== "") {
      setAgentPhn("");
      return;
    }
    setAgentPhn(agphn);
  }, [AgentPhn]);
  return <View>
      <View>
        
        <ScrollView>
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>Fill Account Details Below</Text>
          </View>

         

          <View style={styles.sendAmtView}>
            <TextInput placeholder="+2547xxxxxxxx" value={nationalId} onChangeText={setNationalid} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Chama Phone Number</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput value={UsrId} onChangeText={setUsrId} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Signatory ID</Text>
          </View>

         

          <View style={styles.sendAmtView}>
            <TextInput placeholder="+2547xxxxxxxx" value={AgentPhn} onChangeText={setAgentPhn} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>NSNdogo Phone</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} value={amount} onChangeText={handleMoneyInput(setAmount)} onBlur={() => formatMoneyOnBlur(amount, setAmount)} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Amount</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput value={agPWd} onChangeText={setAgPWd} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>NSNdogo PassWord</Text>
          </View>

          <TouchableOpacity onPress={fetchAcDtls} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>Click to Deposit</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>;
};
export default SMADepositForm;