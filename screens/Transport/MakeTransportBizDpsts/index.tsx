// @ts-nocheck
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { generateClient } from 'aws-amplify/api';
import {
  createFloatReduction,
  createMessages,
  sendNotification,
  updateAgent,
  updateTransportBizna,
} from '../../../src/graphql/mutations';
import { getAgent, getTransportBizna } from '../../../src/graphql/queries';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();

const MakeTransportBizDpsts = () => {
  const { nationality, ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(nationality);
  const currencySymbol = ratesMap?.[userCurrencyKey]?.symbol || 'KES';

  const [bizAc, setBizAc] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!bizAc.trim()) {
      Alert.alert('Missing Field', 'Transport company account number is required.');
      return false;
    }
    if (!agentPhone.trim()) {
      Alert.alert('Missing Field', 'NSNdogo agent phone is required.');
      return false;
    }
    const parsedAmount = Number(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Deposit amount must be a valid number greater than 0.');
      return false;
    }
    if (!agentPassword.trim()) {
      Alert.alert('Missing Field', 'NSNdogo password is required.');
      return false;
    }
    return true;
  };

  const handleDeposit = async () => {
    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const transportBiznaRes: any = await client.graphql({
        query: getTransportBizna,
        variables: {
          BizAc: bizAc.trim(),
        },
      });
      const transportBizna = transportBiznaRes?.data?.getTransportBizna;
      if (!transportBizna) {
        Alert.alert('No Account', 'No transport company account was found for that BizAc.');
        return;
      }

      const agentRes: any = await client.graphql({
        query: getAgent,
        variables: {
          phonecontact: agentPhone.trim(),
        },
      });
      const agent = agentRes?.data?.getAgent;
      if (!agent) {
        Alert.alert('No Agent Account', 'No NSNdogo agent account was found for that phone number.');
        return;
      }

      if (agent.status === 'AccountInactive') {
        Alert.alert('Inactive Agent', 'This NSNdogo agent account is inactive.');
        return;
      }

      if (agent.pw !== agentPassword.trim()) {
        Alert.alert('Access Denied', 'Wrong NSNdogo password.');
        return;
      }

      const depositForeign = Number(amount);
      const depositKES = userCurrencyKey
        ? await convertForeignToKsh(depositForeign, userCurrencyKey)
        : depositForeign;
      const currentBizFund = Number(transportBizna.bizFund || 0);
      const currentAgentFloat = Number(agent.floatBal || 0);
      const currentAgentTotalFloatOut = Number(agent.TtlFltOut || 0);

      if (currentAgentFloat < depositKES) {
        Alert.alert(
          'Insufficient Float',
          `Agent float is too low for this deposit: ${formatAmountSync(currentAgentFloat, userCurrencyKey, ratesMap)}`,
        );
        return;
      }

      await client.graphql({
        query: createFloatReduction,
        variables: {
          input: {
            depositerid: bizAc.trim(),
            agContact: agentPhone.trim(),
            agentName: agent.name || 'Transport Agent',
            userName: transportBizna.transportName || 'TransportBizna',
            amount: depositKES.toFixed(2),
            status: 'AccountActive',
          },
        },
      });

      await client.graphql({
        query: updateTransportBizna,
        variables: {
          input: {
            BizAc: bizAc.trim(),
            bizFund: Number((currentBizFund + Number(depositKES)).toFixed(2)),
          },
        },
      });

      await client.graphql({
        query: updateAgent,
        variables: {
          input: {
            phonecontact: agentPhone.trim(),
            TtlFltOut: Number((currentAgentTotalFloatOut + Number(depositKES)).toFixed(2)),
            floatBal: Number((currentAgentFloat - Number(depositKES)).toFixed(2)),
          },
        },
      });

      const depositMessage =
        `Confirmed. You have successfully deposited ${formatAmountSync(depositKES, userCurrencyKey, ratesMap)} ` +
        `into ${transportBizna.transportName || 'your transport company'} TransportBizna account. ` +
        'Please confirm this deposit record on your NiSenti app. Thank you. NiSenti';

      try {
        const msgRes = await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: transportBizna.biznaOwnerEmail,
              messageBody: depositMessage,
            },
          },
        });
        if (msgRes?.data?.createMessages) {
          await client.graphql({
            query: sendNotification,
            variables: {
              riderEmail: transportBizna.biznaOwnerEmail ,
              title: 'NiSenti: Transport Deposit Confirmed',
              body: depositMessage,
            },
          });
        }
      } catch (notifErr) {
        console.log('Notification error:', notifErr);
      }

      Alert.alert(
        'Success',
        `${formatAmountSync(depositKES, userCurrencyKey, ratesMap)} deposited into ${transportBizna.transportName || 'transport company'} transport fund.`,
      );
      setBizAc('');
      setAgentPhone('');
      setAmount('');
      setAgentPassword('');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to process transport company deposit.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#e58d29', 'skyblue']} style={styles.gradientBackground}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Deposit Transport BizFund</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Transport BizAc</Text>
          <TextInput
            placeholder="Enter transport company account number"
            value={bizAc}
            onChangeText={setBizAc}
            style={styles.input}
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NSNdogo Agent Phone</Text>
          <TextInput
            placeholder="e.g. +2547xxxxxxxx"
            value={agentPhone}
            onChangeText={setAgentPhone}
            style={styles.input}
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount ({currencySymbol})</Text>
          <TextInput
            placeholder={`Enter amount in ${currencySymbol}`}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NSNdogo Password</Text>
          <TextInput
            placeholder="••••••••"
            secureTextEntry
            value={agentPassword}
            onChangeText={setAgentPassword}
            style={styles.input}
            placeholderTextColor="#444"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleDeposit} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Depositing...' : 'Click to Deposit'}</Text>
          {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

export default MakeTransportBizDpsts;

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 22,
    color: '#ECF0F1',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#ECF0F1',
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#e58d29',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
});
