// @ts-nocheck
// Complete, integrated MapView + Cart + Checkout + Filters + Custom Markers
// Responsive design with draggable filter, collapsible cart, responsive carousel spacing

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRoute } from '@react-navigation/native';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, 
  Dimensions, ActivityIndicator, Animated, PanResponder, ScrollView, 
  Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, 
  Platform, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import {useTranslation} from 'react-i18next';
import { translations } from './translation';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { listSokoAds, getBizna, getCompany, getSMAccount, listCovCreditSellers, listCvrdGroupLoans, listSMLoansCovereds, listBiznas } from '../../../../src/graphql/queries';
import { getUrl } from 'aws-amplify/storage';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { buildOsrmRouteUrl } from '../../../../src/config/osrm';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'react-native';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';

const client = generateClient();
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const INPUT_KEYS = ['radius', 'brand', 'business', 'itemName', 'cheapestRank', 'bizName'];
const GAP = 4;
const SIDE_PADDING = 8;
const INPUT_WIDTH = (SCREEN_WIDTH - SIDE_PADDING * 2 - GAP * (INPUT_KEYS.length - 1)) / INPUT_KEYS.length;
const PLACEHOLDERS: Record<string,string> = {
  radius: 'Radius',
  brand: 'Brand',
  business: 'BizType',
  itemName: 'Item',
  cheapestRank: 'Cost Rank',
  bizName: 'BizName'
};
function SalesItemMapScreenInner({ navigation }: { navigation: any }) {
    const route = useRoute<any>();
    const [cascadeBusinessAccountNumber, setCascadeBusinessAccountNumber] = useState(route.params?.recipientBusinessAccountNumber || '');
    const [cascadeAmount, setCascadeAmount] = useState(route.params?.cascadeAmount || '');
    const [fromCascadePayments, setFromCascadePayments] = useState(Boolean(route.params?.fromCascadePayments));
    const [cascadeSenderRef, setCascadeSenderRef] = useState(route.params?.senderAccountRef || '');
    const [cascadeSenderName, setCascadeSenderName] = useState(route.params?.senderAccountName || '');
    const [cascadeSenderFlowId, setCascadeSenderFlowId] = useState(route.params?.senderFlowId || '');
    const [cascadeSenderOwner, setCascadeSenderOwner] = useState(route.params?.senderOwner || '');
    const [cascadeRecipientType, setCascadeRecipientType] = useState(route.params?.recipientType || 'BUSINESS');
    const [cascadeFeeAmount, setCascadeFeeAmount] = useState(route.params?.feeAmount || 0);
    // Fetch signed-in user's email and then fetch Biznas
    const fetchUserEmailAndBiznas = async () => {
      console.log('fetchUserEmailAndBiznas CALLED');
      setLoadingBiznas(true);
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const email = attributes.email;
        setUserEmail(email);
        // Query all Biznas (pagination omitted for brevity)
        const res: any = await client.graphql({ query: listBiznas });
        const allBiznas = res.data.listBiznas.items || [];
        // Debug logs for diagnostics
        console.log('User email:', email);
        console.log('All businesses:', allBiznas);
        // Filter where user is admin
        const filtered = allBiznas.filter((biz: any) => {
          // Log the current Bizna being checked
          console.log('Buyer Bizna:', biz.busName, '| Contact:', biz.BusKntct, '| Admin1:', biz.Admin1);
          for (let i = 1; i <= 50; ++i) {
            const adminVal = biz[`Admin${i}`];
            if (adminVal && adminVal !== 'None') {
              // Debug log for comparison
              console.log('Comparing admin:', adminVal, 'with user:', email);
              if (adminVal.toLowerCase().trim() === email.toLowerCase().trim()) return true;
            }
          }
          return false;
        });
        setBiznas(filtered);
      } catch (err) {
        console.log('fetchUserEmailAndBiznas ERROR:', err);
        setBiznas([]);
      }
      setLoadingBiznas(false);
    };

  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Polyline state for showing route from user to selected item
  const [polylineCoords, setPolylineCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  // Dynamic currency context
  // i18n translation
    const { i18n } = useTranslation();
    const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const t = translations[lang] || translations.en;
  const { nationality, ratesMap } = useExchange();
  // Defensive: ensure nationality is a simple string (some flows return null or an object)
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const natCode = nationalityToCode(safeNationality);
  const [filters, setFilters] = useState({
    radius: '0.1 KM',
    brand: '',
    business: '',
    itemName: '',
    cheapestRank: '1',
    bizName: ''
  });
  const [allItems, setAllItems] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [mapLabelPoints, setMapLabelPoints] = useState<{ item?: { x: number; y: number } | null }>({});

  // Update polyline when selected item or user location changes
  useEffect(() => {
    const drawPolyline = async () => {
      if (!userLocation || !selectedItemId) {
        setPolylineCoords([]);
        return;
      }
      const item = allItems.find(i => i.id === selectedItemId);
      if (!item || !item.latitude || !item.longitude) {
        setPolylineCoords([]);
        return;
      }
      try {
        const url = buildOsrmRouteUrl(userLocation, { latitude: Number(item.latitude), longitude: Number(item.longitude) }, { overview: 'full', geometries: 'geojson' });
        const res = await axios.get(url);
        const routeGeometry = res?.data?.routes?.[0]?.geometry;
        const rawCoords = routeGeometry?.coordinates;
        if (Array.isArray(rawCoords) && rawCoords.length > 0) {
          const coords = rawCoords
            .filter((coord: any) => Array.isArray(coord) && coord.length >= 2 && Number.isFinite(coord[0]) && Number.isFinite(coord[1]))
            .map((coord: any) => ({
              latitude: Number(coord[1]),
              longitude: Number(coord[0])
            }));
          setPolylineCoords(coords.length > 0 ? coords : [
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: item.latitude, longitude: item.longitude }
          ]);
        } else {
          setPolylineCoords([
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: item.latitude, longitude: item.longitude }
          ]);
        }
      } catch (err) {
        setPolylineCoords([
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: item.latitude, longitude: item.longitude }
        ]);
      }
    };
    drawPolyline();
  }, [userLocation, selectedItemId, allItems]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<any[]>([]);
  const [cartExpanded, setCartExpanded] = useState(true);
  const [showCart, setShowCart] = useState(true);
  const [showCarousel, setShowCarousel] = useState(true);
  const [password, setPassword] = useState('');
  const [filteredItems2, setItems3] = useState<any[]>([]);
  const [Ttl, setFilteredItems3] = useState<any[]>([]);
  const [company, setCompany] = useState<any | null>(null);

  const handleCascadePaymentsReturn = useCallback((returnData?: { businessCheckoutPayload?: any }) => {
    if (fromCascadePayments) {
      safeNavigateFrom(navigation, 'CascadePaymentsScreen', {
        fromCascadePaymentsReturn: true,
        businessCheckoutPayload: returnData?.businessCheckoutPayload,
        senderAccountRef: route.params?.senderAccountRef || cascadeSenderRef,
        senderAccountName: route.params?.senderAccountName || cascadeSenderName,
        senderFlowId: route.params?.senderFlowId || cascadeSenderFlowId,
        senderOwner: route.params?.senderOwner || cascadeSenderOwner,
        recipientType: route.params?.recipientType || cascadeRecipientType,
      });
      return;
    }
    navigation.goBack();
  }, [fromCascadePayments, navigation, route.params?.senderAccountRef, route.params?.senderAccountName, route.params?.senderFlowId, route.params?.senderOwner, route.params?.recipientType, cascadeSenderRef, cascadeSenderName, cascadeSenderFlowId, cascadeSenderOwner, cascadeRecipientType]);
  const [OverallTotalDebit, setOverallTotalDebit] = useState(0);
  const carouselPosition = useRef(new Animated.Value(SCREEN_HEIGHT * 0.4)).current;
  const [isLoading2, setIsLoading2] = useState(false); // For Quick Checkout
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const mapRef = useRef<any>(null);
  const listRef = useRef<any>(null);
  type SokoItem = {
    id: string;
    sokoname: string;
    sokoprice: number;
    unitQuantity: number;
    itemUnit: string;
    itemBrand: string;
    bizName: string;
    businessType: string;
    bizContact: string;
    itemPhoto?: string;
    signedUrl?: string;
    ads: string;
    sokodesc: string;
  };

  // Keyboard listeners for carousel
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.spring(carouselPosition, {
        toValue: SCREEN_HEIGHT * 0.25,
        useNativeDriver: false
      }).start();
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.spring(carouselPosition, {
        toValue: SCREEN_HEIGHT * 0.4,
        useNativeDriver: false
      }).start();
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Carousel drag
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

  // Location
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

  // Fetch ads (refactor for refresh)
  // Animated loading state for refresh icon
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isRefreshing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.linear
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isRefreshing]);

  const fetchAds = async () => {
    setIsRefreshing(true);
    try {
      const res: any = await client.graphql({
        query: listSokoAds,
        variables: {
          filter: {
            purchaseType: { eq: 'PayFull' }
          }
        }
      });
      const rawItems = res.data.listSokoAds.items || [];
      const ads = await Promise.all(rawItems.map(async (item: any) => {
        let signedUrl = null;
        if (item.itemPhoto && item.itemPhoto !== 'None') {
          try {
            const urlObj = await getUrl({ key: item.itemPhoto });
            // console.log removed to declutter logs
            if (urlObj && urlObj.url) {
              signedUrl = urlObj.url.toString();
              // console.log removed to declutter logs
            } else {
              console.error('getUrl did not return a .url property for', item.itemPhoto, urlObj);
              signedUrl = null;
            }
          } catch (err) {
            console.error('Failed to get signed URL for image:', item.itemPhoto, err);
            signedUrl = null;
          }
        } else {
          console.log('No itemPhoto or itemPhoto is None for item', item.id, item.itemPhoto);
        }
        let sellerNationality = null;
        if (!item.sokokntct) {
          console.warn('[SKIP] SokoAd missing sokokntct, id:', item.id, item);
        } else {
          try {
            const bizRes: any = await client.graphql({ query: getBizna, variables: { BusKntct: item.sokokntct } });
            const biz = bizRes?.data?.getBizna;
            console.log('[DEBUG] getBizna result for', item.sokokntct, ':', biz);
            if (!biz) {
              console.warn('[DEBUG] getBizna returned undefined/null for', item.sokokntct, 'raw result:', bizRes);
            }
            if (biz?.email) sellerNationality = biz.Nationality;
          } catch (e) {
            console.error('[ERROR] getBizna failed for', item.sokokntct, e);
          }
        }
        return {
          ...item,
          latitude: parseFloat(item.latitude),
          longitude: parseFloat(item.longitude),
          signedUrl,
          sellerNationality
        };
      }));
      setAllItems(ads);
      setItems3(ads);
      setFilteredItems3(ads);
    } catch (err) {
      console.error('Error fetching SokoAds:', err);
    } finally {
      setIsRefreshing(false);
    }
  };
  useEffect(() => { fetchAds(); }, []);

  // Filtering
  const filteredItems = useMemo(() => {
    if (!userLocation) return [];
    const radius = Math.max(1, parseFloat(filters.radius) || 0.1);
    const rank = Math.max(1, parseInt(filters.cheapestRank) || 1);
    return allItems.filter(item => {
      const hasCoords = item.latitude && item.longitude;
      const distance = hasCoords ? getDistance(userLocation, {
        latitude: +item.latitude,
        longitude: +item.longitude
      }) / 1000 : Infinity;
      return distance <= radius && (!filters.brand || item.itemBrand?.toLowerCase().includes(filters.brand.toLowerCase())) && (!filters.business || item.businessType?.toLowerCase().includes(filters.business.toLowerCase())) && (!filters.itemName || item.sokoname?.toLowerCase().includes(filters.itemName.toLowerCase())) && (!filters.bizName || item.bizName?.toLowerCase().includes(filters.bizName.toLowerCase()));
    }).sort((a, b) => a.sokoprice - b.sokoprice).slice(0, rank);
  }, [filters, allItems, userLocation]);

  // Animate map to filtered region
  useEffect(() => {
    if (filteredItems.length && userLocation) {
      const radius = Math.max(0.1, parseFloat(filters.radius) || 0.1);
      mapRef.current?.animateToRegion({
        ...userLocation,
        latitudeDelta: radius * 0.018,
        longitudeDelta: radius * 0.018
      });
    }
  }, [filteredItems]);

  const activeItem = useMemo(() => filteredItems.find(i => i.id === selectedItemId) || null, [filteredItems, selectedItemId]);
  const refreshMapLabelPoints = useCallback(async () => {
    const map: any = mapRef.current;
    if (!map || !activeItem) {
      setMapLabelPoints({ item: null });
      return;
    }
    try {
      const itemCoord = { latitude: Number(activeItem.latitude), longitude: Number(activeItem.longitude) };
      const itemPt = await map.pointForCoordinate(itemCoord);
      setMapLabelPoints({ item: itemPt || null });
    } catch (e) {
      setMapLabelPoints({ item: null });
    }
  }, [activeItem]);

  useEffect(() => {
    refreshMapLabelPoints();
  }, [refreshMapLabelPoints, selectedItemId, filteredItems]);

  // Quantity updates
  const updateQuantity = useCallback((id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  }, []);

  // Item selection
  const onSelectItem = useCallback((item: any, index: number) => {
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

  // Cart management
  const onAddToCart = (item: any) => {
    const exists = cart.find(c => c.id === item.id);
    if (!exists) {
      setCart([...cart, item]);
    }
  };
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Fetch company
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const result: any = await client.graphql({
          query: getCompany,
          variables: {
            AdminId: "BaruchHabaB'ShemAdonai2"
          }
        });
        setCompany(result.data.getCompany);
      } catch (err) {
        console.error("Error fetching company:", err);
      }
    };
    fetchCompany();
  }, []);

  // Calculate totals
  useEffect(() => {
    if (!company || cart.length === 0) {
      setOverallTotalDebit(0);
      return;
    }
    let total = 0;
    for (const item of cart) {
      const qty = quantities[item.id] || 1;
      const price = parseFloat(item.sokoprice) || 0;
      const feeRate = parseFloat(company.userTransferFee) || 0;
      const fee = price * qty * feeRate;
      total += price * qty + fee;
    }
    setOverallTotalDebit(total);
  }, [cart, quantities, company]);

  const validateAndTransact = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const attributes = await fetchUserAttributes();
      const signedInEmail = attributes?.email || attributes?.preferred_username || '';
      if (cart.length === 0) {
        Alert.alert(t.error, t.addItemsToCart);
        return;
      }
      if (!password) {
        Alert.alert(t.error, t.enterPasswordToProceed);
        return;
      }
      if (!signedInEmail) {
        Alert.alert(t.authenticationFailed, t.couldNotFindAccount);
        return;
      }
      const accountResult: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: signedInEmail },
      });
      const account = accountResult?.data?.getSMAccount;
      if (!account?.awsemail) {
        Alert.alert(t.error, t.couldNotFindAccount);
        return;
      }
      const storedPassword = String(account?.pw ?? '');
      if (String(password).trim() !== storedPassword.trim()) {
        Alert.alert(t.authenticationFailed, t.incorrectPassword);
        return;
      }
      const companyResult: any = await client.graphql({
        query: getCompany,
        variables: { AdminId: 'BaruchHabaB\'ShemAdonai2' },
      });
      const company = companyResult?.data?.getCompany;
      const feeRate = Number(company?.cascadePaymentFee ?? company?.userTransferFee ?? 0);
      const sellerBreakdown: Array<any> = [];
      let totalCost = 0;
      let totalFees = 0;
      const sellersMap = new Map<string, { totalCost: number; totalFees: number; description: string[]; itemCount: number }>();

      for (const item of cart) {
        const qty = quantities[item.id] || 1;
        const itemCost = Number(item.sokoprice || 0) * qty;
        const fee = itemCost * feeRate;
        const sellerKey = `${item.sokokntct || ''}`.trim();
        if (!sellerKey) {
          continue;
        }
        if (!sellersMap.has(sellerKey)) {
          sellersMap.set(sellerKey, { totalCost: 0, totalFees: 0, description: [], itemCount: 0 });
        }
        const bucket = sellersMap.get(sellerKey)!;
        bucket.totalCost += itemCost;
        bucket.totalFees += fee;
        bucket.itemCount += 1;
        bucket.description.push(`${qty} ${item.itemUnit || ''} of ${item.sokoname || ''} @ ${item.sokoprice || 0} from ${item.bizName || ''}`.trim());
        totalCost += itemCost;
        totalFees += fee;
      }

      for (const [sellerKey, bucket] of sellersMap.entries()) {
        sellerBreakdown.push({
          sokokntct: sellerKey,
          totalCost: Number(bucket.totalCost || 0),
          totalFees: Number(bucket.totalFees || 0),
          description: bucket.description.join('; '),
          itemCount: bucket.itemCount,
        });
      }

      const businessCheckoutPayload = {
        recipientBusinessAccountNumber: sellerBreakdown[0]?.sokokntct || '',
        totalAmountDue: totalCost + totalFees,
        totalCost,
        totalFees,
        sellerBreakdown,
      };

      setCart([]);
      setQuantities({});
      setPassword('');
      if (fromCascadePayments) {
        handleCascadePaymentsReturn({ businessCheckoutPayload });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.error('Transaction error:', err);
      Alert.alert(t.error, t.somethingWentWrong);
    } finally {
      setIsLoading(false);
    }
  };

  // Render
  if (!userLocation) {
    return <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>{t.locating}</Text>
      </View>;
  }
  return (
    <>
      <View style={{ flex: 1 }}>
      {/* MapView with floating refresh icon */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          showsUserLocation
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
              {...({ onPress: () => onSelectItem(item, index), onLongPress: () => onAddToCart(item) } as any)}
            >
              <View style={[
                styles.mapMarkerDot,
                selectedItemId === item.id ? styles.selectedMapMarkerDot : styles.mapMarkerDotDefault
              ]} />
            </Marker>
          ))}
          {polylineCoords.length > 1 && (
            <Polyline
              coordinates={polylineCoords}
              strokeColor="#e58d29"
              strokeWidth={4}
            />
          )}
        </MapView>
        <View style={styles.mapTextOverlay} pointerEvents="none">
          {mapLabelPoints.item && activeItem && (
            <>
              <View
                style={[
                  styles.mapConnectorLine,
                  styles.itemConnectorLine,
                  {
                    left: mapLabelPoints.item.x - 1,
                    top: mapLabelPoints.item.y - 16
                  }
                ]}
              />
              <View
                style={[
                  styles.mapTextChip,
                  styles.itemTextChip,
                  {
                    left: mapLabelPoints.item.x,
                    top: mapLabelPoints.item.y - 34,
                    transform: [{ translateX: -50 }]
                  }
                ]}
              >
                <Text style={styles.itemText} numberOfLines={1}>
                  {formatAmountSync(Number(activeItem.sokoprice), natCode, ratesMap)}
                </Text>
              </View>
            </>
          )}
        </View>
        {/* Floating Refresh Icon (on top of map) */}
        <TouchableOpacity
          onPress={isRefreshing ? undefined : () => {
            fetchAds();
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
            opacity: isRefreshing ? 0.7 : 1
          }}
          activeOpacity={0.7}
          disabled={isRefreshing}
        >
          <Animated.View style={{
            transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }]
          }}>
            <FontAwesome name="refresh" size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>

      </View>

      {/* Collapsible Filter Panel */}
      {showFilterPanel ? (
        <View style={styles.filterPanel}>
          <TouchableOpacity onPress={() => setShowFilterPanel(false)} style={[styles.hideIconButton, styles.filterCloseButton]}>
            <FontAwesome name="times" size={16} color="#333" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, paddingRight: 56 }}
          >
            {INPUT_KEYS.map((key, idx) => (
              <View
                key={key}
                style={{
                  width: INPUT_WIDTH,
                  marginRight: idx < INPUT_KEYS.length - 1 ? GAP : 0
                }}
              >
                <TextInput
                  placeholder={
                    key === 'radius' ? t.radiusPlaceholder :
                    key === 'brand' ? t.brandPlaceholder :
                    key === 'business' ? t.businessPlaceholder :
                    key === 'itemName' ? t.itemNamePlaceholder :
                    key === 'cheapestRank' ? t.cheapestRankPlaceholder :
                    key === 'bizName' ? t.bizNamePlaceholder :
                    (PLACEHOLDERS as any)[key]
                  }
                  keyboardType={['radius', 'cheapestRank'].includes(key) ? 'numeric' : 'default'}
                  style={styles.input}
                  placeholderTextColor="#999"
                  value={(filters as any)[key]}
                  onChangeText={text => setFilters(f => ({
                    ...f,
                    [key]: text
                  }))}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <TouchableOpacity style={styles.filterIcon} onPress={() => setShowFilterPanel(true)}>
          <FontAwesome name="search" size={20} color="#333" />
        </TouchableOpacity>
      )}

      {/* Responsive Carousel */}
      {showCarousel ? (
        <Animated.View style={[styles.carouselContainer, {
          top: carouselPosition
        }]} {...carouselPanResponder.panHandlers}>
          <TouchableOpacity style={styles.carouselCloseButton} onPress={() => setShowCarousel(false)}>
            <FontAwesome name="times" size={16} color="#333" />
          </TouchableOpacity>
          <FlatList ref={listRef} data={filteredItems} horizontal showsHorizontalScrollIndicator={false} keyExtractor={item => item.id} renderItem={({
            item,
            index
          }: {
        item: SokoItem;
        index: number;
      }) => {
        const qty = quantities[item.id] || 1;
        const total = qty * item.sokoprice;
        // Debug: log the S3 key and signed URL for this item
        // console.log removed to declutter logs
        return <TouchableOpacity style={[styles.card, selectedItemId === item.id && styles.cardSelected, {
          flexDirection: 'row',
          alignItems: 'center'
        }]} onPress={() => onSelectItem(item, index)} onLongPress={() => onAddToCart(item)}>
                {/* RIGHT: Image */}
                {item.signedUrl ? (
                  <Image
                    source={{ uri: item.signedUrl }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                    onError={() => {}}
                  />
                ) : (
                  <View style={[styles.carouselImage, { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }]}> 
                    <FontAwesome name="image" size={40} color="#bbb" />
                  </View>
                )}

                {/* LEFT: Text and buttons */}
                <View style={{
            flex: 1,
            paddingRight: 10
          }}>
                  <Text style={styles.text}>
                    [{qty}×{item.unitQuantity}] {item.itemUnit} {item.itemBrand} {item.sokoname} @ {formatAmountSync(Number(item.sokoprice), natCode, ratesMap)} at {item.bizName} ({item.businessType}) = {formatAmountSync(Number(total), natCode, ratesMap)}
                    {'\n'}{item.bizContact} | {t.longPressToAdd}
                  </Text>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.btn}>
                      <Text>−</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => safeNavigateFrom(navigation, 'DtldSalesInfo', {
                item: item.id
              })} style={[styles.btn, {
                backgroundColor: '#e58d29'
              }]}> 
                      <Text style={{
                          color: 'white',
                          fontSize: 12
                        }}>{t.viewDetails}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.btn}>
                      <Text>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>;
      }} />
        </Animated.View>
      ) : (
        <TouchableOpacity style={styles.carouselIcon} onPress={() => setShowCarousel(true)}>
          <FontAwesome name="archive" size={20} color="#333" />
        </TouchableOpacity>
      )}

      {/* Cart - collapsible */}
      {showCart ? (
        <View style={styles.cartContainer}>
          <View style={styles.cartHeader}>
            <TouchableOpacity onPress={() => setShowCart(false)} style={styles.hideIconButton}>
              <FontAwesome name="times" size={16} color="#333" />
            </TouchableOpacity>
            <Text style={[styles.cartHeaderText, { flex: 1, marginLeft: 8 }]}>{t.yourCart || 'Your Cart'} ({cart.length})</Text>
            <TouchableOpacity onPress={() => setCartExpanded(!cartExpanded)} style={styles.cartToggleButton}>
              <FontAwesome name={cartExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#333" />
            </TouchableOpacity>
          </View>
          {cartExpanded && (
            <ScrollView>
              {cart.length === 0 ? (
                <Text style={{ textAlign: 'center', paddingVertical: 10, color: '#999' }}>{t.addItemsToCart}</Text>
              ) : (
                <>
                  {cart.map(item => (
                    <View key={item.id} style={styles.cartItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cartItemTitle}>{item.sokoname}</Text>
                        <Text style={styles.cartItemSubtitle}>
                          {formatAmountSync(Number(item.sokoprice), natCode, ratesMap)} × {quantities[item.id] || 1}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                        <FontAwesome name="trash" size={14} color="#e53935" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.cartFooter}>
                    <Text style={styles.cartTotal}>Total: {formatAmountSync(Number(OverallTotalDebit), natCode, ratesMap)}</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        placeholder={t.enterPassword}
                        secureTextEntry={!isPasswordVisible}
                        value={password}
                        onChangeText={setPassword}
                        style={styles.partialAmountInput}
                      />
                      <TouchableOpacity onPress={() => setIsPasswordVisible((prev) => !prev)} style={styles.passwordEyeButton}>
                        <FontAwesome name={isPasswordVisible ? 'eye-slash' : 'eye'} size={18} color="#333" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => validateAndTransact()} style={styles.startBtn}>
                      {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.quickCheckout}</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.cartIcon} onPress={() => setShowCart(true)}>
          <FontAwesome name="shopping-cart" size={20} color="#333" />
        </TouchableOpacity>
      )}
    </View>;
    </>
  );
}

export default function SalesItemMapScreen(props: any) {
  return <SalesItemMapScreenInner {...props} />;
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mapMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  mapMarkerDotDefault: {
    backgroundColor: '#e58d29'
  },
  selectedMapMarkerDot: {
    backgroundColor: '#e58d29',
    width: 20,
    height: 20,
    borderRadius: 10
  },
  mapTextOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    pointerEvents: 'none'
  },
  mapConnectorLine: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: '#333',
    opacity: 0.9,
    borderRadius: 1,
    zIndex: 201
  },
  mapTextChip: {
    position: 'absolute',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e58d29',
    maxWidth: SCREEN_WIDTH * 0.42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    zIndex: 202
  },
  itemConnectorLine: {
    backgroundColor: '#e58d29'
  },
  itemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff'
  },
  filterPanel: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.28,
    left: 10,
    right: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 8,
    elevation: 4,
    zIndex: 220
  },
  filterIcon: {
    position: 'absolute',
    top: 20,
    left: (SCREEN_WIDTH - 44) / 2,
    zIndex: 150,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6
  },
  purchaseTypeIcon: {
    position: 'absolute',
    top: 20,
    right: 84,
    zIndex: 160,
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  filterCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 225,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    elevation: 5
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 6,
    fontSize: 12,
    backgroundColor: '#fff'
  },
  handleWrapper: {
    alignItems: 'center',
    marginTop: 6
  },
  handleLine: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2
  },
  carouselContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    paddingVertical: 8
  },
  carouselCloseButton: {
    position: 'absolute',
    top: 8,
    right: 16,
    zIndex: 999,
    backgroundColor: '#fff',
    borderRadius: 18,
    width: 36,
    height: 36,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3
  },
  carouselIcon: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    zIndex: 150,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6
  },
  card: {
    width: SCREEN_WIDTH * 0.8,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 10,
    elevation: 3,
    alignItems: 'center'
  },
  cardSelected: {
    borderColor: '#2a7be4',
    borderWidth: 2
  },
  carouselImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10
  },
  text: {
    fontSize: 12,
    color: '#333'
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 6,
    justifyContent: 'space-between'
  },
  btn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartContainer: {
    position: 'absolute',
    top: 20,
    left: 10,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 10,
    elevation: 6,
    minWidth: 240,
    maxWidth: 360,
    width: Math.min(SCREEN_WIDTH * 0.9, 360),
    zIndex: 100
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  cartHeaderText: { fontSize: 14, fontWeight: 'bold' },
  cartItem: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  cartItemTitle: { fontWeight: 'bold', fontSize: 12 },
  cartItemSubtitle: { fontSize: 10, color: '#666', marginTop: 2 },
  cartFooter: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fafafa'
  },
  cartTotal: { fontWeight: 'bold', marginBottom: 8, fontSize: 12 },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partialAmountInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 36,
    fontWeight: 'bold',
    color: '#222',
    fontSize: 12,
    flex: 1,
  },
  passwordEyeButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    backgroundColor: '#2e8b57',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  cartIcon: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 150,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6
  },
  hideIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  cartToggleButton: {
    padding: 8
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 8,
    height: 40
  },
  checkoutBtn: {
    backgroundColor: '#1e90ff',
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center'
  }
});

