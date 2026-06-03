import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Linking, Animated, StyleSheet } from "react-native";
// import { PanResponder } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from "react-native-maps";
import { BytransprtOwnrEmail, getSMAccount, getTransportOrder, getTransportBizna } from "../../../src/graphql/queries";
import { getDistance } from 'geolib';
import { updateSMAccount, updateTransportOrder, createMessages, sendNotification, updateBizna, updateTransportBizna } from "../../../src/graphql/mutations";
import { getBizna } from "../../../src/graphql/queries";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, getUserNationalityByEmail, getExRatesForNationality, convertForeignToKsh } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { generateClient } from "aws-amplify/api";
import axios from 'axios';
const client = generateClient();
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;
const CAROUSEL_HEIGHT = 110;
const MIN_CAROUSEL_TOP = 60; // px from top
const MAX_CAROUSEL_TOP = screenHeight - CAROUSEL_HEIGHT - 60; // px from bottom

const TransportMapScreen = () => {
  // Removed draggable carousel logic
    const { i18n } = useTranslation();
    const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const t = translations[lang] || translations.en;
    // Dynamic currency context
    const { nationality, ratesMap } = useExchange();
  // Floating refresh spinner state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;


  // Polyline state (must be declared before any usage)
  const [userToSellerCoords, setUserToSellerCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [sellerToBuyerCoords, setSellerToBuyerCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [transporterCoords, setTransporterCoords] = useState(null);
  const [cumulativeDistance, setCumulativeDistance] = useState(0);
  const [cumulativeCost, setCumulativeCost] = useState(0);
  const locationWatcherRef = useRef(null);
  const lastPositionRef = useRef(null);

  // Helper to update polylines using OSRM for road-following routes
  // After engagement, show only brown line from backend transporter position to seller
  const updatePolylines = React.useCallback(async (item) => {
    if (!item) {
      setUserToSellerCoords([]);
      setSellerToBuyerCoords([]);
      return;
    }
    // Always show brown polyline from seller to buyer if transportRequest is 'transportRequestYes'
    if (item.transportRequest === "transportRequestYes" && item.sellerLatitude && item.sellerLongitude && item.deliveryLatitude && item.deliveryLongitude) {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${item.sellerLongitude},${item.sellerLatitude};${item.deliveryLongitude},${item.deliveryLatitude}?overview=full&geometries=geojson`;
        const res = await axios.get(url);
        if (res.data.routes && res.data.routes.length > 0) {
          const coords = res.data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          setSellerToBuyerCoords(coords);
        } else {
          setSellerToBuyerCoords([
            { latitude: Number(item.sellerLatitude), longitude: Number(item.sellerLongitude) },
            { latitude: Number(item.deliveryLatitude), longitude: Number(item.deliveryLongitude) }
          ]);
        }
      } catch (err) {
        setSellerToBuyerCoords([
          { latitude: Number(item.sellerLatitude), longitude: Number(item.sellerLongitude) },
          { latitude: Number(item.deliveryLatitude), longitude: Number(item.deliveryLongitude) }
        ]);
      }
      // Do NOT clear userToSellerCoords here; allow both to be set before engagement
    }
    // Blue polyline: before engagement, from transporter to seller
    if (transporterCoords && item.sellerLatitude && item.sellerLongitude && item.engagementStatus !== "TransportEngaged") {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${transporterCoords.longitude},${transporterCoords.latitude};${item.sellerLongitude},${item.sellerLatitude}?overview=full&geometries=geojson`;
        const res = await axios.get(url);
        if (res.data.routes && res.data.routes.length > 0) {
          const coords = res.data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          setUserToSellerCoords(coords);
        } else {
          setUserToSellerCoords([
            { latitude: transporterCoords.latitude, longitude: transporterCoords.longitude },
            { latitude: Number(item.sellerLatitude), longitude: Number(item.sellerLongitude) }
          ]);
        }
      } catch (err) {
        setUserToSellerCoords([
          { latitude: transporterCoords.latitude, longitude: transporterCoords.longitude },
          { latitude: Number(item.sellerLatitude), longitude: Number(item.sellerLongitude) }
        ]);
      }
    }
    // After engagement, show brown line from LIVE transporterCoords to buyer
    if (item.engagementStatus === "TransportEngaged" && transporterCoords && item.deliveryLatitude && item.deliveryLongitude) {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${transporterCoords.longitude},${transporterCoords.latitude};${item.deliveryLongitude},${item.deliveryLatitude}?overview=full&geometries=geojson`;
        const res = await axios.get(url);
        if (res.data.routes && res.data.routes.length > 0) {
          const coords = res.data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
          setSellerToBuyerCoords(coords);
        } else {
          setSellerToBuyerCoords([
            { latitude: transporterCoords.latitude, longitude: transporterCoords.longitude },
            { latitude: Number(item.deliveryLatitude), longitude: Number(item.deliveryLongitude) }
          ]);
        }
      } catch (err) {
        setSellerToBuyerCoords([
          { latitude: transporterCoords.latitude, longitude: transporterCoords.longitude },
          { latitude: Number(item.deliveryLatitude), longitude: Number(item.deliveryLongitude) }
        ]);
      }
      setUserToSellerCoords([]); // Only clear blue after engagement
    }
    // If none of the above, clear both
    if (!item.sellerLatitude || !item.sellerLongitude) {
      setUserToSellerCoords([]);
      setSellerToBuyerCoords([]);
    }
  }, [transporterCoords]);
  // (Removed updatePolylinesRef indirection)
  const [registerData, setRegisterData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [loadingType, setLoadingType] = useState<"accept" | "view" | "offload" | "cancel" | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [roadDistance, setRoadDistance] = useState<number>(0);
  const [roadDistanceLoading, setRoadDistanceLoading] = useState<boolean>(false);

  // Fetch and set road distance for active card
  const fetchRoadDistance = async (item) => {
    if (
      item &&
      item.sellerLatitude && item.sellerLongitude &&
      item.deliveryLatitude && item.deliveryLongitude &&
      !isNaN(Number(item.sellerLatitude)) && !isNaN(Number(item.sellerLongitude)) &&
      !isNaN(Number(item.deliveryLatitude)) && !isNaN(Number(item.deliveryLongitude))
    ) {
      setRoadDistanceLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${item.sellerLongitude},${item.sellerLatitude};${item.deliveryLongitude},${item.deliveryLatitude}?overview=false`;
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
  const [userNationality, setUserNationality] = useState<string | null>(null);
  // No need for userRateData, use ratesMap from useExchange
  const navigation = useNavigation();
  const mapRef = useRef(null);

  // Floating spinner animation
  useEffect(() => {
    if (isRefreshing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isRefreshing, spinAnim]);

  // Real-time GPS and polyline updates
  useEffect(() => {
    let watcher = null;
    let isMounted = true;
    (async () => {
      watcher = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 2
      }, (loc) => {
        if (!isMounted) return;
        const newPos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setTransporterCoords(newPos);
        // Optionally, update polylines here if needed for live navigation
      });
    })();
    return () => {
      isMounted = false;
      if (watcher && typeof watcher.remove === 'function') watcher.remove();
    };
  }, []);

  // 30s polling for backend/carousel update
  useEffect(() => {
    let pollingInterval = null;
    let isMounted = true;
    async function pollEngagedOrder() {
      try {
        // Always get latest engaged order from backend
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const res = await client.graphql({
          query: BytransprtOwnrEmail,
          variables: {
            transportOwnerEmail: attributes.email,
            sortDirection: "DESC",
            filter: { transportRequest: { eq: "transportRequestYes" } }
          }
        });
        const items = (res as any).data?.BytransprtOwnrEmail?.items || [];
        const activeOrder = items.find(item => item.engagementStatus === "TransportEngaged");
        if (!activeOrder) return;
        lastPositionRef.current = activeOrder.latitude && activeOrder.longitude ? { latitude: Number(activeOrder.latitude), longitude: Number(activeOrder.longitude) } : null;
        setCumulativeDistance(activeOrder.distance || 0);
        setCumulativeCost(activeOrder.Earnings || 0);
        // Use latest live GPS for backend update
        let newPos = transporterCoords;
        if (!newPos) {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
          newPos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
        if (lastPositionRef.current && newPos) {
          const moved = getDistance(lastPositionRef.current, newPos);
          if (moved >= 50) {
            const newCumulative = (activeOrder.distance || 0) + moved / 1000;
            setCumulativeDistance(newCumulative);
            const newCost = newCumulative * (activeOrder.transportRate || 0);
            setCumulativeCost(newCost);
            await client.graphql({
              query: updateTransportOrder,
              variables: {
                input: {
                  id: activeOrder.id,
                  latitude: newPos.latitude,
                  longitude: newPos.longitude,
                  distance: newCumulative,
                  Earnings: newCost
                }
              }
            });
            lastPositionRef.current = newPos;
            // Refresh registerData to update carousel with backend values
            await fetchRegisterData();
          }
        } else if (newPos) {
          lastPositionRef.current = newPos;
        }
      } catch (err) {
        console.warn('Polling GPS error:', err);
      }
    }
    pollingInterval = setInterval(() => {
      if (isMounted) pollEngagedOrder();
    }, 30000);
    // Run once immediately if mounted
    pollEngagedOrder();
    return () => {
      isMounted = false;
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  useEffect(() => {
    // No need to fetch nationality/rates, handled by useExchange
    setUserNationality(nationality);
    // Fetch road distance for active card
    if (registerData[activeIndex]) {
      fetchRoadDistance(registerData[activeIndex]);
    }
  }, [nationality, activeIndex, registerData]);
  const fetchRegisterData = async () => {
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const res = await client.graphql({
        query: BytransprtOwnrEmail,
        variables: {
          transportOwnerEmail: attributes.email,
          sortDirection: "DESC",
          filter: {
            transportRequest: {
              eq: "transportRequestYes"
            }
          }
        }
      });
      if ('data' in res && res.data?.BytransprtOwnrEmail?.items) {
        console.log('[fetchRegisterData] items:', res.data.BytransprtOwnrEmail.items);
        setRegisterData(res.data.BytransprtOwnrEmail.items);
      } else {
        console.log('[fetchRegisterData] No items found');
        setRegisterData([]);
      }
    } catch (error) {
      console.error("Error fetching transport registers:", error);
    }
  };
  const getTransporterLocation = async () => {
    const {
      status
    } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t.permissionDenied, t.locationPermissionRequired);
      return;
      
    }
    const location = await Location.getCurrentPositionAsync({});
    setTransporterCoords(location.coords);
  };
  const handleAcceptDelivery = async item => {
    setLoadingItemId(item.id);
    setLoadingType("accept");
    try {
      const user = await fetchUserAttributes();
      const orderDtlRes = await client.graphql({
        query: getTransportOrder,
        variables: {
          id: item.id
        }
      });
      const orderDtlz = 'data' in orderDtlRes ? orderDtlRes.data.getTransportOrder : null;
      if (item.engagementStatus === "TransportEngaged") {
        Alert.alert(t.error, t.alreadyAccepted);
        return;
      }
      // --- 50 meter check before accepting ---
      const locPerm = await Location.requestForegroundPermissionsAsync();
      if (locPerm.status !== "granted") {
        Alert.alert(t.permissionDenied, t.locationPermissionRequired);
        return;
      }
      const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      const transporterLat = currentLoc.coords.latitude;
      const transporterLng = currentLoc.coords.longitude;
      const sellerLat = Number(orderDtlz.sellerLatitude);
      const sellerLng = Number(orderDtlz.sellerLongitude);
      if (!isNaN(sellerLat) && !isNaN(sellerLng)) {
        // Use OSRM for transporter-to-seller road distance
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${transporterLng},${transporterLat};${sellerLng},${sellerLat}?overview=false`;
          const res = await axios.get(url);
          let distToSeller = 0;
          if (res.data.routes && res.data.routes.length > 0) {
            distToSeller = res.data.routes[0].distance;
          }
          if (distToSeller > 200) {
            Alert.alert(t.sorry, t.mustBeNearSeller);
            setLoadingItemId(null);
            setLoadingType(null);
            return;
          }
        } catch (e) {
          Alert.alert(t.sorry, t.mustBeNearSeller);
          setLoadingItemId(null);
          setLoadingType(null);
          return;
        }
      }
      const isCompanyOwned = orderDtlz?.ownerShipType === "Company" && !!orderDtlz?.transportOwnerAc;

      let userDtlsz: any = null;
      if (!isCompanyOwned) {
        const userDtlsRes = await client.graphql({
          query: getSMAccount,
          variables: {
            awsemail: user.email
          }
        });
        userDtlsz = 'data' in userDtlsRes ? userDtlsRes.data.getSMAccount : null;
      }

      let companyTransportBizna: any = null;
      if (isCompanyOwned) {
        const companyBiznaRes: any = await client.graphql({
          query: getTransportBizna,
          variables: { BizAc: orderDtlz.transportOwnerAc }
        });
        companyTransportBizna = companyBiznaRes?.data?.getTransportBizna || null;
      }

      const buyerDtlsRes = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: orderDtlz.sellerContact
        }
      });
      const buyerDtlsz = 'data' in buyerDtlsRes ? buyerDtlsRes.data.getBizna : null;
      // Use user's currency for all input and display
      const userCurrencyKey = nationalityToCode(nationality);
      const orderCostUser = parseFloat(orderDtlz.orderCost);
      const deliveryCostUser = parseFloat(orderDtlz.deliveryCost);
      const userBalance = userDtlsz ? parseFloat(userDtlsz.balance) : 0;
      const companyBizFund = companyTransportBizna ? parseFloat(companyTransportBizna.bizFund || 0) : 0;
      const buyerBalance = parseFloat(buyerDtlsz.earningsBal);
      const buyerBalance2 = parseFloat(buyerDtlsz.netEarnings);
      // Convert user input to KES for backend
      const orderCostKes =  orderCostUser;
      let computedDistance = 0;
      if (orderDtlz.sellerLatitude && orderDtlz.sellerLongitude && orderDtlz.deliveryLatitude && orderDtlz.deliveryLongitude && !isNaN(Number(orderDtlz.sellerLatitude)) && !isNaN(Number(orderDtlz.sellerLongitude)) && !isNaN(Number(orderDtlz.deliveryLatitude)) && !isNaN(Number(orderDtlz.deliveryLongitude))) {
        // Use OSRM for seller-to-buyer road distance
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${orderDtlz.sellerLongitude},${orderDtlz.sellerLatitude};${orderDtlz.deliveryLongitude},${orderDtlz.deliveryLatitude}?overview=false`;
          const res = await axios.get(url);
          let rawDistance = 0;
          if (res.data.routes && res.data.routes.length > 0) {
            rawDistance = res.data.routes[0].distance;
          }
          setDistanceMeters(rawDistance);
          computedDistance = rawDistance / 1000;
        } catch (e) {
          setDistanceMeters(0);
          computedDistance = 0;
        }
      }
      if (deliveryCostUser > buyerBalance) {
        Alert.alert(t.sorry, t.buyerCannotCover);
        return;
      } else if (orderDtlz.customerEmail === user.email) {
        Alert.alert(t.sorry, t.cannotBeClientAndTransporter);
        return;
      } else if (!isCompanyOwned && orderCostUser > userBalance) {
        navigation.navigate("ViewChama2CommitTransport", {
          id: item.id
        });
        return;
      } else if (isCompanyOwned && orderCostUser > companyBizFund) {
        Alert.alert(t.sorry, t.companyBizFundCannotCover || "Company bizFund cannot cover this order security amount.");
        return;
      }

      // Security commitment source depends on ownership type.
      if (isCompanyOwned && companyTransportBizna) {
        await client.graphql({
          query: updateTransportBizna,
          variables: {
            input: {
              BizAc: companyTransportBizna.BizAc,
              bizFund: companyBizFund - orderCostUser,
            },
          },
        });
      } else {
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: user.email,
              balance: userBalance - orderCostUser
            }
          }
        });
      }

      
      await client.graphql({
        query: updateBizna,
        variables: {
          input: {
          BusKntct: orderDtlz.sellerContact,
            earningsBal: buyerBalance - deliveryCostUser,
            netEarnings: buyerBalance2 - deliveryCostUser
          }
        }
      });

      // Update order (store KES for backend, but set distance and Earnings to zero at journey start)
      const updateResult = await client.graphql({
        query: updateTransportOrder,
        variables: {
          input: {
            id: item.id,
            engagementStatus: "TransportEngaged",
            UsrAcCommitment: orderCostKes,
            deliveryStart: Date.now(),
            distance: 0,
            Earnings: 0
          }
        }
      });
      // --- Notification and Message Logic ---
      if ('data' in updateResult && updateResult.data?.updateTransportOrder) {
        try {
              const notifTitle = t.deliveryAcceptedTitle;
              const notifBody = t.deliveryAcceptedNotif(orderDtlz.transportName, orderDtlz.sellerName, orderDtlz.transportkntct);
          // Send to buyer (customerEmail)
          await client.graphql({
            query: createMessages,
            variables: {
              input: {
                senderEmail: item.buyingOfficerEmail,
                messageBody: notifBody
              }
            }
          });
          await client.graphql({
            query: sendNotification,
            variables: {
              riderEmail: item.buyingOfficerEmail,
              title: notifTitle,
              body: notifBody
            }
          });
          // Send to seller (Bizna email)
          if (orderDtlz.sellerContact) {
            const biznaRes = await client.graphql({ query: getBizna, variables: { BusKntct: orderDtlz.sellerContact } });
            const bizna = (biznaRes as any)?.data?.getBizna;
            if (bizna && bizna.email) {
              await client.graphql({
                query: createMessages,
                variables: {
                  input: {
                    senderEmail: bizna.email,
                    messageBody: notifBody
                  }
                }
              });
              await client.graphql({
                query: sendNotification,
                variables: {
                  riderEmail: bizna.email,
                  title: notifTitle,
                  body: notifBody
                }
              });
            }
          }
        } catch (notifErr) {
          console.warn('Notification error', notifErr);
        }
            Alert.alert(t.success, t.deliveryAccepted);
            Linking.openURL(`sms:${orderDtlz.buyerContact}?body=${encodeURIComponent(t.deliveryAcceptedNotif(orderDtlz.transportName, orderDtlz.sellerName, orderDtlz.transportkntct))}`);
      }
      if ('data' in updateResult && updateResult.data?.updateTransportOrder) {
            Alert.alert(t.success, t.deliveryAccepted);
            Linking.openURL(`sms:${orderDtlz.buyerContact}?body=${encodeURIComponent(t.deliveryAcceptedNotif(orderDtlz.transportName, orderDtlz.sellerName, orderDtlz.transportkntct))}`);
      }
      fetchRegisterData(); // refresh list
    } catch (err) {
      console.error("Accept error:", err);
          Alert.alert(t.error, t.deliveryAccepted);
    } finally {
      setLoadingItemId(null);
      setLoadingType(null);
    }
  };
  // Use onMomentumScrollEnd for FlatList paging, always using latest updatePolylines
  const handleScroll = React.useCallback(async (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setActiveIndex(index);
    const item = registerData[index];
    // Always center on the transporter's live location when scrolling
    if (transporterCoords) {
      mapRef.current?.animateToRegion({
        latitude: transporterCoords.latitude,
        longitude: transporterCoords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      }, 1000);
    }
    if (item) {
      try {
        await updatePolylines(item);
      } catch (err) {
        console.error('[handleScroll] Exception when calling updatePolylines:', err, updatePolylines, new Error().stack);
        Alert.alert('Error', 'Exception in updatePolylines: ' + String(err));
      }
    }
  }, [registerData, screenWidth, updatePolylines, transporterCoords]);

  // Update polylines when activeIndex, transporterCoords, or registerData changes
  useEffect(() => {
    if (!registerData[activeIndex]) {
      setUserToSellerCoords([]);
      setSellerToBuyerCoords([]);
      console.log('[effect] No active registerData, clearing polylines');
      return;
    }
    if (!transporterCoords) {
      // Don't clear polylines, just wait for GPS
      console.log('[effect] transporterCoords not ready, waiting for GPS');
      return;
    }
    console.log('[effect] updatePolylines called', {
      transporterCoords,
      activeIndex,
      item: registerData[activeIndex],
      userToSellerCoords,
      sellerToBuyerCoords
    });
    (async () => {
      try {
        await updatePolylines(registerData[activeIndex]);
        console.log('[effect] After updatePolylines', {
          userToSellerCoords,
          sellerToBuyerCoords
        });
      } catch (err) {
        console.error('[effect] Exception when calling updatePolylines:', err, updatePolylines, new Error().stack);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, transporterCoords, registerData]);

return <View style={{
    flex: 1
  }}>
    {/* Floating Refresh Spinner Button */}
    <TouchableOpacity
      onPress={isRefreshing ? undefined : async () => {
        setIsRefreshing(true);
        try {
          await Promise.all([
            fetchRegisterData(),
            getTransporterLocation()
          ]);
        } catch (err) {
          Alert.alert('Error', 'Failed to refresh.');
        } finally {
          setIsRefreshing(false);
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
        opacity: isRefreshing ? 0.7 : 1
      }}
      activeOpacity={0.7}
      disabled={isRefreshing}
    >
      <Animated.View
        style={{
          transform: [{
            rotate: spinAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })
          }]
        }}
      >
        <FontAwesome name="refresh" size={28} color="#fff" />
      </Animated.View>
    </TouchableOpacity>
      {!transporterCoords ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e58d29" />
          <Text style={{ marginTop: 10 }}>{t.gettingLocation}</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: transporterCoords.latitude,
            longitude: transporterCoords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
          }}
        >
          <Marker coordinate={transporterCoords} title={t.youTransporter} pinColor="green" />
          {registerData.map(item => (
            <React.Fragment key={item.id}>
              <Marker coordinate={{ latitude: Number(item.sellerLatitude), longitude: Number(item.sellerLongitude) }} title={`${t.seller}: ${item.sellerName}`} pinColor="blue" />
              <Marker coordinate={{ latitude: Number(item.deliveryLatitude), longitude: Number(item.deliveryLongitude) }} title={`${t.buyer}: ${item.buyerName}`} pinColor="orange" />
            </React.Fragment>
          ))}
          {/* Polyline: before engagement, blue from transporter to seller; always show brown from seller to buyer if transportRequestYes */}
          {/* Render brown polyline first (thinner), then blue polyline (thicker) so both are visible if overlapping */}
          {registerData[activeIndex]?.transportRequest === "transportRequestYes" && sellerToBuyerCoords.length >= 2 && (
            <Polyline coordinates={sellerToBuyerCoords} strokeColor="#8B4513" strokeWidth={2} zIndex={1} />
          )}
          {registerData[activeIndex]?.engagementStatus !== "TransportEngaged" && userToSellerCoords.length >= 2 && (
            <Polyline coordinates={userToSellerCoords} strokeColor="blue" strokeWidth={8} zIndex={2} />
          )}
        </MapView>
      )}

      {/* Carousel (PassengerRequestRide pattern) */}
      <Animated.View
        style={[
          styles.carouselContainer,
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: CAROUSEL_HEIGHT + 20, // add space for handle and buttons
            maxHeight: screenHeight * 0.45, // allow more room for content
            zIndex: 100,
            borderWidth: 2,
            borderColor: '#e58d29',
            pointerEvents: 'box-none',
            overflow: 'visible',
          },
        ]}
      >
        {/* Removed handle since dragging is disabled */}
        <FlatList
          horizontal
          pagingEnabled
          data={registerData}
          keyExtractor={item => item.id}
          onMomentumScrollEnd={handleScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item, index }) => {
            console.log('[FlatList renderItem] item:', item);
            return (
              <View style={[styles.card, index === activeIndex && styles.activeCard, { flex: 1, height: '100%', width: screenWidth, justifyContent: 'center', alignItems: 'center', marginVertical: 0, marginHorizontal: 0, borderRadius: 0, paddingBottom: 0 }]}> 
                <Text style={styles.cardTitle}>
                  {t.fromTo ? t.fromTo(item.sellerName, item.buyerName) : `${item.sellerName} (${t.seller || 'Seller'}) → ${item.buyerName} (${t.buyer || 'Buyer'})`}
                </Text>
                <Text style={{ color: '#e58d29', fontWeight: 'bold', marginBottom: 0 }}>
                  {(t.transportCost || t.rates || 'Transport Cost') + ': '} {formatAmountSync(Number(item.transportRate ?? 0), nationalityToCode(nationality), ratesMap)}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 0, flexWrap: 'wrap' }}>
                  {/* Accept Request button */}
                  {item.transportRequest === "transportRequestYes" && item.bizType === "TransportDispatched" && item.engagementStatus !== "TransportEngaged" && (
                    <TouchableOpacity
                      onPress={() => handleAcceptDelivery(item)}
                      style={[styles.acceptBtn, { backgroundColor: '#2196f3', opacity: loadingItemId === item.id && loadingType === "accept" ? 0.7 : 1, minWidth: 40, maxWidth: 90, alignSelf: 'flex-end' }]}
                      disabled={loadingItemId === item.id && loadingType === "accept"}
                    >
                      {loadingItemId === item.id && loadingType === "accept" && (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                      )}
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                        {loadingItemId === item.id && loadingType === "accept" ? t.processing : t.accept || "Accept"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {/* Cancel Request button */}
                  {item.transportRequest === "transportRequestYes" && item.bizType === "TransportDispatched" && item.engagementStatus !== "TransportEngaged" && (
                    <TouchableOpacity
                      onPress={async () => {
                        setLoadingItemId(item.id);
                        setLoadingType("cancel");
                        try {
                          await client.graphql({
                            query: updateTransportOrder,
                            variables: {
                              input: {
                                id: item.id,
                                transportRequest: "transportRequestNo"
                              }
                            }
                          });
                          // --- Notification and Message Logic for Cancel ---
                          const notifTitle = t.cancelTitle || "Transport Request Cancelled";
                          const notifBody = t.cancelNotif ? t.cancelNotif(item.transportName, item.sellerName, item.transportkntct) : `Transport request for ${item.transportName} has been cancelled.`;
                          // Send to buyer (buyerOfficerEmail)
                          if (item.buyerOfficerEmail) {
                            await client.graphql({
                              query: createMessages,
                              variables: {
                                input: {
                                  senderEmail: item.buyerOfficerEmail,
                                  messageBody: notifBody
                                }
                              }
                            });
                            await client.graphql({
                              query: sendNotification,
                              variables: {
                                riderEmail: item.buyerOfficerEmail,
                                title: notifTitle,
                                body: notifBody
                              }
                            });
                          }
                          // Send to seller (Bizna email)
                          if (item.sellerContact) {
                            try {
                              const biznaRes = await client.graphql({ query: getBizna, variables: { BusKntct: item.sellerContact } });
                              const bizna = (biznaRes as any)?.data?.getBizna;
                              if (bizna && bizna.email) {
                                await client.graphql({
                                  query: createMessages,
                                  variables: {
                                    input: {
                                      senderEmail: bizna.email,
                                      messageBody: notifBody
                                    }
                                  }
                                });
                                await client.graphql({
                                  query: sendNotification,
                                  variables: {
                                    riderEmail: bizna.email,
                                    title: notifTitle,
                                    body: notifBody
                                  }
                                });
                              }
                            } catch (err) {
                              console.warn('Cancel notification to Bizna failed', err);
                            }
                          }
                          Alert.alert(t.success, t.cancelSuccess || "Request cancelled.");
                          fetchRegisterData();
                        } catch (err) {
                          console.error("Cancel error:", err);
                          Alert.alert(t.error, t.cancelError || "Failed to cancel request.");
                        } finally {
                          setLoadingItemId(null);
                          setLoadingType(null);
                        }
                      }}
                      style={[styles.acceptBtn, { backgroundColor: '#f44336', opacity: loadingItemId === item.id && loadingType === "cancel" ? 0.7 : 1, minWidth: 40, maxWidth: 90, alignSelf: 'flex-end' }]}
                      disabled={loadingItemId === item.id && loadingType === "cancel"}
                    >
                      {loadingItemId === item.id && loadingType === "cancel" && (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                      )}
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                        {loadingItemId === item.id && loadingType === "cancel" ? t.processing : t.cancel || "Cancel"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {/* Offload button: only show if engaged */}
                  {item.engagementStatus === "TransportEngaged" && (
                    <TouchableOpacity
                      onPress={async () => {
                        setLoadingItemId(item.id);
                        setLoadingType("offload");
                        try {
                          // Get live GPS
                          const locPerm = await Location.requestForegroundPermissionsAsync();
                          if (locPerm.status !== "granted") {
                            Alert.alert(t.permissionDenied, t.locationPermissionRequired);
                            setLoadingItemId(null);
                            setLoadingType(null);
                            return;
                          }
                          const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
                          const transporterLat = currentLoc.coords.latitude;
                          const transporterLng = currentLoc.coords.longitude;
                          const sellerLat = Number(item.sellerLatitude);
                          const sellerLng = Number(item.sellerLongitude);
                          if (isNaN(sellerLat) || isNaN(sellerLng)) {
                            Alert.alert(t.error, t.sellerLocationMissing || "Seller location missing");
                            setLoadingItemId(null);
                            setLoadingType(null);
                            return;
                          }
                          // Calculate radial distance (meters)
                          const dist = getDistance(
                            { latitude: transporterLat, longitude: transporterLng },
                            { latitude: sellerLat, longitude: sellerLng }
                          );
                          if (dist > 200) {
                            Alert.alert(t.sorry, t.mustBeNearSeller || "You must be within 200 meters of the seller to offload.");
                            setLoadingItemId(null);
                            setLoadingType(null);
                            return;
                          }
                          // Update dutyStatus
                          await client.graphql({
                            query: updateTransportOrder,
                            variables: {
                              input: {
                                id: item.id,
                                dutyStatus: "TransportNotOnduty"
                              }
                            }
                          });
                          // --- Notification and Message Logic for Offload ---
                          const notifTitle = t.offLoadTitle || "Transport Offloaded";
                          const notifBody = t.offLoadNotif ? t.offLoadNotif(item.transportName, item.sellerName, item.transportkntct) : `Transport for ${item.transportName} has been offloaded.`;
                          // Send to buyer (buyerOfficerEmail)
                          if (item.buyerOfficerEmail) {
                            await client.graphql({
                              query: createMessages,
                              variables: {
                                input: {
                                  senderEmail: item.buyerOfficerEmail,
                                  messageBody: notifBody
                                }
                              }
                            });
                            await client.graphql({
                              query: sendNotification,
                              variables: {
                                riderEmail: item.buyerOfficerEmail,
                                title: notifTitle,
                                body: notifBody
                              }
                            });
                          }
                          // Send to seller (Bizna email)
                          if (item.sellerContact) {
                            try {
                              const biznaRes = await client.graphql({ query: getBizna, variables: { BusKntct: item.sellerContact } });
                              const bizna = (biznaRes as any)?.data?.getBizna;
                              if (bizna && bizna.email) {
                                await client.graphql({
                                  query: createMessages,
                                  variables: {
                                    input: {
                                      senderEmail: bizna.email,
                                      messageBody: notifBody
                                    }
                                  }
                                });
                                await client.graphql({
                                  query: sendNotification,
                                  variables: {
                                    riderEmail: bizna.email,
                                    title: notifTitle,
                                    body: notifBody
                                  }
                                });
                              }
                            } catch (err) {
                              console.warn('Offload notification to Bizna failed', err);
                            }
                          }
                          Alert.alert(t.success, t.offLoadSuccess || "Off load successful!");
                          fetchRegisterData();
                        } catch (err) {
                          console.error("Offload error:", err);
                          Alert.alert(t.error, t.offLoadError || "Failed to off load.");
                        } finally {
                          setLoadingItemId(null);
                          setLoadingType(null);
                        }
                      }}
                      style={[styles.acceptBtn, { backgroundColor: '#4caf50', opacity: loadingItemId === item.id && loadingType === "offload" ? 0.7 : 1, minWidth: 40, maxWidth: 70, alignSelf: 'flex-end' }]} 
                      disabled={loadingItemId === item.id && loadingType === "offload"}
                    >
                      {loadingItemId === item.id && loadingType === "offload" && (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                      )}
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                        {loadingItemId === item.id && loadingType === "offload" ? t.processing : t.offLoad || "Off Load"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* View Details button below the row */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setLoadingItemId(item.id);
                      setLoadingType("view");
                      navigation.navigate("VwTransprtReqDtls", { id: item.id });
                      setLoadingItemId(null);
                      setLoadingType(null);
                    }}
                    style={[styles.acceptBtn, { backgroundColor: '#e29d58', opacity: loadingItemId === item.id && loadingType === "view" ? 0.7 : 1, minWidth: 40, maxWidth: 110, alignSelf: 'flex-end' }]}
                    disabled={loadingItemId === item.id && loadingType === "view"}
                  >
                    {loadingItemId === item.id && loadingType === "view" && (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                    )}
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                        {loadingItemId === item.id && loadingType === "view" ? t.processing : t.view || "View"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </Animated.View>
    </View>;
};
const styles = StyleSheet.create({
  map: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.97)',
    zIndex: 100,
    paddingTop: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    marginHorizontal: 10,
    width: screenWidth * 0.9,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowRadius: 5,
    padding: 16
  },
  activeCard: {
    borderColor: "#e58d29",
    borderWidth: 2
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5
  },
  acceptBtn: {
    backgroundColor: "#e58d29",
    paddingVertical: 6, // reduce height
    paddingHorizontal: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 28, // set a smaller min height
    maxHeight: 32
  }
});
export default TransportMapScreen;