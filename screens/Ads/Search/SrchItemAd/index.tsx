// @ts-nocheck
// Complete, integrated MapView + Cart + Checkout + Filters + Custom Markers
// Responsive design with draggable filter, collapsible cart, responsive carousel spacing

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { ShoppingModeProvider, useShoppingMode } from '../ShoppingModeContext';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { listSokoAds, getBizna, getCompany, getSMAccount, listCovCreditSellers, listCvrdGroupLoans, listSMLoansCovereds, listBiznas } from '../../../../src/graphql/queries';
import { createBenefitContributions2, createNonLoans, updateCompany, updateSMAccount, updateBizna, createMarketConsumption } from '../../../../src/graphql/mutations';
import { getUrl } from 'aws-amplify/storage';
import { formatAmountSync, convertForeignToKsh, getUserNationalityByEmail } from '../../../../src/utils/exchange';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { buildOsrmRouteUrl } from '../../../../src/config/osrm';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'react-native';
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

    const handleSelectMode = (selectedMode: 'B2C' | 'B2B') => {
      setMode(selectedMode);
      setShowModeModal(false);
    };

    const handleSelectBizna = (bizna: any) => {
      // Prevent business from buying from itself
      if (cart && cart.length > 0) {
        const hasSelf = cart.some(item => item.sokokntct && bizna.BusKntct && item.sokokntct === bizna.BusKntct);
        if (hasSelf) {
          Alert.alert(t.error, 'A business cannot buy from itself.');
          return;
        }
      }
      setSelectedBizna(bizna);
      setShowBiznaModal(false);
    };
  // Shopping mode context
  const { mode, setMode, selectedBizna, setSelectedBizna } = useShoppingMode();
  const [showModeModal, setShowModeModal] = useState(false);
  const [showBiznaModal, setShowBiznaModal] = useState(false);
  const [biznas, setBiznas] = useState<any[]>([]);
  const [loadingBiznas, setLoadingBiznas] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedPurchaseFlow, setSelectedPurchaseFlow] = useState<'PayFull' | null>(null);
  const [showPurchaseFlowModal, setShowPurchaseFlowModal] = useState(true);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Show mode modal if mode is not set
  useEffect(() => {
    if (!mode && selectedPurchaseFlow === 'PayFull') setShowModeModal(true);
    else setShowModeModal(false);
  }, [mode, selectedPurchaseFlow]);

  // When B2B is selected, fetch Biznas where user is admin
  useEffect(() => {
    if (selectedPurchaseFlow !== 'PayFull') return;
    if (mode === 'B2B' && !selectedBizna) {
      setShowBiznaModal(true);
      fetchUserEmailAndBiznas();
    } else {
      setShowBiznaModal(false);
    }
    // eslint-disable-next-line
  }, [mode, selectedBizna, selectedPurchaseFlow]);

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

  const createMarketConsumptionForItem = async (item: any, buyerId: string) => {
    const qty = quantities[item.id] || 1;
    const itemCost = parseFloat(item.sokoprice || '0') * qty;
    await client.graphql({
      query: createMarketConsumption,
      variables: {
        input: {
          marketItemID: item.id,
          price: itemCost.toFixed(2),
          sellerID: item.sokokntct,
          buyerID,
          soldAt: Date.now(),
          sokoname: item.sokoname || '',
          itemBrand: item.itemBrand || item.sokoname || '',
          itemSpecifications: item.itemSpecifications || '',
          Nationality: item.Nationality || item.sellerNationality || ''
        }
      }
    });
    return itemCost;
  };

  const VwSalesDtls4Transport = () => {
    navigation.navigate('VwSalesDtls4Transport', { mode, selectedBizna });
  };
  const [OverallTotalDebit, setOverallTotalDebit] = useState(0);
  const carouselPosition = useRef(new Animated.Value(SCREEN_HEIGHT * 0.4)).current;
  const [isLoading2, setIsLoading2] = useState(false); // For Quick Checkout
  const [isLoadingTransport, setIsLoadingTransport] = useState(false); // For Purchase (Ask for Transport)
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
    // Only check in B2B mode with a selected business
    if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct && item.sokokntct === selectedBizna.BusKntct) {
      Alert.alert(t.error, 'A business cannot buy from itself.');
      return;
    }
    if (!exists) setCart([...cart, item]);
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

  // Transaction logic (pivoted)
  // Accepts a param to distinguish which button was pressed
  const validateAndTransact2 = async (modeParam?: 'quick' | 'transport') => {
    if (modeParam === 'transport') {
      if (isLoadingTransport) return;
      setIsLoadingTransport(true);
    } else {
      if (isLoading2) return;
      setIsLoading2(true);
    }
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    if (cart.length === 0) {
      if (modeParam === 'transport') setIsLoadingTransport(false); else setIsLoading2(false);
      Alert.alert(t.error, t.addItemsToCart);
      return;
    }
    if (!password) {
      if (modeParam === 'transport') setIsLoadingTransport(false); else setIsLoading2(false);
      Alert.alert(t.error, t.enterPasswordToProceed);
      return;
    }
    try {
      const navigateToChmRepay = () => navigation.navigate("AutomaticRepayAllTyps");

      // Loan checks
      const [loan1, loan2, loan3] = await Promise.all([client.graphql({
        query: listSMLoansCovereds,
        variables: {
          filter: {
            and: [{
              status: {
                eq: "LoanBL"
              }
            }, {
              lonBala: {
                gt: 0
              }
            }, {
              loaneeEmail: {
                eq: attributes.email
              }
            }]
          }
        }
      }), client.graphql({
        query: listCovCreditSellers,
        variables: {
          filter: {
            and: [{
              status: {
                eq: "LoanBL"
              }
            }, {
              lonBala: {
                gt: 0
              }
            }, {
              buyerContact: {
                eq: attributes.email
              }
            }]
          }
        }
      }), client.graphql({
        query: listCvrdGroupLoans,
        variables: {
          filter: {
            and: [{
              status: {
                eq: "LoanBL"
              }
            }, {
              lonBala: {
                gt: 0
              }
            }, {
              loaneePhn: {
                eq: attributes.email
              }
            }]
          }
        }
      })]);
      const hasLoan = loan1.data.listSMLoansCovereds.items.length > 0 || loan2.data.listCovCreditSellers.items.length > 0 || loan3.data.listCvrdGroupLoans.items.length > 0;
      if (hasLoan) return navigateToChmRepay();

      // User account
      let sender;
      if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct) {
        // Use Bizna as buyer
        const biznaResult: any = await client.graphql({
          query: getBizna,
          variables: { BusKntct: selectedBizna.BusKntct }
        });
        sender = biznaResult.data.getBizna;
        // Optionally, you may want to check a Bizna password or other field here if needed
        // For now, we skip password check for Bizna
        if (!sender) {
          if (modeParam === 'transport') setIsLoadingTransport(false); else setIsLoading2(false);
          Alert.alert(t.error, t.couldNotFindBiznaRecord);
          return;
        }
      } else {
        // Use user account as buyer (B2C)
        const userResult: any = await client.graphql({
          query: getSMAccount,
          variables: {
            awsemail: attributes.email
          }
        });
        sender = userResult.data.getSMAccount;
        if (!sender || sender.pw !== password) {
          if (modeParam === 'transport') setIsLoadingTransport(false); else setIsLoading2(false);
          Alert.alert(t.authenticationFailed, t.incorrectPassword);
          return;
        }
      }
      const buyerId = mode === 'B2B' && selectedBizna && selectedBizna.BusKntct ? selectedBizna.BusKntct : attributes.email;
      const companyResult: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const company = companyResult.data.getCompany;
      let totalCost = 0;
      let totalCompanyEarnings = 0;
      let totalBenefit = 0;
      const sellerTotals: Record<string, any> = {};

      // Process cart items
      for (const item of cart) {
        if (!item.sokokntct) {
          console.warn('[SKIP] Cart item missing sokokntct, id:', item.id, item);
          continue;
        }
        const qty = quantities[item.id] || 1;
        const itemCost = parseFloat(item.sokoprice) * qty;
        const fee = itemCost * parseFloat(company.biznaCashSaleFee);
        const totalDebit = itemCost + fee;
        const benefit = fee * parseFloat(company.p2BBenCom) * 0.01;
        const compEarnings = fee - 2 * benefit;
        if (parseFloat(sender.balance) < totalDebit) {
          if (modeParam === 'transport') setIsLoadingTransport(false); else setIsLoading2(false);
          Alert.alert(t.insufficientFundsTitle, t.insufficientFunds);
          return;
        }
        await createMarketConsumptionForItem(item, buyerId);
        const bizResult: any = await client.graphql({
          query: getBizna,
          variables: {
            BusKntct: item.sokokntct
          }
        });
        const biz = bizResult.data.getBizna;
        console.log('[DEBUG] getBizna result for', item.sokokntct, ':', biz);
        if (!biz) {
          console.warn('[DEBUG] getBizna returned undefined/null for', item.sokokntct, 'raw result:', bizResult);
          if (modeParam === 'transport') setIsLoadingTransport(false); else setIsLoading2(false);
          Alert.alert(t.couldNotFindAccount, item.bizName);
          return;
        }
        // Convert itemCost (KES) to user's currency and attach symbol
        const userCurrencyKey = natCode;
        const itemCostDisplay = formatAmountSync(itemCost, userCurrencyKey, ratesMap);
        const description = `${qty} ${item.itemUnit} of ${item.sokoname} @ ${itemCostDisplay} bought at ${item.bizName} ${item.businessType}`;
        if (!sellerTotals[item.sokokntct]) {
          sellerTotals[item.sokokntct] = {
            totalItemCost: 0,
            totalBenefit: 0,
            description: [],
            // store last item id for this seller
            lastItemId: item.id
          };
        }
        sellerTotals[item.sokokntct].description.push(description);
        sellerTotals[item.sokokntct].totalItemCost += itemCost;
        sellerTotals[item.sokokntct].totalBenefit += benefit;
        // update lastItemId to the most recent item id for this seller
        sellerTotals[item.sokokntct].lastItemId = item.id;
        totalCost += itemCost;
        totalCompanyEarnings += compEarnings;
        totalBenefit += benefit;
      }

      // Update sellers
      let totalCostKes = 0;
      for (const sokokntct in sellerTotals) {
        const totals = sellerTotals[sokokntct];
        const allItemsID = totals.lastItemId;
        console.log('REACHED BIZNA FETCH for sokokntct:', sokokntct);
        const bizResult: any = await client.graphql({
          query: getBizna,
          variables: {
            BusKntct: sokokntct
          }
        });
        console.log(allItemsID)
        const biz = bizResult.data.getBizna;
        console.log('[DEBUG] getBizna result for', sokokntct, ':', biz);
        if (!biz) {
          console.warn('[DEBUG] getBizna returned undefined/null for', sokokntct, 'raw result:', bizResult);
          console.error('[FATAL] Tried to access biz properties but biz is undefined for', sokokntct, 'raw result:', bizResult);
          if (modeParam === 'transport') setIsLoadingTransport(false); else setIsLoading2(false);
          Alert.alert(t.error, t.couldNotFindBiznaRecord);
          continue;
        }
        // All arithmetic and backend writes use KES values directly (totals.totalItemCost, totals.totalBenefit)
        totalCostKes += Number(totals.totalItemCost);
        let usrDtlsx;
        if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct) {
          // Use Bizna as buyer
          const biznaResult: any = await client.graphql({
            query: getBizna,
            variables: { BusKntct: selectedBizna.BusKntct }
          });
          usrDtlsx = biznaResult.data.getBizna;
        } else {
          // Use user account as buyer (B2C)
          const usrDtls: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: attributes.email
            }
          });
          usrDtlsx = usrDtls.data.getSMAccount;
        }
        // Defensive: check before every use of biz and all mutation values, log error if invalid
        const netEarnings = parseFloat(biz.netEarnings);
        const earningsBal = parseFloat(biz.earningsBal);
        const benefitsAmount = parseFloat(biz.benefitsAmount);
        if (isNaN(netEarnings)) {
          console.error('[ERROR] netEarnings is NaN for seller', sokokntct, 'biz:', biz);
        }
        if (isNaN(earningsBal)) {
          console.error('[ERROR] earningsBal is NaN for seller', sokokntct, 'biz:', biz);
        }
        if (isNaN(benefitsAmount)) {
          console.error('[ERROR] benefitsAmount is NaN for seller', sokokntct, 'biz:', biz);
        }
        if (!isNaN(netEarnings) && !isNaN(earningsBal) && !isNaN(benefitsAmount) && !isNaN(Number(totals.totalItemCost)) && !isNaN(Number(totals.totalBenefit))) {
          await client.graphql({
            query: updateBizna,
            variables: {
              input: {
                BusKntct: sokokntct,
                
              }
            }
          });
        } else {
          console.error('[ERROR] Skipping updateBizna for seller', sokokntct, 'due to invalid numeric values:', {
            netEarnings, earningsBal, benefitsAmount, totalItemCost: totals.totalItemCost, totalBenefit: totals.totalBenefit, biz
          });
        }
        console.log('Creating NonLoans for', sokokntct, 'owner:', allItemsID);
        const feeForSeller = Number(totals.totalItemCost) > 0
          ? Number(totals.totalItemCost) * parseFloat(company.biznaCashSaleFee)
          : 0;
        await client.graphql({
          query: createNonLoans,
          variables: {
            input: {
              recPhn: sokokntct,
              senderPhn: mode === 'B2B' && selectedBizna && selectedBizna.BusKntct ? selectedBizna.BusKntct : attributes.email,
              amount: Number(totals.totalItemCost).toFixed(0),
              description: totals.description.join('\n'),
              RecName: biz ? biz.busName : '',
              SenderName: mode === 'B2B' && selectedBizna && selectedBizna.busName ? selectedBizna.busName : usrDtlsx.name,
              status: mode === 'B2B' ? 'Biz2Biz' : 'Biz2Pal',
              owner: allItemsID,
              fees: feeForSeller.toFixed(0)
            }
          }
        });
      }

      // Update buyer account or Bizna depending on mode
      if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct) {
        // Subtract from Bizna's earningsBal
        await client.graphql({
          query: updateBizna,
          variables: {
            input: {
              BusKntct: selectedBizna.BusKntct,
              earningsBal: parseFloat(selectedBizna.earningsBal) - OverallTotalDebit,
              netEarnings: parseFloat(selectedBizna.netEarnings) - OverallTotalDebit,
            }
          }
        });
      } else {
        // Update user (use KES totals where available)
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: attributes.email,
              balance: parseFloat(sender.balance) - OverallTotalDebit,
            }
          }
        });
      }
      Alert.alert(t.success, t.transactionCompleted);
      setCart([]);
      setQuantities({});
      setPassword('');
      VwSalesDtls4Transport();
    } catch (err) {
      console.error("Transaction error:", err);
      Alert.alert(t.error, t.somethingWentWrong);
    } finally {
      if (modeParam === 'transport') setIsLoadingTransport(false); else setIsLoading2(false);
    }
  };
  const validateAndTransact = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    if (cart.length === 0) {
      setIsLoading(false);
      Alert.alert(t.error, t.addItemsToCart);
      return;
    }
    if (!password) {
      setIsLoading(false);
      Alert.alert(t.error, t.enterPasswordToProceed);
      return;
    }
    try {
      const navigateToChmRepay = () => navigation.navigate("AutomaticRepayAllTyps");

      // Loan checks
      const [loan1, loan2, loan3] = await Promise.all([client.graphql({
        query: listSMLoansCovereds,
        variables: {
          filter: {
            and: [{
              status: {
                eq: "LoanBL"
              }
            }, {
              lonBala: {
                gt: 0
              }
            }, {
              loaneeEmail: {
                eq: attributes.email
              }
            }]
          }
        }
      }), client.graphql({
        query: listCovCreditSellers,
        variables: {
          filter: {
            and: [{
              status: {
                eq: "LoanBL"
              }
            }, {
              lonBala: {
                gt: 0
              }
            }, {
              buyerContact: {
                eq: attributes.email
              }
            }]
          }
        }
      }), client.graphql({
        query: listCvrdGroupLoans,
        variables: {
          filter: {
            and: [{
              status: {
                eq: "LoanBL"
              }
            }, {
              lonBala: {
                gt: 0
              }
            }, {
              loaneePhn: {
                eq: attributes.email
              }
            }]
          }
        }
      })]);
      const hasLoan = loan1.data.listSMLoansCovereds.items.length > 0 || loan2.data.listCovCreditSellers.items.length > 0 || loan3.data.listCvrdGroupLoans.items.length > 0;
      if (hasLoan) return navigateToChmRepay();

      // User or Bizna account depending on shopping mode
      let sender;
      if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct) {
        // Use Bizna as buyer
        const biznaResult: any = await client.graphql({
          query: getBizna,
          variables: { BusKntct: selectedBizna.BusKntct }
        });
        sender = biznaResult.data.getBizna;
        if (!sender) {
          setIsLoading(false);
          Alert.alert(t.error, t.couldNotFindBiznaRecord);
          return;
        }
        // Optionally, you may want to check a Bizna password or other field here if needed
      } else {
        // Use user account as buyer (B2C)
        const userResult: any = await client.graphql({
          query: getSMAccount,
          variables: {
            awsemail: attributes.email
          }
        });
        sender = userResult.data.getSMAccount;
        if (!sender || sender.pw !== password) {
          setIsLoading(false);
          Alert.alert(t.authenticationFailed, t.incorrectPassword);
          return;
        }
      }
      const companyResult: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const company = companyResult.data.getCompany;
      let totalCost = 0;
      let totalCompanyEarnings = 0;
      let totalBenefit = 0;
      const sellerTotals: Record<string, any> = {};

      // Process cart items
      for (const item of cart) {
        const qty = quantities[item.id] || 1;
        const itemCost = parseFloat(item.sokoprice) * qty;
        const fee = itemCost * parseFloat(company.biznaCashSaleFee);
        const totalDebit = itemCost + fee;
        const benefit = fee * parseFloat(company.p2BBenCom);
        const compEarnings = fee - 2 * benefit;
        if (parseFloat(sender.balance) < totalDebit) {
          setIsLoading(false);
          Alert.alert("Insufficient Funds");
          return;
        }
        await createMarketConsumptionForItem(item, buyerId);
        const bizResult: any = await client.graphql({
          query: getBizna,
          variables: {
            BusKntct: item.sokokntct
          }
        });
        const biz = bizResult.data.getBizna;
        console.log('[DEBUG] getBizna result for', sokokntct, ':', biz);
        if (!biz) {
          console.warn('[DEBUG] getBizna returned undefined/null for', sokokntct, 'raw result:', bizResult);
        }
        if (!biz) {
          setIsLoading(false);
          Alert.alert(`${t.couldNotFindAccount} ${item.bizName}`);
            Alert.alert(t.success, t.transactionCompleted);
          return;
        }
        // Convert itemCost (KES) to user's currency and attach symbol
        const userCurrencyKey = natCode;
        const itemCostDisplay = formatAmountSync(itemCost, userCurrencyKey, ratesMap);
        const description = `${qty} ${item.itemUnit} of ${item.sokoname} @ ${itemCostDisplay} bought at ${item.bizName} ${item.businessType}`;
        if (!sellerTotals[item.sokokntct]) {
          sellerTotals[item.sokokntct] = {
            totalItemCost: 0,
            totalBenefit: 0,
            description: [],
            // store last item id for this seller
            lastItemId: item.id
          };
        }
        sellerTotals[item.sokokntct].description.push(description);
        sellerTotals[item.sokokntct].totalItemCost += itemCost;
        sellerTotals[item.sokokntct].totalBenefit += benefit;
        // update lastItemId to the most recent item id for this seller
        sellerTotals[item.sokokntct].lastItemId = item.id;
        totalCost += itemCost;
        totalCompanyEarnings += compEarnings;
        totalBenefit += benefit;
      }

      // Update sellers (convert seller totals to KES when necessary)
      let totalCostKes = 0;
      for (const sokokntct in sellerTotals) {
        const totals = sellerTotals[sokokntct];
        const allItemsID = totals.lastItemId;
        const bizResult: any = await client.graphql({
          query: getBizna,
          variables: {
            BusKntct: sokokntct
          }
        });
        const biz = bizResult.data.getBizna;
        if (!biz) {
          console.warn('[DEBUG] getBizna returned undefined/null for', sokokntct, 'raw result:', bizResult);
          console.error('[ERROR] Tried to update Bizna but biz is undefined for', sokokntct);
          continue;
        }
        // seller nationality (via biz email -> SMAccount)
        let sellerNationality = null;
        try {
          if (biz?.email) sellerNationality = biz.Nationality;
        } catch (e) {}
        const totalInKes = totals.totalItemCost;
        const benefitInKes = totals.totalBenefit;
        totalCostKes += Number(totalInKes || 0);

        
        // Buyer details depending on shopping mode
        let usrDts;
        if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct) {
          const biznaResult: any = await client.graphql({
            query: getBizna,
            variables: { BusKntct: selectedBizna.BusKntct }
          });
          usrDts = biznaResult.data.getBizna;
        } else {
          const usrDt: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: attributes.email
            }
          });
          usrDts = usrDt.data.getSMAccount;
        }
        // Defensive: check before every use of biz and all mutation values
        if (biz) {
          const netEarnings = isNaN(parseFloat(biz.netEarnings)) ? 0 : parseFloat(biz.netEarnings);
          const earningsBal = isNaN(parseFloat(biz.earningsBal)) ? 0 : parseFloat(biz.earningsBal);
          const benefitsAmount = isNaN(parseFloat(biz.benefitsAmount)) ? 0 : parseFloat(biz.benefitsAmount);
          await client.graphql({
            query: updateBizna,
            variables: {
              input: {
                BusKntct: sokokntct,
                netEarnings: Math.floor(netEarnings + totalInKes),
                earningsBal: Math.floor(earningsBal + totalInKes),
                benefitsAmount: Math.floor(benefitsAmount + benefitInKes)
              }
            }
          });
        }
        console.log('Creating NonLoans for', sokokntct, 'owner:', allItemsID);
        const feeForSeller2 = Number(totalInKes) > 0
          ? Number(totalInKes) * parseFloat(company.biznaCashSaleFee)
          : 0;
        await client.graphql({
          query: createNonLoans,
          variables: {
            input: {
              recPhn: sokokntct,
              senderPhn: mode === 'B2B' && selectedBizna && selectedBizna.BusKntct ? selectedBizna.BusKntct : attributes.email,
              amount: totalInKes.toFixed(0),
              description: totals.description.join('\n'),
              RecName: biz ? biz.busName : '',
              SenderName: mode === 'B2B' && selectedBizna && selectedBizna.busName ? selectedBizna.busName : usrDts.name,
              status: 'cashSales',
              owner: allItemsID, 
              fees: feeForSeller2.toFixed(0)
            }
          }
        });
      }

      // Update company
      await client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            companyEarningBal: totalCompanyEarnings + parseFloat(company.companyEarningBal),
            companyEarning: totalCompanyEarnings + parseFloat(company.companyEarning),
            ttlNonLonssRecSM: (totalCostKes || totalCost) + parseFloat(company.ttlNonLonssRecSM),
            ttlNonLonssSentSM: (totalCostKes || totalCost) + parseFloat(company.ttlNonLonssSentSM)
          }
        }
      });

      // Update user or Bizna + contribution based on shopping mode
      if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct) {
        await client.graphql({
          query: updateBizna,
          variables: {
            input: {
              BusKntct: selectedBizna.BusKntct,
              earningsBal: parseFloat(sender.earningsBal) - OverallTotalDebit,
              netEarnings: parseFloat(sender.netEarnings) - OverallTotalDebit,
              benefitsAmount: parseFloat(sender.benefitsAmount) + totalBenefit
            }
          }
        });
      } else {
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: attributes.email,
              ttlNonLonsSentSM: parseFloat(sender.ttlNonLonsSentSM) + (totalCostKes || totalCost),
              balance: parseFloat(sender.balance) - OverallTotalDebit,
              benefitsAmount: parseFloat(sender.benefitsAmount) + totalBenefit
            }
          }
        });
      }
      await client.graphql({
        query: createBenefitContributions2,
        variables: {
          input: {
            benefitsID: "String",
            benefactorAc: cart.map(item => item.sokokntct).join(", "),
            benefactorPhone: cart.map(item => item.bizName).join(", "),
            beneficiaryAc: attributes.email,
            beneficiaryPhone: attributes.phone_number || "String",
            creatorEmail: attributes.email,
            prodName: cart.map(item => item.sokoname).join(", "),
            creatorName: sender.name,
            owner: user.userId,
            prodCost: 0,
            benefitsAmount: totalBenefit,
            beneficiaryType: "Pal",
            prodDesc: cart.map(item => {
              const qty = quantities[item.id] || 1;
              return `${qty} ${item.itemUnit} ${item.sokoname}`;
            }).join("; "),
            benefitStatus: "Active",
            amount: totalBenefit
          }
        }
      });
      setCart([]);
      setQuantities({});
      setPassword('');
      Alert.alert("Success", "Transaction completed successfully.");
    } catch (err) {
      console.error("Transaction error:", err);
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
      {/* Inline modal for shopping mode selection */}
      {showModeModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, alignItems: 'center', width: 300 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>{typeof t.selectShoppingMode === 'string' && t.selectShoppingMode.trim() ? t.selectShoppingMode : 'Select Shopping Mode'}</Text>
            <TouchableOpacity style={{ marginVertical: 8, padding: 12, backgroundColor: '#e58d29', borderRadius: 8, width: 220, alignItems: 'center' }} onPress={() => handleSelectMode('B2C')}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{typeof t.b2c === 'string' && t.b2c.trim() ? t.b2c : 'Business to Customer Shopping'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginVertical: 8, padding: 12, backgroundColor: '#2a7be4', borderRadius: 8, width: 220, alignItems: 'center' }} onPress={() => handleSelectMode('B2B')}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{typeof t.b2b === 'string' && t.b2b.trim() ? t.b2b : 'Business to Business Shopping'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Inline modal for Bizna selection if B2B */}
      {showBiznaModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, alignItems: 'center', width: 340, maxHeight: 420 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Select Business</Text>
            {loadingBiznas ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                {biznas.length === 0 && (
                  <Text>No businesses found where you are an admin.</Text>
                )}
                <ScrollView style={{ width: '100%', maxHeight: 260 }}>
                  {biznas.map((biz, idx) => (
                    <TouchableOpacity
                      key={biz.BusKntct}
                      style={{
                        marginVertical: 6,
                        padding: 12,
                        backgroundColor: '#e58d29',
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                      onPress={() => handleSelectBizna(biz)}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>{biz.busName}</Text>
                      <Text style={{ color: '#fff', fontSize: 12 }}>{biz.BusKntct}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={{ marginTop: 16, padding: 12, backgroundColor: '#2a7be4', borderRadius: 8, alignItems: 'center' }}
                  onPress={() => {
                    setShowBiznaModal(false);
                    setMode(undefined); // Reset mode so user can re-select
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Back to Shopping Mode Selection</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
      <View style={{ flex: 1 }}>
      {showPurchaseFlowModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1200,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, alignItems: 'center', width: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Choose Purchase Type</Text>
            <TouchableOpacity
              style={{ marginVertical: 8, padding: 12, backgroundColor: '#e58d29', borderRadius: 8, width: 240, alignItems: 'center' }}
              onPress={() => {
                setSelectedPurchaseFlow('PayFull');
                setShowPurchaseFlowModal(false);
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Pay Full Amount</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginVertical: 8, padding: 12, backgroundColor: '#2a7be4', borderRadius: 8, width: 240, alignItems: 'center' }}
              onPress={() => {
                setShowPurchaseFlowModal(false);
                navigation.navigate('PartialPayFlow');
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Partially Pay For Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
            setShowModeModal(true);
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

        <TouchableOpacity style={styles.purchaseTypeIcon} onPress={() => navigation.navigate('PartialPayFlow')}>
          <FontAwesome name="arrows-h" size={20} color="#333" />
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

                    <TouchableOpacity onPress={() => navigation.navigate("DtldSalesInfo", {
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
                    <TextInput
                      placeholder={t.enterPassword}
                      secureTextEntry={!isPasswordVisible}
                      value={password}
                      onChangeText={setPassword}
                      style={styles.partialAmountInput}
                    />
                    <TouchableOpacity onPress={() => validateAndTransact()} style={styles.startBtn}>
                      {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.quickCheckout}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => validateAndTransact2('transport')} style={[styles.startBtn, { marginTop: 10, backgroundColor: '#2a7be4' }]}>
                      {isLoadingTransport ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, { fontWeight: 'bold' }]}>Purchase (Ask for Transport)</Text>}
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
  // Wrap with ShoppingModeProvider for context
  return (
    <ShoppingModeProvider>
      <SalesItemMapScreenInner {...props} />
    </ShoppingModeProvider>
  );
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
    minWidth: 180,
    maxWidth: 260,
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

