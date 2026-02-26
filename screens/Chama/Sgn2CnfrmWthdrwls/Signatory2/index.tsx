import React, { useEffect, useState } from 'react';
import { createFloatAdd, updateAgent, updateCompany, updateGroup, updateSAgent, updateSMAccount } from '../../../../src/graphql/mutations';
import { getAgent, getCompany, getGroup, getSAgent, getSMAccount } from '../../../../src/graphql/queries';
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import styles from './styles';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';

const client = generateClient();
const SMADepositForm = props => {
  const [UsrPWd, setUsrPWd] = useState("");
  const [AgentPhn, setAgentPhn] = useState("");
  const [grpKntct, setgrpKntct] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    const fetchUserData = async () => {
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
    fetchUserData();
  }, []);
  const fetchAcDtls = async () => {
    if (isLoading) return;
    
    // Convert amount to KES
    const amountForeign = parseAmountInput(amount);
    const amountInKES = convertForeignToKsh(amountForeign, userCurrencyKey, ratesMap);

    // Confirmation prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Withdrawal',
        `You are confirming withdrawal of ${formatAmountSync(amountInKES, userCurrencyKey, ratesMap)}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirm', onPress: () => resolve(true) }
        ]
      );
    });

    if (!confirmed) return;

    setIsLoading(true);
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const accountDtl: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const pws = accountDtl.data.getSMAccount.pw;
      const owner = accountDtl.data.getSMAccount.owner;
      const fetchChamaDtls = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
          const ChmAcDtl: any = await client.graphql({
            query: getGroup,
            variables: {
              grpContact: grpKntct
            }
          });
          const owners = ChmAcDtl.data.getGroup.Signatory3Email;
          const WithdrawCnfrmtn = ChmAcDtl.data.getGroup.WithdrawCnfrmtn;
          const WithdrawCnfrmtnAmt = ChmAcDtl.data.getGroup.WithdrawCnfrmtnAmt;
          const onChamaAc = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
              await client.graphql({
                query: updateGroup,
                variables: {
                  input: {
                    grpContact: grpKntct,
                    WithdrawCnfrmtn2: "YES",
                    WithdrawCnfrmtnAmt: amountInKES.toFixed(0)
                  }
                }
              });
            } catch (error) {
              console.log(error);
              Alert.alert("Check internet Connection");
              return;
            }
            setIsLoading(false);
            Alert.alert("Chama Withdrawal confirmed");
          };
          if (attributes.email !== owners) {
            Alert.alert("Not authorised to confirm chama withdrawal");
            return;
          } else if (WithdrawCnfrmtn === "NO") {
            Alert.alert("Let the second signatory first confirm");
            return;
          } else if (WithdrawCnfrmtnAmt !== amountInKES.toFixed(0)) {
            Alert.alert(`Enter amount agreed with the other signatory. Expected: ${formatAmountSync(parseFloat(WithdrawCnfrmtnAmt), userCurrencyKey, ratesMap)}`);
            return;
          } else if (UsrPWd !== pws) {
            Alert.alert("User credentials are wrong; access denied");
            return;
          } else {
            await onChamaAc();
          }
        } catch (error) {
          console.log(error);
          Alert.alert("Check your internet connection");
          return;
        } finally {
          setIsLoading(false);
        }
      };
      if (user.userId !== owner) {
        Alert.alert("Please first create main account");
      } else {
        await fetchChamaDtls();
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Check your internet connection");
      return;
    } finally {
      setIsLoading(false);
      setAmount("");
      setUsrPWd("");
      setgrpKntct("");
    }
  };
  return <ScrollView>
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>Fill Details Below</Text>
          </View>
      

          <View style={styles.sendAmtView}>
            <TextInput value={grpKntct} onChangeText={setgrpKntct} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Chama Account</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType="decimal-pad" value={amount} onChangeText={handleMoneyInput(setAmount)} onBlur={() => formatMoneyOnBlur(amount, setAmount)} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Amount</Text>
          </View>

          

          <View style={styles.sendAmtView}>
            <TextInput value={UsrPWd} onChangeText={setUsrPWd} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Signitory 3 User PW</Text>
          </View>

          <TouchableOpacity onPress={fetchAcDtls} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>Click to confirm Withdraw</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>
        </ScrollView>;
};
export default SMADepositForm;