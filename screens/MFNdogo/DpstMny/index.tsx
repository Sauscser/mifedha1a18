// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getAgent, getGroup, getSMAccount, getCompany, getSAgent } from '../../../src/graphql/queries';
import { createFloatAdd, updateAgent, updateGroup, updateSMAccount, updateCompany } from '../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { convertForeignToKsh, formatAmountForUser, formatAmountSync, getUserNationalityByEmail } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { useExchange } from '../../../src/contexts/ExchangeContext';

const client = generateClient();

const UserDepositAtAgentScreen = () => {
  const [agentPhone, setAgentPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { nationality, ratesMap, formatAmount } = useExchange();
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const userCurrencyKey = nationalityToCode(safeNationality || '') || safeNationality || undefined;
  const currencySymbol = userCurrencyKey && ratesMap?.[userCurrencyKey]?.symbol ? String(ratesMap[userCurrencyKey].symbol) : '';

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

      // Convert deposited amount (in agent currency) to the backend CHF-based amount
      const amountForeign = Number(amount);
      const resolvedCurrencyKey = userCurrencyKey || nationalityToCode(agentNat || '') || agentNat || undefined;
      let amountKsh = amountForeign;
      if (resolvedCurrencyKey) {
        const rateForCurrency = ratesMap?.[resolvedCurrencyKey];
        if (rateForCurrency?.sellingPrice && Number(rateForCurrency.sellingPrice) > 0) {
          amountKsh = amountForeign / parseFloat(String(rateForCurrency.sellingPrice));
        } else {
          amountKsh = await convertForeignToKsh(amountForeign, resolvedCurrencyKey);
        }
      } else {
        amountKsh = await convertForeignToKsh(amountForeign, agentNat || undefined);
      }

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
      const agentGroupFloatStatus = String(agent.groupFloatStatus || '').toUpperCase();
      const prevAgentGroupFloatAmount = parseFloat(agent.groupFloatAmount || '0');
      let groupFallbackUsed = 0;
      if (agentGroupFloatStatus === 'YES' && prevAgentGroupFloatAmount > 0 && prevFloat < amountKsh) {
        try {
          const sAgentRes: any = await client.graphql({ query: getSAgent, variables: { saPhoneContact: agent.sagentregno } });
          const linkedSAgent = sAgentRes?.data?.getSAgent;
          if (linkedSAgent?.bkAcNo) {
            const groupRes: any = await client.graphql({ query: getGroup, variables: { grpContact: linkedSAgent.bkAcNo } });
            const linkedGroup = groupRes?.data?.getGroup;
            const groupBalance = parseFloat(linkedGroup?.grpBal || '0');
            const groupFloatLoan = parseFloat(linkedGroup?.groupFloatLoan || '0');
            const shortfall = amountKsh - prevFloat;
            const fallbackAmount = Math.min(prevAgentGroupFloatAmount, Math.max(0, shortfall));
            if (linkedGroup && fallbackAmount > 0 && groupBalance >= fallbackAmount) {
              groupFallbackUsed = fallbackAmount;
              const nextGroupBalance = groupBalance - fallbackAmount;
              const nextGroupFloatLoan = groupFloatLoan + fallbackAmount;
              await client.graphql({ query: updateGroup, variables: { input: { grpContact: linkedGroup.grpContact, grpBal: nextGroupBalance, groupFloatLoan: nextGroupFloatLoan } } });
            }
          }
        } catch (error) {
          console.warn('Could not apply linked group float fallback', error);
        }
      }
      const nextAgentGroupFloatAmount = Math.max(0, prevAgentGroupFloatAmount - groupFallbackUsed);
      await client.graphql({ query: updateAgent, variables: { input: { phonecontact: agentPhone, floatBal: (prevFloat + amountKsh).toFixed(0), TtlFltIn: (prevTtlFltIn + amountKsh).toFixed(0), groupFloatAmount: nextAgentGroupFloatAmount, groupFloatStatus: nextAgentGroupFloatAmount > 0 ? 'YES' : 'NO' } } });

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
        const fallbackMessage = groupFallbackUsed > 0
          ? ` The linked group covered ${await formatAmountForUser(groupFallbackUsed, nat || undefined)} of the shortfall.`
          : '';
        Alert.alert('Deposit successful', `You deposited ${formatted} (KES equivalent) at ${agent.name || 'Agent'}.${fallbackMessage}`);
      } catch (e) {
        try {
          const formatted = await formatAmount(amountKsh);
          const fallbackMessage = groupFallbackUsed > 0
            ? ` The linked group covered ${formatAmountSync(groupFallbackUsed, nationality, ratesMap)} of the shortfall.`
            : '';
          Alert.alert('Deposit successful', `You deposited ${formatted} (KES equivalent) at ${agent.name || 'Agent'}.${fallbackMessage}`);
        } catch (e2) {
          const fallback = formatAmountSync(amountKsh, nationality, ratesMap);
          const fallbackMessage = groupFallbackUsed > 0
            ? ` The linked group covered ${formatAmountSync(groupFallbackUsed, nationality, ratesMap)} of the shortfall.`
            : '';
          Alert.alert('Deposit successful', `You deposited ${fallback} (KES equivalent) at ${agent.name || 'Agent'}.${fallbackMessage}`);
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
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Deposit at Agent</Text>
          <TextInput placeholder="Agent Phone (+2547...)" value={agentPhone} onChangeText={setAgentPhone} style={styles.input} />
          <View style={styles.amountInputContainer}>
            {currencySymbol ? <Text style={styles.amountPrefix}>{currencySymbol}</Text> : null}
            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>
          <TouchableOpacity onPress={handleDeposit} style={styles.button} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Deposit</Text>}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: '#f7f7f7' },
  container: { padding: 12, flexGrow: 1, paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, borderRadius: 6 },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8
  },
  amountPrefix: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginRight: 8 },
  amountInput: { flex: 1, paddingVertical: 8, fontSize: 16 },
  button: { backgroundColor: '#4caf50', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' }
});

export default UserDepositAtAgentScreen;
