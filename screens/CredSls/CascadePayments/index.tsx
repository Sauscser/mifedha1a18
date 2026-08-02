import React, { useMemo, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getSMAccount, listBiznas, cascadePaymentFlowsByOwner, listCascadePaymentFlows, getCompany, getCascadePaymentFlow, getBizna, cascadePaymentNodesByFlow, listCascadePaymentNodes } from '../../../src/graphql/queries';
import { createCascadePaymentFlow, createCascadePaymentNode, updateCascadePaymentFlow, createNonLoans, updateBizna, updateCompany, createMessages, sendNotification, updateSMAccount, createBizSls } from '../../../src/graphql/mutations';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, convertForeignToKsh } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { translations } from './translation';

const client = generateClient();

type RecipientType = 'BUSINESS' | 'INDIVIDUAL' | 'SUBUNIT';
type ActionType = 'create' | 'send' | 'view' | null;

type CascadeAccount = {
  id: string;
  name: string;
  accountNumber: string;
  recipientType: RecipientType;
  nationality: string;
  description: string;
  amountShared: number;
  createdAt: string;
  parentId?: string;
  owner: string;
  children: CascadeAccount[];
};

type BiznaOption = {
  BusKntct: string;
  busName: string;
  earningsBal?: number;
  pw?: string;
  email?: string;
  [key: string]: any;
};

type CheckoutSellerBreakdown = {
  sokokntct: string;
  totalCost: number;
  totalFees: number;
  description: string;
  itemCount: number;
};

const createAccountId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const CascadePaymentsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = { ...translations.en, ...(translations[lang] || {}) };
  const { nationality, ratesMap } = useExchange();
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const [showOptions, setShowOptions] = useState(true);
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [accounts, setAccounts] = useState<CascadeAccount[]>([]);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [businessSenderAccountName, setBusinessSenderAccountName] = useState('');
  const [accountNationality, setAccountNationality] = useState('');
  const userCurrencyKey = nationalityToCode(safeNationality || accountNationality || 'KE');
  const formatMoneyForUser = (amount?: number | string | null) => {
    const numericAmount = Number(amount ?? 0);
    if (!Number.isFinite(numericAmount)) {
      return '—';
    }
    return formatAmountSync(numericAmount, userCurrencyKey, ratesMap);
  };
  const [accountDescription, setAccountDescription] = useState('');
  const [createMode, setCreateMode] = useState<'MAIN' | 'SUBUNIT'>('MAIN');
  const [biznas, setBiznas] = useState<BiznaOption[]>([]);
  const [selectedBizna, setSelectedBizna] = useState<BiznaOption | null>(null);
  const [loadingBiznas, setLoadingBiznas] = useState(false);
  const [showBiznaSelector, setShowBiznaSelector] = useState(false);
  const [biznaFilterText, setBiznaFilterText] = useState('');
  const [addFundsBiznas, setAddFundsBiznas] = useState<BiznaOption[]>([]);
  const [selectedAddFundsBizna, setSelectedAddFundsBizna] = useState<BiznaOption | null>(null);
  const [loadingAddFundsBiznas, setLoadingAddFundsBiznas] = useState(false);
  const [showAddFundsBiznaSelector, setShowAddFundsBiznaSelector] = useState(false);
  const [addFundsBiznaFilterText, setAddFundsBiznaFilterText] = useState('');
  const [showAddFundsByFlowId, setShowAddFundsByFlowId] = useState<Record<string, boolean>>({});
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsPassword, setAddFundsPassword] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);
  const [selectedParentFlow, setSelectedParentFlow] = useState<any>(null);
  const [showParentFlowSelector, setShowParentFlowSelector] = useState(false);
  const [parentFlowFilterText, setParentFlowFilterText] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [flowAccounts, setFlowAccounts] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('SUBUNIT');
  const [recipientSelectionStep, setRecipientSelectionStep] = useState(true);
  const [senderAccountMode, setSenderAccountMode] = useState<RecipientType>('SUBUNIT');
  const [showSenderAccountPicker, setShowSenderAccountPicker] = useState(false);
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [businessRecipientAccountNumber, setBusinessRecipientAccountNumber] = useState('');
  const [pendingBusinessCheckoutPayload, setPendingBusinessCheckoutPayload] = useState<any>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [sendingMoney, setSendingMoney] = useState(false);
  const [loadingSenderAccounts, setLoadingSenderAccounts] = useState(false);
  const [loadingSenderAccountButton, setLoadingSenderAccountButton] = useState(false);
  const [selectedSenderAccount, setSelectedSenderAccount] = useState<any>(null);
  const [senderSelectionStep, setSenderSelectionStep] = useState(true);
  const [senderAccountFilter, setSenderAccountFilter] = useState('');
  const [recipientAccountFilter, setRecipientAccountFilter] = useState('');
  const [viewedAccount, setViewedAccount] = useState<CascadeAccount | null>(null);
  const [childrenModalVisible, setChildrenModalVisible] = useState(false);
  const [ownedCascadeFlows, setOwnedCascadeFlows] = useState<any[]>([]);
  const [loadingOwnedFlows, setLoadingOwnedFlows] = useState(false);
  const [viewSectionByFlowId, setViewSectionByFlowId] = useState<Record<string, 'subunits' | 'transactions' | null>>({});
  const [subunitFlowsByFlowId, setSubunitFlowsByFlowId] = useState<Record<string, any[]>>({});
  const [loadingSubunitsByFlowId, setLoadingSubunitsByFlowId] = useState<Record<string, boolean>>({});
  const [transactionNodesByFlowId, setTransactionNodesByFlowId] = useState<Record<string, any[]>>({});
  const [loadingTransactionsByFlowId, setLoadingTransactionsByFlowId] = useState<Record<string, boolean>>({});
  const [expandedFlowIds, setExpandedFlowIds] = useState<Record<string, boolean>>({});
  const [expandedSubunitIds, setExpandedSubunitIds] = useState<Record<string, boolean>>({});
  const [ownerEditValues, setOwnerEditValues] = useState<Record<string, string>>({});
  const [savingOwnerFlowIds, setSavingOwnerFlowIds] = useState<Record<string, boolean>>({});

  const getCascadeFlowById = (flowId: string) => {
    const ownedFlow = ownedCascadeFlows.find((item: any) => item.id === flowId);
    if (ownedFlow) return ownedFlow;
    for (const flows of Object.values(subunitFlowsByFlowId)) {
      const found = flows.find((item: any) => item.id === flowId);
      if (found) return found;
    }
    return null;
  };

  const normalizeRecipientType = (value?: string): RecipientType => {
    if (value === 'BUSINESS') {
      return 'BUSINESS';
    }
    if (value === 'SUBUNIT') {
      return 'SUBUNIT';
    }
    if (value === 'INDIVIDUAL') {
      return 'INDIVIDUAL';
    }
    return 'SUBUNIT';
  };

  const getAccountSummaryTotal = (account: CascadeAccount): number => {
    const childTotal = account.children.reduce((sum, child) => sum + getAccountSummaryTotal(child), 0);
    return account.amountShared + childTotal;
  };

  const filteredSenderAccounts = useMemo(() => {
    const normalizedFilter = senderAccountFilter.trim().toLowerCase();
    const normalizedOwner = (userEmail || '').trim().toLowerCase();
    return (flowAccounts || []).filter((account: any) => {
      const accountOwner = `${account.owner || ''}`.trim().toLowerCase();
      if (normalizedOwner && accountOwner && accountOwner !== normalizedOwner) {
        return false;
      }
      if (!normalizedFilter) {
        return true;
      }
      const candidateName = `${account.senderAccountName || account.title || ''}`.toLowerCase();
      return candidateName.includes(normalizedFilter);
    });
  }, [flowAccounts, senderAccountFilter, userEmail]);

  const filteredParentFlows = useMemo(() => {
    const normalizedFilter = parentFlowFilterText.trim().toLowerCase();
    return (flowAccounts || []).filter((account: any) => {
      if (!normalizedFilter) {
        return true;
      }
      const candidateName = `${account.senderAccountName || account.title || ''}`.toLowerCase();
      return candidateName.includes(normalizedFilter);
    });
  }, [flowAccounts, parentFlowFilterText]);

  const filteredBiznas = useMemo(() => {
    const normalizedFilter = biznaFilterText.trim().toLowerCase();
    return (biznas || []).filter((biz: any) => {
      if (!normalizedFilter) {
        return true;
      }
      const candidateName = `${biz.busName || biz.BusKntct || ''}`.toLowerCase();
      return candidateName.includes(normalizedFilter);
    });
  }, [biznas, biznaFilterText]);

  const filteredAddFundsBiznas = useMemo(() => {
    const normalizedFilter = addFundsBiznaFilterText.trim().toLowerCase();
    return (addFundsBiznas || []).filter((biz: any) => {
      if (!normalizedFilter) {
        return true;
      }
      const candidateName = `${biz.busName || biz.BusKntct || ''}`.toLowerCase();
      return candidateName.includes(normalizedFilter);
    });
  }, [addFundsBiznas, addFundsBiznaFilterText]);

  const filteredRecipientAccounts = useMemo(() => {
    const normalizedFilter = recipientAccountFilter.trim().toLowerCase();
    return (flowAccounts || []).filter((account: any) => {
      if (!normalizedFilter) {
        return true;
      }
      const candidateName = `${account.senderAccountName || account.title || ''}`.toLowerCase();
      return candidateName.includes(normalizedFilter);
    });
  }, [flowAccounts, recipientAccountFilter]);

  const findAccountById = (tree: CascadeAccount[], targetId: string): CascadeAccount | null => {
    for (const account of tree) {
      if (account.id === targetId) {
        return account;
      }
      const nested = findAccountById(account.children, targetId);
      if (nested) {
        return nested;
      }
    }
    return null;
  };

  const attachChildToParent = (tree: CascadeAccount[], parentId: string, child: CascadeAccount): CascadeAccount[] =>
    tree.map((account) => {
      if (account.id === parentId) {
        return {
          ...account,
          amountShared: account.amountShared + child.amountShared,
          children: [...account.children, child],
        };
      }
      return {
        ...account,
        children: attachChildToParent(account.children, parentId, child),
      };
    });

  const hydrateUserContext = async () => {
    try {
      const user = await getCurrentUser();
      const attrs: any = await fetchUserAttributes();
      const email = attrs?.email || attrs?.['email'] || user.username || '';
      setUserEmail(email);
      const smAccountResponse: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: email },
      });
      const smAccount = smAccountResponse?.data?.getSMAccount;
      const resolvedName = smAccount?.name || '';
      const resolvedNationality = smAccount?.nationality || '';
      setUserName(resolvedName);
      setAccountNationality(resolvedNationality);
      return { email, name: resolvedName, nationality: resolvedNationality };
    } catch (error) {
      console.error(error);
      return { email: '', name: '', nationality: '' };
    }
  };

  useEffect(() => {
    hydrateUserContext();
  }, []);

  const loadOwnedCascadeFlows = async () => {
    const activeEmail = userEmail || (await hydrateUserContext()).email || '';
    if (!activeEmail) {
      return [];
    }
    setLoadingOwnedFlows(true);
    try {
      const response: any = await client.graphql({
        query: cascadePaymentFlowsByOwner,
        variables: {
          owner: activeEmail,
          limit: 100,
        },
      });
      const items = (response?.data?.cascadePaymentFlowsByOwner?.items || []).filter((flow: any) => `${flow.owner || ''}`.toLowerCase() === activeEmail.toLowerCase());
      setOwnedCascadeFlows(items);
      setSubunitFlowsByFlowId({});
      setTransactionNodesByFlowId({});
      setViewSectionByFlowId({});
      return items;
    } catch (error) {
      console.error('Failed to load owned cascade payment flows', error);
      setOwnedCascadeFlows([]);
      return [];
    } finally {
      setLoadingOwnedFlows(false);
    }
  };

  const loadSubunitFlowsForFlow = async (flowId: string) => {
    setLoadingSubunitsByFlowId((current) => ({ ...current, [flowId]: true }));
    setViewSectionByFlowId((current) => ({ ...current, [flowId]: 'subunits' }));
    try {
      const response: any = await client.graphql({
        query: listCascadePaymentFlows,
        variables: {
          limit: 100,
          filter: {
            title: { eq: flowId },
          },
        },
      });
      const items = response?.data?.listCascadePaymentFlows?.items || [];
      const filteredItems = items.filter((item: any) => item.id !== flowId);
      setSubunitFlowsByFlowId((current) => ({ ...current, [flowId]: filteredItems }));
    } catch (error) {
      console.error('Failed to load subunit cascade payment flows', error);
      setSubunitFlowsByFlowId((current) => ({ ...current, [flowId]: [] }));
    } finally {
      setLoadingSubunitsByFlowId((current) => ({ ...current, [flowId]: false }));
    }
  };

  const loadTransactionsForFlow = async (flowId: string) => {
    setLoadingTransactionsByFlowId((current) => ({ ...current, [flowId]: true }));
    setViewSectionByFlowId((current) => ({ ...current, [flowId]: 'transactions' }));
    try {
      const response: any = await client.graphql({
        query: listCascadePaymentNodes,
        variables: {
          limit: 100,
          filter: {
            parentNodeId: { eq: flowId },
          },
        },
      });
      const items = response?.data?.listCascadePaymentNodes?.items || [];
      setTransactionNodesByFlowId((current) => ({ ...current, [flowId]: items }));
    } catch (error) {
      console.error('Failed to load cascade payment nodes', error);
      setTransactionNodesByFlowId((current) => ({ ...current, [flowId]: [] }));
    } finally {
      setLoadingTransactionsByFlowId((current) => ({ ...current, [flowId]: false }));
    }
  };

  const renderCascadeFlowCard = (flow: any) => {
    const isExpanded = expandedSubunitIds[flow.id];
    const childSubunits = subunitFlowsByFlowId[flow.id] || [];
    const transactionNodes = transactionNodesByFlowId[flow.id] || [];

    return (
      <View key={flow.id} style={[styles.optionButton, styles.cascadeCard]}> 
        <View style={[styles.row, styles.cardHeader]}>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setExpandedSubunitIds((current) => ({ ...current, [flow.id]: !current[flow.id] }))}
            >
              <Ionicons
                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color="#ff8c00"
              />
            </TouchableOpacity>
            <Text style={[styles.optionButtonText, { marginLeft: 10 }]}>{flow.senderAccountName || flow.title || flow.id}</Text>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.iconButton} onPress={() => loadSubunitFlowsForFlow(flow.id)}>
              <Ionicons name="eye" size={18} color="#ff8c00" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => loadTransactionsForFlow(flow.id)}>
              <Ionicons name="eye" size={18} color="#ff8c00" />
            </TouchableOpacity>
          </View>
        </View>
        {isExpanded ? (
          <>
            <Text style={styles.helperText}>{`${t.payerLabel}: ${flow.senderAccountName || '—'}`}</Text>
            <View style={styles.row}>
              <Text style={styles.helperText}>{`${t.totalDisbursedLabel}: ${formatMoneyForUser(flow.totalDisbursed)}`}</Text>
              <Text style={styles.helperText}>{`${t.totalAllocatedLabel}: ${formatMoneyForUser(flow.totalAllocated)}`}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder={t.enterNewAdminEmailPlaceholder}
              value={ownerEditValues[flow.id] ?? flow.owner ?? ''}
              onChangeText={(text) => setOwnerEditValues((current) => ({ ...current, [flow.id]: text }))}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleUpdateFlowOwner(flow.id)} disabled={savingOwnerFlowIds[flow.id]}>
              {savingOwnerFlowIds[flow.id] ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#ff8c00" />
                  <Text style={styles.secondaryButtonText}>{t.savingOwnerButton}</Text>
                </View>
              ) : (
                <Text style={styles.secondaryButtonText}>{t.updateOwnerButton}</Text>
              )}
            </TouchableOpacity>
            {viewSectionByFlowId[flow.id] === 'subunits' ? (
              <View style={styles.nestedSubunitList}>
                {loadingSubunitsByFlowId[flow.id] ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#ff8c00" />
                    <Text style={styles.helperText}>{t.loadingSubUnits}</Text>
                  </View>
                ) : null}
                {!loadingSubunitsByFlowId[flow.id] && childSubunits.length > 0 ? (
                  childSubunits.map((childSubunit: any) => renderCascadeFlowCard(childSubunit))
                ) : null}
                {!loadingSubunitsByFlowId[flow.id] && childSubunits.length === 0 ? (
                  <Text style={styles.helperText}>{t.noSubUnitsFound}</Text>
                ) : null}
              </View>
            ) : null}
            {viewSectionByFlowId[flow.id] === 'transactions' ? (
              <View style={styles.nestedSubunitList}>
                {loadingTransactionsByFlowId[flow.id] ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#ff8c00" />
                    <Text style={styles.helperText}>{t.loadingTransactions}</Text>
                  </View>
                ) : null}
                {!loadingTransactionsByFlowId[flow.id] && transactionNodes.length > 0 ? (
                  transactionNodes.map((node: any) => {
                    const subtotalValue = Number(node?.subtotal ?? node?.subTotal ?? 0);
                    const amountValue = Number(node?.amount ?? 0);
                    const totalAmountValue = subtotalValue;
                    const subTotalValue = amountValue;
                    const feesValue = Math.max(0, totalAmountValue - subTotalValue);
                    const receiverName = node?.recipientAccountName || node?.recipientName || node?.recipientAccountRef || '—';
                    const receiverRef = node?.recipientAccountRef || '—';
                    return (
                      <View key={node.id} style={styles.optionButton}>
                        <Text style={styles.optionButtonText}>{node.description || t.cascadeTransactionLabel}</Text>
                        <Text style={styles.helperText}>{`${t.payerLabel}: ${node.senderAccountName || '—'}`}</Text>
                        <Text style={styles.helperText}>{`Receiver Name: ${receiverName}`}</Text>
                        <Text style={styles.helperText}>{`Receiver Account: ${receiverRef}`}</Text>
                        <Text style={styles.helperText}>{`${t.recipientTypeLabel}: ${node.recipientType || '—'}`}</Text>
                        <Text style={styles.helperText}>{`${t.totalAmountLabel}: ${formatMoneyForUser(totalAmountValue)}`}</Text>
                        <Text style={styles.helperText}>{`${t.subTotalLabel}: ${formatMoneyForUser(subTotalValue)}`}</Text>
                        <Text style={styles.helperText}>{`${t.feesLabel}: ${formatMoneyForUser(feesValue)}`}</Text>
                      </View>
                    );
                  })
                ) : null}
                {!loadingTransactionsByFlowId[flow.id] && transactionNodes.length === 0 ? (
                  <Text style={styles.helperText}>{t.noTransactionsFound}</Text>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    );
  };

  const handleUpdateFlowOwner = async (flowId: string) => {
    const newOwner = `${ownerEditValues[flowId] || ''}`.trim();
    if (!newOwner) {
      Alert.alert('Please enter an email address before saving the owner.');
      return;
    }
    setSavingOwnerFlowIds((current) => ({ ...current, [flowId]: true }));
    try {
      await client.graphql({
        query: updateCascadePaymentFlow,
        variables: {
          input: {
            id: flowId,
            owner: newOwner,
          },
        },
      });
      setOwnedCascadeFlows((current) => current.map((flow: any) => (flow.id === flowId ? { ...flow, owner: newOwner } : flow)));
      setSubunitFlowsByFlowId((current) => {
        const next = { ...current };
        Object.keys(next).forEach((parentId) => {
          next[parentId] = (next[parentId] || []).map((child: any) => (child.id === flowId ? { ...child, owner: newOwner } : child));
        });
        return next;
      });
      Alert.alert('Owner updated.');
    } catch (error) {
      console.error('Failed to update cascade payment flow owner', error);
      Alert.alert('Unable to update the owner right now.');
    } finally {
      setSavingOwnerFlowIds((current) => ({ ...current, [flowId]: false }));
    }
  };

  useEffect(() => {
    if (activeAction === 'view') {
      void loadOwnedCascadeFlows();
    }
  }, [activeAction, userEmail]);

  const dispatchCascadeNotifications = async (targetEmail: string, title: string, body: string) => {
    if (!targetEmail) {
      return;
    }
    try {
      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            senderEmail: targetEmail,
            messageBody: body,
          },
        },
      });
      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail: targetEmail,
          title,
          body,
        },
      });
    } catch (error) {
      console.warn('Failed to dispatch cascade notification', error);
    }
  };

  const ensureSufficientSenderFunds = async (requiredAmount: number) => {
    const profile = await hydrateUserContext();
    const activeEmail = profile.email || userEmail || '';
    if (!activeEmail) {
      return { hasFunds: false, availableBalance: 0 };
    }
    try {
      const smResponse: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: activeEmail },
      });
      const smAccount = smResponse?.data?.getSMAccount || {};
      const availableBalance = Number(smAccount?.balance || 0);
      return {
        hasFunds: Number.isFinite(availableBalance) && availableBalance >= requiredAmount,
        availableBalance,
      };
    } catch (error) {
      console.error('Failed to fetch sender balance', error);
      return { hasFunds: false, availableBalance: 0 };
    }
  };

  const finalizeBusinessCheckout = async (payload: any) => {
    if (!payload) {
      return;
    }
    const sellerBreakdown = Array.isArray(payload?.sellerBreakdown) ? payload.sellerBreakdown : [];
    const senderFlowId = selectedParentId || selectedSenderAccount?.id || route.params?.senderFlowId || '';
    const senderRef = selectedSenderAccount?.senderAccountRef || selectedSenderAccount?.recipientAccountRef || selectedSenderAccount?.accountNumber || route.params?.senderAccountRef || '';
    const senderName = selectedSenderAccount?.senderAccountName || selectedSenderAccount?.title || selectedSenderAccount?.name || route.params?.senderAccountName || '';
    const recipientBusinessAccountNumber = `${payload?.recipientBusinessAccountNumber || ''}`.trim();
    if (!senderFlowId) {
      return;
    }
    if (!sellerBreakdown.length) {
      Alert.alert('No seller checkout details were returned.');
      return;
    }
    const totalAmountDue = Number(payload?.totalAmountDue ?? (Number(payload?.totalCost || 0) + Number(payload?.totalFees || 0)));
    const fundsCheck = await ensureSufficientSenderFunds(totalAmountDue);
    if (!fundsCheck.hasFunds) {
      Alert.alert('Insufficient funds', 'You do not have enough available balance to complete this checkout.');
      return;
    }
    try {
      const flowResponse: any = await client.graphql({
        query: getCascadePaymentFlow,
        variables: { id: senderFlowId },
      });
      const currentFlow = flowResponse?.data?.getCascadePaymentFlow || {};
      const nextTotalAllocated = Math.max(0, Number(currentFlow.totalAllocated || 0) - totalAmountDue);
      const nextTotalDisbursed = Number(currentFlow.totalDisbursed || 0) + totalAmountDue;
      await client.graphql({
        query: updateCascadePaymentFlow,
        variables: {
          input: {
            id: senderFlowId,
            totalDisbursed: nextTotalDisbursed,
          },
        },
      });

      const companyResponse: any = await client.graphql({
        query: getCompany,
        variables: { AdminId: 'BaruchHabaB\'ShemAdonai2' },
      });
      const company = companyResponse?.data?.getCompany || {};
      const benefitRate = Number(company?.p2BBenCom ?? 0);
      const ownerEmail = userEmail || (await hydrateUserContext()).email || '';
      let senderCreditAmount = 0;
      let companyEarningsTotal = 0;

      for (const seller of sellerBreakdown) {
        const sellerContact = `${seller.sokokntct || ''}`.trim();
        if (!sellerContact) {
          continue;
        }
        const bizResponse: any = await client.graphql({
          query: getBizna,
          variables: { BusKntct: sellerContact },
        });
        const biz = bizResponse?.data?.getBizna || null;
        const totalCost = Number(seller.totalCost || 0);
        const totalFees = Number(seller.totalFees || 0);
        const sellerAmountDue = totalCost + totalFees;
        const netAmount = Math.max(0, totalCost - totalFees);
        const businessBenefit = totalFees * benefitRate;
        const sellerCompanyEarnings = Math.max(0, totalFees - 2 * businessBenefit);
        companyEarningsTotal += sellerCompanyEarnings;
        senderCreditAmount += businessBenefit;
        if (biz) {
          const currentEarnings = Number(biz.earningsBal || 0);
          const currentNetEarnings = Number(biz.netEarnings || 0);
          const currentBenefits = Number(biz.benefitsAmount || 0);
          await client.graphql({
            query: updateBizna,
            variables: {
              input: {
                BusKntct: sellerContact,
                earningsBal: currentEarnings + netAmount,
                netEarnings: currentNetEarnings + netAmount,
                benefitsAmount: currentBenefits + businessBenefit,
              },
            },
          });
        }
        const nodeDescription = `${seller.description || `Checkout for ${biz?.busName || sellerContact || recipientBusinessAccountNumber || 'business'}`}`.trim();
        await client.graphql({
          query: createNonLoans,
          variables: {
            input: {
              recPhn: senderRef,
              senderPhn: senderRef,
              amount: String(Math.max(0, totalCost - totalFees)),
              description: nodeDescription || 'Cascade payment checkout',
              RecName: biz?.busName || sellerContact,
              SenderName: senderName || 'Sender account',
              status: 'DeliveryPayment',
              owner: ownerEmail,
              fees: String(Math.max(0, totalFees)),
            },
          },
        });


        await client.graphql({
          query: createCascadePaymentNode,
          variables: {
            input: {
              owner: ownerEmail,
              flowId: senderFlowId,
              parentNodeId: senderFlowId,
              level: Number(currentFlow.currentLevel || 1) + 1,
              senderAccountRef: senderRef,
              senderAccountName: senderName || senderRef || 'Sender account',
              recipientAccountRef: sellerContact,
              recipientAccountName: biz?.busName || sellerContact,
              recipientType: 'BUSINESS',
              amount: totalCost,
              description: nodeDescription || 'Cascade payment checkout',
              isLeaf: true,
              childCount: 0,
              subtotal: sellerAmountDue,
            },
          },
        });
      }
      if (company) {
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: 'BaruchHabaB\'ShemAdonai2',
              companyEarningBal: Number(company.companyEarningBal || 0) + companyEarningsTotal,
              companyEarning: Number(company.companyEarning || 0) + companyEarningsTotal,
            },
          },
        });
      }
      if (senderCreditAmount > 0) {
        const senderFlowSummary: any = await client.graphql({
          query: getCascadePaymentFlow,
          variables: { id: senderFlowId },
        });
        const senderFlow = senderFlowSummary?.data?.getCascadePaymentFlow || {};
        await client.graphql({
          query: updateCascadePaymentFlow,
          variables: {
            input: {
              id: senderFlowId,
              amount: Number(senderFlow.amount || 0) + senderCreditAmount,
            },
          },
        });
      }
      const notificationTarget = ownerEmail || userEmail || '';
      const notificationBody = `Business checkout of ${formatAmountSync(totalAmountDue, userCurrencyKey, ratesMap)} across ${sellerBreakdown.length} seller${sellerBreakdown.length === 1 ? '' : 's'} has been processed.`;
      await dispatchCascadeNotifications(notificationTarget, 'Cascade checkout processed', notificationBody);
      Alert.alert('Checkout completed', 'The purchase summary was processed successfully.');
      resetActionState();
    } catch (error) {
      console.error('Failed to finalize business checkout', error);
      Alert.alert('Unable to finalize the checkout right now.');
    }
  };

  useEffect(() => {
    const restoreBusinessCheckoutState = async () => {
      const payload = route.params?.businessCheckoutPayload;
      const incomingSenderFlowId = route.params?.senderFlowId || '';
      const incomingSenderRef = route.params?.senderAccountRef || '';
      const incomingSenderName = route.params?.senderAccountName || '';
      const incomingSenderOwner = route.params?.senderOwner || '';
      const incomingRecipientType = normalizeRecipientType(route.params?.recipientType || 'BUSINESS');
      if (!route.params?.fromCascadePaymentsReturn || !payload) {
        return;
      }
      setPendingBusinessCheckoutPayload(payload);
      if (payload?.recipientBusinessAccountNumber) {
        setBusinessRecipientAccountNumber(payload.recipientBusinessAccountNumber);
      }
      setRecipientType(incomingRecipientType);
      setRecipientSelectionStep(false);
      setShowOptions(false);
      setActiveAction('send');
      if (incomingSenderFlowId) {
        setSelectedParentId(incomingSenderFlowId);
        const loadedItems = await loadFlowAccounts('');
        const matchingFlow = loadedItems.find((account: any) => {
          const accountId = `${account.id || ''}`;
          const accountRef = `${account.senderAccountRef || account.recipientAccountRef || ''}`;
          const accountName = `${account.senderAccountName || account.title || ''}`;
          return accountId === incomingSenderFlowId || accountRef === incomingSenderRef || accountName === incomingSenderName || account.owner === incomingSenderOwner;
        });
        if (matchingFlow) {
          setSelectedSenderAccount(matchingFlow);
          setSelectedParentId(matchingFlow.id || incomingSenderFlowId);
          setSenderSelectionStep(false);
          setShowSenderAccountPicker(false);
        } else {
          setSelectedSenderAccount({
            id: incomingSenderFlowId,
            senderAccountRef: incomingSenderRef,
            recipientAccountRef: incomingSenderRef,
            senderAccountName: incomingSenderName || incomingSenderOwner || 'Selected sender',
            title: incomingSenderName || incomingSenderOwner || 'Selected sender',
            name: incomingSenderName || incomingSenderOwner || 'Selected sender',
            owner: incomingSenderOwner || userEmail || '',
          });
          setSenderSelectionStep(false);
        }
      } else if (incomingSenderName || incomingSenderRef) {
        setSelectedSenderAccount({
          id: incomingSenderFlowId || `${incomingSenderRef || incomingSenderName || 'sender'}`,
          senderAccountRef: incomingSenderRef,
          recipientAccountRef: incomingSenderRef,
          senderAccountName: incomingSenderName || 'Selected sender',
          title: incomingSenderName || 'Selected sender',
          name: incomingSenderName || 'Selected sender',
          owner: incomingSenderOwner || userEmail || '',
        });
        setSelectedParentId(incomingSenderFlowId || '');
        setSenderSelectionStep(false);
      }
    };

    void restoreBusinessCheckoutState();
  }, [route.params?.fromCascadePaymentsReturn, route.params?.businessCheckoutPayload, route.params?.senderFlowId, route.params?.senderAccountRef, route.params?.senderAccountName, route.params?.senderOwner, route.params?.recipientType, userEmail]);

  const resetActionState = () => {
    setShowOptions(false);
    setActiveAction(null);
    setAccountName('');
    setAccountNumber('');
    setBusinessSenderAccountName('');
    setAccountDescription('');
    setCreateMode('MAIN');
    setSelectedParentId('');
    setSelectedSenderAccount(null);
    setSenderSelectionStep(true);
    setSenderAccountMode('SUBUNIT');
    setShowSenderAccountPicker(false);
    setSenderAccountFilter('');
    setRecipientType('SUBUNIT');
    setRecipientSelectionStep(true);
    setRecipientIdentifier('');
    setBusinessRecipientAccountNumber('');
    setPendingBusinessCheckoutPayload(null);
    setRecipientAccountFilter('');
    setSelectedRecipient(null);
    setTransferAmount('');
    setTransferDescription('');
    setSelectedBizna(null);
    setShowBiznaSelector(false);
    setBiznaFilterText('');
    setSelectedAddFundsBizna(null);
    setShowAddFundsBiznaSelector(false);
    setAddFundsBiznaFilterText('');
    setAddFundsAmount('');
    setAddFundsPassword('');
    setShowAddFundsByFlowId({});
    setSelectedParentFlow(null);
    setShowParentFlowSelector(false);
    setParentFlowFilterText('');
    setViewedAccount(null);
  };

  const loadBiznaOptions = async () => {
    const activeEmail = userEmail || (await hydrateUserContext()).email;
    try {
      setLoadingBiznas(true);
      const response: any = await client.graphql({ query: listBiznas });
      const items = response?.data?.listBiznas?.items || [];
      const filtered = items.filter((biz: any) => {
        for (let i = 1; i <= 50; i += 1) {
          const adminValue = biz[`Admin${i}`];
          if (adminValue && adminValue !== 'None' && adminValue.toLowerCase().trim() === activeEmail.toLowerCase().trim()) {
            return true;
          }
        }
        return false;
      });
      setBiznas(filtered);
      setShowBiznaSelector(true);
    } catch (error) {
      console.error(error);
      setBiznas([]);
    } finally {
      setLoadingBiznas(false);
    }
  };

  const loadAddFundsBiznaOptions = async () => {
    const activeEmail = userEmail || (await hydrateUserContext()).email;
    try {
      setLoadingAddFundsBiznas(true);
      const response: any = await client.graphql({ query: listBiznas });
      const items = response?.data?.listBiznas?.items || [];
      const filtered = items.filter((biz: any) => {
        for (let i = 1; i <= 50; i += 1) {
          const adminValue = biz[`Admin${i}`];
          if (adminValue && adminValue !== 'None' && adminValue.toLowerCase().trim() === activeEmail.toLowerCase().trim()) {
            return true;
          }
        }
        return false;
      });
      setAddFundsBiznas(filtered);
      setShowAddFundsBiznaSelector(true);
    } catch (error) {
      console.error(error);
      setAddFundsBiznas([]);
    } finally {
      setLoadingAddFundsBiznas(false);
    }
  };

  const handleAddFundsFromBiznaToFlow = async (flowId: string) => {
    if (!selectedAddFundsBizna) {
      Alert.alert(t.noBiznaSelected);
      return;
    }
    if (!addFundsAmount || Number.isNaN(Number(addFundsAmount)) || Number(addFundsAmount) <= 0) {
      Alert.alert(t.enterValidAmount);
      return;
    }
    if (!addFundsPassword.trim()) {
      Alert.alert(t.invalidBiznaPassword);
      return;
    }
    setAddingFunds(true);
    try {
      const amountValue = Number(addFundsAmount);
      const amountInKsh = await convertForeignToKsh(amountValue, userCurrencyKey || safeNationality || accountNationality || 'KE');
      const biznaBalance = Number(selectedAddFundsBizna?.earningsBal || 0);
      if (!Number.isFinite(amountInKsh) || amountInKsh <= 0) {
        Alert.alert(t.enterValidAmount);
        return;
      }
      if (biznaBalance < amountInKsh) {
        Alert.alert(t.insufficientFundsTitle, t.biznaInsufficientFunds);
        return;
      }
      const smResponse: any = await client.graphql({ query: getSMAccount, variables: { awsemail: userEmail || (await hydrateUserContext()).email } });
      const smAccount = smResponse?.data?.getSMAccount || {};
      if (addFundsPassword.trim() !== String(smAccount?.pw || '')) {
        Alert.alert(t.insufficientFundsTitle, t.invalidBiznaPassword);
        return;
      }
      const companyResponse: any = await client.graphql({ query: getCompany, variables: { AdminId: 'BaruchHabaB\'ShemAdonai2' } });
      const company = companyResponse?.data?.getCompany || {};
      const feeRate = Number(company?.cascadePaymentFee ?? company?.userTransferFee ?? 0);
      const transactionFee = amountInKsh * feeRate;
      const totalAmountDeducted = amountInKsh + transactionFee;
      if (biznaBalance < totalAmountDeducted) {
        Alert.alert(t.insufficientFundsTitle, t.biznaInsufficientFunds);
        return;
      }
      const flowResponse: any = await client.graphql({ query: getCascadePaymentFlow, variables: { id: flowId } });
      const currentFlow = flowResponse?.data?.getCascadePaymentFlow || {};
      const nextTotalAllocated = Number(currentFlow.totalAllocated || 0) + amountInKsh;
      await client.graphql({ query: updateCascadePaymentFlow, variables: { input: { id: flowId, totalAllocated: nextTotalAllocated } } });
      await client.graphql({ query: updateBizna, variables: { input: { BusKntct: selectedAddFundsBizna.BusKntct, earningsBal: biznaBalance - totalAmountDeducted } } });
      await client.graphql({ query: createNonLoans, variables: { input: {
          recPhn: currentFlow.senderAccountRef || '',
          senderPhn: selectedAddFundsBizna.BusKntct,
          amount: String(amountInKsh),
          description: 'funds transfer',
          RecName: currentFlow.senderAccountName || currentFlow.title || 'Cascade flow',
          SenderName: selectedAddFundsBizna.busName || selectedAddFundsBizna.BusKntct,
          status: 'DeliveryPayment',
          owner: userEmail || (await hydrateUserContext()).email || '',
          fees: String(transactionFee),
        } } });

  
      await client.graphql({ query: updateCompany, variables: { input: {
          AdminId: 'BaruchHabaB\'ShemAdonai2',
          companyEarningBal: Number(company.companyEarningBal || 0) + transactionFee,
          companyEarning: Number(company.companyEarning || 0) + transactionFee,
        } } });
      await client.graphql({ query: createCascadePaymentNode, variables: { input: {
          owner: userEmail || (await hydrateUserContext()).email || '',
          flowId,
          parentNodeId: flowId,
          level: Number(currentFlow.currentLevel || 1) + 1,
          senderAccountRef: selectedAddFundsBizna.BusKntct,
          senderAccountName: selectedAddFundsBizna.busName || selectedAddFundsBizna.BusKntct,
          recipientAccountRef: currentFlow.senderAccountRef || '',
          recipientAccountName: currentFlow.senderAccountName || currentFlow.title || 'Cascade flow',
          recipientType: 'BUSINESS',
          amount: amountInKsh,
          description: `Added funds from Bizna ${selectedAddFundsBizna.busName || selectedAddFundsBizna.BusKntct}`,
          isLeaf: true,
          childCount: 0,
          subtotal: totalAmountDeducted,
        } } });
      await dispatchCascadeNotifications(userEmail || (await hydrateUserContext()).email || '', t.addFundsSuccessTitle, t.addFundsSuccessMessage.replace('{amount}', formatMoneyForUser(amountInKsh)).replace('{bizna}', selectedAddFundsBizna.busName || selectedAddFundsBizna.BusKntct));
      Alert.alert(t.addFundsSuccessTitle, t.addFundsSuccessMessage.replace('{amount}', formatMoneyForUser(amountInKsh)).replace('{bizna}', selectedAddFundsBizna.busName || selectedAddFundsBizna.BusKntct));
      setShowAddFundsByFlowId((current) => ({ ...current, [flowId]: false }));
      setSelectedAddFundsBizna(null);
      setAddFundsAmount('');
      setAddFundsPassword('');
      setShowAddFundsBiznaSelector(false);
      await loadOwnedCascadeFlows();
    } catch (error) {
      console.error('Failed to add funds from Bizna to flow', error);
      Alert.alert('Unable to add funds right now.');
    } finally {
      setAddingFunds(false);
    }
  };

  const loadFlowAccounts = async (filterText = '') => {
    const profile = await hydrateUserContext();
    const attrs: any = await fetchUserAttributes();
    const activeEmail = profile.email || attrs?.email || attrs?.['email'] || userEmail || '';
    const normalizedFilter = filterText.trim();
    setLoadingSenderAccounts(true);
    setShowSenderAccountPicker(true);
    try {
      const byOwnerResponse: any = await client.graphql({
        query: cascadePaymentFlowsByOwner,
        variables: {
          owner: activeEmail,
          limit: 100,
          filter: {
            ...(normalizedFilter
              ? { senderAccountName: { contains: normalizedFilter } }
              : {}),
          },
        },
      });
      const byOwnerItems = byOwnerResponse?.data?.cascadePaymentFlowsByOwner?.items || [];
      console.log('cascadePaymentFlowsByOwner response for', activeEmail, JSON.stringify(byOwnerItems, null, 2));

      const fallbackResponse: any = await client.graphql({
        query: listCascadePaymentFlows,
        variables: {
          limit: 100,
          filter: {
            owner: { eq: activeEmail },
            ...(normalizedFilter
              ? { senderAccountName: { contains: normalizedFilter } }
              : {}),
          },
        },
      });
      const fallbackItems = fallbackResponse?.data?.listCascadePaymentFlows?.items || [];
      console.log('listCascadePaymentFlows fallback response for', activeEmail, JSON.stringify(fallbackItems, null, 2));

      const items = byOwnerItems.length > 0 ? byOwnerItems : fallbackItems;
      setUserEmail(activeEmail);
      setFlowAccounts(items);
      return items;
    } catch (error) {
      console.error(error);
      setFlowAccounts([]);
      return [];
    } finally {
      setLoadingSenderAccounts(false);
    }
  };

  const loadRecipientAccountsByName = async (filterText = '') => {
    const normalizedFilter = filterText.trim();
    setLoadingSenderAccounts(true);
    try {
      const response: any = await client.graphql({
        query: listCascadePaymentFlows,
        variables: {
          limit: 100,
          filter: {
            ...(normalizedFilter
              ? { senderAccountName: { contains: normalizedFilter } }
              : {}),
          },
        },
      });
      const items = response?.data?.listCascadePaymentFlows?.items || [];
      console.log('listCascadePaymentFlows receiver response for', normalizedFilter || '(empty)', JSON.stringify(items, null, 2));
      setFlowAccounts(items);
      return items;
    } catch (error) {
      console.error(error);
      setFlowAccounts([]);
      return [];
    } finally {
      setLoadingSenderAccounts(false);
    }
  };

  const handleOpenSenderAccountPicker = async () => {
    setLoadingSenderAccountButton(true);
    setSenderAccountMode('SUBUNIT');
    setSelectedSenderAccount(null);
    setSelectedParentId('');
    setSenderAccountFilter('');
    setShowSenderAccountPicker(true);
    try {
      const loadedItems = await loadFlowAccounts();
      const matches = loadedItems.filter((account: any) => account.owner === (userEmail || ''));
      setSelectedParentId(matches[0]?.id || '');
    } finally {
      setLoadingSenderAccountButton(false);
    }
  };

  const handleOpenBusinessSearch = () => {
    try {
      if (!selectedParentId && !selectedSenderAccount) {
        Alert.alert('Please select a sender account before continuing to shopping.');
        return;
      }
      const senderAccountRef = selectedSenderAccount?.senderAccountRef || selectedSenderAccount?.recipientAccountRef || selectedSenderAccount?.accountNumber || '';
      const senderAccountName = selectedSenderAccount?.senderAccountName || selectedSenderAccount?.title || selectedSenderAccount?.name || '';
      navigation.navigate('CascadePayShopping', {
        fromCascadePayments: true,
        senderAccountRef,
        senderAccountName,
        senderFlowId: selectedParentId || selectedSenderAccount?.id || '',
        senderOwner: userEmail,
        recipientType,
      });
    } catch (error) {
      console.error('Failed to open business shopping screen', error);
      Alert.alert('Unable to open the shopping screen right now.');
    }
  };

  const handleCreateAccount = async () => {
    setSavingAccount(true);
    const profile = await hydrateUserContext();
    const resolvedName = profile.name || userName || 'Individual account';
    const resolvedEmail = profile.email || userEmail || '';
    const resolvedNationality = profile.nationality || accountNationality || 'Nationality not captured';

    let resolvedAccountName = resolvedName || 'Individual account';
    let resolvedAccountNumber = resolvedEmail || '';
    let flowInput: any = null;
    let accountRecipientType: RecipientType = 'BUSINESS';

    if (createMode === 'SUBUNIT') {
      if (!selectedParentFlow) {
        setSavingAccount(false);
        Alert.alert('Please select an existing CascadePaymentFlow to create the sub unit from.');
        return;
      }
      const selectedParentFlowId = `${selectedParentFlow.id || ''}`.trim();
      const selectedParentTitle = `${selectedParentFlow.title || selectedParentFlow.senderAccountName || 'Selected flow'}`.trim();
      resolvedAccountName = businessSenderAccountName.trim() || selectedParentTitle || 'Sub unit account';
      resolvedAccountNumber = `${selectedParentFlow.senderAccountRef || selectedParentFlow.recipientAccountRef || selectedParentFlow.id || ''}`.trim();
      accountRecipientType = 'SUBUNIT';
      setAccountName(resolvedAccountName);
      setAccountNumber(resolvedAccountNumber);
      flowInput = {
        owner: resolvedEmail || userEmail || '',
        title: selectedParentFlowId,
        description: accountDescription.trim() || `${selectedParentTitle} sub unit`,
        senderAccountRef: selectedParentFlow.senderAccountRef || resolvedAccountNumber,
        senderAccountName: resolvedAccountName,
        recipientAccountRef: selectedParentFlow.recipientAccountRef || resolvedAccountNumber,
        recipientAccountName: resolvedEmail,
        recipientType: selectedParentFlow.recipientType || 'SUBUNIT',
        amount: 0,
        currency: selectedParentFlow.currency || 'KES',
        status: selectedParentFlow.status || 'DRAFT',
        currentLevel: Number(selectedParentFlow.currentLevel || 1) + 1,
        totalDisbursed: 0,
        totalAllocated: 0,
        rootNodeId: selectedParentFlow.rootNodeId || selectedParentFlow.id || '',
      };
    } else {
      if (!selectedBizna) {
        setSavingAccount(false);
        Alert.alert('Please select one of your admin Bizna accounts first.');
        return;
      }
      resolvedAccountName = businessSenderAccountName.trim() || selectedBizna.busName || selectedBizna.BusKntct || 'Bizna account';
      resolvedAccountNumber = selectedBizna.BusKntct || '';
      accountRecipientType = 'BUSINESS';
      setAccountName(resolvedAccountName);
      setAccountNumber(resolvedAccountNumber);

      flowInput = {
        owner: resolvedEmail || userEmail || '',
        title: resolvedAccountName,
        description: accountDescription.trim() || `${resolvedAccountName} main unit`,
        senderAccountRef: resolvedAccountNumber,
        senderAccountName: resolvedAccountName,
        recipientAccountRef: resolvedAccountNumber,
        recipientAccountName: resolvedEmail,
        recipientType: 'BUSINESS',
        amount: 0,
        currency: 'KES',
        status: 'DRAFT',
        currentLevel: 1,
        totalDisbursed: 0,
        totalAllocated: 0,
      };
    }

    const account: CascadeAccount = {
      id: createAccountId(),
      name: resolvedAccountName,
      accountNumber: resolvedAccountNumber,
      recipientType: accountRecipientType,
      nationality: resolvedNationality.trim() || 'Nationality not captured',
      description: accountDescription.trim(),
      amountShared: 0,
      createdAt: new Date().toISOString(),
      owner: resolvedEmail || userEmail || '',
      children: [],
    };

    let createdFlowId = account.id;
    try {
      const response: any = await client.graphql({
        query: createCascadePaymentFlow,
        variables: {
          input: flowInput,
        },
      });
      createdFlowId = response?.data?.createCascadePaymentFlow?.id || createdFlowId;
    } catch (error) {
      console.error('Failed to create cascade payment flow', error);
    }

    setAccounts((current) => [...current, { ...account, id: createdFlowId }]);
    setSelectedParentId(createdFlowId);
    setSavingAccount(false);
    Alert.alert('Account created.');
    resetActionState();
  };

  const handleSendMoney = async () => {
    setSendingMoney(true);
    try {
      const normalizedRecipientType: RecipientType = recipientType;
      if (normalizedRecipientType === 'BUSINESS') {
        if (pendingBusinessCheckoutPayload) {
          const payload = pendingBusinessCheckoutPayload;
          setPendingBusinessCheckoutPayload(null);
          await finalizeBusinessCheckout(payload);
          return;
        }
        handleOpenBusinessSearch();
        return;
      }

      const selectedParent = findAccountById(accounts, selectedParentId || accounts[0]?.id || '') || (selectedSenderAccount ? ({
        id: selectedSenderAccount.id || selectedParentId || '',
        name: selectedSenderAccount.senderAccountName || selectedSenderAccount.title || selectedSenderAccount.name || '',
        accountNumber: selectedSenderAccount.senderAccountRef || selectedSenderAccount.recipientAccountRef || selectedSenderAccount.accountNumber || '',
        recipientType: (selectedSenderAccount.recipientType || 'SUBUNIT') as RecipientType,
        nationality: accountNationality.trim() || 'Nationality not captured',
        description: selectedSenderAccount.description || '',
        amountShared: 0,
        createdAt: new Date().toISOString(),
        owner: selectedSenderAccount.owner || userEmail || '',
        children: [],
      } as CascadeAccount) : null);
      if (!selectedParent) {
        Alert.alert('Create an account before sending money.');
        return;
      }
      if (!transferAmount || Number.isNaN(Number(transferAmount))) {
        Alert.alert('Please enter a valid amount.');
        return;
      }

      const recipientEmail = recipientIdentifier.trim();
      if (normalizedRecipientType === 'SUBUNIT' && !selectedRecipient?.id) {
        Alert.alert('Please select a sub unit flow before sending.');
        return;
      }
      if (normalizedRecipientType === 'INDIVIDUAL' && !recipientEmail) {
        Alert.alert('Please enter the recipient email.');
        return;
      }

      const amountValue = Number(transferAmount);
      const amountInKsh = await convertForeignToKsh(amountValue, userCurrencyKey || safeNationality || accountNationality || 'KE');
      let transactionFee = 0;
      let amountPaidToReceiver = amountInKsh;
      let totalAmountDeducted = amountInKsh;
      try {
        const companyResponse: any = await client.graphql({
          query: getCompany,
          variables: { AdminId: 'BaruchHabaB\'ShemAdonai2' },
        });
        const company = companyResponse?.data?.getCompany;
        const feeRate = Number(company?.cascadePaymentFee ?? company?.userTransferFee ?? 0);
        transactionFee = amountInKsh * feeRate;
        amountPaidToReceiver = amountInKsh;
        totalAmountDeducted = amountInKsh + transactionFee;
      } catch (error) {
        console.error('Failed to fetch company fee rate', error);
      }

      const fundsCheck = await ensureSufficientSenderFunds(totalAmountDeducted);
      if (!fundsCheck.hasFunds) {
        Alert.alert('Insufficient funds', 'You do not have enough available balance to cover this transfer and fees.');
        return;
      }

      const effectiveRecipientRef = normalizedRecipientType === 'SUBUNIT'
        ? (selectedRecipient?.recipientAccountRef || selectedRecipient?.senderAccountRef || recipientEmail || selectedParent.accountNumber || '')
        : recipientEmail;

      const childAccount: CascadeAccount = {
        id: createAccountId(),
        name: selectedRecipient?.name || (normalizedRecipientType === 'INDIVIDUAL' ? 'Individual recipient' : 'Sub unit recipient'),
        accountNumber: effectiveRecipientRef,
        recipientType: normalizedRecipientType,
        nationality: accountNationality.trim() || 'Nationality not captured',
        description: transferDescription.trim(),
        amountShared: amountInKsh,
        createdAt: new Date().toISOString(),
        parentId: selectedParent.id,
        owner: userEmail || '',
        children: [],
      };

      setAccounts((current) => attachChildToParent(current, selectedParent.id, childAccount));

      let recipientName = normalizedRecipientType === 'SUBUNIT'
        ? (selectedRecipient?.senderAccountName || selectedRecipient?.title || childAccount.name)
        : recipientEmail;

      try {
        const ownerEmail = userEmail || (await hydrateUserContext()).email || '';
        if (normalizedRecipientType === 'INDIVIDUAL' && recipientEmail) {
          const recipientSmResponse: any = await client.graphql({
            query: getSMAccount,
            variables: { awsemail: recipientEmail },
          });
          const recipientSmAccount = recipientSmResponse?.data?.getSMAccount || {};
          recipientName = recipientSmAccount?.name || recipientEmail;
        }
        const flowResponse: any = await client.graphql({
          query: getCascadePaymentFlow,
          variables: { id: selectedParent.id },
        });
        const currentFlow = flowResponse?.data?.getCascadePaymentFlow || {};
        const nextFlowAmount = Number(currentFlow.amount || 0) + transactionFee;
        const nextTotalDisbursed = Number(currentFlow.totalDisbursed || 0) + amountInKsh;
        await client.graphql({
          query: createCascadePaymentNode,
          variables: {
            input: {
              owner: ownerEmail,
              flowId: selectedParent.id,
              parentNodeId: selectedParent.id,
              level: Number(currentFlow.currentLevel || 1) + 1,
              senderAccountRef: selectedParent.accountNumber || '',
              senderAccountName: selectedParent.name || '',
              recipientAccountRef: effectiveRecipientRef,
              recipientAccountName: recipientName,
              recipientType: normalizedRecipientType,
              amount: amountInKsh,
              description: transferDescription.trim() || 'Cascade payment node',
              isLeaf: true,
              childCount: 0,
              subtotal: totalAmountDeducted,
            },
          },
        });
        await client.graphql({
          query: updateCascadePaymentFlow,
          variables: {
            input: {
              id: selectedParent.id,
              amount: nextFlowAmount,
              totalDisbursed: nextTotalDisbursed,
            },
          },
        });
        if (normalizedRecipientType === 'SUBUNIT' && selectedRecipient?.id) {
          const recipientFlowResponse: any = await client.graphql({
            query: getCascadePaymentFlow,
            variables: { id: selectedRecipient.id },
          });
          const recipientFlow = recipientFlowResponse?.data?.getCascadePaymentFlow || {};
          const nextRecipientAmount = Number(recipientFlow.amount || 0) + transactionFee;
          const nextRecipientAllocated = Math.max(0, Number(recipientFlow.totalAllocated || 0) + amountInKsh);
          await client.graphql({
            query: updateCascadePaymentFlow,
            variables: {
              input: {
                id: selectedRecipient.id,
                amount: nextRecipientAmount,
                totalAllocated: nextRecipientAllocated,
              },
            },
          });
        }
        if (normalizedRecipientType === 'INDIVIDUAL' && recipientEmail) {
          const recipientSmResponse: any = await client.graphql({
            query: getSMAccount,
            variables: { awsemail: recipientEmail },
          });
          const recipientSmAccount = recipientSmResponse?.data?.getSMAccount || {};
          const nextRecipientBalance = Number(recipientSmAccount?.balance || 0) + amountInKsh;
          await client.graphql({
            query: updateSMAccount,
            variables: {
              input: {
                awsemail: recipientEmail,
                balance: nextRecipientBalance,
              },
            },
          });
        }
        const notificationTarget = normalizedRecipientType === 'SUBUNIT'
          ? (selectedRecipient?.owner || ownerEmail || recipientEmail || userEmail || '')
          : (recipientEmail || ownerEmail || userEmail || '');
        const notificationBody = `Cascade payment of ${formatAmountSync(amountInKsh, userCurrencyKey, ratesMap)} has been processed for ${recipientName}.`;
        await dispatchCascadeNotifications(notificationTarget, 'Cascade payment updated', notificationBody);
      } catch (error) {
        console.error('Failed to create cascade payment node', error);
      }

      const successTitle = normalizedRecipientType === 'INDIVIDUAL' ? 'Sending money was successful' : 'Money shared to child account.';
      const successMessage = normalizedRecipientType === 'INDIVIDUAL'
        ? `Sending money to ${recipientName} was successful.`
        : `Sent ${formatAmountSync(amountInKsh, userCurrencyKey, ratesMap)} to ${recipientName}.`;
      Alert.alert(successTitle, successMessage);
      resetActionState();
    } finally {
      setSendingMoney(false);
    }
  };

  const openChildModal = (account: CascadeAccount) => {
    setViewedAccount(account);
    setChildrenModalVisible(true);
  };

  const renderAccountCard = (account: CascadeAccount, level = 0) => (
    <View key={account.id} style={[styles.card, { marginLeft: level * 10 }]}> 
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{account.name}</Text>
        <Text style={styles.badge}>{account.recipientType}</Text>
      </View>
      <Text style={styles.metaText}>{`${t.accountNumberLabel}: ${account.accountNumber}`}</Text>
      <Text style={styles.metaText}>{`${t.nationalityLabel}: ${account.nationality}`}</Text>
      <Text style={styles.metaText}>{`${t.totalSharedLabel}: ${formatMoneyForUser(getAccountSummaryTotal(account))}`}</Text>
      <Text style={styles.metaText}>{`${t.createdLabel}: ${new Date(account.createdAt).toLocaleString()}`}</Text>
      <Text style={styles.metaText}>{`${t.descriptionLabel}: ${account.description || '—'}`}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => openChildModal(account)}>
          <Text style={styles.secondaryButtonText}>{t.viewChildren}</Text>
        </TouchableOpacity>
      </View>
      {account.children.length > 0 ? (
        <View style={styles.childList}>
          {account.children.map((child) => renderAccountCard(child, level + 1))}
        </View>
      ) : null}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.subtitle}>{t.subtitle}</Text>

      <TouchableOpacity style={styles.button} onPress={() => { setShowOptions(true); setActiveAction(null); }}>
        <Text style={styles.buttonText}>{t.openCascadeActions}</Text>
      </TouchableOpacity>

      <Modal transparent visible={showOptions} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.chooseAction}</Text>
            <TouchableOpacity style={styles.optionButton} onPress={() => { setActiveAction('create'); setShowOptions(false); }}>
              <Text style={styles.optionButtonText}>{t.createAccount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => { setActiveAction('send'); setShowOptions(false); }}>
              <Text style={styles.optionButtonText}>{t.sendMoney}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => { setActiveAction('view'); setShowOptions(false); }}>
              <Text style={styles.optionButtonText}>{t.viewAccount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowOptions(false)}>
              <Text style={styles.cancelButtonText}>{t.closeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={activeAction === 'create'} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.createModalCard]}>
            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.createModalContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>{t.createAccountModalTitle}</Text>
              <View style={styles.row}>
              {([
                { key: 'MAIN', label: t.createMainUnit },
                { key: 'SUBUNIT', label: t.createSubUnit },
              ] as const).map((mode) => (
                <TouchableOpacity key={mode.key} style={[styles.pill, createMode === mode.key && styles.pillActive]} onPress={() => {
                  setCreateMode(mode.key);
                  if (mode.key === 'MAIN') {
                    setSelectedParentFlow(null);
                    setShowParentFlowSelector(false);
                    setShowBiznaSelector(false);
                    setSelectedBizna(null);
                    setBiznaFilterText('');
                  } else {
                    setShowBiznaSelector(false);
                    setSelectedBizna(null);
                    setParentFlowFilterText('');
                  }
                }}>
                  <Text style={[styles.pillText, createMode === mode.key && styles.pillTextActive]}>{mode.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder={t.descriptionPlaceholder} value={accountDescription} onChangeText={setAccountDescription} multiline />
            {createMode === 'SUBUNIT' ? (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder={t.unitNamePlaceholder}
                  value={businessSenderAccountName}
                  onChangeText={setBusinessSenderAccountName}
                />
                <View style={styles.selectorBox}>
                  <Text style={styles.helperText}>{t.selectParentFlowPrompt}</Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={async () => {
                    setShowParentFlowSelector(true);
                    const items = await loadFlowAccounts(parentFlowFilterText);
                    const ownedItems = items.filter((account: any) => `${account.owner || ''}`.toLowerCase() === (userEmail || '').toLowerCase());
                    setFlowAccounts(ownedItems);
                  }}>
                    <Text style={styles.secondaryButtonText}>{selectedParentFlow ? `${t.selectedLabel} ${selectedParentFlow.senderAccountName || selectedParentFlow.title || selectedParentFlow.id}` : t.selectParentFlow}</Text>
                  </TouchableOpacity>
                  {showParentFlowSelector ? (
                    <View style={styles.selectorBox}>
                      <TextInput
                        style={styles.input}
                        placeholder={t.filterParentFlowPlaceholder}
                        value={parentFlowFilterText}
                        onChangeText={(text) => {
                          setParentFlowFilterText(text);
                        }}
                        autoCapitalize="none"
                      />
                      {loadingSenderAccounts ? (
                        <View style={styles.statusBanner}>
                          <ActivityIndicator size="small" color="#ff8c00" />
                          <Text style={styles.statusText}>{t.loadingParentFlows}</Text>
                        </View>
                      ) : null}
                      {!loadingSenderAccounts && filteredParentFlows.length > 0 ? (
                        <ScrollView style={styles.optionListScroll} contentContainerStyle={styles.optionList} nestedScrollEnabled>
                          {filteredParentFlows.map((item: any) => (
                            <TouchableOpacity key={item.id} style={styles.optionButton} onPress={() => {
                              setSelectedParentFlow(item);
                              setShowParentFlowSelector(false);
                              setSelectedParentId(item.id || '');
                            }}>
                              <Text style={styles.optionButtonText}>{item.senderAccountName || item.title || item.id}</Text>
                              <Text style={styles.helperText}>{item.senderAccountRef || item.recipientAccountRef || ''}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                      {!loadingSenderAccounts && filteredParentFlows.length === 0 ? (
                        <View style={styles.statusBanner}>
                          <Text style={styles.statusText}>{t.noParentFlowsFound}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder={t.senderAccountNamePlaceholder}
                  value={businessSenderAccountName}
                  onChangeText={setBusinessSenderAccountName}
                />
                <TouchableOpacity style={styles.secondaryButton} onPress={() => { setShowBiznaSelector(true); loadBiznaOptions(); }}>
                  <Text style={styles.secondaryButtonText}>{selectedBizna ? `${t.selectedLabel} ${selectedBizna.busName || selectedBizna.BusKntct}` : t.selectBiznaAccount}</Text>
                </TouchableOpacity>
                {showBiznaSelector ? (
                  <View style={styles.selectorBox}>
                    <TextInput
                      style={styles.input}
                      placeholder={t.filterBiznaPlaceholder}
                      value={biznaFilterText}
                      onChangeText={setBiznaFilterText}
                      autoCapitalize="none"
                    />
                    {loadingBiznas ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#ff8c00" />
                        <Text style={styles.helperText}>{t.loadingBiznas}</Text>
                      </View>
                    ) : null}
                    {!loadingBiznas && filteredBiznas.length > 0 ? (
                      <ScrollView style={styles.optionListScroll} contentContainerStyle={styles.optionList} nestedScrollEnabled>
                        {filteredBiznas.map((item) => (
                          <TouchableOpacity key={item.BusKntct} style={styles.optionButton} onPress={() => { setSelectedBizna(item); setShowBiznaSelector(false); }}>
                            <Text style={styles.optionButtonText}>{item.busName || item.BusKntct}</Text>
                            <Text style={styles.helperText}>{item.BusKntct}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : null}
                    {!loadingBiznas && filteredBiznas.length === 0 ? (
                      <Text style={styles.helperText}>{t.noAdminBiznasFound}</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            )}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.button} onPress={handleCreateAccount} disabled={savingAccount}>
                  {savingAccount ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.buttonText}>{t.savingButton}</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>{t.saveAccountButton}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setActiveAction(null)} disabled={savingAccount}>
                  <Text style={styles.secondaryButtonText}>{t.closeLabel}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={activeAction === 'send'} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              bounces={true}
            >
              <Text style={styles.modalTitle}>{t.sendMoney}</Text>
              <Text style={styles.helperText}>{t.senderAccountPrompt}</Text>
              <View style={styles.sectionCard}>
                {senderSelectionStep ? (
                  <>
                    <TouchableOpacity
                      style={[styles.pill, styles.pillActive]}
                      onPress={() => {
                        void handleOpenSenderAccountPicker();
                      }}
                      disabled={loadingSenderAccountButton || loadingSenderAccounts}
                    >
                      {(loadingSenderAccountButton || loadingSenderAccounts) ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={[styles.pillText, styles.pillTextActive]}>{t.senderAccountLabel}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.pillText, styles.pillTextActive]}>{t.senderAccountLabel}</Text>
                      )}
                    </TouchableOpacity>
                    {showSenderAccountPicker ? (
                      <View style={styles.selectorBox}>
                        <Text style={styles.helperText}>{t.senderAccountHint}</Text>
                        <TextInput
                          style={styles.input}
                          placeholder={t.filterSenderAccountsPlaceholder}
                          value={senderAccountFilter}
                          onChangeText={async (text) => {
                            setSenderAccountFilter(text);
                            await loadFlowAccounts(text);
                          }}
                        />
                        {loadingSenderAccounts ? (
                          <View style={styles.statusBanner}>
                            <ActivityIndicator size="small" color="#ff8c00" />
                            <Text style={styles.statusText}>{t.loadingSenderAccounts}</Text>
                          </View>
                        ) : null}
                        {!loadingSenderAccounts && filteredSenderAccounts.length > 0 ? (
                          <ScrollView style={styles.optionListScroll} contentContainerStyle={styles.optionList} nestedScrollEnabled>
                            {filteredSenderAccounts.map((item: any) => (
                              <TouchableOpacity
                                key={item.id}
                                style={styles.optionButton}
                                onPress={() => {
                                  setSelectedParentId(item.id);
                                  setSelectedSenderAccount(item);
                                  setSenderSelectionStep(false);
                                  setShowSenderAccountPicker(false);
                                }}
                              >
                                <Text style={styles.optionButtonText}>{item.senderAccountName || item.title || t.senderAccountLabel}</Text>
                                <Text style={styles.helperText}>{item.senderAccountRef || item.recipientAccountRef || ''}</Text>
                                <Text style={styles.helperText}>{item.owner || ''}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        ) : null}
                        {!loadingSenderAccounts && filteredSenderAccounts.length === 0 ? (
                          <View style={styles.statusBanner}>
                            <Text style={styles.statusText}>{t.noMatchingSenderAccounts}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.selectorBox}>
                    <View style={styles.selectedSenderHeader}>
                      <Text style={styles.helperText}>{t.senderAccountSelectedLabel}</Text>
                      <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={async () => {
                          setSelectedSenderAccount(null);
                          setSelectedParentId('');
                          setSenderSelectionStep(true);
                          setShowSenderAccountPicker(true);
                          await loadFlowAccounts();
                        }}
                      >
                        <Ionicons name="refresh" size={18} color="#ff8c00" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.optionButtonText}>{selectedSenderAccount?.senderAccountName || selectedSenderAccount?.title || t.selectedSenderLabel}</Text>
                    <Text style={styles.helperText}>{selectedSenderAccount?.senderAccountRef || selectedSenderAccount?.recipientAccountRef || ''}</Text>
                    <Text style={styles.helperText}>{`${t.senderAccountBalanceLabel}: ${formatMoneyForUser(Number(selectedSenderAccount?.totalAllocated || 0) - Number(selectedSenderAccount?.totalDisbursed || 0))}`}</Text>
                  </View>
                )}
              </View>
              <View style={styles.sectionCard}>
                <View style={styles.row}>
                  {(['SUBUNIT', 'BUSINESS', 'INDIVIDUAL'] as const).map((type) => (
                    <TouchableOpacity key={type} style={[styles.pill, recipientType === type && styles.pillActive]} onPress={async () => {
                      setRecipientType(type);
                      setRecipientSelectionStep(true);
                      setSelectedRecipient(null);
                      setRecipientIdentifier(type === 'BUSINESS' ? businessRecipientAccountNumber : '');
                      setRecipientAccountFilter('');
                      if (type === 'SUBUNIT') {
                        await loadRecipientAccountsByName('');
                      }
                    }}>
                      <Text style={[styles.pillText, recipientType === type && styles.pillTextActive]}>{type === 'SUBUNIT' ? 'Sub unit' : type === 'BUSINESS' ? 'Business' : 'Individual'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {recipientType === 'SUBUNIT' ? (
                  <View style={styles.selectorBox}>
                    {selectedRecipient ? (
                      <>
                        <View style={styles.selectedSenderHeader}>
                          <Text style={styles.helperText}>{t.selectedSubUnitReceiver}</Text>
                          <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={() => {
                              setSelectedRecipient(null);
                              setRecipientIdentifier('');
                              setRecipientAccountFilter('');
                              setRecipientSelectionStep(true);
                            }}
                          >
                            <Ionicons name="refresh" size={18} color="#ff8c00" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.optionButtonText}>{selectedRecipient?.senderAccountName || selectedRecipient?.title || t.selectedReceiverLabel}</Text>
                        <Text style={styles.helperText}>{selectedRecipient?.recipientAccountRef || selectedRecipient?.senderAccountRef || ''}</Text>
                        <Text style={styles.helperText}>{selectedRecipient?.owner || ''}</Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.selectedSenderHeader}>
                          <Text style={styles.helperText}>{t.selectReceiverLabel}</Text>
                        </View>
                        <TextInput
                          style={styles.input}
                          placeholder={t.searchReceiverPlaceholder}
                          value={recipientAccountFilter}
                          onChangeText={async (text) => {
                            setRecipientAccountFilter(text);
                            await loadRecipientAccountsByName(text);
                          }}
                        />
                        {filteredRecipientAccounts.length > 0 ? (
                          <ScrollView style={styles.optionListScroll} contentContainerStyle={styles.optionList} nestedScrollEnabled>
                            {filteredRecipientAccounts.map((item: any) => (
                              <TouchableOpacity
                                key={item.id}
                                style={styles.optionButton}
                                onPress={() => {
                                  setSelectedRecipient(item);
                                  setRecipientIdentifier(item.recipientAccountRef || item.senderAccountRef || '');
                                  setRecipientAccountFilter('');
                                  setRecipientSelectionStep(false);
                                }}
                              >
                                <Text style={styles.optionButtonText}>{item.senderAccountName || t.receiverAccountLabel}</Text>
                                <Text style={styles.helperText}>{item.recipientAccountRef || item.senderAccountRef || ''}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        ) : (
                          <View style={styles.statusBanner}>
                            <Text style={styles.statusText}>{t.noReceiverFound}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                ) : recipientType === 'BUSINESS' ? (
                  <View style={styles.selectorBox}>
                    {businessRecipientAccountNumber ? (
                      <>
                        <Text style={styles.helperText}>{t.businessReceiverSelected}</Text>
                        <Text style={styles.optionButtonText}>{businessRecipientAccountNumber}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.helperText}>{t.businessReceiverHint}</Text>
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenBusinessSearch}>
                          <Text style={styles.secondaryButtonText}>{t.continueShopping}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {pendingBusinessCheckoutPayload ? (
                      <Text style={styles.helperText}>{t.checkoutReadyHint}</Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.selectorBox}>
                    <TextInput
                      style={styles.input}
                      placeholder={t.recipientEmailPlaceholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={recipientIdentifier}
                      onChangeText={setRecipientIdentifier}
                    />
                  </View>
                )}
              </View>
              {recipientType !== 'BUSINESS' ? (
                <>
                  <TextInput style={styles.input} placeholder={t.amountPlaceholder} keyboardType="numeric" value={transferAmount} onChangeText={setTransferAmount} />
                  <TextInput style={styles.input} placeholder={t.descriptionPlaceholder} value={transferDescription} onChangeText={setTransferDescription} multiline />
                </>
              ) : (
                <TextInput style={styles.input} placeholder={t.descriptionPlaceholder} value={transferDescription} onChangeText={setTransferDescription} multiline />
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.button} onPress={handleSendMoney} disabled={sendingMoney}>
                  {sendingMoney ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.buttonText}>{t.sendingButton}</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>{t.sendButton}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setActiveAction(null)} disabled={sendingMoney}>
                  <Text style={styles.secondaryButtonText}>{t.closeLabel}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={activeAction === 'view'} animationType="slide">
        <View style={[styles.modalBackdrop, styles.viewModalBackdrop]}>
          <View style={[styles.modalCard, styles.viewModalCard]}>
            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>{t.viewAccountTitle}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={() => { void loadOwnedCascadeFlows(); }}>
                  <Ionicons name="refresh" size={18} color="#ff8c00" />
                </TouchableOpacity>
              </View>
              {loadingOwnedFlows ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#ff8c00" />
                  <Text style={styles.helperText}>{t.loadingOwnedFlows}</Text>
                </View>
              ) : null}
              {!loadingOwnedFlows && ownedCascadeFlows.length > 0 ? (
                <ScrollView style={styles.viewOptionListScroll} contentContainerStyle={styles.optionList} nestedScrollEnabled>
                  {ownedCascadeFlows.map((flow: any) => {
                    const subunits = subunitFlowsByFlowId[flow.id] || [];
                    const transactions = transactionNodesByFlowId[flow.id] || [];
                    const activeView = viewSectionByFlowId[flow.id];
                    return (
                      <View key={flow.id} style={styles.viewSelectorBox}>
                        <View style={[styles.row, styles.cardHeader]}>
                          <View style={styles.row}>
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => setExpandedFlowIds((current) => ({ ...current, [flow.id]: !current[flow.id] }))}
                            >
                              <Ionicons
                                name={expandedFlowIds[flow.id] ? 'chevron-down' : 'chevron-forward'}
                                size={18}
                                color="#ff8c00"
                              />
                            </TouchableOpacity>
                            <Text style={[styles.optionButtonText, { marginLeft: 10 }]}>{flow.senderAccountName || flow.title || flow.id}</Text>
                          </View>
                        </View>
                        {expandedFlowIds[flow.id] ? (
                          <>
                            <Text style={styles.helperText}>{`${t.descriptionLabel}: ${flow.description || '—'}`}</Text>
                            <Text style={styles.helperText}>{`${t.totalAllocatedLabel}: ${formatMoneyForUser(flow.totalAllocated)}`}</Text>
                            <Text style={styles.helperText}>{`${t.totalDisbursedLabel}: ${formatMoneyForUser(flow.totalDisbursed)}`}</Text>
                            {flow.currentLevel === 1 ? (
                          <View style={{ marginBottom: 10 }}>
                            <TouchableOpacity
                              style={styles.secondaryButton}
                              onPress={() => {
                                setShowAddFundsByFlowId((current) => ({ ...current, [flow.id]: !current[flow.id] }));
                                if (!showAddFundsByFlowId[flow.id]) {
                                  setSelectedAddFundsBizna(null);
                                  setAddFundsAmount('');
                                  setAddFundsPassword('');
                                  loadAddFundsBiznaOptions();
                                }
                              }}
                            >
                              <Text style={styles.secondaryButtonText}>{t.addFundsButton}</Text>
                            </TouchableOpacity>
                            {showAddFundsByFlowId[flow.id] ? (
                              <View style={styles.selectorBox}>
                                <TouchableOpacity
                                  style={styles.secondaryButton}
                                  onPress={() => loadAddFundsBiznaOptions()}
                                >
                                  <Text style={styles.secondaryButtonText}>
                                    {selectedAddFundsBizna ? `${t.selectedLabel} ${selectedAddFundsBizna.busName || selectedAddFundsBizna.BusKntct}` : t.selectBiznaAccount}
                                  </Text>
                                </TouchableOpacity>
                                {showAddFundsBiznaSelector ? (
                                  <View style={styles.selectorBox}>
                                    <TextInput
                                      style={styles.input}
                                      placeholder={t.filterBiznaPlaceholder}
                                      value={addFundsBiznaFilterText}
                                      onChangeText={setAddFundsBiznaFilterText}
                                      autoCapitalize="none"
                                    />
                                    {loadingAddFundsBiznas ? (
                                      <View style={styles.loadingRow}>
                                        <ActivityIndicator size="small" color="#ff8c00" />
                                        <Text style={styles.helperText}>{t.loadingBiznas}</Text>
                                      </View>
                                    ) : null}
                                    {!loadingAddFundsBiznas && filteredAddFundsBiznas.length > 0 ? (
                                      <ScrollView style={styles.optionListScroll} contentContainerStyle={styles.optionList} nestedScrollEnabled>
                                        {filteredAddFundsBiznas.map((item) => (
                                          <TouchableOpacity
                                            key={item.BusKntct}
                                            style={styles.optionButton}
                                            onPress={() => {
                                              setSelectedAddFundsBizna(item);
                                              setShowAddFundsBiznaSelector(false);
                                            }}
                                          >
                                            <Text style={styles.optionButtonText}>{item.busName || item.BusKntct}</Text>
                                            <Text style={styles.helperText}>{item.BusKntct}</Text>
                                            <Text style={styles.helperText}>{`${t.totalAmountLabel}: ${formatMoneyForUser(Number(item.earningsBal || 0))}`}</Text>
                                          </TouchableOpacity>
                                        ))}
                                      </ScrollView>
                                    ) : null}
                                    {!loadingAddFundsBiznas && filteredAddFundsBiznas.length === 0 ? (
                                      <Text style={styles.helperText}>{t.noAdminBiznasFound}</Text>
                                    ) : null}
                                  </View>
                                ) : null}
                                <TextInput
                                  style={styles.input}
                                  placeholder={t.amountFieldPlaceholder}
                                  value={addFundsAmount}
                                  onChangeText={setAddFundsAmount}
                                  keyboardType="numeric"
                                />
                                <TextInput
                                  style={styles.input}
                                  placeholder={t.passwordPlaceholder}
                                  value={addFundsPassword}
                                  onChangeText={setAddFundsPassword}
                                  secureTextEntry
                                />
                                <TouchableOpacity
                                  style={styles.button}
                                  onPress={() => handleAddFundsFromBiznaToFlow(flow.id)}
                                  disabled={addingFunds}
                                >
                                  {addingFunds ? (
                                    <View style={styles.loadingRow}>
                                      <ActivityIndicator size="small" color="#fff" />
                                      <Text style={styles.buttonText}>{t.savingButton}</Text>
                                    </View>
                                  ) : (
                                    <Text style={styles.buttonText}>{t.addFundsButton}</Text>
                                  )}
                                </TouchableOpacity>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                        <View style={styles.inlineButtonRow}>
                          <TouchableOpacity style={styles.secondaryButton} onPress={() => loadSubunitFlowsForFlow(flow.id)}>
                            <Text style={styles.secondaryButtonText}>{t.viewSubUnits}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.secondaryButton} onPress={() => loadTransactionsForFlow(flow.id)}>
                            <Text style={styles.secondaryButtonText}>{t.viewTransaction}</Text>
                          </TouchableOpacity>
                        </View>
                        {activeView === 'subunits' ? (
                          <View>
                            {loadingSubunitsByFlowId[flow.id] ? (
                              <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#ff8c00" />
                                <Text style={styles.helperText}>{t.loadingSubUnits}</Text>
                              </View>
                            ) : null}
                            {!loadingSubunitsByFlowId[flow.id] && subunits.length > 0 ? (
                              subunits.map((subunit: any) => renderCascadeFlowCard(subunit))
                            ) : null}
                            {!loadingSubunitsByFlowId[flow.id] && subunits.length === 0 ? (
                              <Text style={styles.helperText}>{t.noSubUnitsFound}</Text>
                            ) : null}
                          </View>
                        ) : null}
                        {activeView === 'transactions' ? (
                          <View>
                            {loadingTransactionsByFlowId[flow.id] ? (
                              <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#ff8c00" />
                                <Text style={styles.helperText}>{t.loadingTransactions}</Text>
                              </View>
                            ) : null}
                            {!loadingTransactionsByFlowId[flow.id] && transactions.length > 0 ? (
                              transactions.map((node: any) => {
                                const subtotalValue = Number(node?.subtotal ?? node?.subTotal ?? 0);
                                const amountValue = Number(node?.amount ?? 0);
                                const totalAmountValue = subtotalValue;
                                const subTotalValue = amountValue;
                                const feesValue = Math.max(0, totalAmountValue - subTotalValue);
                                const receiverName = node?.recipientAccountName || node?.recipientName || node?.recipientAccountRef || '—';
                                const receiverRef = node?.recipientAccountRef || '—';
                                return (
                                  <View key={node.id} style={styles.optionButton}>
                                    <Text style={styles.optionButtonText}>{node.description || t.cascadeTransactionLabel}</Text>
                                    <Text style={styles.helperText}>{`${t.payerLabel}: ${node.senderAccountName || '—'}`}</Text>
                                    <Text style={styles.helperText}>{`Receiver Name: ${receiverName}`}</Text>
                                    <Text style={styles.helperText}>{`Receiver Account: ${receiverRef}`}</Text>
                                    <Text style={styles.helperText}>{`${t.recipientTypeLabel}: ${node.recipientType || '—'}`}</Text>
                                    <Text style={styles.helperText}>{`${t.totalAmountLabel}: ${formatMoneyForUser(totalAmountValue)}`}</Text>
                                    <Text style={styles.helperText}>{`${t.subTotalLabel}: ${formatMoneyForUser(subTotalValue)}`}</Text>
                                    <Text style={styles.helperText}>{`${t.feesLabel}: ${formatMoneyForUser(feesValue)}`}</Text>
                                  </View>
                                );
                              })
                            ) : null}
                            {!loadingTransactionsByFlowId[flow.id] && transactions.length === 0 ? (
                              <Text style={styles.helperText}>{t.noTransactionsFound}</Text>
                            ) : null}
                          </View>
                        ) : null}
                      </>
                    ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              ) : null}
              {!loadingOwnedFlows && ownedCascadeFlows.length === 0 ? (
                <Text style={styles.helperText}>{t.noFlowAccountsFound}</Text>
              ) : null}
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setActiveAction(null)}>
                <Text style={styles.secondaryButtonText}>{t.closeLabel}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={childrenModalVisible} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{viewedAccount?.name || t.childrenLabel}</Text>
            {viewedAccount?.children && viewedAccount.children.length > 0 ? (
              viewedAccount.children.map((child) => (
                <TouchableOpacity key={child.id} style={styles.childRow} onPress={() => openChildModal(child)}>
                  <Text style={styles.childRowTitle}>{child.name}</Text>
                  <Text style={styles.metaText}>{`${child.recipientType} • ${child.accountNumber}`}</Text>
                  <Text style={styles.metaText}>{`${t.sharedLabel}: ${child.amountShared.toFixed(2)}`}</Text>
                  <Text style={styles.metaText}>{`${t.descriptionLabel}: ${child.description || '—'}`}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.helperText}>{t.noChildrenAttached}</Text>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setChildrenModalVisible(false)}>
              <Text style={styles.secondaryButtonText}>{t.closeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ff8c00',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  viewModalBackdrop: {
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingBottom: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    maxHeight: '96%',
    width: '100%',
    minHeight: '88%',
    flex: 1,
    overflow: 'hidden',
  },
  createModalCard: {
    minHeight: '95%',
    maxHeight: '98%',
    paddingVertical: 18,
  },
  viewModalCard: {
    minHeight: '90%',
    maxHeight: '98%',
    paddingVertical: 18,
    flex: 0,
    marginTop: 8,
    marginBottom: 8,
  },
  modalScrollView: {
    flex: 1,
    minHeight: 0,
  },
  createModalContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  optionButton: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#fff5e6',
    borderColor: '#ff8c00',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  optionButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: '#f0d1a0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fffdf8',
  },
  optionList: {
    gap: 8,
    paddingBottom: 4,
  },
  optionListScroll: {
    maxHeight: 420,
    minHeight: 260,
    borderWidth: 1,
    borderColor: '#f4e1bc',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    backgroundColor: '#fffefb',
  },
  viewOptionListScroll: {
    flexGrow: 1,
    minHeight: 360,
    maxHeight: 620,
    borderWidth: 1,
    borderColor: '#f4e1bc',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
    backgroundColor: '#fffefb',
  },
  cancelButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#d9534f',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#ff8c00',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: '#ff8c00',
  },
  pillText: {
    color: '#ff8c00',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  helperText: {
    color: '#444',
    marginBottom: 10,
  },
  selectedSenderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#fff5e6',
    borderWidth: 1,
    borderColor: '#ff8c00',
  },
  visibleText: {
    color: '#111',
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#fff7e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcc80',
    minHeight: 44,
  },
  statusText: {
    color: '#111',
    fontWeight: '700',
    flexShrink: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  selectorBox: {
    borderWidth: 1,
    borderColor: '#f0d1a0',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    maxHeight: 520,
    minHeight: 260,
    backgroundColor: '#fffefb',
    overflow: 'hidden',
  },
  viewSelectorBox: {
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#f0d1a0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    minHeight: 320,
    backgroundColor: '#fffefb',
    overflow: 'hidden',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  inlineButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontWeight: '700',
    flexShrink: 1,
  },
  badge: {
    backgroundColor: '#ff8c00',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  metaText: {
    color: '#444',
    marginBottom: 4,
  },
  cardActions: {
    marginTop: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#fff5e6',
    borderWidth: 1,
    borderColor: '#ff8c00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nestedSubunitList: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 10,
    paddingLeft: 0,
    paddingRight: 0,
    marginRight: 0,
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
  },
  cascadeCard: {
    width: '100%',
    minWidth: '100%',
    alignSelf: 'stretch',
  },
  childList: {
    marginTop: 8,
  },
  childRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
  },
  childRowTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
});

export default CascadePaymentsScreen;
