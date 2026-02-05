// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getAgent, getSMAccount, getCompany } from '../../../src/graphql/queries';
import { createFloatAdd, updateAgent, updateSMAccount, updateCompany } from '../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { convertForeignToKsh, formatAmountForUser, formatAmountSync, getUserNationalityByEmail } from '../../../src/utils/exchange';
import { useExchange } from '../../../src/contexts/ExchangeContext';

const client = generateClient();

const UserDepositAtAgentScreen = () => {
  const [agentPhone, setAgentPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { nationality, ratesMap, formatAmount } = useExchange();

  const handleDeposit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      if (!agentPhone) {
        Alert.alert('Agent required', 'Please enter agent phone contact');
        setIsLoading(false);
        return;
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        Alert.alert('Invalid amount', 'Enter a valid deposit amount');
        setIsLoading(false);
        return;
      }

      // Lookup agent
      const agentRes: any = await client.graphql({ query: getAgent, variables: { phonecontact: agentPhone } });
      const agent = agentRes?.data?.getAgent;
      if (!agent) {
        Alert.alert('Agent not found', 'No agent found for the provided phone');
        setIsLoading(false);
        return;
      }

      // Check distance between depositor and agent
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Location required', 'Please allow location to make a deposit at an agent');
        setIsLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const userCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      const agentCoords = { latitude: parseFloat(String(agent.latitude || 0)), longitude: parseFloat(String(agent.longitude || 0)) };

      const dist = getDistance(userCoords, agentCoords); // meters
      if (dist > 300) {
        Alert.alert('Too far', 'You must be within 300m of the agent to make a deposit');
        setIsLoading(false);
        return;
      }

      // Get agent's SM account to find nationality/currency
      const agentEmail = agent.email;
      let agentNat: string | null = null;
      if (agentEmail) {
        const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: agentEmail } });
        agentNat = smRes?.data?.getSMAccount?.nationality || null;
      }

      // Convert deposited amount (in agent currency) to KES
      const amountForeign = Number(amount);
      const amountKsh = await convertForeignToKsh(amountForeign, agentNat || undefined);

      // Create record of deposit (FloatAdd) - store KES value for everything
      await client.graphql({ query: createFloatAdd, variables: { input: {
        withdrawerid: attributes.email,
        agentPhonecontact: agentPhone,
        sagentId: agent.sagentregno || 'None',
        owner: user.userId,
        amount: amountKsh.toFixed(0),
        agentName: agent.name || 'Agent',
        userName: attributes.email,
        saName: agent.sagentregno || 'None',
        saPhone: agent.sagentregno || 'None',
        status: 'AccountActive'
      } } });

      // Update user's SMAccount balance (recorded in KES)
      const accRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: attributes.email } });
      const userAcc = accRes?.data?.getSMAccount;
      const prevBal = parseFloat(userAcc?.balance || '0');
      await client.graphql({ query: updateSMAccount, variables: { input: { awsemail: attributes.email, balance: (prevBal + amountKsh).toFixed(0) } } });

      // Update agent's float balances (record as KES)
      const prevFloat = parseFloat(agent.floatBal || '0');
      const prevTtlFltIn = parseFloat(agent.TtlFltIn || '0');
      await client.graphql({ query: updateAgent, variables: { input: { phonecontact: agentPhone, floatBal: (prevFloat + amountKsh).toFixed(0), TtlFltIn: (prevTtlFltIn + amountKsh).toFixed(0) } } });

      // Optionally update company totals (agentFloatIn)
      try {
        const compRes: any = await client.graphql({ query: getCompany, variables: { AdminId: "BaruchHabaB'ShemAdonai2" } });
        const agentFloatIn = parseFloat(compRes.data.getCompany.agentFloatIn || '0');
        await client.graphql({ query: updateCompany, variables: { input: { AdminId: "BaruchHabaB'ShemAdonai2", agentFloatIn: (agentFloatIn + amountKsh).toFixed(0) } } });
      } catch (e) {
        console.warn('Could not update company float in', e);
      }

      // Notify user with formatted amounts in their preferred nationality
      try {
        const nat = await getUserNationalityByEmail(attributes.email);
        const formatted = await formatAmountForUser(amountKsh, nat || undefined);
        Alert.alert('Deposit successful', `You deposited ${formatted} (KES equivalent) at ${agent.name || 'Agent'}`);
      } catch (e) {
        try {
          const formatted = await formatAmount(amountKsh);
          Alert.alert('Deposit successful', `You deposited ${formatted} (KES equivalent) at ${agent.name || 'Agent'}`);
        } catch (e2) {
          const fallback = formatAmountSync(amountKsh, nationality, ratesMap);
          Alert.alert('Deposit successful', `You deposited ${fallback} (KES equivalent) at ${agent.name || 'Agent'}`);
        }
      }

    } catch (err) {
      console.error(err);
      Alert.alert('Failed', 'Deposit failed. Please retry or contact support');
    } finally {
      setIsLoading(false);
      setAmount('');
      setAgentPhone('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deposit at Agent</Text>
      <TextInput placeholder="Agent Phone (+2547...)" value={agentPhone} onChangeText={setAgentPhone} style={styles.input} />
      <TextInput placeholder="Amount (agent currency)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} />
      <TouchableOpacity onPress={handleDeposit} style={styles.button} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Deposit</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, borderRadius: 6 },
  button: { backgroundColor: '#4caf50', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' }
});

export default UserDepositAtAgentScreen;
