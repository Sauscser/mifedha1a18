import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { translations } from './translation';
import { listBiznas, listPartialPays, listPartialPayContributions, getBizna, getSMAccount, getCompany } from '../../../src/graphql/queries';
import { updateBizna, updateSMAccount, updatePartialPay } from '../../../src/graphql/mutations';
import { styles } from './styles';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();
const SELECTED_BIZNA_STORAGE_KEY = 'sellerPartialPaySelectedBizna';

type BiznaOption = {
  id?: string;
  BusKntct?: string;
  busName?: string;
  name?: string;
};

const SellerPartialPayRecords = () => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = { ...translations.en, ...(translations[lang] || {}) };
  const { nationality, ratesMap } = useExchange();
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const natCode = nationalityToCode(safeNationality);

  const [biznas, setBiznas] = useState<BiznaOption[]>([]);
  const [selectedBizna, setSelectedBizna] = useState<BiznaOption | null>(null);
  const [loadingBiznas, setLoadingBiznas] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [buyerNameFilter, setBuyerNameFilter] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);

  const fetchBiznas = useCallback(async () => {
    setLoadingBiznas(true);
    try {
      const attrs = await fetchUserAttributes();
      const email = attrs?.email || '';
      const res: any = await client.graphql({ query: listBiznas });
      const allBiznas = res?.data?.listBiznas?.items || [];
      const adminBiznas = allBiznas.filter((biz: any) => {
        for (let i = 1; i <= 50; ++i) {
          const adminVal = biz?.[`Admin${i}`];
          if (adminVal && adminVal !== 'None' && adminVal.toLowerCase().trim() === email.toLowerCase().trim()) {
            return true;
          }
        }
        return false;
      });
      setBiznas(adminBiznas);
      if (adminBiznas.length === 0) {
        setSelectedBizna(null);
        return;
      }

      const persistedBizKey = await AsyncStorage.getItem(SELECTED_BIZNA_STORAGE_KEY);
      const saved = adminBiznas.find((biz: any) => (biz.BusKntct || biz.id) === persistedBizKey);
      if (saved) {
        setSelectedBizna(saved);
      } else {
        setSelectedBizna(adminBiznas[0]);
      }
    } catch (e) {
      console.error('Failed to load business list', e);
    } finally {
      setLoadingBiznas(false);
    }
  }, []);

  useEffect(() => {
    fetchBiznas();
  }, [fetchBiznas]);

  useEffect(() => {
    if (selectedBizna?.BusKntct || selectedBizna?.id) {
      AsyncStorage.setItem(SELECTED_BIZNA_STORAGE_KEY, selectedBizna.BusKntct || selectedBizna.id || '');
    }
  }, [selectedBizna?.BusKntct, selectedBizna?.id]);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res: any = await client.graphql({ query: getCompany, variables: { AdminId: "BaruchHabaB'ShemAdonai2" } });
        setCompany(res?.data?.getCompany || null);
      } catch (e) {
        console.error('Failed to fetch company fee info', e);
      }
    };
    fetchCompany();
  }, []);

  const loadRecords = useCallback(async () => {
    if (!selectedBizna?.BusKntct) return;
    setLoadingRecords(true);
    try {
      const res: any = await client.graphql({
        query: listPartialPays,
        variables: {
          filter: {
            and: [
              { sellerAccount: { eq: selectedBizna.BusKntct } },
              {
                or: [
                  { saleStatus: { eq: 'Active' } },
                  { saleStatus: { eq: 'Complete' } },
                  { saleStatus: { eq: 'Completed' } },
                  { saleStatus: { eq: 'Inactive' } }
                ]
              }
            ]
          },
          limit: 100,
          nextToken: null
        }
      });
      const items = res?.data?.listPartialPays?.items || [];
      const sorted = [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setRecords(sorted);
    } catch (e) {
      console.error('Failed to load seller partial pay records', e);
      Alert.alert(t.error, t.failedToLoad);
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedBizna?.BusKntct, t.error, t.failedToLoad]);

  useEffect(() => {
    if (selectedBizna?.BusKntct) {
      loadRecords();
    }
  }, [selectedBizna?.BusKntct, loadRecords]);

  const visibleRecords = useMemo(() => {
    const needle = buyerNameFilter.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => {
      const buyerName = String(record?.buyerName || '').toLowerCase();
      return buyerName.includes(needle);
    });
  }, [buyerNameFilter, records]);

  const openHistory = async (entry: any) => {
    setSelectedEntry(entry);
    setTransactionsLoading(true);
    setShowHistoryModal(true);
    try {
      if (!entry?.id) {
        setTransactions([]);
        return;
      }

      const res: any = await client.graphql({
        query: listPartialPayContributions,
        variables: {
          limit: 200,
          nextToken: null
        }
      });
      const items = res?.data?.listPartialPayContributions?.items || [];
      const matchingItems = items.filter((item: any) => String(item?.saleStatus || '') === String(entry.id));
      setTransactions(matchingItems);
    } catch (e) {
      console.error('Failed to load partial pay transactions', e);
      Alert.alert(t.error, t.failedToLoadTransactions);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleRevoke = async (entry: any) => {
    if (!entry) return;
    Alert.alert(t.confirmRevokeTitle, t.confirmRevokeMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.revoke,
        style: 'destructive',
        onPress: async () => {
          try {
            const amountPaid = Number(entry.amountPaid || 0);
            if (amountPaid <= 0) {
              Alert.alert(t.error, 'Nothing to refund.');
              return;
            }

            if (entry.buyerType === 'Biz') {
              const buyerRes: any = await client.graphql({
                query: getBizna,
                variables: { BusKntct: entry.buyerAccount }
              });
              const buyerBiz = buyerRes?.data?.getBizna;
              if (!buyerBiz) {
                throw new Error('Buyer business not found');
              }
              await client.graphql({
                query: updateBizna,
                variables: {
                  input: {
                    BusKntct: entry.buyerAccount,
                    earningsBal: Number(buyerBiz.earningsBal || 0) + amountPaid,
                    netEarnings: Number(buyerBiz.netEarnings || 0) + amountPaid
                  }
                }
              });
            } else {
              const buyerRes: any = await client.graphql({
                query: getSMAccount,
                variables: { awsemail: entry.buyerEmail }
              });
              const buyerAccount = buyerRes?.data?.getSMAccount;
              if (!buyerAccount) {
                throw new Error('Buyer account not found');
              }
              await client.graphql({
                query: updateSMAccount,
                variables: {
                  input: {
                    awsemail: entry.buyerEmail,
                    balance: Number(buyerAccount.balance || 0) + amountPaid
                  }
                }
              });
            }

            await client.graphql({
              query: updatePartialPay,
              variables: {
                input: {
                  id: entry.id,
                  saleStatus: 'Inactive'
                }
              }
            });

            Alert.alert(t.success, t.contractRevoked);
            setSelectedEntry(null);
            setTransactions([]);
            await loadRecords();
          } catch (e) {
            console.error('Failed to revoke contract', e);
            Alert.alert(t.error, t.failedToRevoke);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.title}</Text>
      </View>

      {loadingBiznas ? (
        <ActivityIndicator size="large" style={{ marginTop: 16 }} />
      ) : biznas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t.noBusinessFound}</Text>
        </View>
      ) : (
        <View style={styles.selectorWrap}>
          <Text style={styles.sectionLabel}>{t.selectBusiness}</Text>
          <View style={styles.selectorRow}>
            {biznas.map((biz) => {
              const label = biz.busName || biz.name || biz.BusKntct || 'Business';
              const selected = (selectedBizna?.BusKntct || selectedBizna?.id) === (biz.BusKntct || biz.id);
              return (
                <Pressable
                  key={biz.BusKntct || biz.id}
                  onPress={() => {
                    setSelectedBizna(biz);
                    setBuyerNameFilter('');
                  }}
                  style={[styles.businessChip, selected && styles.businessChipSelected]}
                >
                  <Text style={[styles.businessChipText, selected && styles.businessChipTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {selectedBizna && (
        <View style={styles.filterWrap}>
          <TextInput
            value={buyerNameFilter}
            onChangeText={setBuyerNameFilter}
            placeholder={t.buyerNamePlaceholder}
            placeholderTextColor="#444"
            style={styles.filterInput}
          />
        </View>
      )}

      {loadingRecords ? (
        <ActivityIndicator size="large" style={{ marginTop: 16 }} />
      ) : (
        <FlatList
          data={visibleRecords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t.noRecordsFound}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{item.itemName || 'Partial pay'}</Text>
                <Text style={styles.badge}>{item.saleStatus || 'Active'}</Text>
              </View>
              <Text style={styles.cardText}>{t.buyer}: {item.buyerName || item.buyerEmail || '-'}</Text>
              <Text style={styles.cardText}>{t.paid}: {formatAmountSync(Number(item.amountPaid || 0), natCode, ratesMap)} {t.of} {formatAmountSync(Number(item.itemCost || 0), natCode, ratesMap)}</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => openHistory(item)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>{t.viewTransactions}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRevoke(item)} style={styles.dangerButton}>
                  <Text style={styles.dangerButtonText}>{t.revokeContract}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showHistoryModal} transparent animationType="slide" onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.paymentHistory}</Text>
            {transactionsLoading ? (
              <ActivityIndicator size="large" style={{ marginTop: 12 }} />
            ) : transactions.length === 0 ? (
              <Text style={styles.emptyText}>{t.noTransactionsFound}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {transactions.map((tx) => (
                  <View key={tx.id} style={styles.transactionItem}>
                    <Text style={styles.transactionTitle}>{tx.itemName || tx.itemDesc || 'Payment'}</Text>
                    <Text style={styles.cardText}>{t.paid}: {formatAmountSync(Number(tx.amountPaid || 0), natCode, ratesMap)}</Text>
                    <Text style={styles.cardText}>{t.buyer}: {tx.buyerName || tx.buyerEmail || '-'}</Text>
                    <Text style={styles.cardText}>{tx.createdAt || '-'}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SellerPartialPayRecords;
