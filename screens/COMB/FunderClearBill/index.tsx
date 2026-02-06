// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { listCombContractVouchers, getSMAccount, getBizna, getCompany, getCombContract } from '../../../src/graphql/queries';
import { updateCombContractVoucher, updateSMAccount, updateBizna, createNonLoans, updateCompany, createMessages, sendNotification, updateCombContract } from '../../../src/graphql/mutations';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, convertKshToUserCurrency } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
const client = generateClient();

/* -------------------- Voucher Card -------------------- */
const VoucherCard = ({
  voucher,
  onClear,
  onDecline,
  loadingMap
}: any) => {
  const { nationality, ratesMap } = useExchange();
  const isClearing = loadingMap[voucher.id]?.clearing;
  const isDeclining = loadingMap[voucher.id]?.declining;
  const sellerNat = voucher.sellerNationality || nationality;
  const funderNat = voucher.funderNationality || nationality;
  const sellerCode = nationalityToCode(sellerNat);
  const funderCode = nationalityToCode(funderNat);
  const unitPrice = Number(voucher.itemPrice);
  const totalAmount = unitPrice * Number(voucher.numberOfItems);
  
  return <View style={styles.voucherCard}>
      <Text style={styles.title}>
        {voucher.itemName} ({voucher.itemBrand})
      </Text>
      <Text>Specifications: {voucher.itemSpecifications || '-'}</Text>
      
      <View style={{ marginVertical: 8, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>💰 Price in Different Currencies:</Text>
        <Text>🏪 Seller Currency ({sellerNat}): {formatAmountSync(unitPrice, sellerCode, ratesMap)}</Text>
        <Text>💳 Funder Currency ({funderNat}): {formatAmountSync(unitPrice, funderCode, ratesMap)}</Text>
        <Text style={{ marginTop: 6, fontWeight: 'bold' }}>Total Amount:</Text>
        <Text>🏪 Seller: {formatAmountSync(totalAmount, sellerCode, ratesMap)}</Text>
        <Text>💳 Funder: {formatAmountSync(totalAmount, funderCode, ratesMap)}</Text>
      </View>
      
      <Text>Number of Items: {voucher.numberOfItems}</Text>

      <Text style={styles.section}>Consumer</Text>
      <Text>Name: {voucher.consumerName}</Text>
      <Text>Account: {voucher.consumerAccount}</Text>
      <Text>Email: {voucher.consumerEmail || '-'}</Text>

      <Text style={styles.section}>Funder</Text>
      <Text>Name: {voucher.funderName}</Text>
      <Text>Account: {voucher.funderAccount}</Text>
      <Text>Email: {voucher.funderEmail || '-'}</Text>

      <Text style={styles.section}>Seller</Text>
      <Text>Name: {voucher.sellerName}</Text>
      <Text>Account: {voucher.sellerAccount}</Text>
      <Text>Email: {voucher.sellerEmail || '-'}</Text>

      <Text style={styles.section}>Market Deviations</Text>
      <Text>
        Seller Deviation: {Number(voucher.priceDeviation)}% | Policy:{' '}
        {voucher.marketConsumptionPrice?.toFixed(2)}%
      </Text>
      <Text>
        MiFedha Market Deviation: {Number(voucher.referencePrice)}% | Policy:{' '}
        {voucher.marketConsumptionFrequency}%
      </Text>
      <Text>
        General Market Deviation: {Number(voucher.generalPriceDev)}% | Policy:{' '}
        {voucher.marketConsumptionTotal}%
      </Text>

      <Text style={{
      marginTop: 6
    }}>Status: {voucher.accStatus}</Text>

      <View style={{
      flexDirection: 'row',
      marginTop: 10
    }}>
        <Pressable disabled={isClearing} style={[styles.button, {
        backgroundColor: 'skyblue',
        marginRight: 8
      }]} onPress={() => onClear(voucher)}>
          {isClearing ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Settle Bill</Text>}
        </Pressable>

        <Pressable disabled={isDeclining} style={[styles.button, {
        backgroundColor: '#e58d29'
      }]} onPress={() => onDecline(voucher)}>
          {isDeclining ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Decline</Text>}
        </Pressable>
      </View>
    </View>;
};

/* -------------------- Main Screen -------------------- */
const FunderClearApprovedVoucherScreen = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [parentMap, setParentMap] = useState<Record<string, any>>({});
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [consumerNationality, setConsumerNationality] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, {
    clearing: boolean;
    declining: boolean;
  }>>({});
  const { nationality, ratesMap } = useExchange();

  /* ---------------- Fetch Approved Vouchers ---------------- */
  const fetchVouchers = async (token?: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const email = attributes.email;
      console.log('🔍 Fetching vouchers for funder email:', email);
      
      // Fetch ALL vouchers for this funder (no server-side accStatus filter)
      const res: any = await client.graphql({
        query: listCombContractVouchers,
        variables: {
          filter: {
            funderEmail: {
              eq: email
            }
          },
          limit: 50,
          nextToken: token
        }
      });
      const data = res?.data?.listCombContractVouchers;
      let items = data?.items || [];
      
      // Log what we got
      console.log(`📋 Fetched ${items.length} total vouchers for funder ${email}`);
      console.log('📦 Raw vouchers:', items.map((v: any) => ({ id: v.id, sellerName: v.sellerName, accStatus: v.accStatus })));
      
      // Filter for 'Approved' status on the client side
      items = items.filter((v: any) => v.accStatus === 'Approved');
      console.log(`✅ Filtered to ${items.length} approved vouchers`);
      
      // Fetch consumer nationality once (funder's perspective)
      let fetchedConsumerNat: string | null = null;
      try {
        if (items.length > 0) {
          const firstItem = items[0];
          if (firstItem.consumerType === 'consumerTypeBiz') {
            const bizRes: any = await client.graphql({ query: getBizna, variables: { BusKntct: firstItem.consumerAccount } });
            const bizEmail = bizRes?.data?.getBizna?.email;
            if (bizEmail) {
              const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: bizEmail } });
              fetchedConsumerNat = smRes?.data?.getSMAccount?.nationality || null;
            }
          } else {
            const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: firstItem.consumerAccount } });
            fetchedConsumerNat = smRes?.data?.getSMAccount?.nationality || null;
          }
        }
        setConsumerNationality(fetchedConsumerNat);
        console.log('✅ Consumer nationality:', fetchedConsumerNat);
      } catch (e) {
        console.warn('⚠️ Could not fetch consumer nationality:', e);
      }
      
      // Collect all unique seller and funder accounts
      const sellerAccounts = Array.from(new Set(items.map(i => i.sellerAccount))).map(account => {
        const item = items.find(i => i.sellerAccount === account);
        return { account, type: item.sellerType };
      });
      const funderAccounts = Array.from(new Set(items.map(i => i.funderAccount))).map(account => {
        const item = items.find(i => i.funderAccount === account);
        return { account, type: item.funderType };
      });
      
      const fetchNationality = async (account: string, type: string) => {
        try {
          if (type === 'sellerTypeBiz' || type === 'funderTypeBiz') {
            const bizRes: any = await client.graphql({ query: getBizna, variables: { BusKntct: account } });
            const email = bizRes?.data?.getBizna?.email;
            if (email) {
              const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: email } });
              return smRes?.data?.getSMAccount?.nationality || null;
            }
            return null;
          } else {
            const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: account } });
            return smRes?.data?.getSMAccount?.nationality || null;
          }
        } catch (e) {
          console.warn(`Could not fetch nationality for ${account}:`, e);
          return null;
        }
      };
      
      const sellerNatMap = new Map<string, string | null>();
      const funderNatMap = new Map<string, string | null>();
      
      await Promise.all([
        ...sellerAccounts.map(async s => {
          const nat = await fetchNationality(s.account, s.type);
          sellerNatMap.set(s.account, nat);
        }),
        ...funderAccounts.map(async f => {
          const nat = await fetchNationality(f.account, f.type);
          funderNatMap.set(f.account, nat);
        })
      ]);
      
      const enriched = items.map(i => ({
        ...i,
        sellerNationality: sellerNatMap.get(i.sellerAccount) || null,
        funderNationality: funderNatMap.get(i.funderAccount) || null
      }));
      setVouchers(prev => {
        const map = new Map(prev.map(v => [v.id, v]));
        enriched.forEach(v => map.set(v.id, v));
        return Array.from(map.values());
      });
      setNextToken(data?.nextToken || null);
      
      // Fetch parent comb contracts for these vouchers
      try {
        const combIds = Array.from(new Set(enriched.map((e: any) => e.combContractID).filter(Boolean)));
        await Promise.all(combIds.map(async id => {
          if (!id || parentMap[id]) return;
          try {
            const pRes: any = await client.graphql({ query: getCombContract, variables: { id } });
            const p = pRes?.data?.getCombContract;
            if (p) setParentMap(prev => ({ ...prev, [id]: p }));
          } catch (e) {
            console.warn('Could not fetch parent contract', id, e);
          }
        }));
      } catch (e) {
        console.warn('Error fetching parent contracts', e);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVouchers();
  }, []);

  /* ---------------- Confirm Dialog ---------------- */
  const confirmAction = (voucher: any, action: 'Settle Bill' | 'Decline') => {
    Alert.alert(`${action}`, `Are you sure you want to ${action.toLowerCase()} this voucher?`, [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: action,
      style: action === 'Decline' ? 'destructive' : 'default',
      onPress: () => action === 'Settle Bill' ? clearVoucher(voucher) : declineVoucher(voucher)
    }]);
  };

  /* ---------------- Decline ---------------- */
  const declineVoucher = async (voucher: any) => {
    setLoadingMap(prev => ({
      ...prev,
      [voucher.id]: {
        ...(prev[voucher.id] || {}),
        declining: true
      }
    }));
    const returnAmount = Number(voucher.itemPrice || 0) * Number(voucher.numberOfItems || 0);
    try {
      await client.graphql({
        query: updateCombContractVoucher,
        variables: {
          input: {
            id: voucher.id,
            accStatus: 'Declined'
          }
        }
      });
      
      // Return funds to consumer's parent contract consumptionCapping
      try {
        const parentId = voucher.combContractID;
        if (parentId) {
          const parent = parentMap[parentId] || (await (async () => { const r: any = await client.graphql({ query: getCombContract, variables: { id: parentId } }); return r?.data?.getCombContract; })());
          if (parent) {
            const newCap = (Number(parent.consumptionCapping || 0) + returnAmount).toFixed(2);
            await client.graphql({ query: updateCombContract, variables: { input: { id: parentId, consumptionCapping: newCap } } });
            setParentMap(prev => ({ ...prev, [parentId]: { ...parent, consumptionCapping: newCap } }));
            console.log('✅ Returned funds to parent contract:', parentId, 'New cap:', newCap);
          }
        }
      } catch (e) {
        console.warn('Failed to return funds on funder decline', e);
      }
      
      setVouchers(prev => prev.filter(v => v.id !== voucher.id));
      const message = `COMB voucher for ${voucher.itemName} was declined by the funder.`;
      for (const email of [voucher.consumerEmail, voucher.sellerEmail]) {
        if (!email) continue;
        await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: email,
              messageBody: message
            }
          }
        });
        await client.graphql({
          query: sendNotification,
          variables: {
            riderEmail: email,
            title: 'MiFedha: COMB Voucher Declined',
            body: message
          }
        });
      }
      Alert.alert('Success', 'Voucher declined and funds returned to consumer');
    } catch (e: any) {
      Alert.alert('Error', 'Decline failed');
    } finally {
      setLoadingMap(prev => ({
        ...prev,
        [voucher.id]: {
          ...(prev[voucher.id] || {}),
          declining: false
        }
      }));
    }
  };

  /* ---------------- Clear / Settlement ---------------- */
  const clearVoucher = async (voucher: any) => {
    setLoadingMap(prev => ({
      ...prev,
      [voucher.id]: {
        ...(prev[voucher.id] || {}),
        clearing: true
      }
    }));
    try {
      // Voucher amounts are in seller's currency - need to convert to KES for database storage
      const totalAmountInSellerCurrency = Number(voucher.itemPrice) * Number(voucher.numberOfItems);
      
      // Fetch seller nationality to convert amounts to KES if needed
      let sellerNationality = voucher.sellerNationality;
      let funderNationality = voucher.funderNationality;
      
      if (!sellerNationality) {
        try {
          if (voucher.sellerType === 'sellerTypeBiz') {
            const bizRes: any = await client.graphql({ query: getBizna, variables: { BusKntct: voucher.sellerAccount } });
            const email = bizRes?.data?.getBizna?.email;
            if (email) {
              const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: email } });
              sellerNationality = smRes?.data?.getSMAccount?.nationality || null;
            }
          } else {
            const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: voucher.sellerAccount } });
            sellerNationality = smRes?.data?.getSMAccount?.nationality || null;
          }
        } catch (e) {
          console.warn('Could not fetch seller nationality for conversion', e);
        }
      }
      
      if (!funderNationality) {
        try {
          if (voucher.funderType === 'funderTypeBiz') {
            const bizRes: any = await client.graphql({ query: getBizna, variables: { BusKntct: voucher.funderAccount } });
            const email = bizRes?.data?.getBizna?.email;
            if (email) {
              const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: email } });
              funderNationality = smRes?.data?.getSMAccount?.nationality || null;
            }
          } else {
            const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: voucher.funderAccount } });
            funderNationality = smRes?.data?.getSMAccount?.nationality || null;
          }
        } catch (e) {
          console.warn('Could not fetch funder nationality', e);
        }
      }
      
      // Convert seller's currency to KES for database storage
      let totalAmountInKes = totalAmountInSellerCurrency;
      if (sellerNationality && sellerNationality !== 'Kenya') {
        totalAmountInKes = await convertKshToUserCurrency(totalAmountInSellerCurrency, sellerNationality);
      }
      
      const companyRes: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const company = companyRes.data.getCompany;
      const fee = Number(company.userTransferFee) * totalAmountInKes;
      const totalDebit = totalAmountInKes + fee;
      const benefit = Math.round(company.p2BBenCom * fee);
      const companyEarnings = fee - benefit * 2;
      const debitAccount = async (type: string, account: string) => {
        if (type === 'funderTypeBiz') {
          const res: any = await client.graphql({
            query: getBizna,
            variables: {
              BusKntct: account
            }
          });
          const bal = Number(res.data.getBizna.earningsBal);
          if (bal < totalDebit) throw new Error('Insufficient funds');
          await client.graphql({
            query: updateBizna,
            variables: {
              input: {
                BusKntct: account,
                earningsBal: bal - totalDebit,
                benefitsAmount: Number(res.data.getBizna.benefitsAmount) + benefit
              }
            }
          });
        } else {
          const res: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: account
            }
          });
          const bal = Number(res.data.getSMAccount.balance);
          if (bal < totalDebit) throw new Error('Insufficient funds');
          await client.graphql({
            query: updateSMAccount,
            variables: {
              input: {
                awsemail: account,
                balance: bal - totalDebit,
                benefitsAmount: Number(res.data.getSMAccount.benefitsAmount) + benefit
              }
            }
          });
        }
      };
      const creditAccount = async (type: string, account: string) => {
        if (type === 'sellerTypeBiz') {
          const res: any = await client.graphql({
            query: getBizna,
            variables: {
              BusKntct: account
            }
          });
          await client.graphql({
            query: updateBizna,
            variables: {
              input: {
                BusKntct: account,
                earningsBal: Number(res.data.getBizna.earningsBal) + totalAmountInKes,
                netEarnings: Number(res.data.getBizna.netEarnings) + totalAmountInKes,
                benefitsAmount: Number(res.data.getBizna.benefitsAmount) + benefit
              }
            }
          });
        } else {
          const res: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: account
            }
          });
          await client.graphql({
            query: updateSMAccount,
            variables: {
              input: {
                awsemail: account,
                balance: Number(res.data.getSMAccount.balance) + totalAmountInKes,
                benefitsAmount: Number(res.data.getSMAccount.benefitsAmount) + benefit
              }
            }
          });
        }
      };
      await debitAccount(voucher.funderType, voucher.funderAccount);
      await creditAccount(voucher.sellerType, voucher.sellerAccount);
      await client.graphql({
        query: createNonLoans,
        variables: {
          input: {
            recPhn: voucher.sellerAccount,
            senderPhn: voucher.funderAccount,
            amount: totalAmountInKes,
            description: `COMB Settlement: ${voucher.itemName}`,
            RecName: voucher.sellerName,
            SenderName: voucher.funderName,
            status: 'cashSales',
            owner: voucher.id
          }
        }
      });
      await client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            companyEarningBal: Number(company.companyEarningBal) + companyEarnings,
            companyEarning: Number(company.companyEarning) + companyEarnings
          }
        }
      });
      await client.graphql({
        query: updateCombContractVoucher,
        variables: {
          input: {
            id: voucher.id,
            accStatus: 'Cleared',
            settlementTime: new Date().toISOString()
          }
        }
      });
      const message = `COMB bill for ${voucher.itemName} has been settled by the funder ${voucher.funderName}.`;
      for (const email of [voucher.consumerEmail, voucher.sellerEmail]) {
        if (!email) continue;
        await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: email,
              messageBody: message
            }
          }
        });
        await client.graphql({
          query: sendNotification,
          variables: {
            riderEmail: email,
            title: 'MiFedha: COMB Voucher Cleared',
            body: message
          }
        });
      }
      setVouchers(prev => prev.filter(v => v.id !== voucher.id));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Settlement failed');
    } finally {
      setLoadingMap(prev => ({
        ...prev,
        [voucher.id]: {
          ...(prev[voucher.id] || {}),
          clearing: false
        }
      }));
    }
  };
  return <View style={{
    flex: 1,
    padding: 10
  }}>
      {loading && vouchers.length === 0 ? <ActivityIndicator size="large" /> : vouchers.length === 0 ? <Text style={{
      textAlign: 'center'
    }}>No approved vouchers found.</Text> : <FlatList data={vouchers} keyExtractor={item => item.id} renderItem={({
      item
    }) => <Pressable onPress={() => setSelectedVoucherId(item.id)}><VoucherCard voucher={item} loadingMap={loadingMap} onClear={v => confirmAction(v, 'Settle Bill')} onDecline={v => confirmAction(v, 'Decline')} /></Pressable>} onEndReached={() => {
      if (nextToken && !loading) fetchVouchers(nextToken);
    }} onEndReachedThreshold={0.5} contentContainerStyle={{
      paddingBottom: 150
    }} />}
      {/* Bottom Funds Bar */}
      {(vouchers.length > 0) && (() => {
        const activeVoucher = selectedVoucherId ? vouchers.find(v => v.id === selectedVoucherId) : vouchers[0];
        const parent = activeVoucher ? parentMap[activeVoucher.combContractID] : null;
        const remaining = parent ? Number(parent.consumptionCapping || 0) : null;
        const sellerNat = activeVoucher?.sellerNationality || nationality;
        const funderNat = activeVoucher?.funderNationality || nationality;
        return parent ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd', padding: 8 }}>
              <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>Remaining Funds (Consumer)</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>🛒 Consumer: {formatAmountSync(Number(remaining || 0), nationalityToCode(consumerNationality || nationality), ratesMap || undefined)}</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>🏪 Seller: {formatAmountSync(Number(remaining || 0), nationalityToCode(sellerNat), ratesMap || undefined)}</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>💳 Funder: {formatAmountSync(Number(remaining || 0), nationalityToCode(funderNat), ratesMap || undefined)}</Text>
            </View> : null;
      })()}
    </View>;
};
const styles = StyleSheet.create({
  voucherCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15
  },
  section: {
    marginTop: 6,
    fontWeight: 'bold'
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center'
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold'
  }
});
export default FunderClearApprovedVoucherScreen;