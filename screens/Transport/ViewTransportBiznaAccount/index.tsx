import React, { useEffect, useState } from 'react';
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
import { fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { listTransportBiznas, listTransportRegisters } from '../../../src/graphql/queries';
import { updateTransportBizna, updateTransportRegister } from '../../../src/graphql/mutations';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();

const ViewTransportBiznaAccount = () => {
  const { nationality, ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(nationality);
  const currencySymbol = ratesMap?.[userCurrencyKey]?.symbol || 'KES';

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [ownerEmail, setOwnerEmail] = useState('');

  // multiple biz accounts
  const [bizList, setBizList] = useState<any[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [transportRateInput, setTransportRateInput] = useState('');
  const [shareRatesInput, setShareRatesInput] = useState('');

  const loadAccount = async () => {
    setLoading(true);
    try {
      const attrs = await fetchUserAttributes();
      const email = attrs.email || '';
      setOwnerEmail(email);

      const response: any = await client.graphql({
        query: listTransportBiznas,
        variables: {
          filter: {
            biznaOwnerEmail: { eq: email },
          },
          limit: 200,
        },
      });

      const items = (response?.data?.listTransportBiznas?.items || []).filter(Boolean);
      setBizList(items);
      // clear selection inputs
      setSelectedBiz(null);
      setTransportRateInput('');
      setShareRatesInput('');
    } catch (error) {
      console.error('Failed to load TransportBizna account:', error);
      Alert.alert('Error', 'Could not load transport company account.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccount();
  }, []);

  const validateInputs = () => {
    const parsedRate = Number(transportRateInput);
    if (!transportRateInput.trim() || Number.isNaN(parsedRate) || parsedRate < 0) {
      Alert.alert('Invalid Transport Rate', 'Transport rate must be a valid number 0 or greater.');
      return null;
    }

    const parsedShareRate = Number(shareRatesInput);
    if (!shareRatesInput.trim() || Number.isNaN(parsedShareRate) || parsedShareRate < 1 || parsedShareRate > 100) {
      Alert.alert('Invalid Share Rate', 'Share rate must be a number between 1 and 100.');
      return null;
    }

    return { parsedRate, parsedShareRate };
  };

  const handleUpdate = async (biz: any) => {
    if (isSaving) return;
    if (!biz || !biz.BizAc) {
      Alert.alert('No Account', 'No transport company account found to update.');
      return;
    }

    const validated = validateInputs();
    if (!validated) return;

    setIsSaving(true);
    try {
      const transportRateKES = userCurrencyKey
        ? await convertForeignToKsh(validated.parsedRate, userCurrencyKey)
        : validated.parsedRate;

      await client.graphql({
        query: updateTransportBizna,
        variables: {
          input: {
            BizAc: biz.BizAc,
            transportRate: transportRateKES,
            shareRates: String(validated.parsedShareRate),
          },
        },
      });

      // Also update all TransportRegister records that belong to this TransportBizna
      try {
        let nextToken = undefined;
        do {
          // eslint-disable-next-line no-await-in-loop
          const listResp: any = await client.graphql({
            query: listTransportRegisters,
            variables: {
              filter: { transportOwnerAc: { eq: biz.BizAc } },
              limit: 100,
              nextToken,
            },
          });

          const items = listResp?.data?.listTransportRegisters?.items || [];
          nextToken = listResp?.data?.listTransportRegisters?.nextToken;

          for (const reg of items) {
            if (!reg?.id) continue;
            try {
              // eslint-disable-next-line no-await-in-loop
              await client.graphql({
                query: updateTransportRegister,
                variables: { input: { id: reg.id, transportRate: transportRateKES } },
              });
            } catch (err) {
              console.error('Failed to update TransportRegister', reg.id, err);
            }
          }
        } while (nextToken);
      } catch (err) {
        console.error('Failed to list/update TransportRegister records for BizAc', biz.BizAc, err);
      }

      // refresh list and close modal
      await loadAccount();
      setModalVisible(false);
      Alert.alert('Success', 'Transport rate and share rates updated successfully.');
    } catch (error) {
      console.error('Failed to update TransportBizna account:', error);
      Alert.alert('Error', 'Could not update transport company account.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#e58d29', '#2c5364']} style={styles.centeredRoot}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading transport company account...</Text>
      </LinearGradient>
    );
  }

  if (!bizList || bizList.length === 0) {
    return (
      <LinearGradient colors={['#e58d29', '#2c5364']} style={styles.centeredRoot}>
        <Text style={styles.noAccountTitle}>No Transport Company Account</Text>
        <Text style={styles.noAccountText}>
          We could not find any TransportBizna profiles under {ownerEmail || 'your account'}.
        </Text>
        <TouchableOpacity onPress={loadAccount} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#e58d29', '#2c5364']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>View Transport Company Account</Text>

        {bizList.map((biz) => {
          const rate = Number(biz.transportRate || 0);
          const share = String(biz.shareRates || '');
          return (
            <View key={biz.BizAc} style={[styles.readOnlyCard, { marginBottom: 12 }]}>
              <Text style={styles.readOnlyLabel}>BizAc</Text>
              <Text style={styles.readOnlyValue}>{biz.BizAc}</Text>

              <Text style={styles.readOnlyLabel}>Transport Name</Text>
              <Text style={styles.readOnlyValue}>{biz.transportName || 'N/A'}</Text>

              <Text style={styles.readOnlyLabel}>Owner Email</Text>
              <Text style={styles.readOnlyValue}>{biz.biznaOwnerEmail || ownerEmail || 'N/A'}</Text>

              <Text style={styles.readOnlyLabel}>Current Transport Rate</Text>
              <Text style={styles.readOnlyValue}>{formatAmountSync(rate, userCurrencyKey, ratesMap)}</Text>

              <Text style={styles.readOnlyLabel}>Current Share Rates</Text>
              <Text style={styles.readOnlyValue}>{share || 'N/A'}</Text>

              <TouchableOpacity
                onPress={() => {
                  setSelectedBiz(biz);
                  setTransportRateInput(String(biz.transportRate || 0));
                  setShareRatesInput(String(biz.shareRates || ''));
                  setModalVisible(true);
                }}
                style={[styles.updateButton, { marginTop: 10 }]}
                disabled={isSaving}
              >
                <Text style={styles.updateButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Inline modal for editing selected biz */}
        {modalVisible && selectedBiz ? (
          <View style={{ marginTop: 12 }}>
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>New Transport Rate per km ({currencySymbol})</Text>
              <TextInput
                value={transportRateInput}
                onChangeText={setTransportRateInput}
                keyboardType="numeric"
                style={styles.input}
                placeholder={`Enter rate in ${currencySymbol}`}
                placeholderTextColor="#444"
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>New Share Rates (1 - 100)</Text>
              <TextInput
                value={shareRatesInput}
                onChangeText={setShareRatesInput}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Enter share rates"
                placeholderTextColor="#444"
                maxLength={3}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.retryButton, { flex: 0.45 }]}
                disabled={isSaving}
              >
                <Text style={styles.retryButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleUpdate(selectedBiz)}
                style={[styles.updateButton, { flex: 0.52, alignItems: 'center' }]}
                disabled={isSaving}
              >
                <Text style={styles.updateButtonText}>{isSaving ? 'Updating...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centeredRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 15,
  },
  noAccountTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  noAccountText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1f7a8c',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  readOnlyCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  readOnlyLabel: {
    color: '#444',
    fontWeight: '700',
    marginTop: 6,
  },
  readOnlyValue: {
    color: '#222',
    fontWeight: '600',
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
  updateButton: {
    marginTop: 8,
    backgroundColor: '#1f7a8c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ViewTransportBiznaAccount;
