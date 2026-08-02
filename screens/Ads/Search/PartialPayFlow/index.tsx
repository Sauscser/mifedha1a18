// @ts-nocheck
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, StyleSheet,
  Animated, PanResponder, ScrollView, Dimensions, Image, KeyboardAvoidingView, Keyboard, Platform
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { getUrl } from 'aws-amplify/storage';
import { listPartialPays, listSokoAds, getSMAccount, getBizna, getCompany, listBiznas, listPartialPayContributions } from '../../../../src/graphql/queries';
import { createPartialPay, updatePartialPay, createPartialPayContributions, updateSMAccount, updateBizna, createBenefitContributions2, createNonLoans, updateCompany, createMarketConsumption } from '../../../../src/graphql/mutations';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { ShoppingModeProvider, useShoppingMode } from '../ShoppingModeContext';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { formatAmountSync, convertForeignToKsh } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { buildOsrmRouteUrl } from '../../../../src/config/osrm';
import { FontAwesome } from '@expo/vector-icons';

const client = generateClient();
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const INPUT_KEYS = ['radius', 'brand', 'business', 'itemName', 'cheapestRank', 'bizName'];
const GAP = 4;
const SIDE_PADDING = 8;
const INPUT_WIDTH = (SCREEN_WIDTH - SIDE_PADDING * 2 - GAP * (INPUT_KEYS.length - 1)) / INPUT_KEYS.length;
const CAROUSEL_CONTENT_PADDING = 8;

function PartialPayFlowInner({ navigation, route }: { navigation: any; route: any }) {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = { ...translations.en, ...(translations[lang] || {}) };
  const { nationality, ratesMap } = useExchange();
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const natCode = nationalityToCode(safeNationality);

  // Share the selected shopping mode and business through the navigation chain.
  const { mode, setMode, selectedBizna, setSelectedBizna } = useShoppingMode();
  const [biznas, setBiznas] = useState<any[]>([]);
  const [loadingBiznas, setLoadingBiznas] = useState(false);
  const [showBuyerModeModal, setShowBuyerModeModal] = useState(false);
  const [showBiznaModal, setShowBiznaModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);

  const fetchUserEmailAndBiznas = async () => {
    setLoadingBiznas(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const email = attributes?.email || user?.username || '';
      setUserEmail(email);
      const res: any = await client.graphql({ query: listBiznas });
      const allBiznas = res?.data?.listBiznas?.items || [];
      const filtered = allBiznas.filter((biz: any) => {
        for (let i = 1; i <= 50; ++i) {
          const adminVal = biz?.[`Admin${i}`];
          if (adminVal && adminVal !== 'None' && adminVal.toLowerCase().trim() === email.toLowerCase().trim()) {
            return true;
          }
        }
        return false;
      });
      setBiznas(filtered);
    } catch (err) {
      console.log('fetchUserEmailAndBiznas ERROR:', err);
      setBiznas([]);
    } finally {
      setLoadingBiznas(false);
    }
  };

  const isAdminForBizna = (bizna: any, email: string) => {
    if (!bizna || !email) return false;
    for (let i = 1; i <= 50; ++i) {
      const adminVal = bizna?.[`Admin${i}`];
      if (adminVal && adminVal !== 'None' && adminVal.toLowerCase().trim() === email.toLowerCase().trim()) {
        return true;
      }
    }
    return false;
  };

  const getSignedInEmail = async () => {
    const attrs = await fetchUserAttributes();
    return attrs?.email || '';
  };

  // Screens: menu | existing | new
  const [screenMode, setScreenMode] = useState<'menu' | 'existing' | 'new'>('menu');
  const [loading, setLoading] = useState(false);

  // Existing payments screen
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [sellerNameFilter, setSellerNameFilter] = useState('');
  const [isOverpaying, setIsOverpaying] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributions, setContributions] = useState<any[]>([]);
  const [contributionsLoading, setContributionsLoading] = useState(false);
  const [contributionsError, setContributionsError] = useState<string | null>(null);

  // New items screen (map-based)
  const [userLocation, setUserLocation] = useState<any>(null);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    radius: '10',
    brand: '',
    business: '',
    itemName: '',
    cheapestRank: '1',
    bizName: ''
  });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<any[]>([]);
  const [cartExpanded, setCartExpanded] = useState(true);
  const [showCart, setShowCart] = useState(true);
  const [partialAmount, setPartialAmount] = useState('');
  const [isPartialCartOverpaying, setIsPartialCartOverpaying] = useState(false);
  const [polylineCoords, setPolylineCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);

  const mapRef = useRef<any>(null);
  const listRef = useRef<any>(null);
  const programmaticScroll = useRef(false);
  const userInteracting = useRef(false);
  const carouselPosition = useRef(new Animated.Value(SCREEN_HEIGHT * 0.4)).current;
  const pan = useRef(new Animated.ValueXY({ x: 20, y: 40 })).current;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (route?.params?.mode && !mode) {
      setMode(route.params.mode);
    }
    if (route?.params?.selectedBizna && !selectedBizna) {
      setSelectedBizna(route.params.selectedBizna);
    }
  }, [route?.params?.mode, route?.params?.selectedBizna, mode, selectedBizna, setMode, setSelectedBizna]);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res: any = await client.graphql({
          query: getCompany,
          variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
        });
        setCompany(res?.data?.getCompany || null);
      } catch (err) {
        console.error('Failed to fetch company for transaction fees:', err);
      }
    };
    fetchCompany();
  }, []);

  const feeRate = useMemo(() => parseFloat(company?.userTransferFee) || 0, [company]);
  const cartNetTotal = useMemo(() => cart.reduce((sum, item) => {
    const qty = quantities[item.id] || 1;
    return sum + Number(item.sokoprice || 0) * qty;
  }, 0), [cart, quantities]);
  const cartFeeTotal = useMemo(() => cart.reduce((sum, item) => {
    const qty = quantities[item.id] || 1;
    return sum + Number(item.sokoprice || 0) * qty * feeRate;
  }, 0), [cart, quantities, feeRate]);
  const cartTotalWithFees = useMemo(() => cart.reduce((sum, item) => {
    const qty = quantities[item.id] || 1;
    const itemTotal = Number(item.sokoprice || 0) * qty;
    return sum + itemTotal + itemTotal * feeRate;
  }, 0), [cart, quantities, feeRate]);

  const getCartItemTotalWithFee = useCallback((item: any) => {
    const qty = quantities[item.id] || 1;
    const itemTotal = Number(item.sokoprice || 0) * qty;
    return itemTotal + itemTotal * feeRate;
  }, [quantities, feeRate]);

  const cartSeller = useMemo(() => {
    if (cart.length === 0) return null;
    return cart[0]?.sokokntct || null;
  }, [cart]);

  // Show buyer mode modal if mode not selected
  useEffect(() => {
    if (!mode) {
      setShowBuyerModeModal(true);
    } else {
      setShowBuyerModeModal(false);
    }
  }, [mode]);

  // Show bizna modal if B2B selected but no bizna chosen
  useEffect(() => {
    if (mode === 'B2B' && !selectedBizna) {
      setShowBiznaModal(true);
      fetchUserEmailAndBiznas();
    } else {
      setShowBiznaModal(false);
    }
  }, [mode, selectedBizna]);

  // Location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      }
    })();
  }, []);

  // Non-draggable filter panel (toggled visibility instead)
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Carousel visibility toggle
  const [showCarousel, setShowCarousel] = useState(true);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value
      });
      pan.setValue({ x: 0, y: 0 });
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
      let toValue = SCREEN_HEIGHT * 0.4;
      if (finalY < SCREEN_HEIGHT * 0.4) toValue = SCREEN_HEIGHT * 0.25;
      else if (finalY > SCREEN_HEIGHT * 0.7) toValue = SCREEN_HEIGHT * 0.75;
      Animated.spring(carouselPosition, { toValue, useNativeDriver: false }).start();
    }
  })).current;

  // Keyboard listeners to move carousel up when keyboard appears
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      Animated.spring(carouselPosition, { toValue: SCREEN_HEIGHT * 0.25, useNativeDriver: false }).start();
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.spring(carouselPosition, { toValue: SCREEN_HEIGHT * 0.4, useNativeDriver: false }).start();
      setIsKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadPartialPayContributions = useCallback(async (partialPayId: string) => {
    if (!partialPayId) {
      setContributionsError('Partial pay record missing.');
      setContributions([]);
      return;
    }
    setContributionsLoading(true);
    setContributionsError(null);
    try {
      const res: any = await client.graphql({
        query: listPartialPayContributions,
        variables: {
          limit: 200,
          nextToken: null
        }
      });
      const items = res?.data?.listPartialPayContributions?.items || [];
      const matchingItems = items.filter((item: any) => String(item?.saleStatus || '') === String(partialPayId));
      setContributions(matchingItems);
    } catch (e) {
      console.error('Failed to load partial pay contributions:', e);
      setContributionsError(t.failedToLoadItems || 'Failed to load contributions.');
      setContributions([]);
    } finally {
      setContributionsLoading(false);
    }
  }, [t.failedToLoadItems]);

  const createPartialPayContributionRecord = useCallback(async (input: any) => {
    try {
      await client.graphql({
        query: createPartialPayContributions,
        variables: { input }
      });
    } catch (e) {
      console.error('Failed to create PartialPayContribution record:', e);
    }
  }, []);

  const handleOpenContributionModal = useCallback(async (entry: any) => {
    setSelectedEntry(entry);
    setPayAmount('');
    setIsOverpaying(false);
    await loadPartialPayContributions(entry.id);
    setShowContributionModal(true);
  }, [loadPartialPayContributions]);

  // Floating refresh spinner (copied from SrchItemAd)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isRefreshing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
          easing: undefined
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isRefreshing]);

  // Load existing payments
  const loadExistingPartialPays = async () => {
    setLoading(true);
    try {
      const attrs = await fetchUserAttributes();
      const buyerAccount = mode === 'B2B' && selectedBizna?.BusKntct ? selectedBizna.BusKntct : attrs.email;
      const res: any = await client.graphql({
        query: listPartialPays,
        variables: {
          filter: {
            and: [
              { buyerAccount: { eq: buyerAccount } },
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
      const sortedItems = [...items].sort((a, b) => {
        const aTime = a?.createdAt || '';
        const bTime = b?.createdAt || '';
        return bTime.localeCompare(aTime);
      });
      setEntries(sortedItems);
    } catch (e) {
      Alert.alert('Error', 'Failed to load partial payments.');
    } finally {
      setLoading(false);
    }
  };

  // Load PartialPay ads (new items)
  const loadPartialPayAds = async () => {
    setLoading(true);
    try {
      const res: any = await client.graphql({
        query: listSokoAds,
        variables: {
          filter: {
            purchaseType: { eq: 'PartialPay' }
          }
        }
      });
      const items = res?.data?.listSokoAds?.items || [];
      const withUrls = await Promise.all(items.map(async (item: any) => {
        let signedUrl = null;
        if (item.itemPhoto && item.itemPhoto !== 'None') {
          try {
            const obj = await getUrl({ key: item.itemPhoto });
            if (obj?.url) signedUrl = obj.url.toString();
          } catch (e) {}
        }
        return {
          ...item,
          latitude: parseFloat(item.latitude || 0),
          longitude: parseFloat(item.longitude || 0),
          signedUrl
        };
      }));
      setAllItems(withUrls);
    } catch (e) {
      Alert.alert(t.error, t.failedToLoadItems);
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredItems = useMemo(() => {
    if (!userLocation) return [];
    const radius = Math.max(0.1, parseFloat(filters.radius) || 0.1);
    const rank = Math.max(1, parseInt(filters.cheapestRank) || 1);
    const brandFilter = filters.brand?.toLowerCase() || '';
    const businessFilter = filters.business?.toLowerCase() || '';
    const itemNameFilter = filters.itemName?.toLowerCase() || '';
    const bizNameFilter = filters.bizName?.toLowerCase() || '';

    return allItems
      .filter(item => {
        const latitude = Number(item.latitude);
        const longitude = Number(item.longitude);
        const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
        const distance = hasCoords
          ? getDistance(userLocation, { latitude, longitude }) / 1000
          : Infinity;

        const itemBrand = String(item.sokobrand || item.itemBrand || '').toLowerCase();
        const businessType = String(item.bizType || item.businessType || '').toLowerCase();
        const sokoname = String(item.sokoname || '').toLowerCase();
        const bizName = String(item.bizName || '').toLowerCase();

        return (
          distance <= radius &&
          (!brandFilter || itemBrand.includes(brandFilter)) &&
          (!businessFilter || businessType.includes(businessFilter)) &&
          (!itemNameFilter || sokoname.includes(itemNameFilter)) &&
          (!bizNameFilter || bizName.includes(bizNameFilter))
        );
      })
      .sort((a, b) => Number(a.sokoprice || 0) - Number(b.sokoprice || 0))
      .slice(0, rank * 10);
  }, [filters, allItems, userLocation]);

  // Animate map to filtered region
  useEffect(() => {
    if (filteredItems.length && userLocation && mapRef.current) {
      const radius = Math.max(0.1, parseFloat(filters.radius) || 0.1);
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: radius * 0.018,
        longitudeDelta: radius * 0.018
      });
    }
  }, [filteredItems]);

  // Update polyline when item selected
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
        const url = buildOsrmRouteUrl(
          userLocation,
          { latitude: item.latitude, longitude: item.longitude },
          { overview: 'full', geometries: 'geojson' }
        );
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

  // Map label overlay: project selected item coordinate to screen point
  const [mapLabelPoints, setMapLabelPoints] = useState<{ item?: { x: number; y: number } | null }>({});
  const activeItem = useMemo(() => filteredItems.find(i => i.id === selectedItemId) || null, [filteredItems, selectedItemId]);

  const refreshMapLabelPoints = useCallback(async () => {
    const map: any = mapRef.current;
    if (!map) return;
    try {
      const itemCoord = activeItem ? { latitude: Number(activeItem.latitude), longitude: Number(activeItem.longitude) } : null;
      const [itemPt] = await Promise.all([
        itemCoord ? map.pointForCoordinate(itemCoord) : Promise.resolve(null)
      ]);
      setMapLabelPoints({ item: itemPt || null });
    } catch (e) {
      // ignore projection failures
    }
  }, [activeItem]);

  useEffect(() => {
    refreshMapLabelPoints();
  }, [refreshMapLabelPoints, selectedItemId, filteredItems]);

  // Quantity update
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
    if (listRef.current) {
      try {
        programmaticScroll.current = true;
        listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        console.log('onSelectItem: index=', index, 'using scrollToIndex viewPosition=0.5');
        setTimeout(() => { programmaticScroll.current = false; }, 500);
      } catch (e) {
        // fall back to offset if scrollToIndex fails
        const contentPadding = CAROUSEL_CONTENT_PADDING; // matches contentContainerStyle paddingHorizontal
        const cardWidth = SCREEN_WIDTH * 0.8;
        const itemFull = cardWidth + 16; // marginHorizontal * 2
        const offset = Math.max(0, contentPadding + itemFull * index - (SCREEN_WIDTH - cardWidth) / 2);
        programmaticScroll.current = true;
        listRef.current.scrollToOffset({ offset, animated: true });
        console.log('onSelectItem fallback: index=', index, 'computedOffset=', offset);
        setTimeout(() => { programmaticScroll.current = false; }, 500);
      }
    }
  }, []);

  // Ensure marker taps reliably center the carousel card: animate map first, then scroll carousel
  const selectItemAndCenter = useCallback((item: any, index: number) => {
    setSelectedItemId(item.id);
    if (item.latitude && item.longitude) {
      mapRef.current?.animateToRegion({
        latitude: +item.latitude,
        longitude: +item.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
    // allow the map animation to start, then programmatically center the card
    programmaticScroll.current = true;
    setTimeout(() => {
      try {
        if (listRef.current?.scrollToIndex) {
          listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        } else if (listRef.current?.scrollToOffset) {
          const contentPadding = CAROUSEL_CONTENT_PADDING;
          const cardWidth = SCREEN_WIDTH * 0.8;
          const itemFull = cardWidth + 16;
          const offset = Math.max(0, contentPadding + itemFull * index - (SCREEN_WIDTH - cardWidth) / 2);
          listRef.current.scrollToOffset({ offset, animated: true });
        }
      } catch (e) {
        // ignore
      } finally {
        setTimeout(() => { programmaticScroll.current = false; }, 500);
      }
    }, 220);
  }, []);

  // Cart management
  const onAddToCart = (item: any) => {
    if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct && item.sokokntct === selectedBizna.BusKntct) {
      Alert.alert(t.error, 'Cannot purchase items from your own business.');
      return;
    }
    console.log('PartialPayFlow:onAddToCart', {
      cartSeller,
      newItemSeller: item.sokokntct,
      cartIds: cart.map(c => c.id),
      cartSellerValues: cart.map(c => c.sokokntct)
    });
    if (cart.length > 0 && cartSeller && item.sokokntct && item.sokokntct !== cartSeller) {
      Alert.alert(t.error, t.cannotMixSellers);
      return;
    }
    const exists = cart.find(c => c.id === item.id);
    if (!exists) {
      setCart([...cart, item]);
      setQuantities({ ...quantities, [item.id]: 1 });
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
    const newQty = { ...quantities };
    delete newQty[id];
    setQuantities(newQty);
  };

  // Resolve buyer
  const resolveBuyer = async (attrs: any) => {
    if (mode === 'B2B' && selectedBizna?.BusKntct) {
      const bizRes: any = await client.graphql({ query: getBizna, variables: { BusKntct: selectedBizna.BusKntct } });
      const buyerBiz = bizRes?.data?.getBizna;
      if (!buyerBiz) throw new Error('Business buyer not found');
      return {
        buyerType: 'Biz',
        buyerEmail: selectedBizna.BusKntct,
        buyerAccount: selectedBizna.BusKntct,
        buyerName: buyerBiz.busName,
        currentBalance: Number(buyerBiz.earningsBal || 0),
        account: buyerBiz
      };
    }

    const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: attrs.email } });
    const buyerSm = smRes?.data?.getSMAccount;
    if (!buyerSm) throw new Error('Pal buyer account not found');
    return {
      buyerType: 'Pal',
      buyerEmail: attrs.email,
      buyerAccount: attrs.email,
      buyerName: buyerSm.name,
      currentBalance: Number(buyerSm.balance || 0),
      account: buyerSm
    };
  };

  const resolvePartialPayBuyer = async (attrs: any) => {
    if (selectedEntry?.buyerType === 'Biz' && selectedEntry?.buyerAccount) {
      const bizRes: any = await client.graphql({ query: getBizna, variables: { BusKntct: selectedEntry.buyerAccount } });
      const buyerBiz = bizRes?.data?.getBizna;
      if (!buyerBiz) throw new Error('Business buyer not found');
      return {
        buyerType: 'Biz',
        buyerEmail: selectedEntry.buyerEmail || attrs.email,
        buyerAccount: selectedEntry.buyerAccount,
        buyerName: buyerBiz.busName || selectedEntry.buyerName || attrs.email,
        currentBalance: Number(buyerBiz.earningsBal || 0),
        account: buyerBiz
      };
    }

    const buyerEmail = selectedEntry?.buyerEmail || attrs.email;
    const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: buyerEmail } });
    const buyerSm = smRes?.data?.getSMAccount;
    if (!buyerSm) throw new Error('Pal buyer account not found');
    return {
      buyerType: 'Pal',
      buyerEmail,
      buyerAccount: selectedEntry?.buyerAccount || buyerEmail,
      buyerName: buyerSm.name || selectedEntry?.buyerName || buyerEmail,
      currentBalance: Number(buyerSm.balance || 0),
      account: buyerSm
    };
  };

  // Debit buyer
  const debitBuyer = async (buyer: any, amount: number) => {
    if (buyer.buyerType === 'Biz') {
      await client.graphql({
        query: updateBizna,
        variables: {
          input: {
            BusKntct: buyer.buyerAccount,
            earningsBal: Number(buyer.account.earningsBal) - amount,
            netEarnings: Number(buyer.account.netEarnings) - amount
          }
        }
      });
      return;
    }

    await client.graphql({
      query: updateSMAccount,
      variables: {
        input: {
          awsemail: buyer.buyerEmail,
          balance: Number(buyer.account.balance) - amount
        }
      }
    });
  };

  const transferPartialPayCompanyFee = async ({
    amountPaid,
    sellerAccount,
    sellerName,
    buyer,
    creatorEmail,
    creatorPhone,
    itemName,
    itemDesc,
    itemUrl
  }: {
    amountPaid: number;
    sellerAccount: string;
    sellerName: string;
    buyer: any;
    creatorEmail: string;
    creatorPhone: string;
    itemName: string;
    itemDesc: string;
    itemUrl: string;
  }) => {
    if (!sellerAccount || amountPaid <= 0) {
      return;
    }

    const companyRecord = company || (await client.graphql({
      query: getCompany,
      variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
    })).data.getCompany;
    if (!companyRecord) {
      throw new Error('Company record not found');
    }

    const feeRate = parseFloat(companyRecord.biznaCashSaleFee || '0') || 0;
    const benefitRate = parseFloat(companyRecord.p2BBenCom || '0') || 0;
    const fee = amountPaid * feeRate;
    const totalBenefit = fee * benefitRate;
    const companyEarnings = fee - 2 * totalBenefit;

    const sellerRes: any = await client.graphql({
      query: getBizna,
      variables: { BusKntct: sellerAccount }
    });
    const seller = sellerRes?.data?.getBizna;
    if (!seller) {
      throw new Error('Seller record not found');
    }

    await client.graphql({
      query: updateBizna,
      variables: {
        input: {
          BusKntct: sellerAccount,
          benefitsAmount: Math.floor(parseFloat(seller.benefitsAmount || '0') + totalBenefit)
        }
      }
    });

    await client.graphql({
      query: updateCompany,
      variables: {
        input: {
          AdminId: "BaruchHabaB'ShemAdonai2",
          companyEarningBal: companyEarnings + parseFloat(companyRecord.companyEarningBal || '0'),
          companyEarning: companyEarnings + parseFloat(companyRecord.companyEarning || '0'),
          ttlNonLonssRecSM: amountPaid + parseFloat(companyRecord.ttlNonLonssRecSM || '0'),
          ttlNonLonssSentSM: amountPaid + parseFloat(companyRecord.ttlNonLonssSentSM || '0')
        }
      }
    });

    if (buyer.buyerType === 'Biz') {
      await client.graphql({
        query: updateBizna,
        variables: {
          input: {
            BusKntct: buyer.buyerAccount,
            benefitsAmount: parseFloat(buyer.account.benefitsAmount || '0') + totalBenefit
          }
        }
      });
    } else {
      await client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: buyer.buyerEmail,
            ttlNonLonsSentSM: parseFloat(buyer.account.ttlNonLonsSentSM || '0') + amountPaid,
            balance: Number(buyer.account.balance),
            benefitsAmount: parseFloat(buyer.account.benefitsAmount || '0') + totalBenefit
          }
        }
      });
    }

    await client.graphql({
      query: createBenefitContributions2,
      variables: {
        input: {
          benefitsID: "String",
          benefactorAc: sellerAccount,
          benefactorPhone: sellerName || '',
          beneficiaryAc: buyer.buyerAccount,
          beneficiaryPhone: creatorPhone || 'String',
          creatorEmail: creatorEmail || buyer.buyerEmail,
          prodName: itemName || '',
          creatorName: buyer.buyerName || creatorEmail || buyer.buyerEmail,
          owner: buyer.buyerAccount || creatorEmail || buyer.buyerEmail,
          prodCost: 0,
          benefitsAmount: totalBenefit,
          beneficiaryType: buyer.buyerType === 'Biz' ? 'Biz' : 'Pal',
          prodDesc: itemDesc || '',
          benefitStatus: 'Active',
          amount: totalBenefit
        }
      }
    });
  };

  const VwSalesDtls4Transport = () => {
    navigation.navigate('VwSalesDtls4Transport', { mode, selectedBizna });
  };

  const createMarketConsumptionForPartialPayEntry = async (entry: any) => {
    const itemCost = Number(entry.itemCost || 0);
    const buyerId = entry.buyerAccount || '';
    await client.graphql({
      query: createMarketConsumption,
      variables: {
        input: {
          marketItemID: entry.id,
          price: itemCost.toFixed(2),
          sellerID: entry.sellerAccount,
          buyerID: buyerId,
          soldAt: Date.now(),
          sokoname: entry.itemName || '',
          itemBrand: entry.itemBrand || entry.itemName || '',
          itemSpecifications: entry.itemDesc || '',
          Nationality: entry.Nationality || entry.sellerNationality || ''
        }
      }
    });
    return itemCost;
  };

  const finalizeFullPaymentRecords = async (modeParam: 'quick' | 'transport') => {
    if (!selectedEntry) {
      Alert.alert(t.error, 'No partial payment selected.');
      return;
    }

    setLoading(true);
    try {
      const attrs = await fetchUserAttributes();
      const user = await getCurrentUser();
      const itemCost = Number(selectedEntry.itemCost || 0);
      const sellerAccount = selectedEntry.sellerAccount;
      if (!sellerAccount) {
        throw new Error('Seller account missing');
      }

      const sellerResult: any = await client.graphql({
        query: getBizna,
        variables: { BusKntct: sellerAccount }
      });
      const seller = sellerResult?.data?.getBizna;
      if (!seller) {
        throw new Error('Seller record not found');
      }

      const companyRecord = company || (await client.graphql({
        query: getCompany,
        variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
      })).data.getCompany;
      const feeRate = parseFloat(companyRecord?.biznaCashSaleFee || '0') || 0;
      const accumulatedFees = Number(selectedEntry.partialfees || 0);

      await client.graphql({
        query: updateBizna,
        variables: {
          input: {
            BusKntct: sellerAccount,
            netEarnings: Math.floor(parseFloat(seller.netEarnings || '0') + itemCost),
            earningsBal: Math.floor(parseFloat(seller.earningsBal || '0') + itemCost)
          }
        }
      });

      const nonLoanStatus = modeParam === 'quick'
        ? 'DeliveryPayment'
        : (selectedEntry.buyerType === 'Biz' ? 'Biz2Biz' : 'Biz2Pal');

      await client.graphql({
        query: createNonLoans,
        variables: {
          input: {
            recPhn: sellerAccount,
            senderPhn: selectedEntry.buyerAccount || attrs.email,
            amount: itemCost.toFixed(0),
            description: selectedEntry.itemDesc || selectedEntry.itemName || '',
            RecName: selectedEntry.sellerName || '',
            SenderName: selectedEntry.buyerName || attrs.email,
            status: nonLoanStatus,
            owner: selectedEntry.itemUrl || selectedEntry.id,
            fees: accumulatedFees.toFixed(0)
          }
        }
      });

        await client.graphql({
                              query: createBizSls,
                              variables: {
                                input: {
                                  saleId: selectedEntry.id,
                                  recPhn: sellerAccount,
                                  senderPhn: selectedEntry.buyerAccount || attrs.email,
                                  amount: itemCost.toFixed(0),
                                  description: selectedEntry.itemDesc || selectedEntry.itemName || 'Cascade payment checkout',
                                  RecName: seller.busName || selectedEntry.sellerName ,
                                  SenderName: selectedEntry.buyerName || attrs.email,
                                  status: "cashSales",
                                  owner: attrs.email,
                                  attendingAdmin: attrs.email,
                                }
                              }
                            });

      if (modeParam === 'quick') {
        let buyerAccountDetails: any = null;
        if (selectedEntry.buyerType === 'Biz') {
          const buyerRes: any = await client.graphql({
            query: getBizna,
            variables: { BusKntct: selectedEntry.buyerAccount || selectedEntry.buyerEmail }
          });
          buyerAccountDetails = buyerRes?.data?.getBizna;
        } else {
          const buyerRes: any = await client.graphql({
            query: getSMAccount,
            variables: { awsemail: selectedEntry.buyerEmail }
          });
          buyerAccountDetails = buyerRes?.data?.getSMAccount;
        }

        await transferPartialPayCompanyFee({
          amountPaid: itemCost,
          sellerAccount,
          sellerName: selectedEntry.sellerName || selectedEntry.sellerEmail || '',
          buyer: {
            buyerType: selectedEntry.buyerType,
            buyerAccount: selectedEntry.buyerAccount || selectedEntry.buyerEmail,
            buyerEmail: selectedEntry.buyerEmail,
            buyerName: selectedEntry.buyerName || attrs.email,
            account: buyerAccountDetails
          },
          creatorEmail: attrs.email,
          creatorPhone: attrs.phone_number || 'String',
          itemName: selectedEntry.itemName || '',
          itemDesc: selectedEntry.itemDesc || '',
          itemUrl: selectedEntry.itemUrl || ''
        });
      }

      await loadExistingPartialPays();
      setSelectedEntry(null);
      setPayAmount('');

      if (modeParam === 'transport') {
        VwSalesDtls4Transport();
      } else {
        Alert.alert(t.success, t.transactionCompleted || 'Transaction completed successfully.');
      }
    } catch (err) {
      console.error('Failed to complete full payment records:', err);
      Alert.alert(t.error, t.somethingWentWrong || 'Failed to complete checkout.');
    } finally {
      setLoading(false);
    }
  };

  // Start new partial purchase
  const handleStartNewPartial = async () => {
    if (cart.length === 0) {
      Alert.alert(t.error, t.addItemsToCart);
      return;
    }
    if (!partialAmount || Number(partialAmount) <= 0) {
      Alert.alert(t.error, t.enterValidAmount);
      return;
    }

    setLoading(true);
    try {
      const attrs = await fetchUserAttributes();
      const signedInEmail = attrs.email;
      if (mode === 'B2B') {
        if (!selectedBizna?.BusKntct || !isAdminForBizna(selectedBizna, signedInEmail)) {
          Alert.alert(t.error, t.mustBeAdminToCreatePartialPay);
          setLoading(false);
          return;
        }
      }
      const buyer = await resolveBuyer(attrs);
      const enteredAmount = Number(partialAmount);
      const totalAmount = await convertForeignToKsh(enteredAmount, natCode);
      const totalCost = cartNetTotal;
      const uniqueSellerIds = Array.from(new Set(cart.map(item => item.sokokntct).filter(Boolean)));

      if (uniqueSellerIds.length > 1) {
        Alert.alert(t.error, t.cannotMixSellers);
        setLoading(false);
        return;
      }

      if (totalAmount >= totalCost) {
        Alert.alert(
          t.error,
          t.useFullPaymentOption || 'You entered an amount that covers the full item cost. Please use the full payment option in SrchItemAd.'
        );
        navigation.navigate('SrchItemAds');
        setLoading(false);
        return;
      }

      const totalFee = totalAmount * feeRate;

      if (buyer.currentBalance < totalAmount) {
        Alert.alert(t.insufficientFunds);
        setLoading(false);
        return;
      }

      const sellerContact = cart[0]?.sokokntct;
      if (!sellerContact) {
        throw new Error('Seller account missing from cart item');
      }

      const sellerRes: any = await client.graphql({
        query: getBizna,
        variables: { BusKntct: sellerContact }
      });
      const seller = sellerRes?.data?.getBizna;
      if (!seller) throw new Error(t.couldNotFindBiznaRecord);

      const itemName = cart.map(item => item.sokoname).filter(Boolean).join(' | ');
      const itemDesc = cart.map(item => {
        const qty = quantities[item.id] || 1;
        const desc = item.sokodesc || '';
        return qty > 1 ? `${qty}x ${item.sokoname || 'item'}: ${desc}` : `${item.sokoname || 'item'}: ${desc}`;
      }).filter(Boolean).join(' | ');
      const itemPhoto = cart.map(item => item.itemPhoto).filter(Boolean).join(', ');
      const itemUrl = cart.map(item => item.id).join(', ');

      await debitBuyer(buyer, totalAmount);

      const partialPayRes: any = await client.graphql({
        query: createPartialPay,
        variables: {
          input: {
            sellerEmail: seller.email,
            sellerAccount: sellerContact,
            buyerEmail: buyer.buyerEmail,
            buyerAccount: buyer.buyerAccount,
            sellerName: seller.busName || cart[0]?.bizName,
            buyerName: buyer.buyerName,
            buyerType: buyer.buyerType,
            sellerType: 'Biz',
            itemCost: totalCost,
            amountPaid: totalAmount,
            partialfees: totalFee.toFixed(0),
            itemDesc,
            itemName,
            itemPhoto,
            itemUrl,
            saleStatus: 'Active'
          }
        }
      });
      const createdPartialPay = partialPayRes?.data?.createPartialPay || {};

      await createPartialPayContributionRecord({
        sellerEmail: seller.email,
        sellerAccount: sellerContact,
        buyerEmail: buyer.buyerEmail,
        buyerAccount: buyer.buyerAccount,
        sellerName: seller.busName || cart[0]?.bizName,
        buyerName: buyer.buyerName,
        buyerType: buyer.buyerType,
        sellerType: 'Biz',
        itemCost: totalCost,
        amountPaid: totalAmount,
        itemDesc,
        itemName,
        itemPhoto,
        itemUrl,
        saleStatus: createdPartialPay.id || ''
      });

      await transferPartialPayCompanyFee({
        amountPaid: totalAmount,
        sellerAccount: sellerContact,
        sellerName: seller.busName || cart[0]?.bizName || seller.email || '',
        buyer,
        creatorEmail: attrs.email,
        creatorPhone: attrs.phone_number || 'String',
        itemName,
        itemDesc,
        itemUrl
      });

      await createMarketConsumptionForPartialPayEntry({
        id: createdPartialPay.id || itemUrl,
        itemCost: totalCost,
        sellerAccount: sellerContact,
        buyerAccount: buyer.buyerAccount,
        itemName,
        itemBrand: cart[0]?.itemBrand || cart[0]?.sokoname || cart[0]?.bizName || '',
        itemDesc,
        itemPhoto,
        itemUrl,
        sellerNationality: cart[0]?.Nationality || cart[0]?.sellerNationality || ''
      });

      Alert.alert(t.successPartialPayment, t.partialPaymentRecorded);
      setCart([]);
      setQuantities({});
      setPartialAmount('');
      setSelectedItemId(null);
    } catch (e) {
      Alert.alert(t.error, t.failedToStartPurchase);
    } finally {
      setLoading(false);
    }
  };

  // Pay for existing
  const handlePayExisting = async () => {
    if (!selectedEntry) {
      Alert.alert('Error', 'Select an item first.');
      return;
    }
    const enteredAmount = Number(payAmount || 0);
    if (!enteredAmount || enteredAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const attrs = await fetchUserAttributes();
      const signedInEmail = attrs.email;
      if (selectedEntry.buyerType === 'Biz') {
        if (!selectedBizna?.BusKntct || selectedBizna.BusKntct !== selectedEntry.buyerAccount) {
          Alert.alert(t.error, t.mustSelectBuyerBusinessForExistingPayment);
          setLoading(false);
          return;
        }
        if (!isAdminForBizna(selectedBizna, signedInEmail)) {
          Alert.alert(t.error, t.mustBeAdminToPayPartialPay);
          setLoading(false);
          return;
        }
      }
      const buyer = await resolveBuyer(attrs);
      const amountKes = await convertForeignToKsh(enteredAmount, natCode);
      if (amountKes > selectedGrandRemaining) {
        Alert.alert(t.error, 'Amount exceeds remaining total.');
        setLoading(false);
        return;
      }

      if (buyer.currentBalance < amountKes) {
        Alert.alert('Insufficient Funds');
        setLoading(false);
        return;
      }

      const itemCost = Number(selectedEntry.itemCost || 0);
      const alreadyPaid = Number(selectedEntry.amountPaid || 0);
      const remainingBase = Math.max(0, itemCost - alreadyPaid);
      const remainingGrand = remainingBase + remainingBase * feeRate;
      const amountToApply = Math.min(amountKes, remainingBase);
      const amountFee = amountToApply * feeRate;
      const accumulatedFees = Number(selectedEntry.partialfees || 0) + amountFee;
      const nextPaid = alreadyPaid + amountToApply;
      const isCompleted = nextPaid >= itemCost;

      await debitBuyer(buyer, amountKes);

      await client.graphql({
        query: updatePartialPay,
        variables: {
          input: {
            id: selectedEntry.id,
            amountPaid: nextPaid,
            partialfees: accumulatedFees.toFixed(0),
            saleStatus: isCompleted ? 'Completed' : 'Active'
          }
        }
      });

      await createPartialPayContributionRecord({
        sellerEmail: selectedEntry.sellerEmail,
        sellerAccount: selectedEntry.sellerAccount,
        buyerEmail: selectedEntry.buyerEmail,
        buyerAccount: selectedEntry.buyerAccount,
        sellerName: selectedEntry.sellerName,
        buyerName: selectedEntry.buyerName,
        buyerType: selectedEntry.buyerType,
        sellerType: selectedEntry.sellerType || 'Biz',
        itemCost: itemCost,
        amountPaid: amountToApply,
        itemDesc: selectedEntry.itemDesc,
        itemName: selectedEntry.itemName,
        itemPhoto: selectedEntry.itemPhoto,
        itemUrl: selectedEntry.itemUrl,
        saleStatus: selectedEntry.id
      });

      if (!isCompleted) {
        Alert.alert('Success', 'Partial payment recorded.');
        setPayAmount('');
        await loadExistingPartialPays();
        setLoading(false);
        return;
      }

      Alert.alert(
        t.paymentCompleteTitle || 'Payment Complete',
        t.paymentCompleteMessage || 'You have completed payment. Choose checkout option.',
        [
          { text: t.pickItemMyself || 'Pick Item Myself', onPress: () => finalizeFullPaymentRecords('quick') },
          { text: t.requestTransport || 'Request Transport', onPress: () => finalizeFullPaymentRecords('transport') }
        ]
      );
      setPayAmount('');
      await loadExistingPartialPays();
    } catch (e) {
      Alert.alert('Error', 'Failed to process payment.');
    } finally {
      setLoading(false);
    }
  };

  const confirmRevokeContract = () => {
    if (!selectedEntry) {
      Alert.alert('Error', 'Select an item first.');
      return;
    }
    Alert.alert(
      'Confirm',
      'Revoke this contract and refund the paid amount?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: handleRevokeContract }
      ]
    );
  };

  const handleRevokeContract = async () => {
    if (!selectedEntry) {
      Alert.alert('Error', 'Select an item first.');
      return;
    }

    const amountPaid = Number(selectedEntry.amountPaid || 0);
    if (amountPaid <= 0) {
      Alert.alert('Error', 'Nothing to refund.');
      return;
    }

    setLoading(true);
    try {
      if (selectedEntry.buyerType === 'Biz') {
        const buyerBusKntct = selectedBizna?.BusKntct || selectedEntry.buyerAccount;
        if (!buyerBusKntct) {
          throw new Error('Bizna account not found');
        }

        const buyerRes: any = await client.graphql({
          query: getBizna,
          variables: { BusKntct: buyerBusKntct }
        });
        const buyerBiz = buyerRes?.data?.getBizna;
        if (!buyerBiz) {
          throw new Error('Bizna record not found');
        }

        await client.graphql({
          query: updateBizna,
          variables: {
            input: {
              BusKntct: buyerBusKntct,
              earningsBal: Number(buyerBiz.earningsBal || 0) + amountPaid,
              netEarnings: Number(buyerBiz.netEarnings || 0) + amountPaid
            }
          }
        });
      } else {
        const buyerRes: any = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: selectedEntry.buyerEmail }
        });
        const buyerAccount = buyerRes?.data?.getSMAccount;
        if (!buyerAccount) {
          throw new Error('Buyer account not found');
        }

        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: selectedEntry.buyerEmail,
              balance: Number(buyerAccount.balance || 0) + amountPaid
            }
          }
        });
      }

      await client.graphql({
        query: updatePartialPay,
        variables: {
          input: {
            id: selectedEntry.id,
            saleStatus: 'Inactive'
          }
        }
      });

      Alert.alert('Success', 'Contract revoked and amount returned.');
      await loadExistingPartialPays();
      setSelectedEntry(null);
    } catch (e) {
      console.error('Revoke contract failed:', e);
      Alert.alert('Error', 'Failed to revoke contract.');
    } finally {
      setLoading(false);
    }
  };

  const cartMaxPartialAmount = useMemo(() => {
    if (cartNetTotal <= 0) return 0;
    const sellingPrice = ratesMap && natCode && ratesMap[natCode] ? parseFloat(String(ratesMap[natCode].sellingPrice)) || 1 : 1;
    return cartNetTotal / sellingPrice;
  }, [cartNetTotal, ratesMap, natCode]);

  const onPartialAmountChange = useCallback((value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const normalized = sanitized.split('.')
      .filter((part, index) => index === 0 ? true : part)
      .map((part, index) => index === 0 ? part : part.slice(0, 2))
      .join('.');
    if (normalized === '') {
      setPartialAmount('');
      setIsPartialCartOverpaying(false);
      return;
    }
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) return;
    const sellingPrice = ratesMap && natCode && ratesMap[natCode] ? parseFloat(String(ratesMap[natCode].sellingPrice)) || 1 : 1;
    const amountInKsh = parsed / sellingPrice;
    if (cartNetTotal > 0 && amountInKsh >= cartNetTotal) {
      setIsPartialCartOverpaying(true);
      return;
    }
    setPartialAmount(normalized);
    setIsPartialCartOverpaying(false);
  }, [cartNetTotal, natCode, ratesMap]);

  const selectedRemainingBase = useMemo(() => {
    if (!selectedEntry) return 0;
    return Math.max(0, Number(selectedEntry.itemCost || 0) - Number(selectedEntry.amountPaid || 0));
  }, [selectedEntry]);
  const selectedRemainingFee = useMemo(() => selectedRemainingBase * feeRate, [selectedRemainingBase, feeRate]);
  const selectedGrandRemaining = useMemo(() => {
    return selectedRemainingBase + selectedRemainingFee;
  }, [selectedRemainingBase, selectedRemainingFee]);

  const enteredPayAmountKes = useMemo(() => {
    if (!payAmount || !selectedEntry) return 0;
    const parsed = Number(payAmount);
    if (Number.isNaN(parsed)) return 0;
    const sellingPrice = ratesMap && natCode && ratesMap[natCode] ? parseFloat(String(ratesMap[natCode].sellingPrice)) || 1 : 1;
    return parsed / sellingPrice;
  }, [payAmount, ratesMap, natCode, selectedEntry]);

  const dynamicRemainingForSelected = useMemo(() => {
    if (!selectedEntry) return selectedGrandRemaining;
    return Math.max(0, selectedGrandRemaining - enteredPayAmountKes);
  }, [selectedGrandRemaining, enteredPayAmountKes, selectedEntry]);

  const onPayAmountChange = useCallback((value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const normalized = sanitized.split('.')
      .filter((part, index) => index === 0 ? true : part)
      .map((part, index) => index === 0 ? part : part.slice(0, 2))
      .join('.');
    if (normalized === '') {
      setPayAmount('');
      setIsOverpaying(false);
      return;
    }
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) return;

    setPayAmount(normalized);

    const sellingPrice = ratesMap && natCode && ratesMap[natCode] ? parseFloat(String(ratesMap[natCode].sellingPrice)) || 1 : 1;
    const amountInKsh = parsed / sellingPrice;
    const isBeyondGrandRemaining = selectedEntry && selectedGrandRemaining > 0 && amountInKsh > selectedGrandRemaining;
    setIsOverpaying(Boolean(isBeyondGrandRemaining));
  }, [selectedEntry, selectedGrandRemaining, natCode, ratesMap]);

  const visibleEntries = useMemo(() => {
    const needle = sellerNameFilter.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry: any) => {
      const sellerText = `${entry?.sellerName || ''} ${entry?.sellerEmail || ''}`.toLowerCase();
      return sellerText.includes(needle);
    });
  }, [entries, sellerNameFilter]);

  if (!userLocation && screenMode === 'new') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>{t.locating}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showBuyerModeModal && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t.selectBuyerType}</Text>
            <TouchableOpacity style={styles.orangeBtn} onPress={() => { setMode('B2C'); setShowBuyerModeModal(false); }}>
              <Text style={styles.btnText}>{t.palIndividual}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.blueBtn} onPress={() => { setMode('B2B'); setShowBuyerModeModal(false); }}>
              <Text style={styles.btnText}>{t.bizBusiness}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showBiznaModal && (
        <View style={styles.overlay}>
          <View style={[styles.modal, { width: 340, maxHeight: 420 }]}> 
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Select Business</Text>
            {loadingBiznas ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                {biznas.length === 0 && (
                  <Text style={{ textAlign: 'center', marginVertical: 8 }}>No businesses found where you are an admin.</Text>
                )}
                <ScrollView style={{ width: '100%', maxHeight: 260 }}>
                  {biznas.map((biz: any) => (
                    <TouchableOpacity
                      key={biz.BusKntct || biz.id}
                      style={{
                        marginVertical: 6,
                        padding: 12,
                        backgroundColor: '#e58d29',
                        borderRadius: 8,
                        alignItems: 'center'
                      }}
                      onPress={() => {
                        setSelectedBizna(biz);
                        setShowBiznaModal(false);
                      }}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>{biz.busName || biz.name || 'Business'}</Text>
                      {biz.BusKntct ? <Text style={{ color: '#fff', fontSize: 12 }}>{biz.BusKntct}</Text> : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={{ marginTop: 16, padding: 12, backgroundColor: '#2a7be4', borderRadius: 8, alignItems: 'center' }}
                  onPress={() => {
                    setShowBiznaModal(false);
                    setMode(undefined);
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Back to Shopping Mode Selection</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {screenMode === 'menu' && (
        <View style={styles.menuWrap}>
          <Text style={styles.title}>{t.partialPay}</Text>
          <TouchableOpacity
            style={styles.orangeBtn}
            onPress={async () => {
              setScreenMode('existing');
              await loadExistingPartialPays();
            }}
          >
            <Text style={styles.btnText}>{t.payForExisting}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.blueBtn}
            onPress={async () => {
              setScreenMode('new');
              await loadPartialPayAds();
            }}
          >
            <Text style={styles.btnText}>{t.partiallyPurchaseNew}</Text>
          </TouchableOpacity>
        </View>
      )}

      {screenMode === 'existing' && (
        <KeyboardAvoidingView
          style={styles.existingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 100}
        >
          <View style={styles.listWrap}>
            <View style={styles.listHeaderRow}>
            <Text style={styles.subtitle}>{t.existingPartialPayments}</Text>
            <TouchableOpacity
              onPress={loadExistingPartialPays}
              disabled={loading}
              style={styles.refreshIconButton}
            >
              <FontAwesome name="refresh" size={18} color="#333" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" style={{ marginVertical: 8 }} />
          ) : (
            <>
              <TextInput
                value={sellerNameFilter}
                onChangeText={setSellerNameFilter}
                placeholder={t.sellerName || 'Seller name'}
                placeholderTextColor="#444"
                style={{
                  height: 36,
                  width: '60%',
                  marginBottom: 8,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  backgroundColor: '#fff',
                  fontWeight: 'bold',
                  color: '#222'
                }}
              />
              <FlatList
              data={visibleEntries}
              keyExtractor={(item: any) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 220 }}
              renderItem={({ item }) => {
                const remaining = Math.max(0, Number(item.itemCost || 0) - Number(item.amountPaid || 0));
                const fee = remaining * feeRate;
                const remainingWithFees = remaining + fee;
                return (
                  <TouchableOpacity
                    style={[styles.card, selectedEntry?.id === item.id && styles.selectedCard]}
                    onPress={() => {
                      setSelectedEntry(item);
                      setPayAmount('');
                      setIsOverpaying(false);
                    }}
                  >
                    <Text style={styles.cardTitle}>{item.itemName || 'Item'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ flex: 1, marginRight: 8 }}>
                        {t.paidLabel || 'Paid'}: {formatAmountSync(Number(item.amountPaid || 0), natCode, ratesMap)} / {formatAmountSync(Number(item.itemCost || 0), natCode, ratesMap)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleOpenContributionModal(item)}
                        style={{ padding: 6 }}
                      >
                        <FontAwesome name="eye-slash" size={18} color="#e29d58" />
                      </TouchableOpacity>
                    </View>
                    <Text>{t.remainingLabel || 'Remaining'}: {formatAmountSync(remaining, natCode, ratesMap)} + {t.feeLabel || 'Fee'}: {formatAmountSync(fee, natCode, ratesMap)} = {t.grandRemaining || 'Grand Remaining'}: {formatAmountSync(remainingWithFees, natCode, ratesMap)}</Text>
                    {selectedEntry?.id === item.id && payAmount ? (
                      <Text style={{ marginTop: 6, color: isOverpaying ? '#d32f2f' : '#333' }}>
                        {t.grandRemaining || 'Grand Remaining'} after payment: {formatAmountSync(dynamicRemainingForSelected, natCode, ratesMap)}
                        {isOverpaying ? `  — ${t.overpaying || 'Overpaying not allowed'}` : ''}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={{ marginTop: 10 }}>{sellerNameFilter ? 'No matching seller records.' : (t.noActivePartialPayRecords || 'No records found.')}</Text>}
            />
            </>
          )}

          <TextInput
            value={payAmount}
            onChangeText={onPayAmountChange}
            keyboardType="decimal-pad"
            placeholder={selectedGrandRemaining === 0 ? t.paymentComplete || 'Payment Complete' : t.enterAmountToPay}
            placeholderTextColor="#444"
            editable={selectedGrandRemaining > 0}
            style={[styles.amountInput, { fontWeight: 'bold', color: selectedGrandRemaining > 0 ? '#222' : '#aaa', borderColor: isOverpaying ? '#d32f2f' : '#ccc' }]}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={[styles.redBtn, { backgroundColor: '#e29d58', flex: 1, marginRight: 8, paddingHorizontal: 12 }]}
                onPress={handlePayExisting}
                disabled={!selectedEntry || loading}
              >
                <Text style={styles.btnText}>{t.payAmount || 'Pay'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.greenBtn, { flex: 1, paddingHorizontal: 12 }]}
                onPress={confirmRevokeContract}
                disabled={!selectedEntry || loading}
              >
                <Text style={styles.btnText}>{t.revokeContract || 'Revoke Contract'}</Text>
              </TouchableOpacity>
            </View>
          {showContributionModal && (
            <View style={styles.overlay}>
              <View style={[styles.modal, { width: 360, maxHeight: 520 }]}> 
                <Text style={styles.modalTitle}>{t.paymentHistory || 'Payment History'}</Text>
                {contributionsLoading ? (
                  <ActivityIndicator size="large" />
                ) : contributionsError ? (
                  <Text style={{ color: '#d32f2f', textAlign: 'center' }}>{contributionsError}</Text>
                ) : contributions.length === 0 ? (
                  <Text style={{ textAlign: 'center', marginVertical: 12 }}>{t.noContributionsFound || 'No contributions found.'}</Text>
                ) : (
                  <ScrollView style={{ width: '100%', marginBottom: 12 }}>
                    {contributions.map((contribution: any) => (
                      <View key={contribution.id} style={{ marginBottom: 12, padding: 10, backgroundColor: '#f7f7f7', borderRadius: 8 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{contribution.itemName || contribution.itemDesc || 'Payment'}</Text>
                        <Text>{t.amountPaid || 'Amount Paid'}: {formatAmountSync(Number(contribution.amountPaid || 0), natCode, ratesMap)}</Text>
                        <Text>{t.date || 'Date'}: {contribution.createdAt || '-'}</Text>
                        <Text>{t.sellerName || 'Seller'}: {contribution.sellerName || contribution.sellerEmail || '-'}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
                <TouchableOpacity style={[styles.blueBtn, { width: '100%' }]} onPress={() => setShowContributionModal(false)}>
                  <Text style={styles.btnText}>{t.close || 'Close'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          </View>
        </KeyboardAvoidingView>
      )}

      {screenMode === 'new' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {/* Map View */}
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            showsUserLocation
            initialRegion={
              userLocation ? {
                ...userLocation,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
              } : {
                latitude: -1.286389,
                longitude: 36.817223,
                latitudeDelta: 0.15,
                longitudeDelta: 0.15
              }
            }
          >
            {filteredItems.map((item) => (
              <Marker
                key={item.id}
                coordinate={{
                  latitude: item.latitude,
                  longitude: item.longitude
                }}
                onPress={() => {
                  const index = filteredItems.findIndex(i => i.id === item.id);
                  selectItemAndCenter(item, index);
                }}
                onLongPress={() => onAddToCart(item)}
              >
                <View
                  style={[
                    styles.mapMarkerDot,
                    selectedItemId === item.id ? styles.selectedMapMarkerDot : styles.mapMarkerDotDefault
                  ]}
                />
              </Marker>
            ))}
            {polylineCoords.length > 1 && (
              <Polyline
                coordinates={polylineCoords}
                strokeColor="#e58d29"
                strokeWidth={3}
              />
            )}
              {/* Map label overlay container (absolute) rendered below MapView in JSX */}
          </MapView>
          {/* Floating Refresh Icon */}
          <TouchableOpacity
            onPress={isRefreshing ? undefined : () => { loadPartialPayAds(); setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 1200); }}
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
            <Animated.View style={{ transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
              <FontAwesome name="refresh" size={28} color="#fff" />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.purchaseTypeIcon} onPress={() => navigation.navigate('SrchItemAds')}>
            <FontAwesome name="arrows-h" size={20} color="#333" />
          </TouchableOpacity>

          {/* Filter Panel (toggleable + draggable) */}
          {showFilterPanel ? (
            <Animated.View style={[styles.filterPanel, pan.getLayout()]} {...panResponder.panHandlers}>
              <TouchableOpacity onPress={() => setShowFilterPanel(false)} style={[styles.hideIconButton, styles.filterCloseButton]}>
                <FontAwesome name="times" size={16} color="#333" />
              </TouchableOpacity>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ maxHeight: 50 }}
                contentContainerStyle={{ paddingHorizontal: 4, paddingRight: 56 }}
              >
                {INPUT_KEYS.map((key) => (
                  <TextInput
                    key={key}
                    style={[styles.filterInput, { width: INPUT_WIDTH }]}
                    placeholder={
                      key === 'radius'
                        ? 'Radius (KM)'
                        : key === 'cheapestRank'
                          ? 'Rank (Cost)'
                          : t[`${key}Placeholder`] || key
                    }
                    placeholderTextColor="#999"
                    keyboardType={['radius', 'cheapestRank'].includes(key) ? 'numeric' : 'default'}
                    value={filters[key] || ''}
                    onChangeText={(val) => setFilters({ ...filters, [key]: val })}
                  />
                ))}
              </ScrollView>
              <View style={styles.handleWrapper}>
                <View style={styles.handleLine} />
              </View>
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.filterIcon} onPress={() => setShowFilterPanel(true)}>
              <FontAwesome name="search" size={20} color="#333" />
            </TouchableOpacity>
          )}

          {/* Carousel (toggleable + draggable) */}
          {showCarousel ? (
            <Animated.View style={[styles.carouselContainer, { top: carouselPosition }]} {...carouselPanResponder.panHandlers}> 
              <TouchableOpacity style={styles.carouselCloseButton} onPress={() => setShowCarousel(false)}>
                <FontAwesome name="times" size={16} color="#333" />
              </TouchableOpacity>
              <FlatList
                ref={listRef}
                data={filteredItems}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: CAROUSEL_CONTENT_PADDING, paddingTop: 16 }}
                keyExtractor={item => item.id}
                getItemLayout={(data, index) => {
                  const cardWidth = SCREEN_WIDTH * 0.8;
                  const itemFull = cardWidth + 16;
                  const offset = CAROUSEL_CONTENT_PADDING + itemFull * index;
                  return { length: itemFull, offset, index };
                }}
                onScrollToIndexFailed={({ index }) => {
                  const wait = new Promise(resolve => setTimeout(resolve, 100));
                  wait.then(() => {
                    const contentPadding = CAROUSEL_CONTENT_PADDING;
                    const cardWidth = SCREEN_WIDTH * 0.8;
                    const itemFull = cardWidth + 16;
                    const offset = Math.max(0, contentPadding + itemFull * index - (SCREEN_WIDTH - cardWidth) / 2);
                    programmaticScroll.current = true;
                    listRef.current?.scrollToOffset({ offset, animated: true });
                    console.log('onScrollToIndexFailed: index=', index, 'computedOffset=', offset);
                    setTimeout(() => { programmaticScroll.current = false; }, 500);
                  });
                }}
                onMomentumScrollEnd={(ev) => {
                  // snap to nearest card after momentum, but only if not programmatic and only if misaligned
                  try {
                    if (programmaticScroll.current || userInteracting.current) return;
                    const contentOffsetX = ev.nativeEvent.contentOffset.x;
                    const cardWidth = SCREEN_WIDTH * 0.8;
                    const itemFull = cardWidth + 16;
                    const rawIndex = (contentOffsetX - CAROUSEL_CONTENT_PADDING + (SCREEN_WIDTH - cardWidth) / 2) / itemFull;
                    const index = Math.round(rawIndex);
                    const clamped = Math.max(0, Math.min(filteredItems.length - 1, index));
                    const desiredOffset = Math.max(0, CAROUSEL_CONTENT_PADDING + itemFull * clamped - (SCREEN_WIDTH - cardWidth) / 2);
                    const diff = Math.abs(contentOffsetX - desiredOffset);
                    console.log('onMomentumScrollEnd: contentOffset=', contentOffsetX, 'desiredOffset=', desiredOffset, 'diff=', diff, 'index=', clamped);
                    if (diff > 6) {
                      programmaticScroll.current = true;
                      listRef.current?.scrollToOffset({ offset: desiredOffset, animated: true });
                      setTimeout(() => { programmaticScroll.current = false; }, 400);
                    }
                  } catch (e) {
                    // ignore
                  }
                }}
                onScrollBeginDrag={() => { userInteracting.current = true; programmaticScroll.current = false; }}
                onScrollEndDrag={() => { userInteracting.current = false; }}
                renderItem={({ item, index }) => {
                const qty = quantities[item.id] || 1;
                const total = qty * item.sokoprice;
                return (
                  <TouchableOpacity
                    style={[styles.carouselCard, selectedItemId === item.id && styles.carouselCardSelected, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => onSelectItem(item, index)}
                    onLongPress={() => onAddToCart(item)}
                  >
                    {item.signedUrl ? (
                      <Image source={{ uri: item.signedUrl }} style={styles.carouselImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.carouselImage, { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }]}>
                        <FontAwesome name="image" size={40} color="#bbb" />
                      </View>
                    )}

                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.text}>
                        [{qty}×{item.unitQuantity || 1}] {item.itemUnit || ''} {item.itemBrand || ''} {item.sokoname} @ {formatAmountSync(Number(item.sokoprice || 0), natCode, ratesMap)} at {item.bizName} ({item.bizType || item.businessType || ''}) = {formatAmountSync(Number(total || 0), natCode, ratesMap)}
                        {'\n'}{item.bizContact || item.sokokntct} | {t.longPressToAdd}
                      </Text>

                      <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.btn}>
                          <Text>−</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('DtldSalesInfo', { item: item.id })} style={[styles.btn, { backgroundColor: '#e58d29' }]}> 
                          <Text style={{ color: 'white', fontSize: 12 }}>{t.viewDetails}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.btn}>
                          <Text>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              />
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.carouselIcon} onPress={() => setShowCarousel(true)}>
              <FontAwesome name="archive" size={20} color="#333" />
            </TouchableOpacity>
          )}

          {/* Map label overlay */}
          <View style={styles.mapTextOverlay} pointerEvents="none">
              {mapLabelPoints.item && activeItem && (
                <>
                  <View
                    style={[
                      styles.mapConnectorLine,
                      styles.itemConnectorLine,
                      {
                        left: mapLabelPoints.item.x - 1,
                        top: mapLabelPoints.item.y - 16,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.mapTextChip,
                      styles.itemTextChip,
                      {
                        left: mapLabelPoints.item.x,
                        top: mapLabelPoints.item.y - 34,
                        transform: [{ translateX: -50 }],
                      },
                    ]}
                  >
                    <Text style={styles.itemText} numberOfLines={1}>
                      {formatAmountSync(Number(activeItem.sokoprice || 0), natCode, ratesMap)}
                    </Text>
                  </View>
                </>
              )}
          </View>
          

          {/* Collapsible Cart */}
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
                <ScrollView style={{ maxHeight: 150 }}>
                {cart.length === 0 ? (
                  <Text style={{ textAlign: 'center', paddingVertical: 10, color: '#999' }}>{t.addItemsToCart}</Text>
                ) : (
                  <>
                    {cart.map(item => (
                      <View key={item.id} style={styles.cartItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cartItemTitle}>{item.sokoname}</Text>
                          <Text style={styles.cartItemSubtitle}>
                            {feeRate > 0
                              ? `${formatAmountSync(Number(item.sokoprice || 0) * (quantities[item.id] || 1), natCode, ratesMap)} + fee = ${formatAmountSync(getCartItemTotalWithFee(item), natCode, ratesMap)}`
                              : `${formatAmountSync(Number(item.sokoprice || 0) * (quantities[item.id] || 1), natCode, ratesMap)}`}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                          <FontAwesome name="trash" size={14} color="#e53935" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.cartFooter}>
                      <Text style={styles.cartTotal}>Subtotal: {formatAmountSync(cartNetTotal, natCode, ratesMap)}</Text>
                      {feeRate > 0 ? (
                        <>
                          <Text style={styles.cartTotal}>Fee: {formatAmountSync(cartFeeTotal, natCode, ratesMap)}</Text>
                          <Text style={styles.cartTotal}>Grand Total (with fees): {formatAmountSync(cartTotalWithFees, natCode, ratesMap)}</Text>
                        </>
                      ) : (
                        <Text style={styles.cartTotal}>Total: {formatAmountSync(cartTotalWithFees, natCode, ratesMap)}</Text>
                      )}
                      <TextInput
                        style={styles.partialAmountInput}
                        placeholder={t.enterAmountToPay}
                        placeholderTextColor="#444"
                        keyboardType="decimal-pad"
                        value={partialAmount}
                        onChangeText={onPartialAmountChange}
                      />
                      {isPartialCartOverpaying ? (
                        <Text style={{ color: '#d32f2f', marginTop: 4 }}>{t.overpaying || 'Overpaying not allowed'}</Text>
                      ) : null}
                      <TouchableOpacity style={styles.startBtn} onPress={handleStartNewPartial} disabled={loading || isPartialCartOverpaying}>
                        {loading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.btnText}>{t.startPartialPurchase}</Text>
                        )}
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

        </KeyboardAvoidingView>
      )}
    </View>
  );
}

export default function PartialPayFlowScreen(props: any) {
  return (
    <ShoppingModeProvider>
      <PartialPayFlowInner {...props} />
    </ShoppingModeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    backgroundColor: '#fff',
    width: 320,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', marginTop: 20 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginLeft: 12 },
  menuWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  existingContainer: { flex: 1 },
  listWrap: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  orangeBtn: {
    backgroundColor: '#e58d29',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center'
  },
  blueBtn: {
    backgroundColor: '#2a7be4',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center'
  },
  greenBtn: {
    backgroundColor: '#2e8b57',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center'
  },
  redBtn: {
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center'
  },
  backBtn: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 12,
    alignItems: 'center'
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8
  },
  selectedCard: {
    borderColor: '#2a7be4',
    borderWidth: 2
  },
  cardTitle: { fontWeight: 'bold' },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 10,
    height: 42,
    color: '#222',
    fontWeight: 'bold'
  },
  filterPanel: {
    position: 'absolute',
    top: 120,
    left: 10,
    right: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 8,
    elevation: 4
  },
  filterInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 6,
    fontSize: 12,
    backgroundColor: '#fff'
  },
  handleWrapper: { alignItems: 'center', marginTop: 6 },
  handleLine: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2 },
  carouselContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    paddingVertical: 8
  },
  carouselCard: {
    width: SCREEN_WIDTH * 0.8,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 10,
    elevation: 3,
    alignItems: 'center'
  },
  carouselCardSelected: {
    borderColor: '#2a7be4',
    borderWidth: 2
  },
  carouselImage: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  carouselTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'left' },
  carouselPrice: { fontSize: 12, color: '#e58d29', fontWeight: 'bold', marginVertical: 2 },
  quantityControl: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    gap: 4
  },
  qtyBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: '#eee',
    borderRadius: 4,
    minWidth: 20,
    alignItems: 'center'
  },
  // from SrchItemAd
  btn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 6,
    justifyContent: 'space-between'
  },
  text: {
    fontSize: 12,
    color: '#333'
  },
  filterHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1
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
  filterCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 150,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cartToggleButton: {
    padding: 8
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
    minWidth: 180,
    maxWidth: 260,
    zIndex: 100
  },
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
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  refreshIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3
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
  partialAmountInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 36,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#222',
    fontSize: 12
  },
  startBtn: {
    backgroundColor: '#2e8b57',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
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
  }
  ,
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
    fontSize: 11,
    fontWeight: '700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#fff',
    maxWidth: SCREEN_WIDTH * 0.42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    zIndex: 202
  },
  itemConnectorLine: {
    backgroundColor: '#e58d29'
  },
  itemTextChip: {
    backgroundColor: '#e58d29'
  },
  itemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff'
  },
  mapConnectorLine: {
    position: 'absolute',
    width: 2,
    height: 12,
    borderRadius: 1,
    zIndex: 201
  },
  mapMarkerDotDefault: {
    backgroundColor: '#1f8ef1'
  },
  selectedMapMarkerDot: {
    backgroundColor: '#1f8ef1',
    width: 18,
    height: 18,
    borderRadius: 9
  },
  priceBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e58d29',
    marginBottom: 6,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2
  },
  priceText: { fontSize: 12, fontWeight: 'bold', color: '#e58d29' }
});
