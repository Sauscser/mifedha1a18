// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { listCombContractVouchers, getSMAccount, getBizna, getCompany, getCombContract } from '../../../src/graphql/queries';
import { createMessages, updateCombContractVoucher, sendNotification, updateSMAccount, updateBizna, createNonLoans, updateCompany, updateCombContract } from '../../../src/graphql/mutations';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, convertKshToUserCurrency } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

/* -------------------- GraphQL Client -------------------- */
const client = generateClient();

/* -------------------- Voucher Card -------------------- */
const VoucherCard = ({
  voucher,
  onApprove,
  onDecline,
  updatingId
}: any) => {
  const isUpdating = updatingId === voucher.id;
  const { nationality, ratesMap } = useExchange();
  const sellerNat = voucher.sellerNationality || nationality;
  const funderNat = voucher.funderNationality || nationality;
  const consumerNat = voucher.consumerNationality || nationality;
  
  const itemPrice = Number(voucher.itemPrice);
  const numItems = Number(voucher.numberOfItems);
  const totalPrice = itemPrice * numItems;
  
  return <View style={styles.voucherCard}>
      <Text style={{
      fontWeight: 'bold',
      marginBottom: 8
    }}>
        {voucher.itemName} ({voucher.itemBrand})
      </Text>
      <Text>Specifications: {voucher.itemSpecifications || '-'}</Text>
      
      {/* Multi-Currency Price Display */}
      <View style={{ marginVertical: 8, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>💰 Price in Different Currencies:</Text>
        <Text>🛒 Your Currency ({consumerNat}): {formatAmountSync(totalPrice, nationalityToCode(consumerNat), ratesMap || undefined)}</Text>
        <Text>💳 Funder Currency ({funderNat}): {formatAmountSync(totalPrice, nationalityToCode(funderNat), ratesMap || undefined)}</Text>
        <Text>🏪 Seller Currency ({sellerNat}): {formatAmountSync(totalPrice, nationalityToCode(sellerNat), ratesMap || undefined)}</Text>
      </View>
      
      <Text>Unit Price: {formatAmountSync(itemPrice, nationalityToCode(sellerNat), ratesMap || undefined)}</Text>
      <Text>Number of Items: {numItems}</Text>

      <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Funder Details:</Text>
      <Text>  Account: {voucher.funderAccount}</Text>
      <Text>  Name: {voucher.funderName}</Text>
      <Text>  Contact: {voucher.funderContact}</Text>
      <Text>  Email: {voucher.funderEmail || '-'}</Text>

      <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Seller Details:</Text>
      <Text>  Account: {voucher.sellerAccount}</Text>
      <Text>  Name: {voucher.sellerName}</Text>
      <Text>  Contact: {voucher.sellerContact}</Text>

      <Text style={{ marginTop: 8 }}>
        Seller Deviation: {Number(voucher.priceDeviation).toFixed(2)} | Policy:{' '}
        {voucher.marketConsumptionPrice?.toFixed(2)}%
      </Text>
      <Text>
        MiFedha Market Deviation: {Number(voucher.referencePrice).toFixed(2)} | Policy:{' '}
        {voucher.marketConsumptionFrequency}%
      </Text>
      <Text>
        General Market Price Deviation: {Number(voucher.generalPriceDev).toFixed(2)} | Policy:{' '}
        {voucher.marketConsumptionTotal}%
      </Text>

      <Text style={{ marginTop: 8 }}>Status: {voucher.accStatus}</Text>

      {voucher.accStatus === 'Pending' && <View style={{
      flexDirection: 'row',
      marginTop: 8
    }}>
          <Pressable disabled={isUpdating} style={[styles.button, {
        backgroundColor: 'skyblue',
        marginRight: 8
      }]} onPress={() => onApprove(voucher)}>
            {isUpdating ? <ActivityIndicator color="white" /> : <Text style={{
          color: 'white'
        }}>Approve</Text>}
          </Pressable>

          <Pressable disabled={isUpdating} style={[styles.button, {
        backgroundColor: '#e58d29'
      }]} onPress={() => onDecline(voucher)}>
            {isUpdating ? <ActivityIndicator color="white" /> : <Text style={{
          color: 'white'
        }}>Decline</Text>}
          </Pressable>
        </View>}
    </View>;
};

/* -------------------- Main Screen -------------------- */
const ConsumerApproveVoucherScreen = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [parentMap, setParentMap] = useState<Record<string, any>>({});
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    sellerAccount: '',
    funderAccount: '',
    consumerAccount: ''
  });
  const [consumerNationality, setConsumerNationality] = useState<string | null>(null);
  const { nationality, ratesMap } = useExchange();

  /* ---------------- Fetch vouchers ---------------- */
  const fetchVouchers = async (token?: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const user = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      const consumerEmail = attrs.email;
      console.log('🔍 Fetching vouchers for consumer email:', consumerEmail);
      
      // Fetch consumer's nationality once
      let consumerNationality: string | null = null;
      try {
        const consumerRes: any = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: consumerEmail }
        });
        consumerNationality = consumerRes?.data?.getSMAccount?.nationality || null;
        console.log('✅ Consumer nationality:', consumerNationality);
        setConsumerNationality(consumerNationality);
      } catch (e) {
        console.warn('⚠️ Could not fetch consumer nationality:', e);
      }
      
      const res: any = await client.graphql({
        query: listCombContractVouchers,
        variables: {
          filter: {
            consumerEmail: {
              eq: consumerEmail
            }
          },
          limit: 50,
          nextToken: token
        }
      });
      let newItems = res?.data?.listCombContractVouchers?.items || [];
      // Filter for Pending status on the client side
      newItems = newItems.filter((v: any) => v.accStatus === 'Pending');
      console.log(`📋 Fetched ${newItems.length} pending vouchers for consumer ${consumerEmail}`);
      console.log('📦 Raw vouchers:', newItems.map((v: any) => ({ id: v.id, sellerName: v.sellerName, accStatus: v.accStatus, consumerEmail: v.consumerEmail })));
      
      // If no items, log and return early
      if (newItems.length === 0) {
        console.log('⚠️ No pending vouchers found. Checking if vouchers exist with different statuses...');
        // Try to debug by fetching ALL vouchers for this consumer
        try {
          const debugRes: any = await client.graphql({
            query: listCombContractVouchers,
            variables: {
              filter: {
                consumerEmail: {
                  eq: consumerEmail
                }
              },
              limit: 50
            }
          });
          const allVouchers = debugRes?.data?.listCombContractVouchers?.items || [];
          console.log(`🔎 Total vouchers for this consumer (all statuses): ${allVouchers.length}`);
          console.log('📊 Voucher statuses:', allVouchers.map((v: any) => ({ id: v.id, accStatus: v.accStatus })));
        } catch (debugErr) {
          console.error('❌ Debug query failed:', debugErr);
        }
      }
      
      // Fetch nationalities for seller and funder
      const nationalities = new Map<string, string | null>();
      
      const fetchNationality = async (account: string, type: string, key: string) => {
        try {
          // Check if account is business or individual
          const isBusiness = type && type.includes('Biz');
          
          if (isBusiness) {
            // Business: get email from getBizna, then fetch SMAccount
            const bizRes: any = await client.graphql({
              query: getBizna,
              variables: { BusKntct: account }
            });
            const bizEmail = bizRes?.data?.getBizna?.email;
            if (bizEmail) {
              const smRes: any = await client.graphql({
                query: getSMAccount,
                variables: { awsemail: bizEmail }
              });
              nationalities.set(key, smRes?.data?.getSMAccount?.nationality || null);
              console.log(`✅ ${key} (business): ${bizEmail} -> ${smRes?.data?.getSMAccount?.nationality}`);
            } else {
              nationalities.set(key, null);
              console.warn(`⚠️ ${key} (business): No email found`);
            }
          } else {
            // Individual: account is email, fetch SMAccount directly
            const smRes: any = await client.graphql({
              query: getSMAccount,
              variables: { awsemail: account }
            });
            nationalities.set(key, smRes?.data?.getSMAccount?.nationality || null);
            console.log(`✅ ${key} (individual): ${smRes?.data?.getSMAccount?.nationality}`);
          }
        } catch (e) {
          console.warn(`❌ Could not fetch nationality for ${key}:`, e);
          nationalities.set(key, null);
        }
      };
      
      // Collect all unique accounts to fetch
      const uniqueSellerAccounts = Array.from(new Set((newItems as any[]).map((i: any) => i.sellerAccount)));
      const uniqueFunderAccounts = Array.from(new Set((newItems as any[]).map((i: any) => i.funderAccount)));
      
      console.log('🏪 Unique sellers:', uniqueSellerAccounts);
      console.log('💳 Unique funders:', uniqueFunderAccounts);
      
      // Fetch all seller and funder nationalities in parallel
      if (uniqueSellerAccounts.length > 0 || uniqueFunderAccounts.length > 0) {
        await Promise.all([
          ...uniqueSellerAccounts.map((account) => {
            const item = (newItems as any[]).find((i: any) => i.sellerAccount === account);
            return fetchNationality(account, item?.sellerType, `seller_${account}`);
          }),
          ...uniqueFunderAccounts.map((account) => {
            const item = (newItems as any[]).find((i: any) => i.funderAccount === account);
            return fetchNationality(account, item?.funderType, `funder_${account}`);
          })
        ]);
      }
      
      const enriched = (newItems as any[]).map((i: any) => ({
        ...i,
        sellerNationality: nationalities.get(`seller_${i.sellerAccount}`) || null,
        funderNationality: nationalities.get(`funder_${i.funderAccount}`) || null,
        consumerNationality: consumerNationality
      }));
      
      console.log('✨ Enriched vouchers:', enriched.length);
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
      
      setVouchers(prev => {
        const merged = [...prev, ...enriched];
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        return unique;
      });
      setNextToken(res?.data?.listCombContractVouchers?.nextToken || null);
    } catch (err) {
      console.error('❌ Error loading vouchers:', err);
      Alert.alert('Error', 'Could not load vouchers. ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVouchers();
  }, []);

  /* ---------------- Filters ---------------- */
  const match = (a = '', b = '') => a.toLowerCase().includes(b.toLowerCase().trim());
  const filteredVouchers = useMemo(() => vouchers.filter(v => (!filters.sellerAccount || match(v.sellerAccount, filters.sellerAccount)) && (!filters.funderAccount || match(v.funderAccount, filters.funderAccount)) && (!filters.consumerAccount || match(v.consumerAccount, filters.consumerAccount))), [vouchers, filters]);

  /* ---------------- Confirmation ---------------- */
  const confirmAction = (voucher: any, status: 'Approved' | 'Declined') => {
    const verb = status === 'Approved' ? 'Approve' : 'Decline';
    Alert.alert(`${verb} Voucher`, `Are you sure you want to ${verb} this voucher from ${voucher.sellerName}?`, [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: verb,
      style: status === 'Declined' ? 'destructive' : 'default',
      onPress: () => updateVoucherStatus(voucher, status)
    }]);
  };

  /* ---------------- Approve / Decline ---------------- */
  const updateVoucherStatus = async (voucher: any, status: 'Approved' | 'Declined') => {
    setUpdatingId(voucher.id);
    setVouchers(prev => prev.filter(v => v.id !== voucher.id));
    const now = Date.now();
    const returnAmount = Number(voucher.itemPrice || 0) * Number(voucher.numberOfItems || 0);
    try {
      // 1️⃣ Check expiry
      const expiry = Number(voucher.voucherLastUpdate) + Number(voucher.updateFrequency) * 24 * 60 * 60 * 1000;
      if (voucher.consumptionMarginStatus === 'Active' && now > expiry) {
        await client.graphql({
          query: updateCombContractVoucher,
          variables: {
            input: {
              id: voucher.id,
              accStatus: 'Declined'
            }
          }
        });
        // return funds to parent contract consumptionCapping
        try {
          const parentId = voucher.combContractID;
          if (parentId) {
            const parent = parentMap[parentId] || (await (async () => { const r: any = await client.graphql({ query: getCombContract, variables: { id: parentId } }); return r?.data?.getCombContract; })());
            if (parent) {
              const newCap = (Number(parent.consumptionCapping || 0) + returnAmount).toFixed(2);
              await client.graphql({ query: updateCombContract, variables: { input: { id: parentId, consumptionCapping: newCap } } });
              setParentMap(prev => ({ ...prev, [parentId]: { ...parent, consumptionCapping: newCap } }));
            }
          }
        } catch (e) {
          console.warn('Failed to return funds on expiry-decline', e);
        }
        if (voucher.sellerEmail) {
          await client.graphql({
            query: createMessages,
            variables: {
              input: {
                senderEmail: voucher.sellerEmail,
                messageBody: 'Voucher approval window closed.'
              }
            }
          });
          await client.graphql({
            query: sendNotification,
            variables: {
              riderEmail: voucher.sellerEmail,
              title: 'MiFedha: Voucher Closed',
              body: 'Voucher approval window closed.'
            }
          });
        }
        Alert.alert('Declined! Voucher approval window closed.');
        return;
      }
      if (voucher.consumptionMarginStatus === 'Active' && expiry > now) {
        await client.graphql({
          query: updateCombContractVoucher,
          variables: {
            input: {
              id: voucher.id,
              accStatus: status,
              voucherLastUpdate: now,
              settlementTime: new Date().toISOString()
            }
          }
        });
        // if consumer declined, release funds back to contract
        if (status === 'Declined') {
          try {
            const parentId = voucher.combContractID;
            if (parentId) {
              const parent = parentMap[parentId] || (await (async () => { const r: any = await client.graphql({ query: getCombContract, variables: { id: parentId } }); return r?.data?.getCombContract; })());
              if (parent) {
                const newCap = (Number(parent.consumptionCapping || 0) + returnAmount).toFixed(2);
                await client.graphql({ query: updateCombContract, variables: { input: { id: parentId, consumptionCapping: newCap } } });
                setParentMap(prev => ({ ...prev, [parentId]: { ...parent, consumptionCapping: newCap } }));
              }
            }
          } catch (e) {
            console.warn('Failed to return funds on decline', e);
          }
        }
        if (voucher.sellerEmail) {
          const msg = `${voucher.consumerName} has approved a COMB contract voucher from ${voucher.sellerName}. Proceed to COMB to clear the bill.`;
          await client.graphql({
            query: createMessages,
            variables: {
              input: {
                senderEmail: voucher.sellerEmail,
                messageBody: msg
              }
            }
          });
          await client.graphql({
            query: sendNotification,
            variables: {
              riderEmail: voucher.sellerEmail,
              title: 'MiFedha: Voucher Approval',
              body: msg
            }
          });
        }
        Alert.alert('Voucher successfully approved');
        return;
      }

      /* ---------------- Auto-billing if Cancelled ---------------- */
      if (voucher.consumptionMarginStatus === 'Cancelled') {
        const totalAmountInSellerCurrency = Number(voucher.itemPrice) * Number(voucher.numberOfItems);
        
        // Fetch nationalities if not already cached
        let sellerNationality = voucher.sellerNationality;
        let funderNationality = voucher.funderNationality;
        let consumerNationality = voucher.consumerNationality;
        
        // Fetch seller nationality if missing
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
        
        // Fetch funder nationality if missing
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
        
        // Fetch consumer nationality if missing
        if (!consumerNationality) {
          try {
            if (voucher.consumerType === 'consumerTypeBiz') {
              const bizRes: any = await client.graphql({ query: getBizna, variables: { BusKntct: voucher.consumerAccount } });
              const email = bizRes?.data?.getBizna?.email;
              if (email) {
                const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: email } });
                consumerNationality = smRes?.data?.getSMAccount?.nationality || null;
              }
            } else {
              const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: voucher.consumerAccount } });
              consumerNationality = smRes?.data?.getSMAccount?.nationality || null;
            }
          } catch (e) {
            console.warn('Could not fetch consumer nationality', e);
          }
        }
        
        // Convert seller's currency to KES for database storage
        let totalAmount = totalAmountInSellerCurrency;
        if (sellerNationality && sellerNationality !== 'Kenya') {
          totalAmount = await convertKshToUserCurrency(totalAmountInSellerCurrency, sellerNationality);
        }

        // Fetch company settings
        const companyRes: any = await client.graphql({
          query: getCompany,
          variables: {
            AdminId: "BaruchHabaB'ShemAdonai2"
          }
        });
        const company = companyRes.data.getCompany;
        const userTransferFee = Number(company.userTransferFee);
        const p2BBenCom = Number(company.p2BBenCom);
        const compEarnings = Number(company.companyEarning);
        const companyEarningBal = Number(company.companyEarningBal);
        const Fee = userTransferFee * totalAmount;
        const totalDebited = Fee + totalAmount;
        const benefit = Math.round(p2BBenCom * Fee);
        const companyEarningss = Fee - 2 * benefit;

        // Funder balance
        let funderBalance = 0,
          benefitsAmount = 0,
          ttlNonLonsSentSM = 0;
        if (voucher.funderType === 'funderTypeBiz') {
          const res: any = await client.graphql({
            query: getBizna,
            variables: {
              BusKntct: voucher.funderAccount
            }
          });
          funderBalance = Number(res.data.getBizna.earningsBal);
          benefitsAmount = Number(res.data.getBizna.benefitsAmount);
        } else if (voucher.funderType === 'funderTypePal') {
          const res: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: voucher.funderAccount
            }
          });
          funderBalance = Number(res.data.getSMAccount.balance);
          ttlNonLonsSentSM = Number(res.data.getSMAccount.ttlNonLonsSentSM);
          benefitsAmount = Number(res.data.getSMAccount.benefitsAmount);
        }
        if (funderBalance < totalDebited) {
          Alert.alert('Insufficient funds', `Funder ${voucher.funderName} does not have enough balance.`);
          setUpdatingId(null);
          setVouchers(prev => [voucher, ...prev]);
          return;
        }

        // Debit funder
        if (voucher.funderType === 'funderTypeBiz') {
          await client.graphql({
            query: updateBizna,
            variables: {
              input: {
                BusKntct: voucher.funderAccount,
                earningsBal: funderBalance - totalDebited,
                benefitsAmount: benefitsAmount + benefit
              }
            }
          });
        } else if (voucher.funderType === 'funderTypePal') {
          await client.graphql({
            query: updateSMAccount,
            variables: {
              input: {
                awsemail: voucher.funderAccount,
                balance: funderBalance - totalDebited,
                benefitsAmount: benefitsAmount + benefit
              }
            }
          });
        }

        // Credit seller
        if (voucher.sellerType === 'sellerTypeBiz') {
          const res: any = await client.graphql({
            query: getBizna,
            variables: {
              BusKntct: voucher.sellerAccount
            }
          });
          const currentNetEarnings = Number(res.data.getBizna.netEarnings);
          const currentBenefits = Number(res.data.getBizna.benefitsAmount);
          await client.graphql({
            query: updateBizna,
            variables: {
              input: {
                BusKntct: voucher.sellerAccount,
                netEarnings: currentNetEarnings + totalAmount,
                earningsBal: currentNetEarnings + totalAmount,
                benefitsAmount: currentBenefits + benefit
              }
            }
          });
        } else if (voucher.sellerType === 'sellerTypePal') {
          const res: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: voucher.sellerAccount
            }
          });
          const currentBal = Number(res.data.getSMAccount.balance);
          const currentBenefits = Number(res.data.getSMAccount.benefitsAmount);
          const currentTtlNonLons = Number(res.data.getSMAccount.ttlNonLonsSentSM);
          await client.graphql({
            query: updateSMAccount,
            variables: {
              input: {
                awsemail: voucher.sellerAccount,
                balance: currentBal + totalAmount,
                benefitsAmount: currentBenefits + benefit,
                ttlNonLonsSentSM: currentTtlNonLons + benefit
              }
            }
          });
        }

        // Record NonLoan transaction
        await client.graphql({
          query: createNonLoans,
          variables: {
            input: {
              recPhn: voucher.sellerAccount,
              senderPhn: voucher.funderAccount,
              amount: totalAmount,
              description: `COMB Auto Settlement: ${voucher.itemName}`,
              RecName: voucher.sellerName,
              SenderName: voucher.funderName,
              status: 'cashSales',
              owner: voucher.id
            }
          }
        });

        // Update company earnings
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "BaruchHabaB'ShemAdonai2",
              companyEarningBal: companyEarningBal + companyEarningss,
              companyEarning: compEarnings + companyEarningss
            }
          }
        });

        // Update voucher
        await client.graphql({
          query: updateCombContractVoucher,
          variables: {
            input: {
              id: voucher.id,
              accStatus: 'Cleared'
            }
          }
        });

        // Notify all parties
        const sellerNat = voucher.sellerNationality || nationality;
        const consumerNat = consumerNationality || nationality;
        const funderNat = funderNationality || nationality;
        
        const messageBody = `${voucher.consumerName} has spent ${formatAmountSync(Number(totalDebited), nationalityToCode(consumerNat), ratesMap || undefined)} (consumer currency) / ${formatAmountSync(Number(totalDebited), nationalityToCode(sellerNat), ratesMap || undefined)} (seller currency) from a COMB voucher from ${voucher.sellerName}.`; 
        if (voucher.funderEmail) await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: voucher.funderEmail,
              messageBody
            }
          }
        });
        if (voucher.funderEmail) await client.graphql({
          query: sendNotification,
          variables: {
            riderEmail: voucher.funderEmail,
            title: 'MiFedha: COMB Voucher Update',
            body: messageBody
          }
        });
        if (voucher.sellerEmail) await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: voucher.sellerEmail,
              messageBody
            }
          }
        });
        if (voucher.sellerEmail) await client.graphql({
          query: sendNotification,
          variables: {
            riderEmail: voucher.sellerEmail,
            title: 'MiFedha: COMB Voucher Update',
            body: messageBody
          }
        });
        if (voucher.consumerEmail) await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: voucher.consumerEmail,
              messageBody: `You paid from funder ${voucher.funderName} account for a COMB voucher from ${voucher.sellerName}.`
            }
          }
        });
      }
    } catch (err) {
      console.error(err);
      setVouchers(prev => [voucher, ...prev]); // rollback
      Alert.alert('Error', 'Could not update voucher.');
    } finally {
      setUpdatingId(null);
    }
  };
  return <View style={{
    flex: 1,
    padding: 10
  }}>
      {/* Filters */}
      <View style={{
      flexDirection: 'row',
      marginBottom: 10
    }}>
        <TextInput placeholder="Seller Account" value={filters.sellerAccount} onChangeText={t => setFilters(f => ({
        ...f,
        sellerAccount: t
      }))} style={styles.input} />
        <TextInput placeholder="Funder Account" value={filters.funderAccount} onChangeText={t => setFilters(f => ({
        ...f,
        funderAccount: t
      }))} style={styles.input} />
        <TextInput placeholder="Consumer Account" value={filters.consumerAccount} onChangeText={t => setFilters(f => ({
        ...f,
        consumerAccount: t
      }))} style={styles.input} />
      </View>

      {updatingId && <View style={{
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10
    }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{
        color: 'white',
        marginTop: 8
      }}>Processing voucher...</Text>
        </View>}

      {/* List */}
      {loading && vouchers.length === 0 ? <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={{
        marginTop: 8
      }}>Loading vouchers...</Text>
        </View> : filteredVouchers.length === 0 ? <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
          <Text>No pending vouchers found.</Text>
        </View> : <FlatList data={filteredVouchers} keyExtractor={item => item.id} renderItem={({
      item
    }) => <Pressable onPress={() => setSelectedVoucherId(item.id)}><VoucherCard voucher={item} updatingId={updatingId} onApprove={(v: any) => confirmAction(v, 'Approved')} onDecline={(v: any) => confirmAction(v, 'Declined')} /></Pressable>} onEndReached={() => {
      if (nextToken && !loading) fetchVouchers(nextToken);
    }} onEndReachedThreshold={0.5} ListFooterComponent={loading ? <ActivityIndicator style={{
      marginVertical: 10
    }} /> : null} contentContainerStyle={{
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
              <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>Remaining Funds</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>🛒 Consumer: {formatAmountSync(Number(remaining || 0), nationalityToCode(consumerNationality || nationality), ratesMap || undefined)}</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>🏪 Seller: {formatAmountSync(Number(remaining || 0), nationalityToCode(sellerNat), ratesMap || undefined)}</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>💳 Funder: {formatAmountSync(Number(remaining || 0), nationalityToCode(funderNat), ratesMap || undefined)}</Text>
            </View> : null;
      })()}
    </View>;
};
const styles = StyleSheet.create({
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 6,
    marginRight: 4,
    borderRadius: 4
  },
  voucherCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8
  },
  button: {
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
export default ConsumerApproveVoucherScreen;