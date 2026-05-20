import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PanResponder } from 'react-native';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Animated, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Easing } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
// import { getDistance } from 'geolib';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listTransportRegisters, listRideRequests, getSMAccount, getTransportRegister } from '../../../src/graphql/queries';
import { createRideRequest, sendNotification } from '../../../src/graphql/mutations';
import GooglePlacesAutocompleteNew from './GooglePlacesAutoCompleteNew';
import messaging from '@react-native-firebase/messaging';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, getUserNationalityByEmail, convertForeignToKsh } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { generateClient } from "aws-amplify/api";
import { getUrl } from 'aws-amplify/storage';
const client = generateClient();
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_RADIUS_KM = 0.1;
export default function RideRequestMapScreen({
  navigation
}: {
  navigation: any;
}) {
  // i18n translation pattern (as in RequestTransport)
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  // Collapsible filter panel state
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  const [pendingCheckDone, setPendingCheckDone] = useState(false);
  // Floating refresh animation state
  const [pendingRides, setPendingRides] = useState<any[]>([]);
  const [pickupInput, setPickupInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [allRiders, setAllRiders] = useState<any[]>([]);
  const [filteredRiders, setFilteredRiders] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    pickup: null as {
      latitude: number;
      longitude: number;
    } | null,
    destination: null as {
      latitude: number;
      longitude: number;
    } | null,
    radiusKm: String(DEFAULT_RADIUS_KM)
  });
  const { nationality, ratesMap } = useExchange();
  // normalize nationality to code used in ratesMap
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const natCode = nationalityToCode(safeNationality) || safeNationality || undefined;

  // On mount, check for pending rides for this passenger
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        console.log('PassengerRequestRide: fetched attributes', attributes);
        const pendingRes: any = await client.graphql({
          query: listRideRequests,
          variables: {
            filter: {
              passengerEmail: { eq: attributes.email },
              rideStatus: { ne: 'Completed' }
            },
            limit: 10
          }
        });
        const pending = pendingRes?.data?.listRideRequests?.items || [];
        console.log('PassengerRequestRide: pending rides count', pending.length);

        // Fallback: if server returned no items, try a broad query and filter client-side
        let fallbackMatches: any[] = [];
        if (pending.length === 0) {
          try {
            const broadRes: any = await client.graphql({ query: listRideRequests, variables: { limit: 50 } });
            const allItems = broadRes?.data?.listRideRequests?.items || [];
            fallbackMatches = allItems.filter((it: any) => it?.passengerEmail === attributes.email && it?.rideStatus !== 'Completed');
            console.log('PassengerRequestRide: fallback matches count', fallbackMatches.length);
          } catch (e) {
            console.warn('PassengerRequestRide: fallback query failed', e);
          }
        }

        const effectivePending = pending.length > 0 ? pending : fallbackMatches;
        if (effectivePending.length > 0) {
          Alert.alert(
            t.pendingRidesTitle,
            t.pendingRidesBody,
            [
              {
                text: t.goToPendingRides,
                onPress: () => {
                  setPendingRides(effectivePending);
                  navigation.replace('RideTrackingScreen', { pendingRides: effectivePending });
                },
                style: 'default'
              },
              {
                text: t.continue,
                onPress: () => setPendingCheckDone(true),
                style: 'cancel'
              }
            ],
            { cancelable: false }
          );
        } else {
          setPendingCheckDone(true);
        }
      } catch (err) {
        console.error('PassengerRequestRide: pending check error', err);
        Alert.alert(t.error, t.errorRequestRide);
        setPendingCheckDone(true);
      }
    })();
  }, []);

  // Fetch all riders on mount (after pending check)
  const [loadingAllRiders, setLoadingAllRiders] = useState(false);

  const fetchRiders = async () => {
    if (!pendingCheckDone) return;
    setLoadingAllRiders(true);
    try {
      console.log('PassengerRequestRide: fetchRiders starting');
      const res: any = await client.graphql({
        query: listTransportRegisters,
        variables: {
          filter: { dutyStatus: { eq: "TransportOnduty" }, engagementStatus: { eq: "TransportNotEngaged" } },
          limit: 1000
        }
      });
      console.log('PassengerRequestRide: fetchRiders raw response', res && typeof res === 'object' ? Object.keys(res).slice(0,10) : res);
      const items = res?.data?.listTransportRegisters?.items || [];
      console.log('PassengerRequestRide: fetchRiders items count', items.length);
      // Parse lat/lng as numbers and fetch signedUrl for each rider
      const riders = await Promise.all(items.map(async (item: any) => {
        const latitude = parseFloat(item.latitude);
        const longitude = parseFloat(item.longitude);
        let signedUrl = null;
        // Use 'photoKey' as the S3 key field; adjust if your field is different
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
            console.error('Failed to get signed URL for rider image:', photoKey, err);
            signedUrl = null;
          }
        }
        return {
          ...item,
          latitude,
          longitude,
          signedUrl
        };
      }));
      const validRiders = riders.filter((r: any) => !isNaN(r.latitude) && !isNaN(r.longitude));
      console.log('PassengerRequestRide: parsed riders count', validRiders.length);
      setAllRiders(validRiders);
    } catch (err) {
      console.error('PassengerRequestRide: Error fetching riders:', err);
    } finally {
      setLoadingAllRiders(false);
    }
  };

  useEffect(() => {
    if (!pendingCheckDone) return;
    fetchRiders();
  }, [pendingCheckDone]);

  // Loading state for filtering
  const [filteringLoading, setFilteringLoading] = useState(false);
  // Filter riders by pickup location and radius, and calculate estimated trip distance/cost
  useEffect(() => {
    const fetchEstimates = async () => {
      setFilteringLoading(true);
      // Determine pickup point: use filters.pickup if set, else use userLocation
      const pickupPoint = filters.pickup || userLocation;
      // If no pickup point (user location not available), block
      if (!pickupPoint) {
        setFilteredRiders([]);
        setFilteringLoading(false);
        return;
      }
      // If destination is NOT set, do a simple radius-only filter around pickup using OSRM road distance
      if (!filters.destination) {
        const radius = Math.max(0.05, parseFloat(filters.radiusKm) || 0.05); // in km
        // Use OSRM for each rider to pickup
        const promises = allRiders.map(async rider => {
          let dist = 0;
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${rider.longitude},${rider.latitude};${pickupPoint.longitude},${pickupPoint.latitude}?overview=false`;
            const res = await axios.get(url);
            if (res.data.routes && res.data.routes.length > 0) {
              dist = res.data.routes[0].distance / 1000;
            } else {
              dist = null;
            }
          } catch (err) {
            dist = null;
          }
          if (dist == null) return null;
          return {
            ...rider,
            _distanceKm: dist
          };
        });
        const ridersWithRoadDist = (await Promise.all(promises)).filter(Boolean).filter(rider => rider._distanceKm <= radius).sort((a, b) => a._distanceKm - b._distanceKm);
        setFilteredRiders(ridersWithRoadDist);
        setFilteringLoading(false);
        return;
      }
      // If both pickup and destination are set, calculate trip distance and cost for each rider using OSRM for both legs
      const radius = Math.max(0.05, parseFloat(filters.radiusKm) || 0.05); // in km
      const promises = allRiders.map(async rider => {
        // OSRM for rider to pickup
        let distToPickup = 0;
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${rider.longitude},${rider.latitude};${pickupPoint.longitude},${pickupPoint.latitude}?overview=false`;
          const res = await axios.get(url);
          if (res.data.routes && res.data.routes.length > 0) {
            distToPickup = res.data.routes[0].distance / 1000;
          } else {
            distToPickup = null;
          }
        } catch (err) {
          distToPickup = null;
        }
        if (distToPickup == null || distToPickup > radius) return null;
        // OSRM for pickup to destination
        let tripDistanceKm = 0;
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${pickupPoint.longitude},${pickupPoint.latitude};${filters.destination!.longitude},${filters.destination!.latitude}?overview=false`;
          const res = await axios.get(url);
          if (res.data.routes && res.data.routes.length > 0) {
            tripDistanceKm = res.data.routes[0].distance / 1000;
          } else {
            tripDistanceKm = null;
          }
        } catch (err) {
          tripDistanceKm = null;
        }
        if (tripDistanceKm == null) return null;
        const estimatedCost = Math.round((rider.transportRate || 0) * tripDistanceKm);
        return {
          ...rider,
          _distanceKm: distToPickup,
          _tripDistanceKm: tripDistanceKm,
          _estimatedCost: estimatedCost
        };
      });
      const ridersWithEstimates = (await Promise.all(promises)).filter(Boolean).sort((a, b) => a._distanceKm - b._distanceKm);
      setFilteredRiders(ridersWithEstimates);
      setFilteringLoading(false);
    };
    fetchEstimates();
  }, [allRiders, filters.pickup, filters.radiusKm, filters.destination, userLocation]);

  // Polyline state for showing route from selected rider to pickup
  const [polylineCoords, setPolylineCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  // Polyline for pickup -> destination (orange), computed when both pickup and destination present
  const [dropPolylineCoords, setDropPolylineCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  // Route cache to avoid repeated OSRM calls: keyed by rider id
  const routeCache = useRef<Record<string, { pickup?: any[]; drop?: any[]; dropDistanceKm?: number }>>({});
  // Persist/load route cache to reduce OSRM calls
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('routeCache');
        if (raw) routeCache.current = JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to load route cache', e);
      }
    })();
  }, []);
  const saveRouteCache = async () => {
    try {
      await AsyncStorage.setItem('routeCache', JSON.stringify(routeCache.current));
    } catch (e) {
      console.warn('Failed to save route cache', e);
    }
  };

  // Selected route distance (pickup -> destination) for the currently selected rider
  const [selectedRouteDistanceKm, setSelectedRouteDistanceKm] = useState<number | null>(null);

  // Selected rider id
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  // Invalidate cached polylines when pickup or destination changes
  useEffect(() => {
    if (!selectedRiderId) return;
    // Invalidate both pickup and drop cache for this rider
    if (routeCache.current[selectedRiderId]) {
      delete routeCache.current[selectedRiderId].pickup;
      delete routeCache.current[selectedRiderId].drop;
      delete routeCache.current[selectedRiderId].dropDistanceKm;
    }
  }, [filters.pickup, filters.destination, selectedRiderId]);

  // Update polyline when a rider is focused/selected or pickup/destination changes
  useEffect(() => {
    const drawPolyline = async () => {
      if (!selectedRiderId || !filters.pickup) {
        setPolylineCoords([]);
        setDropPolylineCoords([]);
        setSelectedRouteDistanceKm(null);
        return;
      }
      const rider = filteredRiders.find(r => r.id === selectedRiderId);
      if (!rider) {
        setPolylineCoords([]);
        setDropPolylineCoords([]);
        setSelectedRouteDistanceKm(null);
        return;
      }

      // use cache if available
      const cache = routeCache.current[selectedRiderId] || {};
      if (cache.pickup) {
        setPolylineCoords(cache.pickup);
      } else {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${rider.longitude},${rider.latitude};${filters.pickup!.longitude},${filters.pickup!.latitude}?overview=full&geometries=geojson`;
          const res = await axios.get(url);
          if (res.data.routes && res.data.routes.length > 0) {
            const coords = res.data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
            setPolylineCoords(coords);
            routeCache.current[selectedRiderId] = { ...(routeCache.current[selectedRiderId] || {}), pickup: coords };
            saveRouteCache().catch(() => {});
          } else {
            const coords = [
              { latitude: rider.latitude, longitude: rider.longitude },
              { latitude: filters.pickup!.latitude, longitude: filters.pickup!.longitude }
            ];
            setPolylineCoords(coords);
            routeCache.current[selectedRiderId] = { ...(routeCache.current[selectedRiderId] || {}), pickup: coords };
            saveRouteCache().catch(() => {});
          }
        } catch (err) {
          const coords = [
            { latitude: rider.latitude, longitude: rider.longitude },
            { latitude: filters.pickup!.latitude, longitude: filters.pickup!.longitude }
          ];
          setPolylineCoords(coords);
          routeCache.current[selectedRiderId] = { ...(routeCache.current[selectedRiderId] || {}), pickup: coords };
        }
      }

      // pickup -> destination polyline
      if (filters.pickup && filters.destination) {
        if (cache.drop) {
          setDropPolylineCoords(cache.drop);
          setSelectedRouteDistanceKm(cache.dropDistanceKm ?? null);
        } else {
          try {
            const url2 = `https://router.project-osrm.org/route/v1/driving/${filters.pickup!.longitude},${filters.pickup!.latitude};${filters.destination!.longitude},${filters.destination!.latitude}?overview=full&geometries=geojson`;
            const res2 = await axios.get(url2);
            if (res2.data.routes && res2.data.routes.length > 0) {
              const coords2 = res2.data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
              setDropPolylineCoords(coords2);
              const distKm = res2.data.routes[0].distance / 1000;
              setSelectedRouteDistanceKm(distKm);
              routeCache.current[selectedRiderId] = { ...(routeCache.current[selectedRiderId] || {}), drop: coords2, dropDistanceKm: distKm };
              saveRouteCache().catch(() => {});
            } else {
              const coords2 = [
                { latitude: filters.pickup!.latitude, longitude: filters.pickup!.longitude },
                { latitude: filters.destination!.latitude, longitude: filters.destination!.longitude }
              ];
              setDropPolylineCoords(coords2);
              setSelectedRouteDistanceKm(null);
              routeCache.current[selectedRiderId] = { ...(routeCache.current[selectedRiderId] || {}), drop: coords2 };
              saveRouteCache().catch(() => {});
            }
          } catch (err) {
            const coords2 = [
              { latitude: filters.pickup!.latitude, longitude: filters.pickup!.longitude },
              { latitude: filters.destination!.latitude, longitude: filters.destination!.longitude }
            ];
            setDropPolylineCoords(coords2);
            setSelectedRouteDistanceKm(null);
            routeCache.current[selectedRiderId] = { ...(routeCache.current[selectedRiderId] || {}), drop: coords2 };
          }
        }
      } else {
        setDropPolylineCoords([]);
        setSelectedRouteDistanceKm(null);
      }
    };
    drawPolyline();
  }, [selectedRiderId, filters.pickup, filters.destination, filteredRiders]);
  const [loadingRiders, setLoadingRiders] = useState<{
    [id: string]: boolean;
  }>({});
  const [paymentMethod, setPaymentMethod] = useState<'NiSenti' | 'Cash'>('Cash');
  const [pickupText, setPickupText] = useState(t.currentLocation);
  const [destinationText, setDestinationText] = useState('');
  const mapRef = useRef<MapView | null>(null);
  const carouselRef = useRef<FlatList | null>(null);
  // Draggable carousel state
  const CAROUSEL_HEIGHT = 220;
  // Clamp so at least 60px of the carousel is always visible at top and bottom
  const MIN_CAROUSEL_TOP = 60; // 60px from top
  const MAX_CAROUSEL_TOP = SCREEN_HEIGHT - CAROUSEL_HEIGHT - 60; // 60px from bottom
  const carouselPosition = useRef(new Animated.Value(MAX_CAROUSEL_TOP)).current;

  // Ensure carousel is visible on mount
  useEffect(() => {
    setTimeout(() => {
      Animated.timing(carouselPosition, {
        toValue: MAX_CAROUSEL_TOP,
        duration: 0,
        useNativeDriver: false
      }).start();
    }, 100);
  }, []);

  const lastTop = useRef(MAX_CAROUSEL_TOP);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        carouselPosition.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        let newTop = lastTop.current + gestureState.dy;
        newTop = Math.max(MIN_CAROUSEL_TOP, Math.min(newTop, MAX_CAROUSEL_TOP));
        carouselPosition.setValue(newTop);
      },
      onPanResponderRelease: (evt, gestureState) => {
        let newTop = lastTop.current + gestureState.dy;
        newTop = Math.max(MIN_CAROUSEL_TOP, Math.min(newTop, MAX_CAROUSEL_TOP));
        // Snap to closest position
        let snapTo = (newTop < (MIN_CAROUSEL_TOP + MAX_CAROUSEL_TOP) / 2) ? MIN_CAROUSEL_TOP : MAX_CAROUSEL_TOP;
        Animated.spring(carouselPosition, {
          toValue: snapTo,
          useNativeDriver: false
        }).start(() => {
          lastTop.current = snapTo;
        });
      },
    })
  ).current;

  // ---------- Notification Handlers ----------
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(remoteMessage.notification?.title || t.notification, remoteMessage.notification?.body || t.newMessage);
    });
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log("Background notification:", remoteMessage);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const {
          status
        } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required to show the map.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        };
        setUserLocation(coords);

        // also set pickup to current location if not already set
        setFilters(prev => ({
          ...prev,
          pickup: prev.pickup || coords
        }));
      } catch (err) {
        console.warn('Error fetching location:', err);
      }
    })();
  }, []);

  // ---------- Focus rider ----------
  const focusOnRider = useCallback((rider: any, index: number) => {
    setSelectedRiderId(rider.id);
    mapRef.current?.animateToRegion({
      latitude: rider.latitude,
      longitude: rider.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    }, 300);
    try {
      carouselRef.current?.scrollToIndex({
        index,
        animated: true
      });
    } catch {}
    Animated.spring(carouselPosition, {
      toValue: SCREEN_HEIGHT * 0.6,
      useNativeDriver: false
    }).start();
  }, [carouselPosition]);

  // ---------- Fetch place details ----------
  const fetchPlaceDetails = (place: any, type: 'pickup' | 'destination') => {
    if (!place?.location) return;
    setFilters(prev => ({
      ...prev,
      [type]: place.location
    }));
    if (type === 'pickup') {
      setPickupText(place.displayName || t.pickup);
      setPickupInput(place.displayName || '');
    } else {
      setDestinationText(place.displayName || t.destination);
      setDestinationInput(place.displayName || '');
    }
  };

  // ---------- Confirm ride ----------
  const confirmAndRequestRide = (rider: any) => {
    const est = formatAmountSync(Math.round(rider._estimatedCost || 0), natCode, ratesMap);
    Alert.alert(
      t.confirmRideTitle,
      t.confirmRideBody(rider.transportName || 'Rider', est, (rider._tripDistanceKm || 0).toFixed(2)),
      [
        {
          text: t.cancel,
          style: 'cancel'
        },
        {
          text: t.confirm,
          onPress: () => requestRide(rider)
        }
      ]
    );
  };

  // ---------- Request ride ----------
  const requestRide = async (rider: any) => {
    if (!filters.pickup || !filters.destination) {
      Alert.alert(t.pickLocations, t.pickLocationsBody);
      return;
    }
    try {
      setLoadingRiders(prev => ({ ...prev, [rider.id]: true }));
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      // Check for pending ride requests for this passenger
      const pendingRes: any = await client.graphql({
        query: listRideRequests,
        variables: {
          filter: {
            passengerEmail: { eq: attributes.email },
            rideStatus: { ne: 'Completed' }
          },
          limit: 10
        }
      });
      const pendingRides = pendingRes?.data?.listRideRequests?.items || [];
      if (pendingRides.length > 0) {
        Alert.alert(
          t.pendingRidesTitle,
          t.pendingRidesProceedBody,
          [
            {
              text: t.goToPendingRides,
              onPress: () => {
                setLoadingRiders(prev => ({ ...prev, [rider.id]: false }));
                navigation.navigate('RideTrackingScreen', { pendingRides });
              }
            },
            {
              text: t.proceed,
              onPress: async () => {
                await actuallyRequestRide(rider, attributes, user, () => setLoadingRiders(prev => ({ ...prev, [rider.id]: false })));
              }
            },
            { text: t.cancel, style: 'cancel', onPress: () => setLoadingRiders(prev => ({ ...prev, [rider.id]: false })) }
          ]
        );
        return;
      }
      await actuallyRequestRide(rider, attributes, user, () => setLoadingRiders(prev => ({ ...prev, [rider.id]: false })));
    } catch (err) {
      console.error(err);
      Alert.alert(t.error, t.errorRequestRide);
      setLoadingRiders(prev => ({ ...prev, [rider.id]: false }));
    }
  };

  // Helper to actually request ride
  const actuallyRequestRide = async (
    rider: any,
    attributes: any,
    user: any,
    loadingCallback?: () => void
  ) => {
    try {
      // Alert.alert('Debug', 'Entered actuallyRequestRide');
      const userDtls: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: attributes.email }
      });
      const passengerInfo = userDtls.data.getSMAccount;
      if (!passengerInfo) {
        Alert.alert(t.noAccountTitle, t.noAccountBody);
        if (loadingCallback) loadingCallback();
        return;
      }

      // Ensure we use authoritative TransportRegister data for the rider
      let transporter: any = null;
      try {
        const trRes: any = await client.graphql({ query: getTransportRegister, variables: { id: rider.id } });
        transporter = trRes?.data?.getTransportRegister || null;
      } catch (err) {
        console.warn('Failed to fetch transport register for rider, falling back to card data', err);
        transporter = null;
      }

      const selectedRider = transporter || rider;

      // Convert estimated cost (which is in rider currency) to KES for storage
      let sellerNationality = selectedRider?.nationality || null;
      if (!sellerNationality && selectedRider?.transportOwnerEmail) sellerNationality = await getUserNationalityByEmail(selectedRider.transportOwnerEmail);
      // normalize seller nationality to the code used in ratesMap
      const sellerNatCode = nationalityToCode(sellerNationality) || sellerNationality || undefined;
      const estimatedCostRaw = Number(rider._estimatedCost || 0);
      const estimatedCostKes = sellerNatCode ? await convertForeignToKsh(estimatedCostRaw, sellerNatCode) : estimatedCostRaw;

      const input = {
        passengerEmail: attributes.email,
        passengerName: passengerInfo.name,
        passengerContact: attributes.phone_contact,
        pickupLatitude: filters.pickup!.latitude,
        pickupLongitude: filters.pickup!.longitude,
        destinationLatitude: filters.destination!.latitude,
        destinationLongitude: filters.destination!.longitude,
        distance: rider._tripDistanceKm || 0,
        estimatedCost: estimatedCostKes,
        selectedRiderID: selectedRider.id,
        riderName: selectedRider.transportName || selectedRider.transportName,
        riderContact: selectedRider.transportkntct || selectedRider.transportkntct,
        riderRate: selectedRider.transportRate || selectedRider.transportRate || 0,
        paymentMethod,
        paymentStatus: 'NotCleared',
        rideStatus: 'transportRequestYes',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        riderLatitude: Number(selectedRider.latitude) || Number(rider.latitude) || 0,
        riderLongitude: Number(selectedRider.longitude) || Number(rider.longitude) || 0
      };
      const rideRes: any = await client.graphql({
        query: createRideRequest,
        variables: { input }
      });
      const ride = rideRes?.data?.createRideRequest;
      if (ride) {
        Alert.alert(t.rideRequestedTitle, t.rideRequestedBody(rider.transportName || 'Rider'));
        // 🔔 Trigger backend Lambda to send push notification
        const riderEmail = rider.transportOwnerEmail;
        if (!riderEmail) {
          Alert.alert(t.error, t.errorRiderEmail);
        } else {
          // Format estimated cost in user's currency for notification
          const formattedCost = formatAmountSync(ride.estimatedCost, natCode, ratesMap);
          const notifTitle = "NiSenti: New Ride Request";
          const notifBody = `Passenger ${ride.passengerName} requested a ride. Estimated cost: ${formattedCost}`;
          try {
            // Send notification
            await client.graphql({
              query: sendNotification,
              variables: {
                riderEmail: riderEmail,
                title: notifTitle,
                body: notifBody
              }
            });
            // Log message in createMessages
            await client.graphql({
              query: require('../../../src/graphql/mutations').createMessages,
              variables: {
                input: {
                  senderEmail: ride.passengerEmail,
                  messageBody: notifBody
                }
              }
            });
          } catch (notifErr) {
            Alert.alert(t.errorNotification, t.errorNotificationBody(notifErr && notifErr.message ? notifErr.message : JSON.stringify(notifErr)));
          }
        }
        // Alert.alert('Debug', 'Navigation to RideTrackingScreen about to happen.');
        if (loadingCallback) loadingCallback();
        navigation.navigate('RideTrackingScreen', { rideId: ride.id });
      } else {
        if (loadingCallback) loadingCallback();
      }
    } catch (err) {
      Alert.alert(t.error, t.errorRequestRide);
      if (loadingCallback) loadingCallback();
    }
  };
  // Keep map fitted to current polylines when they change
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [...polylineCoords, ...dropPolylineCoords];
    if (coords.length > 1) {
      try {
        (mapRef.current as any).fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 80, bottom: 240, left: 80 },
          animated: true
        });
      } catch (e) {}
    }
  }, [polylineCoords, dropPolylineCoords]);

  if (!pendingCheckDone || !userLocation) {
    return <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading…</Text>
      </View>;
  }

  return <View style={{
    flex: 1
  }}>
      {/* Map */}
      <MapView ref={mapRef} style={{
        flex: 1
      }} showsUserLocation initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }}>
        {/* Riders: custom marker showing numberPlate (if available) or price */}
        {filteredRiders.map((rider, idx) => (
          <Marker
            key={rider.id}
            coordinate={{ latitude: rider.latitude, longitude: rider.longitude }}
            onPress={() => focusOnRider(rider, idx)}
          >
            <View style={[styles.markerContainer, selectedRiderId === rider.id && styles.selectedMarker]} />
          </Marker>
        ))}

        {/* Pickup marker */}
        {filters.pickup && (
          <Marker coordinate={{ latitude: filters.pickup.latitude, longitude: filters.pickup.longitude }}>
            <View style={{ backgroundColor: '#27ae60', padding: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person-circle" size={32} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Destination marker */}
        {filters.destination && (
          <Marker coordinate={{ latitude: filters.destination.latitude, longitude: filters.destination.longitude }}>
            <View style={{ backgroundColor: '#9b59b6', padding: 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flag" size={28} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Rider -> Pickup (blue) */}
        {polylineCoords.length > 1 && (
          <Polyline coordinates={polylineCoords} strokeColor="blue" strokeWidth={4} />
        )}

        {/* Pickup -> Destination (orange) */}
        {dropPolylineCoords.length > 1 && (
          <Polyline coordinates={dropPolylineCoords} strokeColor="#e58d29" strokeWidth={4} />
        )}
      </MapView>


      {/* Filter/Search Panel (collapsible) */}
      <View style={[styles.filterPanel, filterPanelCollapsed && { height: 40, minHeight: 40, overflow: 'hidden', paddingVertical: 0, paddingBottom: 0 }]}> 
        <TouchableOpacity
          onPress={() => setFilterPanelCollapsed(c => !c)}
          style={{ position: 'absolute', top: 4, right: 8, zIndex: 10, backgroundColor: '#e58d29', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{filterPanelCollapsed ? `▼ ${t.showFilters}` : `▲ ${t.hideFilters}`}</Text>
        </TouchableOpacity>
        {!filterPanelCollapsed && (
          <>
            <GooglePlacesAutocompleteNew
              placeholder={t.pickupLocation}
              value={pickupInput}
              onValueChange={setPickupInput}
              onPlaceSelected={(place: any) => fetchPlaceDetails(place, 'pickup')}
              clearOnSelect={false}
            />
            <GooglePlacesAutocompleteNew
              placeholder={t.destination}
              value={destinationInput}
              onValueChange={setDestinationInput}
              onPlaceSelected={(place: any) => fetchPlaceDetails(place, 'destination')}
              clearOnSelect={false}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                placeholder={t.radiusKm}
                value={filters.radiusKm}
                keyboardType="numeric"
                onChangeText={t => setFilters(f => ({ ...f, radiusKm: t }))}
                style={[styles.smallInput, { width: 80, marginTop: 6 }]}
              />
              {filteringLoading && (
                <ActivityIndicator size="small" color="#e58d29" style={{ marginLeft: 8, marginTop: 6 }} />
              )}
              <TouchableOpacity onPress={fetchRiders} style={styles.refreshBtn}>
                {loadingAllRiders ? <ActivityIndicator size="small" color="#1f8ef1" style={{ marginLeft: 8, marginTop: 6 }} /> : <Text style={styles.refreshTxt}>{t.refresh}</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>


      {/* Payment Method Toggle (with collapse/expand icon) */}
      {!filterPanelCollapsed && (
        <View style={styles.paymentToggle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginLeft: 4 }}>{t.paymentMethod}</Text>
            <TouchableOpacity
              onPress={() => setFilterPanelCollapsed(true)}
              style={styles.collapseBtn}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22, color: '#fff' }}>▼</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.payBtn, paymentMethod === 'Cash' && styles.payBtnActive]} onPress={() => setPaymentMethod('Cash')}>
            <Text style={[styles.payTxt, paymentMethod === 'Cash' && styles.payTxtActive]}>
              {t.cash}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.payBtn, paymentMethod === 'NiSenti' && styles.payBtnActive]} onPress={() => setPaymentMethod('NiSenti')}>
            <Text style={[styles.payTxt, paymentMethod === 'NiSenti' && styles.payTxtActive]}>
              {t.nisenti}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating expand icon when collapsed, attached to payment method area */}
      {filterPanelCollapsed && (
        <TouchableOpacity
          onPress={() => setFilterPanelCollapsed(false)}
          style={styles.floatingExpandBtn}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 22, color: '#fff' }}>▲</Text>
        </TouchableOpacity>
      )}


      {/* Carousel */}
      <Animated.View
        style={[
          styles.carouselContainer,
          {
            top: carouselPosition,
            height: CAROUSEL_HEIGHT,
            zIndex: 100,
            borderWidth: 2,
            borderColor: '#e58d29',
            pointerEvents: 'box-none',
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.carouselHandle}>
          <View style={styles.carouselHandleBar} />
        </View>
        <FlatList
          ref={carouselRef}
          data={filteredRiders}
          horizontal
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.card, selectedRiderId === item.id && styles.cardSelected]}
              onPress={() => focusOnRider(item, index)}
              onLongPress={() => confirmAndRequestRide(item)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                {item.signedUrl ? (
                  <Image source={{ uri: item.signedUrl }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={{ color: '#fff' }}>{(item.transportType || 'TR').slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <Text style={{ fontWeight: '700' }}>{item.transportName || t.rider}</Text>
                  <Text style={{ fontSize: 12 }}>
                    {item.transportType} • {formatAmountSync(item.transportRate, natCode, ratesMap)}/{t.km}
                  </Text>
                  <Text style={{ fontSize: 12 }}>
                    {t.est}: {formatAmountSync(Math.round(item._estimatedCost || 0), natCode, ratesMap)} || {selectedRiderId === item.id && selectedRouteDistanceKm != null ? selectedRouteDistanceKm.toFixed(2) : (item._tripDistanceKm || 0).toFixed(2)} {t.km}
                  </Text>
                  {/* New button for TransportDetails */}
                  <TouchableOpacity
                    style={[styles.requestBtn, { backgroundColor: '#4CAF50', marginTop: 6 }]}
                    onPress={() => navigation.navigate('TransportDetails', { id: item.id })}
                  >
                    <Text style={{ color: '#fff' }}>{t.viewDetails}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.requestBtn} onPress={async () => {
                  // Notify transport owner of ride request intent
                  if (item.transportOwnerEmail) {
                    try {
                      await client.graphql({
                        query: sendNotification,
                        variables: {
                          riderEmail: item.transportOwnerEmail,
                          title: t.notifRequestInitiatedTitle,
                          body: t.notifRequestInitiatedBody(item.transportName || 'your vehicle'),
                        }
                      });
                    } catch (err) {
                      // Optionally log or alert
                    }
                  }
                  confirmAndRequestRide(item);
                }}>
                  {loadingRiders[item.id] ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>{t.request}</Text>}
                </TouchableOpacity>

                {/* Example: Complete, Pay, Cancel buttons with notification logic */}
                {/*
                <TouchableOpacity style={styles.requestBtn} onPress={async () => {
                  // Complete Ride
                  if (item.transportOwnerEmail) {
                    try {
                      await client.graphql({
                        query: sendNotification,
                        variables: {
                          riderEmail: item.transportOwnerEmail,
                          title: 'NiSenti: Ride Completed',
                          body: `A passenger has marked the ride as complete for ${item.transportName || 'your vehicle'}.`
                        }
                      });
                    } catch (err) {}
                  }
                  // ...complete ride logic...
                }}>
                  <Text style={{ color: '#fff' }}>Complete</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.requestBtn} onPress={async () => {
                  // Pay Ride
                  if (item.transportOwnerEmail) {
                    try {
                      await client.graphql({
                        query: sendNotification,
                        variables: {
                          riderEmail: item.transportOwnerEmail,
                          title: 'NiSenti: Ride Paid',
                          body: `A passenger has paid for the ride for ${item.transportName || 'your vehicle'}.`
                        }
                      });
                    } catch (err) {}
                  }
                  // ...pay ride logic...
                }}>
                  <Text style={{ color: '#fff' }}>Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.requestBtn} onPress={async () => {
                  // Cancel Ride
                  if (item.transportOwnerEmail) {
                    try {
                      await client.graphql({
                        query: sendNotification,
                        variables: {
                          riderEmail: item.transportOwnerEmail,
                          title: 'NiSenti: Ride Cancelled',
                          body: `A passenger has cancelled the ride for ${item.transportName || 'your vehicle'}.`
                        }
                      });
                    } catch (err) {}
                  }
                  // ...cancel ride logic...
                }}>
                  <Text style={{ color: '#fff' }}>Cancel</Text>
                </TouchableOpacity>
                */}
              </View>
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </View>;
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  carouselHandle: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  carouselHandleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 4,
  },
  filterPanel: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 6,
    zIndex: 5
  },
  collapseBtn: {
    backgroundColor: '#e58d29',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginLeft: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  floatingExpandBtn: {
    position: 'absolute',
    top: 250,
    left: 12,
    backgroundColor: '#e58d29',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  smallInput: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
    fontSize: 12
  },
  paymentToggle: {
    position: 'absolute',
    top: 250,
    left: 12,
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 4,
    borderRadius: 8,
    elevation: 6
  },
  payBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  payBtnActive: {
    backgroundColor: '#e58d29'
  },
  payTxt: {
    color: '#333'
  },
  payTxtActive: {
    color: '#fff'
  },
  carouselContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.90, // slightly less than full width for margin
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
    backgroundColor: 'white',
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 8,
    width: SCREEN_WIDTH * 0.90, // slightly less than full width for margin
    elevation: 3,
    minHeight: 120, // Increased height for better visibility
    height: 120, // Set a larger fixed height for the card
  },
  cardSelected: {
    borderColor: '#1f8ef1',
    borderWidth: 2
  },
  thumbPlaceholder: {
    width: 60,
    height: 90,
    backgroundColor: '#e58d29',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  markerContainer: {
    backgroundColor: '#293ad1',
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  selectedMarker: {
    backgroundColor: '#e58d29'
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  requestBtn: {
    backgroundColor: '#1f8ef1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8
  }
  ,
  refreshBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center'
  },
  refreshTxt: {
    color: '#1f8ef1',
    fontWeight: '700'
  }
});