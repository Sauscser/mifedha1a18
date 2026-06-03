import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { createTransportBizna } from '../../../src/graphql/mutations';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();

const RegisterTransportBizna = () => {
  const { nationality, ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(nationality);
  const currencySymbol = ratesMap?.[userCurrencyKey]?.symbol || 'KES';

  const [isLoading, setIsLoading] = useState(false);
  const [owner, setOwner] = useState('');
  const [biznaOwnerEmail, setBiznaOwnerEmail] = useState('');

  const [bizAc, setBizAc] = useState('');
  const [transportRate, setTransportRate] = useState('');
  const [transportDesc, setTransportDesc] = useState('');
  const [shareRates, setShareRates] = useState('');
  const [transportName, setTransportName] = useState('');

  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const user = await getCurrentUser();
        const attrs = await fetchUserAttributes();
        setOwner(attrs.sub || user.userId || '');
        setBiznaOwnerEmail(attrs.email || '');
      } catch (error) {
        Alert.alert('Error', 'Unable to load user details. Please try again.');
      }
    };

    loadIdentity();
  }, []);

  const validateForm = () => {
    if (!bizAc.trim()) {
      Alert.alert('Missing Field', 'BizAc is required.');
      return false;
    }
    if (!transportName.trim()) {
      Alert.alert('Missing Field', 'Transport name is required.');
      return false;
    }
    if (!transportDesc.trim()) {
      Alert.alert('Missing Field', 'Transport description is required.');
      return false;
    }
    if (!transportRate.trim() || Number.isNaN(Number(transportRate))) {
      Alert.alert('Invalid Field', 'Transport rate must be a valid number.');
      return false;
    }

    const parsedShareRate = Number(shareRates);
    if (!shareRates.trim() || Number.isNaN(parsedShareRate) || parsedShareRate < 1 || parsedShareRate > 100) {
      Alert.alert('Invalid Field', 'Share rate must be a number between 1 and 100.');
      return false;
    }

    if (!owner || !biznaOwnerEmail) {
      Alert.alert('Missing User Details', 'Owner and email must be available before submitting.');
      return false;
    }

    return true;
  };

  const handleRegisterCompanyTransport = async () => {
    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const createdAt = new Date().toISOString();

      const transportRateKES = userCurrencyKey
        ? await convertForeignToKsh(parseFloat(transportRate), userCurrencyKey)
        : parseFloat(transportRate);

      await client.graphql({
        query: createTransportBizna,
        variables: {
          input: {
            BizAc: bizAc.trim(),
            transportRate: transportRateKES,
            transportdesc: transportDesc.trim(),
            owner,
            createdAt,
            shareRates: String(Number(shareRates)),
            transportName: transportName.trim(),
            biznaOwnerEmail,
            Earnings: 0,
            bizFund: 0,
          },
        },
      });

      Alert.alert('Success', 'Transport company profile registered successfully.');
      setBizAc('');
      setTransportRate('');
      setTransportDesc('');
      setShareRates('');
      setTransportName('');
    } catch (error) {
      console.error('Failed to create TransportBizna:', error);
      Alert.alert('Error', 'Failed to register transport company profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const readOnlyField = (label: string, value: string) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyText}>{value || 'Loading...'}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#e58d29', '#2c5364']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Register Transport Company</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>BizAc</Text>
          <TextInput
            value={bizAc}
            onChangeText={setBizAc}
            style={styles.input}
            placeholder="Enter company Account number"
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Transport Name</Text>
          <TextInput
            value={transportName}
            onChangeText={setTransportName}
            style={styles.input}
            placeholder="Enter transport company name"
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Transport Rate per km ({currencySymbol})</Text>
          <TextInput
            value={transportRate}
            onChangeText={setTransportRate}
            style={styles.input}
            keyboardType="numeric"
            placeholder={`Enter rate in ${currencySymbol}`}
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Transport Description</Text>
          <TextInput
            value={transportDesc}
            onChangeText={setTransportDesc}
            style={[styles.input, styles.multilineInput]}
            multiline
            placeholder="Enter transport description"
            placeholderTextColor="#444"
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Share Rates (1 - 100)</Text>
          <TextInput
            value={shareRates}
            onChangeText={setShareRates}
            style={styles.input}
            keyboardType="numeric"
            maxLength={3}
            placeholder="Enter partner share rate"
            placeholderTextColor="#444"
          />
        </View>

      

        <TouchableOpacity
          onPress={handleRegisterCompanyTransport}
          style={[styles.submitButton, isLoading ? { opacity: 0.7 } : null]}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Registering...' : 'Register Transport Company'}
          </Text>
          {isLoading ? <ActivityIndicator color="#fff" style={{ marginTop: 8 }} /> : null}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: 'bold',
    color: '#222',
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  readOnlyBox: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyText: {
    color: '#222',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#1f7a8c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default RegisterTransportBizna;
