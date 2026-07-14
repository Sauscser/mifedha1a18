// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import translations from './translation';
import { View, Text, FlatList, ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { buildOsrmRouteUrl } from '../../../src/config/osrm';
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
  onOpenMap,
  loadingMap
}: any) => {
  const { nationality, ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const buyerProximityLabel = t.buyerProximity || 'Buyer Proximity';
  const viewOnMapLabel = t.viewOnMap || 'View on map';
  const isClearing = loadingMap[voucher.id]?.clearing;
  const isDeclining = loadingMap[voucher.id]?.declining;
  const sellerNat = voucher.sellerNationality || nationality;
  const funderNat = voucher.funderNationality || nationality;
  const sellerCode = nationalityToCode(sellerNat);
  const funderCode = nationalityToCode(funderNat);
  const unitPrice = Number(voucher.itemPrice);
  const totalAmount = unitPrice * Number(voucher.numberOfItems);
  const buyerProximityMeters = (() => {
    const coords = [voucher.sellerLatitude, voucher.sellerLongitude, voucher.buyerLatitude, voucher.buyerLongitude];
    if (coords.some(coord => coord === null || coord === undefined || coord === '')) {
      return null;
    }
    const sellerLat = Number(voucher.sellerLatitude);
    const sellerLng = Number(voucher.sellerLongitude);
    const buyerLat = Number(voucher.buyerLatitude);
    const buyerLng = Number(voucher.buyerLongitude);
    if ([sellerLat, sellerLng, buyerLat, buyerLng].some(coord => Number.isNaN(coord))) {
      return null;
    }
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(buyerLat - sellerLat);
    const dLng = toRad(buyerLng - sellerLng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(sellerLat)) * Math.cos(toRad(buyerLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const earthRadius = 6371000;
    return Math.round(earthRadius * c);
  })();
  const buyerProximityKm = buyerProximityMeters !== null ? buyerProximityMeters / 1000 : null;
  const hasMapCoordinates = buyerProximityMeters !== null;
  
  return <View style={styles.voucherCard}>
      <Text style={styles.title}>
        {voucher.itemName} ({voucher.itemBrand})
      </Text>
      <Text>{t.specifications}: {voucher.itemSpecifications || '-'}</Text>
      
      <View style={{ marginVertical: 8, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>💰 {t.priceInDifferentCurrencies}</Text>
        <Text>🏪 {t.sellerCurrency} ({sellerNat}): {formatAmountSync(unitPrice, sellerCode, ratesMap)}</Text>
        <Text>💳 {t.funderCurrency} ({funderNat}): {formatAmountSync(unitPrice, funderCode, ratesMap)}</Text>
        <Text style={{ marginTop: 6, fontWeight: 'bold' }}>{t.totalAmount}</Text>
        <Text>🏪 {t.seller}: {formatAmountSync(totalAmount, sellerCode, ratesMap)}</Text>
        <Text>💳 {t.funder}: {formatAmountSync(totalAmount, funderCode, ratesMap)}</Text>
      </View>
      
      <Text>{t.numberOfItems}: {voucher.numberOfItems}</Text>


      <Text style={styles.section}>{t.consumer}</Text>
      <Text>{t.name}: {voucher.consumerName}</Text>
      <Text>{t.account}: {voucher.consumerAccount}</Text>
      <Text>{t.email}: {voucher.consumerEmail || '-'}</Text>


      <Text style={styles.section}>{t.funder}</Text>
      <Text>{t.name}: {voucher.funderName}</Text>
      <Text>{t.account}: {voucher.funderAccount}</Text>
      <Text>{t.email}: {voucher.funderEmail || '-'}</Text>


      <Text style={styles.section}>{t.seller}</Text>
      <Text>{t.name}: {voucher.sellerName}</Text>
      <Text>{t.account}: {voucher.sellerAccount}</Text>
      <Text>{t.email}: {voucher.sellerEmail || '-'}</Text>
      <Text>{buyerProximityLabel}: {buyerProximityKm !== null ? `${buyerProximityKm.toFixed(3)} km` : t.distanceUnavailable || 'Unavailable'}</Text>
      {hasMapCoordinates ? <Pressable style={[styles.button, { backgroundColor: '#2e86de', marginTop: 10 }]} onPress={() => onOpenMap(voucher)}>
          <Text style={styles.btnText}>{viewOnMapLabel}</Text>
        </Pressable> : null}

      <Text style={styles.section}>{t.marketDeviations}</Text>
      <Text>
        {t.sellerDeviation}: {Number(voucher.priceDeviation)}% | {t.policy}: {voucher.marketConsumptionPrice?.toFixed(2)}%
      </Text>
      <Text>
        {t.nisentiMarketDeviation}: {Number(voucher.referencePrice)}% | {t.policy}: {voucher.marketConsumptionFrequency}%
      </Text>
      <Text>
        {t.generalMarketDeviation}: {Number(voucher.generalPriceDev)}% | {t.policy}: {voucher.marketConsumptionTotal}%
      </Text>

      <Text style={{
      marginTop: 6
    }}>{t.status}: {voucher.accStatus}</Text>

      <View style={{
      flexDirection: 'row',
      marginTop: 10
    }}>
        <Pressable disabled={isClearing} style={[styles.button, {
        backgroundColor: 'skyblue',
        marginRight: 8
      }]} onPress={() => onClear(voucher)}>
          {isClearing ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{t.settleBill}</Text>}
        </Pressable>

        <Pressable disabled={isDeclining} style={[styles.button, {
        backgroundColor: '#e58d29'
      }]} onPress={() => onDecline(voucher)}>
          {isDeclining ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{t.decline}</Text>}
        </Pressable>
      </View>
    </View>;
};

/* -------------------- Main Screen -------------------- */
const FunderClearApprovedVoucherScreen = () => {
  const isFocused = useIsFocused();
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
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapVoucher, setMapVoucher] = useState<any | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const mapWindowHeight = Math.min(Dimensions.get('window').height * 0.7, 420);
  const hasMapCoordinates = Boolean(mapVoucher && mapVoucher.sellerLatitude && mapVoucher.sellerLongitude && mapVoucher.buyerLatitude && mapVoucher.buyerLongitude);
  const modalSellerLatitude = hasMapCoordinates ? Number(mapVoucher.sellerLatitude) : 0;
  const modalSellerLongitude = hasMapCoordinates ? Number(mapVoucher.sellerLongitude) : 0;
  const modalBuyerLatitude = hasMapCoordinates ? Number(mapVoucher.buyerLatitude) : 0;
  const modalBuyerLongitude = hasMapCoordinates ? Number(mapVoucher.buyerLongitude) : 0;
  const modalRegion = hasMapCoordinates ? {
    latitude: (modalSellerLatitude + modalBuyerLatitude) / 2,
    longitude: (modalSellerLongitude + modalBuyerLongitude) / 2,
    latitudeDelta: Math.max(0.03, Math.abs(modalSellerLatitude - modalBuyerLatitude) * 1.6),
    longitudeDelta: Math.max(0.03, Math.abs(modalSellerLongitude - modalBuyerLongitude) * 1.6)
  } : undefined;

  const openMapModal = (voucher: any) => {
    setMapVoucher(voucher);
    setMapModalVisible(true);
  };

  const closeMapModal = () => {
    setMapModalVisible(false);
    setMapVoucher(null);
    setRouteCoords([]);
    setRouteDistanceKm(null);
    setRouteError(null);
  };

  const fitMapToRoute = () => {
    if (!mapRef.current || !hasMapCoordinates) return;
    const sellerPoint = { latitude: modalSellerLatitude, longitude: modalSellerLongitude };
    const buyerPoint = { latitude: modalBuyerLatitude, longitude: modalBuyerLongitude };
    const coordsToFit = routeCoords.length > 1 ? routeCoords : [sellerPoint, buyerPoint];
    if (coordsToFit.length) {
      try {
        mapRef.current.fitToCoordinates(coordsToFit, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true
        });
      } catch (e) {
        // ignore fit errors
      }
    }
  };

  useEffect(() => {
    const loadRoadRoute = async () => {
      if (!hasMapCoordinates || !mapModalVisible || !mapVoucher) return;
      setRouteLoading(true);
      setRouteError(null);
      try {
        const sellerPos = { latitude: Number(mapVoucher.sellerLatitude), longitude: Number(mapVoucher.sellerLongitude) };
        const buyerPos = { latitude: Number(mapVoucher.buyerLatitude), longitude: Number(mapVoucher.buyerLongitude) };
        const url = buildOsrmRouteUrl(sellerPos, buyerPos, { overview: 'full', geometries: 'geojson' });
        const res = await fetch(url);
        const data = await res.json();
        if (!data?.routes?.length) {
          throw new Error('No route returned');
        }
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((pair: [number, number]) => ({ latitude: pair[1], longitude: pair[0] }));
        setRouteCoords(coords);
        setRouteDistanceKm(route.distance != null ? Number(route.distance) / 1000 : null);
      } catch (err: any) {
        console.warn('FunderClearBill road route error', err);
        setRouteCoords([]);
        setRouteDistanceKm(null);
        setRouteError(err?.message || 'Unable to load route');
      } finally {
        setRouteLoading(false);
      }
    };

    loadRoadRoute();
  }, [hasMapCoordinates, mapModalVisible, mapVoucher]);

  useEffect(() => {
    if (mapModalVisible) {
      fitMapToRoute();
    }
  }, [mapModalVisible, routeCoords, hasMapCoordinates]);
  const { nationality, ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

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
      Alert.alert(combTranslations[lang].funderClearBill.error, combTranslations[lang].funderClearBill.failedToLoadVouchers);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchVouchers();
    }
  }, [isFocused]);

  /* ---------------- Confirm Dialog ---------------- */
  const confirmAction = (voucher: any, action: 'Settle Bill' | 'Decline') => {
    const actionLabel = action === 'Settle Bill' ? t.settleBill : t.decline;
    Alert.alert(
      actionLabel,
      t.confirmAction.replace('{{action}}', actionLabel.toLowerCase()),
      [
        {
          text: t.cancel,
          style: 'cancel'
        },
        {
          text: actionLabel,
          style: action === t.decline ? 'destructive' : 'default',
          onPress: () => action === t.settleBill ? clearVoucher(voucher) : declineVoucher(voucher)
        }
      ]
    );
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
      const message = t.voucherDeclinedMessage
        ? t.voucherDeclinedMessage.replace('{{itemName}}', voucher.itemName)
        : `COMB voucher for ${voucher.itemName} was declined by the funder.`;
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
            title: 'NiSenti: COMB Voucher Declined',
            body: message
          }
        });
      }
      Alert.alert(t.success, t.voucherDeclined);
    } catch (e: any) {
      Alert.alert(t.error, t.declineFailed);
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
          if (bal < totalDebit) throw new Error(t.errorInsufficientFunds);
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
          if (bal < totalDebit) throw new Error(t.errorInsufficientFunds);
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
            owner: voucher.id,
            fees: 0
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
      const message = t.voucherClearedMessage
        ? t.voucherClearedMessage.replace('{{itemName}}', voucher.itemName).replace('{{funderName}}', voucher.funderName)
        : `COMB bill for ${voucher.itemName} has been settled by the funder ${voucher.funderName}.`;
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
            title: 'NiSenti: COMB Voucher Cleared',
            body: message
          }
        });
      }
      setVouchers(prev => prev.filter(v => v.id !== voucher.id));
    } catch (e: any) {
      Alert.alert(t.error, e.message || t.settlementFailed);
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
    }}>{t.noApprovedVouchers || t.noApprovedVouchersFound || 'No approved vouchers found.'}</Text> : <FlatList data={vouchers} keyExtractor={item => item.id} renderItem={({
      item
    }) => <Pressable onPress={() => setSelectedVoucherId(item.id)}><VoucherCard voucher={item} loadingMap={loadingMap} onClear={v => confirmAction(v, t.settleBill)} onDecline={v => confirmAction(v, t.decline)} onOpenMap={openMapModal} /></Pressable>} onEndReached={() => {
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
              <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{t.remainingFundsConsumer}</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>🛒 {t.consumer}: {formatAmountSync(Number(remaining || 0), nationalityToCode(consumerNationality || nationality), ratesMap || undefined)}</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>🏪 {t.seller}: {formatAmountSync(Number(remaining || 0), nationalityToCode(sellerNat), ratesMap || undefined)}</Text>
              <Text style={{ textAlign: 'center', fontSize: 12 }}>💳 {t.funder}: {formatAmountSync(Number(remaining || 0), nationalityToCode(funderNat), ratesMap || undefined)}</Text>
            </View> : null;
      })()}
      <Modal visible={mapModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: mapWindowHeight }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.buyerProximity}</Text>
              <Pressable style={styles.modalCloseButton} onPress={closeMapModal}>
                <Text style={styles.modalCloseText}>{t.close || 'Close'}</Text>
              </Pressable>
            </View>
            {hasMapCoordinates && mapVoucher ? <>
                <View style={styles.routeInfoBar}>
                  <Text style={styles.routeInfoText}>{routeLoading ? t.loadingRoute || 'Loading route…' : routeDistanceKm !== null ? `${t.roadDistance || 'Road distance:'} ${routeDistanceKm.toFixed(3)} km` : routeError || t.distanceUnavailable || 'Location unavailable'}</Text>
                </View>
                <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={styles.modalMap} initialRegion={modalRegion}>
                  {routeCoords.length > 1 && <Polyline coordinates={routeCoords} strokeColor="#4a90e2" strokeWidth={4} zIndex={1} />}
                  <Marker coordinate={{ latitude: modalSellerLatitude, longitude: modalSellerLongitude }} title={t.sellerMarker} description={mapVoucher.sellerName} pinColor="skyblue">
                    <View style={styles.customMarkerContainer}>
                      <View style={[styles.markerDot, { backgroundColor: 'skyblue' }]} />
                      <View style={styles.markerLabelContainer}>
                        <Text style={styles.markerLabel}>{t.sellerMarker}</Text>
                      </View>
                    </View>
                  </Marker>
                  <Marker coordinate={{ latitude: modalBuyerLatitude, longitude: modalBuyerLongitude }} title={t.buyerMarker} description={mapVoucher.consumerName} pinColor="#e29d58">
                    <View style={styles.customMarkerContainer}>
                      <View style={[styles.markerDot, { backgroundColor: '#e29d58' }]} />
                      <View style={styles.markerLabelContainer}>
                        <Text style={styles.markerLabel}>{t.buyerMarker}</Text>
                      </View>
                    </View>
                  </Marker>
                </MapView>
              </> : <View style={styles.noCoordsContainer}>
                <Text style={styles.noCoordsText}>{t.distanceUnavailable || 'Location unavailable'}</Text>
              </View>}
          </View>
        </View>
      </Modal>
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '92%',
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#ddd'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  modalCloseButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#2e86de'
  },
  modalCloseText: {
    color: 'white',
    fontWeight: '700'
  },
  modalMap: {
    flex: 1,
    width: '100%'
  },
  customMarkerContainer: {
    alignItems: 'center'
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  markerLabelContainer: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.65)'
  },
  markerLabel: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700'
  },
  routeInfoBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderColor: '#ddd'
  },
  routeInfoText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700'
  },
  noCoordsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noCoordsText: {
    color: '#666',
    fontSize: 15
  }
});
export default FunderClearApprovedVoucherScreen;