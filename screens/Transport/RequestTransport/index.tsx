// @ts-nocheck
// Complete, integrated MapView + Cart + Checkout + Filters + Custom Markers
// Responsive design with draggable filter, collapsible cart, responsive carousel spacing

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Animated, PanResponder, ScrollView, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { getBizna, getCompany, getNonLoans, getSokoAd, getTransportRegister, listTransportRegisters } from '../../../src/graphql/queries';
import { getSMAccount } from '../../../src/graphql/queries';
import { getUrl } from 'aws-amplify/storage';
import { createTransportOrder, updateTransportRegister, sendNotification, createMessages } from '../../../src/graphql/mutations';
import { Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'react-native'; // ✅ This is correct
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { buildOsrmRouteUrl } from '../../../src/config/osrm';
import { generateClient } from "aws-amplify/api";
import { formatAmountForUser, getUserNationalityByEmail, getExRatesForNationality, convertForeignToKsh } from '../../../src/utils/exchange';
const client = generateClient();
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const INPUT_KEYS = ['radius', 'transportRate', 'transportName', 'transportType'];
const GAP = 4;
const SIDE_PADDING = 8;
const INPUT_WIDTH = (SCREEN_WIDTH - SIDE_PADDING * 2 - GAP * (INPUT_KEYS.length - 1)) / INPUT_KEYS.length;
const PLACEHOLDERS = {
  radius: 'Radius',
  transportRate: 'RateRank',
  transportName: 'TransportName',
  transportType: 'TransportType'
};
export default function SalesItemMapScreen({
  navigation
}) {
  // Dynamic currency context
  const { nationality, ratesMap } = useExchange();
  // No local state for mode/business; always use route.params
  // i18n translation
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [filters, setFilters] = useState({
    radius: '0.05 KM',
    transportRate: '1',
    transportName: '',
    transportType: '',
    dutyStatus: 'TransportOnduty',
    engagementStatus: 'TransportNotEngaged'
  });
  const [allItems, setAllItems] = useState([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [userLocation2, setUserLocation2] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [cartExpanded, setCartExpanded] = useState(true);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [mapLabelPoints, setMapLabelPoints] = useState<{
    rider: { x: number; y: number } | null;
    pickup: { x: number; y: number } | null;
  }>({ rider: null, pickup: null });
  const [sellerlongitude2, setsellerlongitude] = useState('');
  const [sellerlatitude2, setsellerlatitude] = useState('');
  const [company, setCompany] = useState<Company | null>(null);
  const [Rdz, setRdz] = useState(0);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [roadDistance, setRoadDistance] = useState<number>(0);
  const [roadDistanceLoading, setRoadDistanceLoading] = useState<boolean>(false);
  const [userNationality, setUserNationality] = useState<string | null>(null);
  const [userRateData, setUserRateData] = useState<{ buyingPrice: number; sellingPrice: number; symbol?: string } | null>(null);
  const route = useRoute();
  const [ItemUrlz, setItemUrlz] = useState('');
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [OverallTotalDebit, setOverallTotalDebit] = useState(0);
  const carouselPosition = useRef(new Animated.Value(SCREEN_HEIGHT * 0.55)).current;
  const [isLoading2, setIsLoading2] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const mapRef = useRef();
  const listRef = useRef();
  type SokoItem = {
    id: string;
    itemPhoto?: string;
    signedUrl?: string;
    ads: string;
    transportkntct: string;
    transportRate: number;
    transportdesc: string;
    transportPhoto: string;
    owner: string;
    latitude: number;
    longitude: number;
    transportName: string;
    transportType: string;
    dutyStatus: string;
    engagementStatus: string;
    transportRequest: string;
    transportOwnerEmail: string;
    Earnings: number;
    UsrAcCommitment: number;
    ChmAcCommitment: number;
    chmAcNumber: string;
    chmAcCommitmentStatus: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    buyerName: string;
    buyerContact: string;
    deliveryID: string;
    deliveryCost: number;
    customerEmail: string;
    deliveryDesc: string;
    bizAc: string;
    bizType: string;
    purchasePhoto: string;
    deliveryStart: number;
    itemID: string;
  };
  // Fetch road distance using OSRM

  let getDistance: any;
try {
  // Dynamically import geolib for environments where static import fails
  getDistance = require('geolib').getDistance;
  if (typeof getDistance !== 'function') throw new Error('getDistance is not a function');
} catch (e) {
  getDistance = (...args: any[]) => {
    throw new Error('getDistance is not available. Please ensure geolib is installed and properly imported.');
  };
}
  useEffect(() => {
    const fetchRoadDistance = async () => {
      if (
        sellerlatitude2 && sellerlongitude2 &&
        userLocation &&
        typeof userLocation.latitude === 'number' &&
        typeof userLocation.longitude === 'number' &&
        !isNaN(Number(sellerlatitude2)) && !isNaN(Number(sellerlongitude2))
      ) {
        setRoadDistanceLoading(true);
        try {
          // OSRM expects lng,lat order
          const url = buildOsrmRouteUrl(
            userLocation,
            { latitude: Number(sellerlatitude2), longitude: Number(sellerlongitude2) },
            { overview: 'false' }
          );
          const res = await axios.get(url);
          if (res.data.routes && res.data.routes.length > 0) {
            setRoadDistance(res.data.routes[0].distance);
          } else {
            setRoadDistance(0);
          }
        } catch (e) {
          setRoadDistance(0);
        } finally {
          setRoadDistanceLoading(false);
        }
      } else {
        setRoadDistance(0);
      }
    };
    fetchRoadDistance();
  }, [sellerlatitude2, sellerlongitude2, userLocation]);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.spring(carouselPosition, {
        toValue: SCREEN_HEIGHT * 0.25,
        useNativeDriver: false
      }).start();
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.spring(carouselPosition, {
        toValue: SCREEN_HEIGHT * 0.55,
        useNativeDriver: false
      }).start();
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const fetchUserNat = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const nat = await getUserNationalityByEmail(attributes.email ?? '');
        setUserNationality(nat);
        if (nat) {
          const rateData = await getExRatesForNationality(nat);
          setUserRateData(rateData);
        }
      } catch (e) {
        console.warn('fetchUserNat', e);
      }
    };
    fetchUserNat();
  }, []);
  const pan = useRef(new Animated.ValueXY({
    x: 20,
    y: 40
  })).current;
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value
      });
      pan.setValue({
        x: 0,
        y: 0
      });
    },
    onPanResponderMove: Animated.event([null, {
      dx: pan.x,
      dy: pan.y
    }], {
      useNativeDriver: false
    }),
    onPanResponderRelease: () => pan.flattenOffset()
  })).current;
  const carouselPanResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
    onPanResponderMove: (_, gestureState) => {
      carouselPosition.setValue(Math.min(Math.max(gestureState.moveY, SCREEN_HEIGHT * 0.2), SCREEN_HEIGHT * 0.8));
    },
    onPanResponderRelease: (_, gestureState) => {
      const finalY = gestureState.moveY;
      let toValue = SCREEN_HEIGHT * 0.55;
      if (finalY < SCREEN_HEIGHT * 0.4) toValue = SCREEN_HEIGHT * 0.3;else if (finalY > SCREEN_HEIGHT * 0.7) toValue = SCREEN_HEIGHT * 0.75;
      Animated.spring(carouselPosition, {
        toValue,
        useNativeDriver: false
      }).start();
    }
  })).current;
  useEffect(() => {
    (async () => {
      const {
        status
      } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      }
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const res = await client.graphql({
          query: listTransportRegisters
        });
        const rawItems = res.data.listTransportRegisters.items || [];
        console.log('Hi');
        const ads = await Promise.all(rawItems.map(async (item: any) => {
          let signedUrl = null;
          const photoKey = item.photoKey || item.transportPhoto || item.itemPhoto;
          if (photoKey && photoKey !== 'None') {
            try {
              const urlObj = await getUrl({ key: photoKey });
              if (urlObj && urlObj.url) {
                signedUrl = urlObj.url.toString();
              } else {
                signedUrl = null;
              }
            } catch (err) {
              signedUrl = null;
            }
          }
          return {
            ...item,
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            signedUrl
          };
        }));
        setAllItems(ads);
      } catch (err) {
        console.error('HI');
      }
    })();
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const res3 = await client.graphql({
          query: getNonLoans,
          variables: {
            id: route.params.id
          }
        });
        const ItemUrl = res3.data.getNonLoans.owner;
        setItemUrlz(ItemUrl);
        const res = await client.graphql({
          query: getSokoAd,
          variables: {
            id: ItemUrl
          }
        });
        const sellerlatitude = res.data.getSokoAd.latitude;
        const sellerlongitude = res.data.getSokoAd.longitude;
        console.log();
        setsellerlatitude(sellerlatitude);
        setsellerlongitude(sellerlongitude);
      } catch (err) {
        console.error('Hi');
      }
    })();
  }, []);

  //  Calculate distance (in kilometers) between seller and buyer

  const filteredItems = useMemo(() => {
    if (!userLocation) return [];
    const radius = Math.max(1, parseFloat(filters.radius) || 0.05);
    const rank = Math.max(1, parseInt(filters.transportRate) || 1);
    const filtered = allItems.filter(item => {
      const hasCoords = sellerlatitude2 && sellerlongitude2;
      const distance = hasCoords && item.latitude && item.longitude ? getDistance({
        latitude: +sellerlatitude2,
        longitude: +sellerlongitude2
      }, {
        latitude: item.latitude,
        longitude: item.longitude
      }) / 1000 : Infinity;
      const passes = distance <= radius && (!filters.transportType || item.transportType?.toLowerCase().includes(filters.transportType.toLowerCase())) && (!filters.transportName || item.transportName?.toLowerCase().includes(filters.transportName.toLowerCase())) && (!filters.dutyStatus || item.dutyStatus?.toLowerCase().includes(filters.dutyStatus.toLowerCase())) && (!filters.transportRequest || item.transportRequest?.toLowerCase().includes(filters.transportRequest.toLowerCase())) && (!filters.engagementStatus || item.engagementStatus?.toLowerCase().includes(filters.engagementStatus.toLowerCase()));
      if (!passes) {
        console.log('Hi');
      }
      return passes;
    });
    // Ensure signedUrl is always present and up to date
    const filteredWithSignedUrl = filtered.map(item => {
      // Find the original item in allItems (should be itself, but for safety)
      const original = allItems.find(ai => ai.id === item.id);
      return {
        ...item,
        signedUrl: original && original.signedUrl ? original.signedUrl : item.signedUrl || null
      };
    });
    return filteredWithSignedUrl.sort((a, b) => a.transportRate - b.transportRate).slice(0, rank);
  }, [filters, allItems, userLocation]);
  const activeItem = useMemo(() => {
    return filteredItems.find((item: any) => item.id === selectedItemId) || null;
  }, [filteredItems, selectedItemId]);
  useEffect(() => {
    if (filteredItems.length && userLocation) {
      const radius = Math.max(0.05, parseFloat(filters.radius) || 0.05);
      mapRef.current?.animateToRegion({
        ...userLocation,
        latitudeDelta: radius * 0.018,
        longitudeDelta: radius * 0.018
      });
      setRdz(radius);
    }
  }, [filteredItems]);
  const updateQuantity = useCallback((id, delta) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  }, []);
  const onSelectItem = useCallback((item, index) => {
    setSelectedItemId(item.id);
    if (item.latitude && item.longitude) {
      mapRef.current?.animateToRegion({
        latitude: +item.latitude,
        longitude: +item.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
    listRef.current?.scrollToIndex({
      index,
      animated: true
    });
  }, []);

  const refreshMapLabelPoints = useCallback(async () => {
    const map = mapRef.current as any;
    if (!map) return;
    try {
      const riderCoord = activeItem && !isNaN(Number(activeItem.latitude)) && !isNaN(Number(activeItem.longitude))
        ? { latitude: Number(activeItem.latitude), longitude: Number(activeItem.longitude) }
        : null;
      const pickupCoord = sellerlatitude2 && sellerlongitude2 && !isNaN(Number(sellerlatitude2)) && !isNaN(Number(sellerlongitude2))
        ? { latitude: Number(sellerlatitude2), longitude: Number(sellerlongitude2) }
        : null;

      const [riderPt, pickupPt] = await Promise.all([
        riderCoord ? map.pointForCoordinate(riderCoord) : Promise.resolve(null),
        pickupCoord ? map.pointForCoordinate(pickupCoord) : Promise.resolve(null),
      ]);

      setMapLabelPoints({
        rider: riderPt || null,
        pickup: pickupPt || null,
      });
    } catch {
      // Ignore projection errors; labels refresh on next map move.
    }
  }, [activeItem, sellerlatitude2, sellerlongitude2]);

  useEffect(() => {
    refreshMapLabelPoints();
  }, [refreshMapLabelPoints, selectedItemId, sellerlatitude2, sellerlongitude2, cardsCollapsed]);
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const result = await client.graphql({
          query: getCompany,
          variables: {
            AdminId: "BaruchHabaB'ShemAdonai2"
          }
        });
        setCompany(result.data.getCompany);
      } catch (err) {
      }
    };
    fetchCompany();
  }, []);

  // Handler function for registering transport
  interface NonLoanDetails {
    SenderName: string;
    senderPhn: string;
    amount: number;
    id: string;
    owner: string;
    description: string;
  }
  interface SokoAdDetails {
    description: string;
    sokokntct: string;
    busName: string;
    businessType: string;
    bizName: string;
    transportkntct: string;
    transportRate: number;
    transportdesc: string;
    transportPhoto: string;
    latitude: number;
    longitude: number;
    transportName: string;
    transportType: string;
    owner: string;
    transportOwnerEmail: string;
    id: string;
  }
  interface RegisterTransportInput {
    transportRequest: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    buyerName: string;
    buyerContact: string;
    deliveryID: string;
    deliveryCost: number;
    customerEmail: string;
    deliveryDesc: string;
    purchasePhoto: string;
    deliveryStart: number;
    itemID: string;
    transportkntct: string;
    transportRate: number;
    transportdesc: string;
    transportPhoto: string;
    owner: string;
    latitude: number;
    longitude: number;
    transportName: string;
    transportType: string;
    dutyStatus: string;
    engagementStatus: string;
    transportOwnerEmail: string;
    Earnings: number;
    UsrAcCommitment: number;
    ChmAcCommitment: number;
    chmAcNumber: string;
    chmAcCommitmentStatus: string;
    bizAc: string;
    bizType: string;
    distance: number;
    orderCost: number;
    sellerLatitude: number;
    sellerLongitude: number;
    sellerContact: string;
    sellerName: string;
  }
  interface AuthUser {
    attributes: {
      email: string;
      [key: string]: any;
    };
    [key: string]: any;
  }
  const registerTransport = async (item: SokoItem): Promise<void> => {
    console.log('[registerTransport] called for item:', item);
    const userInfo: AuthUser = await fetchUserAttributes();
    if (!userInfo || !userInfo.email) {
      console.log('[registerTransport] No userInfo or email');
      Alert.alert("User Error", "Could not retrieve your email. Please re-login.");
      setLoadingItemId(null);
      return;
    }
    setLoadingItemId(item.id);
    const coords: {
      latitude: number;
      longitude: number;
    } = location || {
      latitude: 0,
      longitude: 0
    };

    // Always use route.params for mode/business (assume present)
    const effectiveMode = route?.params?.mode;
    const effectiveBizna = route?.params?.selectedBizna;
    // Set senderName based on mode
    let senderName = userInfo?.email;
    if (effectiveMode === 'B2B' && effectiveBizna && effectiveBizna.busName) {
      senderName = effectiveBizna.busName;
    } else {
      try {
        const smAccountRes = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: userInfo?.email }
        });
        senderName = smAccountRes?.data?.getSMAccount?.name;
      } catch (err) {
        // fallback to email if error
      }
    }
    console.log('[registerTransport] senderName:', senderName);
    try {
      console.log('[registerTransport] Fetching NonLoans, SokoAd, TransportRegister');
      // --- Calculate costs and then check buyer's available funds before proceeding ---
      const res4 = await client.graphql({
        query: getNonLoans,
        variables: {
          id: route.params.id
        }
      });
      const ItemDtls4: NonLoanDetails = res4.data.getNonLoans;
      const res2 = await client.graphql({
        query: getSokoAd,
        variables: {
          id: ItemDtls4.owner
        }
      });
      const AdDtls: SokoAdDetails = res2.data.getSokoAd;
      const res6 = await client.graphql({
        query: getTransportRegister,
        variables: {
          id: item.id
        }
      });
      const ItemDtls6: SokoAdDetails = res6.data.getTransportRegister;
      if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
        console.log('[registerTransport] Invalid userLocation:', userLocation);
        Alert.alert(t.locationErrorTitle || "Location Error", t.locationErrorMsg || "Unable to get your current location. Please check location permissions and try again.");
        setLoadingItemId(null);
        return;
      }
      // determine seller nationality and convert computed amounts to KES for storage
      let sellerNationality = ItemDtls6?.nationality || null;
      if (!sellerNationality && ItemDtls6?.transportOwnerEmail) sellerNationality = await getUserNationalityByEmail(ItemDtls6.transportOwnerEmail);
      const deliveryCostRaw = Number(((roadDistance / 1000) * item.transportRate).toFixed(0));
      const orderCostRaw = Number(ItemDtls4.amount);
      const deliveryCostKes = sellerNationality ? await convertForeignToKsh(deliveryCostRaw, sellerNationality) : deliveryCostRaw;
      const orderCostKes = sellerNationality ? await convertForeignToKsh(orderCostRaw, sellerNationality) : orderCostRaw;
      console.log('[registerTransport] deliveryCostRaw:', deliveryCostRaw, 'orderCostRaw:', orderCostRaw, 'deliveryCostKes:', deliveryCostKes, 'orderCostKes:', orderCostKes);
      // Extra log for debugging deliveryCostKes
      console.log('[registerTransport] DEBUG deliveryCostKes to be sent:', deliveryCostKes);
      // Determine purchaseType and customerEmail based on mode
      let purchaseType = 'B2C';
      let customerEmail = userInfo.email ?? '';
      if (route?.params?.mode === 'B2B' && route?.params?.selectedBizna && route.params.selectedBizna.BusKntct) {
        purchaseType = 'B2B';
        customerEmail = route.params.selectedBizna.BusKntct;
      }
      console.log('[registerTransport] purchaseType:', purchaseType, 'customerEmail:', customerEmail);
      // --- Now check buyer's available funds ---
      let hasSufficientFunds = false;
      if (route?.params?.mode === 'B2B' && route?.params?.selectedBizna && route.params.selectedBizna.BusKntct) {
        // B2B: Check Bizna earningsBal only
        const biznaRes = await client.graphql({ query: getBizna, variables: { BusKntct: route.params.selectedBizna.BusKntct } });
        const bizna = biznaRes?.data?.getBizna;
        const earningsBal = parseFloat(bizna?.earningsBal || '0');
        console.log('[registerTransport] B2B earningsBal:', earningsBal, 'deliveryCostKes:', deliveryCostKes);
        if (earningsBal >= deliveryCostKes) {
          hasSufficientFunds = true;
        } else {
          console.log('[registerTransport] Insufficient B2B funds:', earningsBal, deliveryCostKes);
          Alert.alert(
            t.insufficientFundsTitle || 'Insufficient Funds',
            t.insufficientFundsMsgB2B || 'Your business account does not have enough funds to request transport.'
          );
          setLoadingItemId(null);
          return;
        }
      } else {
        // B2C: Check SMAccount balance
        const smAccountRes = await client.graphql({ query: getSMAccount, variables: { awsemail: userInfo.email } });
        const smAccount = smAccountRes?.data?.getSMAccount;
        const balance = parseFloat(smAccount?.balance || '0');
        console.log('[registerTransport] B2C balance:', balance, 'deliveryCostKes:', deliveryCostKes);
        if (balance >= deliveryCostKes) {
          hasSufficientFunds = true;
        } else {
          console.log('[registerTransport] Insufficient B2C funds:', balance, deliveryCostKes);
          Alert.alert(
            t.insufficientFundsTitle || 'Insufficient Funds',
            t.insufficientFundsMsgB2C || 'Your account does not have enough funds to request transport.'
          );
          setLoadingItemId(null);
          return;
        }
      }
     
      
      
      const attributes = await fetchUserAttributes();
      if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
        Alert.alert(t.locationErrorTitle || "Location Error", t.locationErrorMsg || "Unable to get your current location. Please check location permissions and try again.");
        return;
      }
      // determine seller nationality and convert computed amounts to KES for storage
      if (!sellerNationality && ItemDtls6?.transportOwnerEmail) sellerNationality = await getUserNationalityByEmail(ItemDtls6.transportOwnerEmail);
      // Determine purchaseType and customerEmail based on mode
      if (effectiveMode === 'B2B' && effectiveBizna && effectiveBizna.BusKntct) {
        purchaseType = 'B2B';
        customerEmail = effectiveBizna.BusKntct;
      }
      const input: RegisterTransportInput = {
        transportkntct: ItemDtls6.transportkntct,
        transportRate: ItemDtls6.transportRate,
        transportdesc: ItemDtls6.transportdesc,
        transportPhoto: ItemDtls6.transportPhoto,
        owner: ItemDtls6.owner,
        latitude: Number(ItemDtls6.latitude),
        longitude: Number(ItemDtls6.longitude),
        transportName: ItemDtls6.transportName,
        transportType: ItemDtls6.transportType,
        dutyStatus: "TransportOnduty",
        engagementStatus: "TransportNotEngaged",
        transportRequest: "transportRequestYes",
        transportOwnerEmail: ItemDtls6.transportOwnerEmail,
        buyerOfficerEmail: userInfo.email,
        Earnings: 0,
        UsrAcCommitment: 0,
        ChmAcCommitment: 0,
        chmAcNumber: "String",
        chmAcCommitmentStatus: "TransportChmCommitmentNo",
        deliveryLatitude: Number(userLocation.latitude),
        deliveryLongitude: Number(userLocation.longitude),
        buyerName: ItemDtls4.SenderName,
        buyerContact: attributes.phone_number ?? '',
        deliveryID: ItemDtls4.id,
        deliveryCost: deliveryCostKes,
        purchaseType,
        customerEmail,
        deliveryDesc: ItemDtls4.description,
        //transport account id
        bizAc: ItemDtls6.id,
        //dispatch status
        bizType: "NotDispatched",
        purchasePhoto: ItemDtls4.owner,
        deliveryStart: 0,
        itemID: ItemDtls4.owner,
        sellerContact: AdDtls.sokokntct,
        sellerName: AdDtls.bizName,
        sellerLatitude: Number(sellerlatitude2),
        sellerLongitude: Number(sellerlongitude2),
        distance: Number(roadDistance / 1000),
        orderCost: orderCostKes
      };
      console.log('[registerTransport] route.params:', route?.params);
      console.log('[registerTransport] effectiveMode:', effectiveMode, 'effectiveBizna:', effectiveBizna);
      console.log('[registerTransport] purchaseType:', purchaseType, 'customerEmail:', customerEmail);
      if (ItemDtls6.transportOwnerEmail === userInfo.email && purchaseType === 'B2C') {
        console.log('[registerTransport] Blocked self-transport for B2C');
        Alert.alert(t.sorryTitle || "Sorry", t.cannotRequestOwnTransport || "You cannot request your own transport.");
        setLoadingItemId(null);
        return;
      }
      console.log('[registerTransport] Submitting transport order mutation', input);
      const mutationResult = (await client.graphql({
        query: createTransportOrder,
        variables: {
          input
        }
      })) as {
        data?: any;
      };
      // Log the mutation response for debugging
      console.log('[registerTransport] createTransportOrder mutation response:', mutationResult);
      if (mutationResult?.data?.createTransportOrder) {
        console.log('[registerTransport] Transport order created successfully');
        Alert.alert(t.transportRequestSuccess || 'Transport Request Successful');
        setSelectedItemId(null);
        setQuantities({});
        setCart([]);
        setCartExpanded(false);
        setFilters({
          radius: '0.05 KM',
          transportRate: '1',
          transportName: '',
          transportType: '',
          dutyStatus: 'TransportOnduty',
          engagementStatus: 'TransportNotEngaged'
        });
      } else {
        console.log('[registerTransport] Transport order mutation failed', mutationResult);
      }
      // --- Notification and Message Logic for Delivery Receipt ---
      try {
        // Notify transporter (transportOwnerEmail of TransportOrder)
        const notifTitleTransporter = t.transportRequestTitle || 'New Transport Request';
        const notifBodyTransporter = t.transportRequestNotifTransporter
          ? t.transportRequestNotifTransporter.replace('{name}', senderName)
          : `${senderName} has placed a new transport request. Please review and accept if available.`;
        await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: ItemDtls6.transportOwnerEmail,
              messageBody: notifBodyTransporter
            }
          }
        });
        await client.graphql({
          query: sendNotification,
          variables: {
            riderEmail: ItemDtls6.transportOwnerEmail,
            title: notifTitleTransporter,
            body: notifBodyTransporter
          }
        });

        // Notify seller (getBizna.email via sellerContact)
        if (AdDtls.sokokntct) {
          const biznaRes = await client.graphql({ query: getBizna, variables: { BusKntct: AdDtls.sokokntct } });
          const bizna = biznaRes?.data?.getBizna;
          if (bizna && bizna.email) {
            const notifTitleSeller = t.transportRequestTitle || 'New Transport Request';
            const notifBodySeller = t.transportRequestNotifSeller
              ? t.transportRequestNotifSeller.replace('{name}', senderName)
              : `${senderName} has placed a new transport request for your order. Please dispatch when ready.`;
            await client.graphql({
              query: createMessages,
              variables: {
                input: {
                  senderEmail: bizna.email,
                  messageBody: notifBodySeller
                }
              }
            });
            await client.graphql({
              query: sendNotification,
              variables: {
                riderEmail: bizna.email,
                title: notifTitleSeller,
                body: notifBodySeller
              }
            });
          }
        }
      } catch (notifyErr) {
      }
      // --- End Notification and Message Logic for Delivery Receipt ---
    } catch (err) {
      Alert.alert(t.errorTitle || 'Error', t.failedRequestTransport || 'Failed to request transport. Try again.');
      console.log('[registerTransport] Caught error:', err);
    } finally {
      setLoadingItemId(null);
    }
  };
  if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
    return <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>{t.locationErrorMsg || 'Unable to get your location. Please check location permissions and try again.'}</Text>
        <TouchableOpacity onPress={() => {
          (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({});
              setUserLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
              });
            } else {
              Alert.alert(t.locationErrorTitle || 'Location Error', t.locationPermissionDenied || 'Location permission denied. Please enable location services.');
            }
          })();
        }} style={{marginTop: 20, padding: 12, backgroundColor: '#1e90ff', borderRadius: 8}}>
          <Text style={{color: 'white'}}>{t.retryLocation || 'Retry Location'}</Text>
        </TouchableOpacity>
      </View>;
  }
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          showsUserLocation
          onMapReady={refreshMapLabelPoints}
          onRegionChangeComplete={refreshMapLabelPoints}
          initialRegion={{
            ...userLocation,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
          }}
        >
          {filteredItems.map((item, index) => (
            <Marker
              key={item.id}
              coordinate={{
                latitude: +item.latitude,
                longitude: +item.longitude
              }}
              onPress={() => onSelectItem(item, index)}
            >
              <View
                style={[
                  styles.mapMarkerDot,
                  selectedItemId === item.id ? styles.selectedRiderMarkerDot : styles.riderMarkerDot
                ]}
              />
            </Marker>
          ))}

          {sellerlatitude2 && sellerlongitude2 && (
            <Marker
              coordinate={{
                latitude: Number(sellerlatitude2),
                longitude: Number(sellerlongitude2)
              }}
              title="Seller"
              description="Seller Location"
              pinColor="orange"
            >
              <View
                style={[
                  styles.mapMarkerDot,
                  selectedItemId ? styles.selectedPickupMarkerDot : styles.pickupMarkerDot
                ]}
              />
            </Marker>
          )}
        </MapView>
        <View style={styles.mapTextOverlay} pointerEvents="none">
          {mapLabelPoints.rider && activeItem && (
            <>
              <View
                style={[
                  styles.mapConnectorLine,
                  styles.riderConnectorLine,
                  {
                    left: mapLabelPoints.rider.x - 1,
                    top: mapLabelPoints.rider.y - 16,
                  },
                ]}
              />
              <Text
                style={[
                  styles.mapTextChip,
                  styles.riderTextChip,
                  {
                    left: mapLabelPoints.rider.x,
                    top: mapLabelPoints.rider.y - 34,
                    transform: [{ translateX: -70 }],
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t.transport}: {activeItem.transportName || t.transport}
              </Text>
            </>
          )}

          {mapLabelPoints.pickup && (
            <>
              <View
                style={[
                  styles.mapConnectorLine,
                  styles.pickupConnectorLine,
                  {
                    left: mapLabelPoints.pickup.x - 1,
                    top: mapLabelPoints.pickup.y - 16,
                  },
                ]}
              />
              <Text
                style={[
                  styles.mapTextChip,
                  styles.pickupTextChip,
                  {
                    left: mapLabelPoints.pickup.x,
                    top: mapLabelPoints.pickup.y - 34,
                    transform: [{ translateX: -42 }],
                  },
                ]}
                numberOfLines={1}
              >
                {t.sellerLabel}
              </Text>
            </>
          )}
        </View>
        {/* Floating Refresh Spinner Button */}
        <TouchableOpacity
          onPress={isLoading2 ? undefined : async () => {
            setIsLoading2(true);
            try {
              // Re-fetch transporters logic (copy from your fetch logic above)
              const res = await client.graphql({ query: listTransportRegisters });
              const rawItems = res.data.listTransportRegisters.items || [];
              setAllItems(rawItems || []);
              const ads = await Promise.all(rawItems.map(async (item) => {
                let signedUrl = null;
                if (item.transportPhoto && item.transportPhoto !== 'None') {
                  try {
                    const urlObj = await getUrl({ key: item.transportPhoto });
                    if (urlObj && urlObj.url) {
                      signedUrl = urlObj.url.toString();
                    } else {
                      signedUrl = null;
                    }
                  } catch (err) {
                    signedUrl = null;
                  }
                }
                return {
                  ...item,
                  latitude: parseFloat(item.latitude),
                  longitude: parseFloat(item.longitude),
                  signedUrl
                };
              }));
              setAllItems(ads);
            } catch (err) {
              // Optionally show error
            } finally {
              setIsLoading2(false);
            }
          }}
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 100,
            backgroundColor: '#e58d29',
            borderRadius: 25,
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            opacity: isLoading2 ? 0.7 : 1
          }}
          activeOpacity={0.7}
          disabled={isLoading2}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: isLoading2
                    ? new Animated.Value(0).interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    : '0deg'
                }
              ]
            }}
          >
            <FontAwesome name="refresh" size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
      {/* Draggable Filter Panel */}
      <Animated.View style={[styles.filterPanel, pan.getLayout()]} {...panResponder.panHandlers}>
        <View style={styles.inputsRow}>
          {INPUT_KEYS.map((key, idx) => (
            <View
              key={key}
              style={{
                width: INPUT_WIDTH,
                marginRight: idx < INPUT_KEYS.length - 1 ? GAP : 0
              }}
            >
              <TextInput
                placeholder={t[key] || (PLACEHOLDERS as any)[key]}
                keyboardType={['radius', 'transportRate'].includes(key) ? 'numeric' : 'default'}
                style={styles.input}
                placeholderTextColor="#999"
                value={(filters as any)[key]}
                onChangeText={text =>
                  setFilters(f => ({
                    ...f,
                    [key]: text
                  }))
                }
              />
            </View>
          ))}
        </View>
        <View style={styles.handleWrapper}>
          <View style={styles.handleLine} />
        </View>
      </Animated.View>
      {/* Responsive Carousel */}
      {cardsCollapsed && (
        <TouchableOpacity
          style={styles.floatingShowCardsBtn}
          onPress={() => setCardsCollapsed(false)}
          activeOpacity={0.9}
        >
          <Text style={styles.floatingShowCardsText}>{t.showTransportDetails || 'Show Transport Details'}</Text>
        </TouchableOpacity>
      )}
      {!cardsCollapsed && (
      <Animated.View style={[styles.carouselContainer, { top: carouselPosition }]}> 
        <TouchableOpacity
          style={styles.cardsHideFloatingBtn}
          onPress={() => setCardsCollapsed(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.cardsHideBtnText}>{t.hideTransportDetails || 'Hide'}</Text>
        </TouchableOpacity>
        <FlatList
          ref={listRef}
          data={filteredItems}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => {
            const qty = quantities[item.id] || 1;
            const total = (roadDistance / 1000) * item.transportRate;
            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  selectedItemId === item.id && styles.cardSelected,
                  { flexDirection: 'row', alignItems: 'center' }
                ]}
                onPress={() => onSelectItem(item, index)}
                onLongPress={() => registerTransport(item)}
              >
                {/* RIGHT: Image */}
                {item.signedUrl ? (
                  <Image source={{ uri: item.signedUrl }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                ) : (
                  <View style={{ width: 60, height: 90, backgroundColor: '#e58d29', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff' }}>{(item.transportType || 'TR').slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                {/* LEFT: Text and buttons */}
                <View style={{ flex: 1, padding: 10 }}>
                  <Text style={styles.text}>
                    {t.transportNameLabel
                      ? t.transportNameLabel.replace('{name}', item.transportName)
                      : item.transportName}{' '}
                    {t.offering || 'offering'} {item.transportType} {t.services || 'services'} @{' '}
                    {formatAmountSync(item.transportRate, nationalityToCode(nationality), ratesMap)} / KM ={' '}
                    {formatAmountSync(total, nationalityToCode(nationality), ratesMap)} {t.forLabel || 'for'}{' '}
                    {roadDistanceLoading ? t.loadingRoadDistance || 'Loading road distance...' : `${(roadDistance / 1000).toFixed(2)} ${t.roadDistance || 'Road Kilometers'}`}. {t.contact || 'Contact'}:
                    {item.transportkntct} | {t.longPressRequest || 'Long press to Request transport'}
                  </Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('TransportDetails', { id: item.id })}
                      style={[styles.btn, { backgroundColor: '#e58d29' }]}
                    >
                      <Text style={{ color: 'white', fontSize: 12 }}>{t.viewDetails || 'Details'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => registerTransport(item)}
                      style={[
                        styles.btn,
                        {
                          backgroundColor: '#e58d29',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: loadingItemId === item.id ? 0.7 : 1
                        }
                      ]}
                      disabled={loadingItemId === item.id}
                    >
                      {loadingItemId === item.id && (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                      )}
                      <Text style={{ color: 'white', fontSize: 12 }}>
                        {loadingItemId === item.id
                          ? t.processing || 'Processing...'
                          : t.transport || 'Transport'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterPanel: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 6,
    elevation: 5,
    zIndex: 1
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  handleWrapper: {
    alignItems: 'center',
    marginTop: 4
  },
  handleLine: {
    width: 38,
    height: 10,
    backgroundColor: '#aaa',
    borderRadius: 2
  },
  input: {
    borderBottomWidth: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#e58d29',
    paddingVertical: 2,
    paddingHorizontal: 2,
    backgroundColor: '#f5f5f5',
    height: 15
  },
  carouselImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: 'center'
  },
  mapMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
  },
  riderMarkerDot: {
    backgroundColor: '#1f8ef1',
  },
  pickupMarkerDot: {
    backgroundColor: '#27ae60',
  },
  selectedRiderMarkerDot: {
    backgroundColor: '#1f8ef1',
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  selectedPickupMarkerDot: {
    backgroundColor: '#27ae60',
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  mapTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  mapTextChip: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#fff',
    maxWidth: SCREEN_WIDTH * 0.42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  riderTextChip: {
    backgroundColor: '#1f8ef1',
  },
  pickupTextChip: {
    backgroundColor: '#27ae60',
  },
  mapConnectorLine: {
    position: 'absolute',
    width: 2,
    height: 12,
    borderRadius: 1,
  },
  riderConnectorLine: {
    backgroundColor: '#1f8ef1',
  },
  pickupConnectorLine: {
    backgroundColor: '#27ae60',
  },
  carouselContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: 130,
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 1,
    pointerEvents: 'box-none'
  },
  floatingShowCardsBtn: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    backgroundColor: '#e58d29',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  floatingShowCardsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  cardsHideFloatingBtn: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    backgroundColor: '#e58d29',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  cardsHideBtn: {
    backgroundColor: '#e58d29'
  },
  cardsHideBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 6,
    padding: 1,
    borderRadius: 6,
    width: SCREEN_WIDTH * 0.8,
    elevation: 2
  },
  cardSelected: {
    borderColor: '#00aaff',
    borderWidth: 2
  },
  text: {
    fontSize: 12
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  btn: {
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4
  },
  cartContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    elevation: 5,
    maxHeight: SCREEN_HEIGHT * 0.5
  },
  button: {
    marginTop: 20,
    backgroundColor: '#f5a623',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  carouselHandle: {
    alignSelf: 'center',
    width: 40,
    height: 10,
    borderRadius: 3,
    backgroundColor: '#aaa',
    marginBottom: 6
  },
  buttonText: {
    color: '#1b1b1b',
    fontWeight: 'bold',
    fontSize: 16
  },
  sellerMarker: {
    backgroundColor: '#e58d29',
    borderRadius: 20,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  sellerMarkerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
    marginTop: 2
  }
});