import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, FlatList, Dimensions, Animated, AppState, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSMAccount, getTransportRegister, getCompany, getRideRequest, getTransportBizna } from '../../../src/graphql/queries';
import { onUpdateRideRequest } from '../../../src/graphql/subscriptions';
import { Observable } from 'zen-observable-ts';
import { updateSMAccount, updateTransportRegister, updateCompany, updateTransportBizna } from '../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, getUserNationalityByEmail, convertForeignToKsh } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { buildOsrmRouteUrl } from '../../../src/config/osrm';
import { Hub } from '@aws-amplify/core';
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
const client = generateClient();
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const ENFORCE_PICKUP_PROXIMITY_CHECK = true; // temporary toggle for testing
const MIN_PICKUP_DISTANCE = 0.1; // km (100 meters minimum)
const MIN_REAL_MOVEMENT_KM = 0.01; // km (10 meters) - ignore tiny jitter
const MIN_SAVE_DISTANCE_KM = 0.05; // km (50 meters) - save after every ~50m moved
const MAX_ACCEPTABLE_ACCURACY_M = 100; // meters - acceptable GPS accuracy for immediate saves
const SAVE_FALLBACK_INTERVAL_MS = 120_000; // 2 minutes - fallback save during poor GPS / outages
const FALLBACK_CHECK_INTERVAL_MS = 30_000; // check fallback every 30s

// Metrics persistence
const METRICS_STORAGE_KEY = 'rideMetricsBackup_v1';
const SAVE_METRICS_INTERVAL_MS = 30_000; // persist metrics to AsyncStorage every 30s

const COMPANY_ADMIN_ID = "BaruchHabaB'ShemAdonai2";

const LIST_RIDE_REQUESTS_SAFE_QUERY = /* GraphQL */ `
  query ListRideRequestsSafe($filter: ModelRideRequestFilterInput, $limit: Int, $nextToken: String) {
    listRideRequests(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        passengerEmail
        passengerName
        passengerContact
        pickupLatitude
        pickupLongitude
        destinationLatitude
        destinationLongitude
        distance
        estimatedCost
        selectedRiderID
        riderName
        riderContact
        riderRate
        paymentMethod
        paymentStatus
        rideStatus
        startTime
        endTime
        riderLatitude
        riderLongitude
        createdAt
        updatedAt
        owner
        __typename
      }
      nextToken
      __typename
    }
  }
`;

const UPDATE_RIDE_REQUEST_SAFE_MUTATION = /* GraphQL */ `
  mutation UpdateRideRequestSafe(
    $input: UpdateRideRequestInput!
    $condition: ModelRideRequestConditionInput
  ) {
    updateRideRequest(input: $input, condition: $condition) {
      id
      passengerEmail
      passengerName
      passengerContact
      pickupLatitude
      pickupLongitude
      destinationLatitude
      destinationLongitude
      distance
      estimatedCost
      selectedRiderID
      riderName
      riderContact
      riderRate
      paymentMethod
      paymentStatus
      rideStatus
      startTime
      endTime
      riderLatitude
      riderLongitude
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
// Location type with optional accuracy to align with Expo Location objects
type LocationWithAccuracy = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  coords?: { accuracy?: number | null };
};
// Removed Google Maps API Key. Using OSRM and OSM.
export default function RiderRideRequestScreen() {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = { ...translations.en, ...(translations[lang] || {}) };
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [mapLabelPoints, setMapLabelPoints] = useState<{
    rider: { x: number; y: number } | null;
    pickup: { x: number; y: number } | null;
    destination: { x: number; y: number } | null;
  }>({ rider: null, pickup: null, destination: null });
  const [userContact, setUserContact] = useState<string | null>(null);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [riderLocation, setRiderLocation] = useState<LocationWithAccuracy | null>(null);
  const [tripStarted, setTripStarted] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const { nationality, ratesMap } = useExchange();
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const natCode = nationalityToCode(safeNationality) || safeNationality || undefined;
  const carouselRef = useRef<FlatList | null>(null);
  // Triggers carousel re-render whenever distance/cost changes
  // OSRM-based distances
  // Store OSRM road distances for each ride
  const [pickupToDestRoadDistance, setPickupToDestRoadDistance] = useState<Record<string, number>>({});
  const [riderToPickupRoadDistance, setRiderToPickupRoadDistance] = useState<Record<string, number>>({});
  const [roadDistanceLoading, setRoadDistanceLoading] = useState<Record<string, boolean>>({});
  const [rideMetricsTick, setRideMetricsTick] = useState(0);
  const carouselPosition = useRef(new Animated.Value(SCREEN_HEIGHT * 0.62)).current;
  const appState = useRef(AppState.currentState);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastLocationRef = useRef<LocationWithAccuracy | null>(null);
  const lastCameraCenter = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const routeCache = useRef<Record<string, {
    pickup?: any[];
    drop?: any[];
  }>>({});
  // Persist/load route cache for faster UX
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

  // Metrics persistence helpers
  const metricsSaveIntervalRef = useRef<number | null>(null);
  const userContactRef = useRef<string | null>(null);
  const hubUnsubscribeRef = useRef<(() => void) | null>(null);
  const getMetricsKeyForUser = (email?: string) => `${METRICS_STORAGE_KEY}:${email || userContactRef.current || 'unknown'}`;

  const loadMetricsFromStorage = async (email?: string) => {
    const key = getMetricsKeyForUser(email);
    if (!userContactRef.current && !email) return;
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return;
      const obj = JSON.parse(raw);
      cumulativeDistanceRef.current = obj.distance || {};
      cumulativeCostRef.current = obj.cost || {};
      lastLocationRef.current = obj.lastLocation || null;
      lastSaveDistanceRef.current = obj.lastSavedDistance || {};
      lastSaveTimeRef.current = obj.lastSavedTime || {};
    } catch (e) {
      console.warn('Failed to load ride metrics from storage', e);
    }
  };
  const saveMetricsToStorage = async (email?: string) => {
    const key = getMetricsKeyForUser(email);
    if (!userContactRef.current && !email) return;
    try {
      const payload = {
        distance: cumulativeDistanceRef.current,
        cost: cumulativeCostRef.current,
        lastLocation: lastLocationRef.current,
        lastSavedDistance: lastSaveDistanceRef.current,
        lastSavedTime: lastSaveTimeRef.current
      };
      await AsyncStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save ride metrics to storage', e);
    }
  };

  const clearMetricsForUser = async (email?: string) => {
    const key = getMetricsKeyForUser(email);
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Failed to remove metrics for user', e);
    }
    cumulativeDistanceRef.current = {};
    cumulativeCostRef.current = {};
    backendDistanceBaseRef.current = {};
    lastLocationRef.current = null;
    lastSaveDistanceRef.current = {};
    lastSaveTimeRef.current = {};
  };

  const transportMap = useRef<Record<string, any>>({});
  const [transporterTick, setTransporterTick] = useState(0);
  const backendDistanceBaseRef = useRef<Record<string, number>>({});
  const cumulativeDistanceRef = useRef<Record<string, number>>({});
  const cumulativeCostRef = useRef<Record<string, number>>({});
  // Save bookkeeping: last saved distance and time per ride, and a flag to avoid concurrent saves
  const lastSaveDistanceRef = useRef<Record<string, number>>({});
  const lastSaveTimeRef = useRef<Record<string, number>>({});
  const saveInProgressRef = useRef<Record<string, boolean>>({});
  const routeToPickupRef = useRef<any[]>([]);
  const routeToDropRef = useRef<any[]>([]);
  const updateIntervalRef = useRef<number | null>(null);
  const [polylineTick, setPolylineTick] = useState(0);

  // Load metrics and start periodic persistence per-user; clear on sign-out
  useEffect(() => {
    if (!userContact) return;
    userContactRef.current = userContact;

    let hubListener: any = null;
    (async () => {
      await loadMetricsFromStorage(userContact);
      // Start periodic persistence
      metricsSaveIntervalRef.current = setInterval(() => {
        saveMetricsToStorage().catch(() => {});
      }, SAVE_METRICS_INTERVAL_MS) as unknown as number;
    })();

    // Save on background/inactive
    const sub = AppState.addEventListener('change', next => {
      if (next === 'background' || next === 'inactive') {
        saveMetricsToStorage().catch(() => {});
      }
      appState.current = next;
    });

    // Clear metrics when user signs out
    const authListener = (caps: any) => {
      const event = caps?.payload?.event ?? caps?.payload;
      if (event === 'signOut' || event === 'signedOut') {
        clearMetricsForUser(userContactRef.current!).catch(() => {});
      }
    };

    // Register auth listener if Hub is available
    try {
      if (typeof Hub !== 'undefined' && Hub && typeof Hub.listen === 'function') {
        const unsub = Hub.listen('auth', authListener);
        if (typeof unsub === 'function') {
          hubUnsubscribeRef.current = unsub;
        } else if (unsub && typeof (unsub as any).remove === 'function') {
          hubUnsubscribeRef.current = () => (unsub as any).remove();
        }
      } else {
        console.warn('Amplify Hub is not available; auth sign-out clearing disabled');
      }
    } catch (e) {
      console.warn('Failed to register auth Hub listener', e);
    }

    // cleanup
    return () => {
      const v = metricsSaveIntervalRef.current;
      if (v != null) {
        try { clearInterval(v); } catch (e) {}
        metricsSaveIntervalRef.current = null;
      }
      sub.remove?.();
      // also attempt one last save
      saveMetricsToStorage().catch(() => {});
      try {
        if (hubUnsubscribeRef.current) {
          try { hubUnsubscribeRef.current(); } catch (e) {}
          hubUnsubscribeRef.current = null;
        }
      } catch (e) {}
    };
  }, [userContact]);

  useEffect(() => {
    let sub: any = null;
    const init = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const email = attributes.email;
        if (email) {
          setUserContact(email);
          await fetchRides(email);
        } else {
          console.warn('No user email found');
        }

        // Subscribe to ride updates to get rider location updates in real-time
        sub = (client.graphql({ query: onUpdateRideRequest }) as unknown as Observable<any>).subscribe({
          next: ({ value }: any) => {
            const updated = value?.data?.onUpdateRideRequest;
            if (!updated) return;
            // Keep rides array in sync for this transporter's phone number
            if (updated.riderContact === attributes.phone_number) {
              setRides(prev => prev.map(r => r.id === updated.id ? updated : r));
              // If the currently selected ride has new rider coords, refetch cached routes for it
              if (selectedRideId === updated.id) {
                fetchCachedRoute(updated, { latitude: updated.riderLatitude, longitude: updated.riderLongitude }).catch(() => {});
              }
            }
          },
          error: (err: any) => console.warn('ride updates subscription error', err)
        });
      } catch (err) {
        console.error('Failed to fetch user or rides', err);
      }
    };
    init();
    return () => sub?.unsubscribe?.();
  }, []);
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  // Decode OSRM GeoJSON LineString coordinates to {latitude, longitude}
  const decodeOSRMLine = (coordinates: number[][]) => {
    return coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  };

  // Fetch route and distance from OSRM
  const fetchRouteWithDistance = async (start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) => {
    try {
      const url = buildOsrmRouteUrl(start, end, { overview: 'full', geometries: 'geojson' });
      const res = await axios.get(url);
      if (res.data.routes && res.data.routes.length > 0) {
        return {
          coords: decodeOSRMLine(res.data.routes[0].geometry.coordinates),
          distanceKm: res.data.routes[0].distance / 1000
        };
      }
    } catch (err) {
      // fallback: straight line
      return {
        coords: [start, end],
        distanceKm: getDistanceKm(start.latitude, start.longitude, end.latitude, end.longitude)
      };
    }
    return { coords: [start, end], distanceKm: getDistanceKm(start.latitude, start.longitude, end.latitude, end.longitude) };
  };
  const routeFetchTimestamps = useRef<Record<string, number>>({});
  const ROUTE_FETCH_THROTTLE_MS = 10_000;
  // Fetch route from OSRM (Open Source Routing Machine)
  const fetchRoute = useCallback(async (start: {
    latitude: number;
    longitude: number;
  }, end: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const url = buildOsrmRouteUrl(start, end, { overview: 'full', geometries: 'geojson' });
      const res = await axios.get(url);
      if (res.data.routes?.length) {
        return decodeOSRMLine(res.data.routes[0].geometry.coordinates);
      }
      return [];
    } catch (err) {
      console.error('fetchRoute error', err);
      return [];
    }
  }, []);

  //part 2
  const maybeAnimateCamera = (newLoc: any) => {
    const last = lastCameraCenter.current;
    const moved = last ? getDistanceKm(last.latitude, last.longitude, newLoc.latitude, newLoc.longitude) : Infinity;
    if (moved > 0.01 && mapRef.current) {
      try {
        (mapRef.current as any).animateCamera?.({
          center: newLoc,
          zoom: 15
        }, {
          duration: 300
        }) || (mapRef.current as any).animateToRegion?.({
          ...newLoc,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }, 300);
      } catch (e) {}
      lastCameraCenter.current = newLoc;
    }
  };
  // Fetch and update polyline and estimated cost/distance for each ride
  const fetchCachedRoute = useCallback(async (ride: any, currentLoc: any) => {
    if (!ride?.id) return;
    const now = Date.now();
    const stampKey = `${ride.id}-${ride.rideStatus}`;
    if (routeFetchTimestamps.current[stampKey] && now - routeFetchTimestamps.current[stampKey] < ROUTE_FETCH_THROTTLE_MS) return;
    routeFetchTimestamps.current[stampKey] = now;
    const cache = routeCache.current[ride.id] || {};
    const isPickup = ride.rideStatus === 'TransportApproved';
    const target = isPickup ? {
      latitude: ride.pickupLatitude,
      longitude: ride.pickupLongitude
    } : {
      latitude: ride.destinationLatitude,
      longitude: ride.destinationLongitude
    };
    const routeType = isPickup ? 'pickup' : 'drop';
    if (cache[routeType]) {
      if (routeType === 'pickup') routeToPickupRef.current = cache.pickup!;else routeToDropRef.current = cache.drop!;
      setPolylineTick(t => t + 1);
      return;
    }
    const start = currentLoc || (ride.riderLatitude && ride.riderLongitude ? { latitude: ride.riderLatitude, longitude: ride.riderLongitude } : lastCameraCenter.current || { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude });
    const { coords, distanceKm } = await fetchRouteWithDistance(start, target);
    saveRouteCache().catch(() => {});
    routeCache.current[ride.id] = {
      ...cache,
      [routeType]: coords
    };
    if (routeType === 'pickup') {
      routeToPickupRef.current = coords;
      setRiderToPickupRoadDistance(prev => ({ ...prev, [ride.id]: distanceKm }));
    } else {
      routeToDropRef.current = coords;
      setPickupToDestRoadDistance(prev => ({ ...prev, [ride.id]: distanceKm }));
    }
    setPolylineTick(t => t + 1);
    // Keep backend distance updates to active-trip save cycle only.
    const rate = Number(ride.riderRate || 0);
    const nextEstimatedCost = Math.round(rate * distanceKm);
    if (routeType === 'drop' && distanceKm && ride.estimatedCost !== nextEstimatedCost) {
      try {
        await client.graphql({
          query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
          variables: {
            input: {
              id: ride.id,
              estimatedCost: nextEstimatedCost
            }
          }
        });
      } catch (err) { /* ignore */ }
    }
  }, [fetchRouteWithDistance]);
  const startTrackingRide = useCallback(async (ride: any) => {
    if (!ride) return;
    const {
      status
    } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location permission required');
      return;
    }

    // Remove any existing location subscription
    if (locationSubscription.current) {
      try {
        locationSubscription.current.remove();
      } catch (e) {}
      locationSubscription.current = null;
    }
    locationSubscription.current = await Location.watchPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000,
      distanceInterval: 10
    }, async loc => {
      if (!ride?.id || !selectedRideId) return;
      if (ride.id !== selectedRideId) return; // track only selected ride

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const accuracy = loc.coords.accuracy;
      const newLoc: LocationWithAccuracy = {
        latitude: lat,
        longitude: lng,
        accuracy,
        coords: loc.coords
      };
      const prev = lastLocationRef.current;
      const smoothLoc: LocationWithAccuracy = prev ? {
        latitude: 0.7 * prev.latitude + 0.3 * newLoc.latitude,
        longitude: 0.7 * prev.longitude + 0.3 * newLoc.longitude,
        accuracy: newLoc.accuracy,
        coords: newLoc.coords
      } : newLoc;
      const movedKm = prev ? getDistanceKm(prev.latitude, prev.longitude, smoothLoc.latitude, smoothLoc.longitude) : Infinity;
      if (movedKm < MIN_REAL_MOVEMENT_KM) return;

      // Track live trip distance only after pickup (Active)
      const latestRide = rides.find(r => r.id === ride.id) || ride;
      const isTripActive = latestRide?.rideStatus === 'Active';
      const rate = Number(latestRide?.riderRate || ride.riderRate || 0);
      const baseDistance = backendDistanceBaseRef.current[ride.id] ?? Number(latestRide?.distance || 0);
      if (isTripActive) {
        cumulativeDistanceRef.current[ride.id] = (cumulativeDistanceRef.current[ride.id] || 0) + movedKm;
        const totalDistance = baseDistance + (cumulativeDistanceRef.current[ride.id] || 0);
        cumulativeCostRef.current[ride.id] = Math.round(totalDistance * rate);
        setRideMetricsTick(t => t + 1); // trigger carousel re-render
      }

      // Persist metrics locally immediately to reduce data loss risk
      saveMetricsToStorage().catch(() => {});


      lastLocationRef.current = smoothLoc;
      setRiderLocation(smoothLoc);

      // Try to save if we've moved enough since last save and accuracy is acceptable
      try {
        const lastSaved = lastSaveDistanceRef.current[ride.id] || 0;
        const movedSinceSave = (cumulativeDistanceRef.current[ride.id] || 0) - lastSaved;
        const accM = smoothLoc.accuracy ?? smoothLoc.coords?.accuracy ?? 9999;
        if (isTripActive && movedSinceSave >= MIN_SAVE_DISTANCE_KM && accM <= MAX_ACCEPTABLE_ACCURACY_M) {
          if (!saveInProgressRef.current[ride.id]) {
            saveInProgressRef.current[ride.id] = true;
            try {
              const totalDistance = baseDistance + (cumulativeDistanceRef.current[ride.id] || 0);
              const totalEstimatedCost = Math.round(totalDistance * rate);
              await client.graphql({
                query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
                variables: {
                  input: {
                    id: ride.id,
                    riderLatitude: smoothLoc.latitude,
                    riderLongitude: smoothLoc.longitude,
                    distance: totalDistance,
                    estimatedCost: totalEstimatedCost
                  }
                }
              });
              lastSaveDistanceRef.current[ride.id] = cumulativeDistanceRef.current[ride.id] || 0;
              lastSaveTimeRef.current[ride.id] = Date.now();
              console.log(`Auto-saved ride ${ride.id} after ${Math.round(movedSinceSave * 1000)} m`);
            } catch (err) {
              console.error('Auto-save error', err);
            } finally {
              saveInProgressRef.current[ride.id] = false;
            }
          }
        }
      } catch (err) {
        console.warn('Auto-save check failed', err);
      }

      try {
        await fetchCachedRoute(ride, smoothLoc);
      } catch (err) {}
      maybeAnimateCamera(smoothLoc);
    });

    // Clear any existing update interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Fallback periodic checker: flush if we haven't saved recently (handles GPS outages / tall buildings)
    updateIntervalRef.current = setInterval(async () => {
      if (!ride.id || !lastLocationRef.current) return;
      const now = Date.now();
      const lastSavedTime = lastSaveTimeRef.current[ride.id] || 0;
      const timeSinceLastSave = now - lastSavedTime;
      const latestRide = rides.find(r => r.id === ride.id) || ride;
      const isTripActive = latestRide?.rideStatus === 'Active';
      const rate = Number(latestRide?.riderRate || ride.riderRate || 0);
      const baseDistance = backendDistanceBaseRef.current[ride.id] ?? Number(latestRide?.distance || 0);
      if (isTripActive && timeSinceLastSave >= SAVE_FALLBACK_INTERVAL_MS) {
        if (!saveInProgressRef.current[ride.id]) {
          saveInProgressRef.current[ride.id] = true;
          try {
            const totalDistance = baseDistance + (cumulativeDistanceRef.current[ride.id] || 0);
            const totalEstimatedCost = Math.round(totalDistance * rate);
            await client.graphql({
              query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
              variables: {
                input: {
                  id: ride.id,
                  riderLatitude: lastLocationRef.current.latitude,
                  riderLongitude: lastLocationRef.current.longitude,
                  distance: totalDistance,
                  estimatedCost: totalEstimatedCost
                }
              }
            });
            lastSaveDistanceRef.current[ride.id] = cumulativeDistanceRef.current[ride.id] || 0;
            lastSaveTimeRef.current[ride.id] = now;
            console.log(`Fallback auto-saved ride ${ride.id} after ${Math.round((cumulativeDistanceRef.current[ride.id] || 0) * 1000)} m`);
          } catch (err) {
            console.error('Fallback auto-save error', err);
          } finally {
            saveInProgressRef.current[ride.id] = false;
          }
        }
      }
    }, FALLBACK_CHECK_INTERVAL_MS) as unknown as number;
  }, [tripStarted, rides, fetchCachedRoute, maybeAnimateCamera]);
  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      try {
        locationSubscription.current.remove();
      } catch (e) {}
      locationSubscription.current = null;
    }
    {
      const v = updateIntervalRef.current;
      if (v != null) {
        try { clearInterval(v); } catch (e) {}
        updateIntervalRef.current = null;
      }
    }
    {
      const v2 = metricsSaveIntervalRef.current;
      if (v2 != null) {
        try { clearInterval(v2); } catch (e) {}
        metricsSaveIntervalRef.current = null;
      }
    }
    // Ensure metrics are persisted when tracking stops
    saveMetricsToStorage().catch(() => {});
  }, []);
  const fetchRides = useCallback(async (transportOwnerEmail: string) => {
    setLoading(true);
    const user = await fetchUserAttributes();
    try {
      const res: any = await client.graphql({
        query: LIST_RIDE_REQUESTS_SAFE_QUERY,
        variables: {
          filter: {
            or: [
              { rideStatus: { eq: 'transportRequestYes' } },
              { rideStatus: { eq: 'TransportApproved' } },
              { rideStatus: { eq: 'TransportEngaged' } },
              { rideStatus: { eq: 'Active' } },
              { and: [
                { rideStatus: { eq: 'Completed' } },
                { paymentStatus: { ne: 'Cleared' } }
              ]}
            ],
            riderContact: { eq: user.phone_number }
          }
        }
      });
      // Filter out cancelled rides in code
      const items = (res?.data?.listRideRequests?.items || []).filter((r: any) => r.rideStatus !== 'Cancelled');
      setRides(items);
    } catch (err) {
      console.error('fetchRides error:', err);
      Alert.alert('Error', 'Failed to fetch ride requests.');
    } finally {
      setLoading(false);
    }
  }, []);
  const processMiFedhaPayment = useCallback(async (ride: any): Promise<boolean> => {
    if (!ride || !ride.id) return false;
    try {
      const totalFare = Number(cumulativeCostRef.current[ride.id] ?? ride.estimatedCost ?? 0);
      if (totalFare <= 0) {
        Alert.alert('Payment', 'No fare to charge.');
        return false;
      }
      // --- OSRM road distance for final trip ---
      let osrmDistance = 0;
      const pickup = { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude };
      const lastLoc = lastLocationRef.current;
      if (pickup && lastLoc && lastLoc.latitude && lastLoc.longitude) {
        try {
          const url = buildOsrmRouteUrl(pickup, lastLoc, { overview: 'false' });
          const res = await axios.get(url);
          if (res.data.routes && res.data.routes.length > 0) {
            osrmDistance = res.data.routes[0].distance / 1000;
          }
        } catch (err) {
          osrmDistance = 0;
        }
      }
      const passengerEmail = ride.passengerEmail;

      // Get passenger SMAccount
      const smRes: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: passengerEmail
        }
      });
      const sm = smRes?.data?.getSMAccount;
      if (!sm) {
        Alert.alert('Payment error', 'Passenger account not found.');
        return false;
      }
      const passengerBalance = Number(sm.balance ?? 0);
      const transporterRes: any = await client.graphql({
        query: getTransportRegister,
        variables: {
          id: ride.selectedRiderID
        }
      });
      const transporter = transporterRes?.data?.getTransportRegister;
      // determine transporter nationality and convert fare to KES for ledger ops
      let transporterNationality = transporter?.nationality || null;
      if (!transporterNationality && transporter?.transportOwnerEmail) transporterNationality = await getUserNationalityByEmail(transporter.transportOwnerEmail);
      const transporterNatCode = nationalityToCode(transporterNationality) || transporterNationality || undefined;
      const totalFareKes = transporterNatCode ? await convertForeignToKsh(totalFare, transporterNatCode) : totalFare;
      if (passengerBalance < totalFareKes) {
        const finalDistance = (backendDistanceBaseRef.current[ride.id] ?? Number(ride.distance || 0)) + (cumulativeDistanceRef.current[ride.id] || 0);
        // Payment pending → mark overdue
        await client.graphql({
          query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
          variables: {
            input: {
              id: ride.id,
              rideStatus: 'Completed',
              paymentStatus: 'Pending',
              endTime: new Date().toISOString(),
              estimatedCost: totalFare,
              distance: finalDistance || osrmDistance || Number(ride.distance || 0)
            }
          }
        });
        if (transporter) {
          await client.graphql({
            query: updateTransportRegister,
            variables: {
              input: {
                id: transporter.id,
                overdue: true
              }
            }
          });
        }
        Alert.alert('Insufficient funds', 'Passenger NiSenti balance insufficient. Marked as pending.');
        if (userContact) fetchRides(userContact);
        return true; // Overdue
      }

      // Payment succeeds
      const companyRes: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: COMPANY_ADMIN_ID
        }
      });
      const company = companyRes?.data?.getCompany;
      const companySharePct = Number(company?.transportCompanyShare ?? 0) / 100;
      const companyShare = totalFareKes * companySharePct;
      const transporterShare = totalFareKes - companyShare;

      // If the ride belongs to a company transporter, split transporter share between TransportRegister and TransportBizna.
      let transportRegisterShare = transporterShare;
      let transportBiznaShare = 0;
      let transportBizna: any = null;
      const rideOwnershipType = transporter?.ownerShipType;
      const rideTransportOwnerAc = transporter?.transportOwnerAc;
      if (rideOwnershipType === 'Company' && rideTransportOwnerAc) {
        try {
          const biznaRes: any = await client.graphql({
            query: getTransportBizna,
            variables: { BizAc: rideTransportOwnerAc }
          });
          transportBizna = biznaRes?.data?.getTransportBizna || null;
          if (transportBizna) {
            const rate = Math.max(0, Math.min(100, Number(transportBizna.shareRates ?? 0)));
            transportRegisterShare = Number((transporterShare * (rate / 100)).toFixed(2));
            transportBiznaShare = Number((transporterShare - transportRegisterShare).toFixed(2));
          }
        } catch (e) {
          console.warn('Failed to load TransportBizna for earnings split; falling back to TransportRegister only', e);
        }
      }

      // Deduct passenger balance (use KES)
      await client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: passengerEmail,
            balance: passengerBalance - totalFareKes
          }
        }
      });

      // Update transporter earnings
      if (transporter) {
        const newEarnings = Number(transporter.Earnings ?? 0) + transportRegisterShare;
        await client.graphql({
          query: updateTransportRegister,
          variables: {
            input: {
              id: transporter.id,
              Earnings: newEarnings,
              lastForwardedTime: new Date().toISOString(),
              overdue: false
            }
          }
        });
      }

      // Update TransportBizna earnings only for company-owned rides.
      if (transportBizna && transportBiznaShare > 0) {
        const newBiznaEarnings = Number(transportBizna.Earnings ?? 0) + transportBiznaShare;
        await client.graphql({
          query: updateTransportBizna,
          variables: {
            input: {
              BizAc: transportBizna.BizAc,
              Earnings: Number(newBiznaEarnings.toFixed(2))
            }
          }
        });
      }

      // Update company earnings
      if (company) {
        const companyEarning = Number(company.companyEarning ?? 0) + companyShare;
        const companyEarningBal = Number(company.companyEarningBal ?? 0) + companyShare;
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: COMPANY_ADMIN_ID,
              companyEarning,
              companyEarningBal
            }
          }
        });
      }

      // Mark ride completed & paid
      const finalDistance = (backendDistanceBaseRef.current[ride.id] ?? Number(ride.distance || 0)) + (cumulativeDistanceRef.current[ride.id] || 0);
      await client.graphql({
        query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
        variables: {
          input: {
            id: ride.id,
            rideStatus: 'Completed',
            paymentStatus: 'Cleared',
            endTime: new Date().toISOString(),
            estimatedCost: totalFare,
            distance: finalDistance || osrmDistance || Number(ride.distance || 0)
          }
        }
      });

      // Reset local tracking
      backendDistanceBaseRef.current[ride.id] = 0;
      cumulativeCostRef.current[ride.id] = 0;
      cumulativeDistanceRef.current[ride.id] = 0;
      lastLocationRef.current = null;
      stopTracking();
      setTripStarted(false);
      Alert.alert('Payment successful', `Charged ${formatAmountSync(totalFare, natCode, ratesMap || {})} from ${passengerEmail}.`);
      if (userContact) fetchRides(userContact);
      return false; // Not overdue
    } catch (err) {
      Alert.alert('Payment error', 'Could not complete NiSenti payment.');
      return false;
    }
  }, [fetchRides, stopTracking, userContact]);

  // Manual clear (cash): forwards company share from transporter account and marks ride completed
  const manualClearPayment = useCallback(async (ride: any): Promise<boolean> => {
    if (!ride || !ride.id) return false;
    try {
      const totalFare = Number(cumulativeCostRef.current[ride.id] ?? ride.estimatedCost ?? 0);
      if (totalFare <= 0) {
        Alert.alert('No fare', 'No fare recorded to clear.');
        return false;
      }
      // --- OSRM road distance for final trip ---
      let osrmDistance = 0;
      const pickup = { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude };
      const lastLoc = lastLocationRef.current;
      if (pickup && lastLoc && lastLoc.latitude && lastLoc.longitude) {
        try {
          const url = buildOsrmRouteUrl(pickup, lastLoc, { overview: 'false' });
          const res = await axios.get(url);
          if (res.data.routes && res.data.routes.length > 0) {
            osrmDistance = res.data.routes[0].distance / 1000;
          }
        } catch (err) {
          osrmDistance = 0;
        }
      }
      const transporterRes: any = await client.graphql({
        query: getTransportRegister,
        variables: {
          id: ride.selectedRiderID
        }
      });
      const transporter = transporterRes?.data?.getTransportRegister;
      if (!transporter) return false;
      const companyRes: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: COMPANY_ADMIN_ID
        }
      });
      const company = companyRes?.data?.getCompany;
      const companySharePct = Number(company?.transportCompanyShare ?? 0) / 100;
      // manual clear: compute KES equivalents
      let manualTransporterNationality = transporter?.nationality || null;
      if (!manualTransporterNationality && transporter?.transportOwnerEmail) manualTransporterNationality = await getUserNationalityByEmail(transporter.transportOwnerEmail);
      const manualTransporterNatCode = nationalityToCode(manualTransporterNationality) || manualTransporterNationality || undefined;
      const totalFareKesManual = manualTransporterNatCode ? await convertForeignToKsh(totalFare, manualTransporterNatCode) : totalFare;
      const companyShare = totalFareKesManual * companySharePct;
      const transporterShare = totalFareKesManual - companyShare;

      // If the ride belongs to a company transporter, split transporter share between TransportRegister and TransportBizna.
      let transportRegisterShare = transporterShare;
      let transportBiznaShare = 0;
      let transportBizna: any = null;
      const rideOwnershipType = transporter?.ownerShipType;
      const rideTransportOwnerAc = transporter?.transportOwnerAc;
      if (rideOwnershipType === 'Company' && rideTransportOwnerAc) {
        try {
          const biznaRes: any = await client.graphql({
            query: getTransportBizna,
            variables: { BizAc: rideTransportOwnerAc }
          });
          transportBizna = biznaRes?.data?.getTransportBizna || null;
          if (transportBizna) {
            const rate = Math.max(0, Math.min(100, Number(transportBizna.shareRates ?? 0)));
            transportRegisterShare = Number((transporterShare * (rate / 100)).toFixed(2));
            transportBiznaShare = Number((transporterShare - transportRegisterShare).toFixed(2));
          }
        } catch (e) {
          console.warn('Failed to load TransportBizna for earnings split; falling back to TransportRegister only', e);
        }
      }

      // Deduct company share from transporter SMAccount
      const transporterEmail = transporter.transportOwnerEmail; // authenticated user
      const smRes: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: transporterEmail
        }
      });
      const smAccount = smRes?.data?.getSMAccount;
      const transporterBalance = Number(smAccount?.balance ?? 0);
      if (transporterBalance < companyShare) {
        // Not enough to forward → mark overdue
        await client.graphql({
          query: updateTransportRegister,
          variables: {
            input: {
              id: transporter.id,
              overdue: true
            }
          }
        });
        Alert.alert('Insufficient funds', 'You do not have enough balance to forward company share.');
        return true; // Overdue
      }

      // Deduct company share (KES)
      await client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: transporterEmail,
            balance: transporterBalance - companyShare
          }
        }
      });

      // Update transporter earnings (KES)
      const newEarnings = Number(transporter.Earnings ?? 0) + transportRegisterShare;
      await client.graphql({
        query: updateTransportRegister,
        variables: {
          input: {
            id: transporter.id,
            Earnings: newEarnings,
            lastForwardedTime: new Date().toISOString(),
            overdue: false
          }
        }
      });

      // Update TransportBizna earnings only for company-owned rides.
      if (transportBizna && transportBiznaShare > 0) {
        const newBiznaEarnings = Number(transportBizna.Earnings ?? 0) + transportBiznaShare;
        await client.graphql({
          query: updateTransportBizna,
          variables: {
            input: {
              BizAc: transportBizna.BizAc,
              Earnings: Number(newBiznaEarnings.toFixed(2))
            }
          }
        });
      }

      // Update company earnings
      if (company) {
        const companyEarning = Number(company.companyEarning ?? 0) + companyShare;
        const companyEarningBal = Number(company.companyEarningBal ?? 0) + companyShare;
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: COMPANY_ADMIN_ID,
              companyEarning,
              companyEarningBal
            }
          }
        });
      }

      // Mark ride completed & paid
      const finalDistance = (backendDistanceBaseRef.current[ride.id] ?? Number(ride.distance || 0)) + (cumulativeDistanceRef.current[ride.id] || 0);
      await client.graphql({
        query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
        variables: {
          input: {
            id: ride.id,
            rideStatus: 'Completed',
            paymentStatus: 'Cleared',
            endTime: new Date().toISOString(),
            estimatedCost: totalFare,
            distance: finalDistance || osrmDistance || Number(ride.distance || 0)
          }
        }
      });

      // Reset local tracking
      backendDistanceBaseRef.current[ride.id] = 0;
      cumulativeCostRef.current[ride.id] = 0;
      cumulativeDistanceRef.current[ride.id] = 0;
      lastLocationRef.current = null;
      // Persist reset metrics
      await saveMetricsToStorage();
      stopTracking();
      setTripStarted(false);
      Alert.alert('Payment cleared', 'Company share forwarded successfully.');
      if (userContact) fetchRides(userContact);
      return false; // Not overdue
    } catch (err) {
      console.error('manualClearPayment error', err);
      Alert.alert('Error', 'Could not clear payment.');
      return false;
    }
  }, [fetchRides, stopTracking, userContact]);
  const focusOnRide = useCallback(async (ride: any, index: number) => {
    if (!ride) return;

    // 1️⃣ Select ride and initialize cumulative metrics
    setSelectedRideId(ride.id);
    if (ride.rideStatus === 'Active') {
      backendDistanceBaseRef.current[ride.id] = Number(ride.distance || 0);
      if (!cumulativeDistanceRef.current[ride.id]) cumulativeDistanceRef.current[ride.id] = 0;
      if (!cumulativeCostRef.current[ride.id]) cumulativeCostRef.current[ride.id] = Number(ride.estimatedCost || 0);
    } else {
      backendDistanceBaseRef.current[ride.id] = 0;
      cumulativeDistanceRef.current[ride.id] = 0;
      cumulativeCostRef.current[ride.id] = 0;
    }
    setTripStarted(ride.rideStatus === 'Active');

    // Initialize last-save markers so distance-since-save is computed from a sensible baseline
    lastSaveDistanceRef.current[ride.id] = cumulativeDistanceRef.current[ride.id] || 0;
    lastSaveTimeRef.current[ride.id] = Date.now();
    if (!lastLocationRef.current && ride.riderLatitude && ride.riderLongitude) {
      lastLocationRef.current = { latitude: ride.riderLatitude, longitude: ride.riderLongitude };
    }

    // 2️⃣ Get current location immediately
    let currentLoc = riderLocation;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      currentLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };
      lastLocationRef.current = currentLoc;
      setRiderLocation(currentLoc);

      // Push immediate location to backend
      await client.graphql({
        query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
        variables: {
          input: {
            id: ride.id,
            riderLatitude: currentLoc.latitude,
            riderLongitude: currentLoc.longitude
          }
        }
      });
      console.log(`Immediate rider location update for ride ${ride.id}`);
    } catch (err) {
      console.error('Immediate location fetch/update failed', err);
      // fallback
      currentLoc = riderLocation || {
        latitude: ride.pickupLatitude,
        longitude: ride.pickupLongitude
      };
    }

    // 3️⃣ Center map on current location
    if (mapRef.current) {
      maybeAnimateCamera(currentLoc);
    }

    // 4️⃣ Scroll carousel to the selected ride
    try {
      carouselRef.current?.scrollToIndex({
        index,
        animated: true
      });
    } catch (e) {
      console.warn('Carousel scroll failed:', e);
    }

    // 5️⃣ Expand the carousel panel
    Animated.spring(carouselPosition, {
      toValue: SCREEN_HEIGHT * 0.62,
      useNativeDriver: false
    }).start();

    // 6️⃣ Fetch routes: rider->pickup and pickup->destination (or rider->destination when Active)
    try {
      const pickupTarget = { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude };
      const dropTarget = { latitude: ride.destinationLatitude, longitude: ride.destinationLongitude };
      const riderLocForPickup = riderLocation || currentLoc;
      const pickupPromise = (ride.pickupLatitude && ride.pickupLongitude && riderLocForPickup) ? fetchRoute(riderLocForPickup, pickupTarget) : Promise.resolve([]);
      const dropPromise = (ride.pickupLatitude && ride.pickupLongitude && ride.destinationLatitude && ride.destinationLongitude) ? (ride.rideStatus === 'Active' ? fetchRoute(riderLocForPickup || pickupTarget, dropTarget) : fetchRoute(pickupTarget, dropTarget)) : Promise.resolve([]);
      const [pickupRoute, dropRoute] = await Promise.all([pickupPromise, dropPromise]);
      routeCache.current[ride.id] = {
        ...(routeCache.current[ride.id] || {}),
        pickup: pickupRoute || [],
        drop: dropRoute || []
      };
      saveRouteCache().catch(() => {});
      routeToPickupRef.current = pickupRoute || [];
      routeToDropRef.current = dropRoute || [];
      setPolylineTick(t => t + 1);

      // Fetch transporter info (numberPlate) and cache it
      if (ride.selectedRiderID && !transportMap.current[ride.selectedRiderID]) {
        try {
          const tRes: any = await client.graphql({ query: getTransportRegister, variables: { id: ride.selectedRiderID } });
          const transporter = tRes?.data?.getTransportRegister;
          if (transporter) {
            transportMap.current[ride.selectedRiderID] = transporter;
            setTransporterTick(tick => tick + 1);
          }
        } catch (err) {
          console.warn('Failed to fetch transporter info', err);
        }
      }

    } catch (err) {
      console.warn('Immediate route fetch failed:', err);
    }
  }, [fetchRides, stopTracking, userContact]);
  const updateStatus = useCallback(async (status: string) => {
    if (!selectedRideId) return;
    const ride = rides.find(r => r.id === selectedRideId);
    if (!ride) return;

    // Check distance before starting trip
    if (ENFORCE_PICKUP_PROXIMITY_CHECK && status === 'Active' && riderLocation) {
      const distanceToPickup = getDistanceKm(riderLocation.latitude, riderLocation.longitude, ride.pickupLatitude, ride.pickupLongitude);
      // If location accuracy is available, increase required distance to account for inaccuracy
      const accuracyM = (riderLocation.accuracy || (riderLocation as any).coords?.accuracy) ?? 0;
      const requiredKm = Math.max(MIN_PICKUP_DISTANCE, (accuracyM ? (accuracyM * 1.5) / 1000 : 0));
      if (distanceToPickup > requiredKm) {
        const distanceM = Math.round(distanceToPickup * 1000);
        const reqM = Math.round(requiredKm * 1000);
        // Show meters in the message to be clearer to driver
        Alert.alert('Too far from pickup', `You are ${distanceM} m away from the pickup point. Move closer to within ${reqM} m to start the trip.`);
        return;
      }
    }
    try {
      if (status === 'Completed') {
        // Fetch fresh ride to avoid stale data
        const rideRes: any = await client.graphql({
          query: getRideRequest,
          variables: {
            id: selectedRideId
          }
        });
        const freshRide = rideRes?.data?.getRideRequest ?? ride;

        // Update ride status first
        await client.graphql({
          query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
          variables: {
            input: {
              id: selectedRideId,
              rideStatus: 'Completed',
              endTime: new Date().toISOString()
            }
          }
        });

        // Handle payment depending on method
        if (freshRide.paymentMethod === 'MiFedha') {
          // Passenger pays via MiFedha
          await processMiFedhaPayment(freshRide);
        } else {
          // Cash collected: only forward company share
          await manualClearPayment(freshRide);
        }

        // Refresh ride list
        if (userContact) fetchRides(userContact);

        // Stop local tracking
        stopTracking();
        setTripStarted(false);
        return;
      }

      // Other status updates (Active, Cancelled, etc.)
      await client.graphql({
        query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
        variables: {
          input: {
            id: selectedRideId,
            rideStatus: status
          }
        }
      });
      if (status === 'Active') {
        await client.graphql({
          query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
          variables: {
            input: {
              id: selectedRideId,
              distance: 0,
              estimatedCost: 0
            }
          }
        });
        backendDistanceBaseRef.current[selectedRideId] = 0;
        cumulativeDistanceRef.current[selectedRideId] = 0;
        cumulativeCostRef.current[selectedRideId] = 0;
        lastSaveDistanceRef.current[selectedRideId] = 0;
        lastSaveTimeRef.current[selectedRideId] = Date.now();
        setTripStarted(true);
        setRideMetricsTick(t => t + 1);
        saveMetricsToStorage().catch(() => {});
      }
      if (status === 'Cancelled') {
        setTripStarted(false);
        routeToPickupRef.current = [];
        routeToDropRef.current = [];
        setPolylineTick(t => t + 1);
        stopTracking();
      }
      if (userContact) fetchRides(userContact);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update status.');
    }
  }, [selectedRideId, riderLocation, rides, userContact, fetchRides, processMiFedhaPayment, manualClearPayment, stopTracking]);
  const respondToRequest = useCallback(async (rideId: string, accept: boolean) => {
    try {
      const rideRes: any = await client.graphql({
        query: getRideRequest,
        variables: {
          id: rideId
        }
      });
      const ride = rideRes?.data?.getRideRequest;
      if (!ride) {
        Alert.alert('Error', 'Ride not found.');
        return;
      }
      const newStatus = accept ? 'TransportApproved' : 'Cancelled';
      await client.graphql({
        query: UPDATE_RIDE_REQUEST_SAFE_MUTATION,
        variables: {
          input: {
            id: rideId,
            rideStatus: newStatus,
            selectedRiderID: accept ? ride.selectedRiderID : null
          }
        }
      });
      Alert.alert('Success', accept ? 'Ride accepted.' : 'Ride rejected.');
      if (userContact) fetchRides(userContact);
    } catch (err) {
      console.error('respondToRequest error', err);
      Alert.alert('Error', 'Failed to respond to ride request.');
    }
  }, [userContact, fetchRides]);

  //part 3

  const rideMarkers = useMemo(() => {
    return rides.map((ride, idx) => {
      const isSelected = selectedRideId === ride.id;
      const pickupDotStyle = isSelected ? styles.selectedPickupMarkerDot : styles.pickupMarkerDot;
      const dropDotStyle = isSelected ? styles.selectedDestinationMarkerDot : styles.destinationMarkerDot;
      const riderDotStyle = isSelected ? styles.selectedRiderMarkerDot : styles.riderMarkerDot;

      const pickupMarker = <Marker key={ride.id + '-pickup'} coordinate={{ latitude: ride.pickupLatitude, longitude: ride.pickupLongitude }} onPress={() => focusOnRide(ride, idx)}>
        <View style={[styles.mapMarkerDot, pickupDotStyle]} />
      </Marker>;

      const dropMarker = (ride.destinationLatitude && ride.destinationLongitude) ? <Marker key={ride.id + '-drop'} coordinate={{ latitude: ride.destinationLatitude, longitude: ride.destinationLongitude }} onPress={() => focusOnRide(ride, idx)}>
        <View style={[styles.mapMarkerDot, dropDotStyle]} />
      </Marker> : null;

      const riderMarker = (ride.riderLatitude && ride.riderLongitude) ? <Marker key={ride.id + '-rider'} coordinate={{ latitude: ride.riderLatitude, longitude: ride.riderLongitude }} onPress={() => focusOnRide(ride, idx)}>
        <View style={[styles.mapMarkerDot, riderDotStyle]} />
      </Marker> : null;

      return (
        <React.Fragment key={ride.id}>
          {pickupMarker}
          {dropMarker}
          {riderMarker}
        </React.Fragment>
      );
    });
  }, [rides, selectedRideId, riderLocation, tripStarted]);
  const activeRide = useMemo(() => rides.find(r => r.id === selectedRideId), [rides, selectedRideId]);
  const refreshMapLabelPoints = useCallback(async () => {
    const map = mapRef.current as any;
    if (!map || !activeRide) return;
    try {
      const [riderPt, pickupPt, destPt] = await Promise.all([
        activeRide?.riderLatitude && activeRide?.riderLongitude
          ? map.pointForCoordinate({ latitude: activeRide.riderLatitude, longitude: activeRide.riderLongitude })
          : Promise.resolve(null),
        activeRide?.pickupLatitude && activeRide?.pickupLongitude
          ? map.pointForCoordinate({ latitude: activeRide.pickupLatitude, longitude: activeRide.pickupLongitude })
          : Promise.resolve(null),
        activeRide?.destinationLatitude && activeRide?.destinationLongitude
          ? map.pointForCoordinate({ latitude: activeRide.destinationLatitude, longitude: activeRide.destinationLongitude })
          : Promise.resolve(null),
      ]);
      setMapLabelPoints({
        rider: riderPt || null,
        pickup: pickupPt || null,
        destination: destPt || null,
      });
    } catch {
      // Ignore mapping failures and retry on the next region change.
    }
  }, [activeRide]);

  useEffect(() => {
    refreshMapLabelPoints();
  }, [refreshMapLabelPoints, selectedRideId, rides, cardsCollapsed, transporterTick]);
  const pickupPolyline = useMemo(() => {
    if (!activeRide) return null;
    // Show rider -> pickup when ride has not started (any status except Active)
    if (activeRide.rideStatus !== 'Active' && routeToPickupRef.current.length) {
      return <Polyline coordinates={routeToPickupRef.current} strokeColor="blue" strokeWidth={4} />;
    }
    return null;
  }, [polylineTick, selectedRideId, rides]);
  const dropPolyline = useMemo(() => {
    if (!activeRide) return null;
    // Show pickup->destination before trip starts, and rider->destination during trip
    if (routeToDropRef.current.length) {
      return <Polyline coordinates={routeToDropRef.current} strokeColor="#e58d29" strokeWidth={4} />;
    }
    return null;
  }, [polylineTick, selectedRideId, rides]);
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 50
  });
  const onViewableItemsChanged = useRef(({
    viewableItems
  }: {
    viewableItems: any[];
  }) => {
    if (!viewableItems || !viewableItems.length) return;
    const first = viewableItems[0];
    if (!first) return;
    const item = first.item;
    const index = first.index;
    if (!item) return;
    focusOnRide(item, index).catch(() => {});
  }).current;
  if (loading) return <ActivityIndicator size="large" style={{
    flex: 1
  }} />;
  if (!rides.length) {
    return <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
        <Text>{t.noRides}</Text>
      </View>;
  }
  return <View style={{
    flex: 1
  }}>
      <MapView ref={mapRef} style={{ flex: 1 }}
        showsUserLocation
        onMapReady={refreshMapLabelPoints}
        onRegionChangeComplete={reg => {
          lastCameraCenter.current = {
            latitude: reg.latitude,
            longitude: reg.longitude
          };
          refreshMapLabelPoints();
        }}
        initialRegion={{
          latitude: rides[0]?.pickupLatitude || 0,
          longitude: rides[0]?.pickupLongitude || 0,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }}>
        <UrlTile
          urlTemplate="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=IXsiA7phXPF3BeMY5KKp"
          maximumZ={19}
          flipY={false}
        />
        {rideMarkers}
        {pickupPolyline}
        {dropPolyline}
      </MapView>

      <View style={styles.mapTextOverlay} pointerEvents="none">
        {mapLabelPoints.rider && activeRide?.riderLatitude && activeRide?.riderLongitude && (
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
              {t.riderMarker}: {transportMap.current[activeRide.selectedRiderID]?.numberPlate || t.riderMarker}
            </Text>
          </>
        )}

        {mapLabelPoints.pickup && activeRide?.pickupLatitude && activeRide?.pickupLongitude && (
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
                  transform: [{ translateX: -45 }],
                },
              ]}
              numberOfLines={1}
            >
              {t.pickupMarker}
            </Text>
          </>
        )}

        {mapLabelPoints.destination && activeRide?.destinationLatitude && activeRide?.destinationLongitude && (
          <>
            <View
              style={[
                styles.mapConnectorLine,
                styles.destinationConnectorLine,
                {
                  left: mapLabelPoints.destination.x - 1,
                  top: mapLabelPoints.destination.y - 16,
                },
              ]}
            />
            <Text
              style={[
                styles.mapTextChip,
                styles.destinationTextChip,
                {
                  left: mapLabelPoints.destination.x,
                  top: mapLabelPoints.destination.y - 34,
                  transform: [{ translateX: -58 }],
                },
              ]}
              numberOfLines={1}
            >
              {t.destinationMarker}
            </Text>
          </>
        )}
      </View>

      {/* Action toolbar for selected ride (placed above the carousel) */}
      <View style={[styles.actionBar, { bottom: cardsCollapsed ? 72 : SCREEN_HEIGHT * 0.18 + 12 }]} pointerEvents={loading ? 'none' : 'auto'}>
        {activeRide ? (
          <>
            {activeRide.rideStatus === 'transportRequestYes' && (
              <>
                <TouchableOpacity onPress={() => respondToRequest(activeRide.id, true)} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>{t.accept}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => respondToRequest(activeRide.id, false)} style={[styles.actionButton, { backgroundColor: '#bbb' }]}>
                  <Text style={styles.actionButtonText}>{t.cancel}</Text>
                </TouchableOpacity>
              </>
            )}
            {activeRide.rideStatus === 'TransportApproved' && (
              <TouchableOpacity onPress={() => updateStatus('Active')} style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}>
                <Text style={styles.actionButtonText}>{t.startTrip}</Text>
              </TouchableOpacity>
            )}
            {(activeRide.rideStatus === 'Active' || activeRide.rideStatus === 'TransportEngaged') && (
              <TouchableOpacity onPress={() => updateStatus('Completed')} style={[styles.actionButton, { backgroundColor: 'blue' }]}>
                <Text style={styles.actionButtonText}>{t.completeTrip}</Text>
              </TouchableOpacity>
            )}
            {activeRide.rideStatus === 'Completed' && activeRide.paymentStatus !== 'Paid' && (
              activeRide.paymentMethod === 'MiFedha' ? (
                <TouchableOpacity onPress={() => processMiFedhaPayment(activeRide)} style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}>
                  <Text style={styles.actionButtonText}>{t.chargeNiSenti}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => manualClearPayment(activeRide)} style={[styles.actionButton, { backgroundColor: '#f39c12' }]}>
                  <Text style={styles.actionButtonText}>{t.forward}</Text>
                </TouchableOpacity>
              )
            )}
          </>
        ) : null}
      </View>

      {cardsCollapsed && (
        <TouchableOpacity
          style={styles.floatingShowCardsBtn}
          onPress={() => setCardsCollapsed(false)}
          activeOpacity={0.9}
        >
          <Text style={styles.floatingShowCardsText}>{t.viewRideDetails}</Text>
        </TouchableOpacity>
      )}

      {!cardsCollapsed && (
      <Animated.View style={{
      position: 'absolute',
      bottom: 0,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT * 0.18,
      maxHeight: 200,
      minHeight: 160,
      backgroundColor: 'rgba(255,255,255,0.98)',
      paddingTop: 6,
      paddingHorizontal: 6
    }}>

      <TouchableOpacity
        style={styles.cardsHideBtn}
        onPress={() => setCardsCollapsed(true)}
        activeOpacity={0.9}
      >
        <Text style={styles.cardsHideBtnText}>{t.hide}</Text>
      </TouchableOpacity>
      
      <FlatList style={{
        flexGrow: 0
      }} contentContainerStyle={{
        paddingTop: 26,
        paddingBottom: 12
      }} ref={carouselRef} data={rides.filter(r => r.rideStatus !== 'Cancelled' && r.paymentStatus !== 'Cleared')} extraData={rideMetricsTick} // ← important!
      horizontal keyExtractor={item => item.id} showsHorizontalScrollIndicator={false} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfigRef.current} renderItem={({
        item,
        index
      }) => {
        const isSelected = selectedRideId === item.id;
        const {
          rideStatus
        } = item;
        let costText = '';
        const fallbackRouteDist = getDistanceKm(item.pickupLatitude, item.pickupLongitude, item.destinationLatitude, item.destinationLongitude);
        const routeDistanceNum = pickupToDestRoadDistance[item.id] ?? fallbackRouteDist;
        const riderRate = Number(item.riderRate || 0);
        const routeFare = Math.round(riderRate * routeDistanceNum);
        const baseDistance = backendDistanceBaseRef.current[item.id] ?? Number(item.distance || 0);
        const liveDistanceNum = baseDistance + (cumulativeDistanceRef.current[item.id] ?? 0);
        const liveFare = Math.round(riderRate * liveDistanceNum);
        const hasTripStartedForCard = rideStatus === 'Active';
        costText = `${formatAmountSync(routeFare, natCode, ratesMap || {})}`;
        if (isSelected && rideStatus !== 'Active') {
          costText = `${t.approxCost}: ${formatAmountSync(routeFare, natCode, ratesMap || {})}`;
        } else if (riderToPickupRoadDistance[item.id] != null && rideStatus === 'TransportApproved') {
          costText = `${t.estimatedCost}: ${formatAmountSync(routeFare, natCode, ratesMap || {})}`;
        }
        // Show route distance always; show live trip distance only after trip starts
        const routeDistanceValue = routeDistanceNum.toFixed(2);
        const routeDistanceText = `${t.routeDistance}: ${routeDistanceValue} km`;
        const compactProgressLiveText = `${liveDistanceNum.toFixed(2)} km`;
        const compactProgressRouteText = `${routeDistanceValue} km`;
        const compactRateText = `${formatAmountSync(riderRate, natCode, ratesMap || {})}/km`;
        const compactFareLiveText = `${formatAmountSync(liveFare, natCode, ratesMap || {})}`;
        const compactFareRouteText = `${formatAmountSync(routeFare, natCode, ratesMap || {})}`;
        return <View key={item.id} style={{
          backgroundColor: '#fff',
          marginHorizontal: 8,
          paddingHorizontal: 10,
          paddingVertical: 7,
          borderRadius: 10,
          width: SCREEN_WIDTH * 0.88,
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2
          },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
          borderColor: isSelected ? '#1f8ef1' : 'transparent',
          borderWidth: isSelected ? 2 : 0
        }}>
                <TouchableOpacity onPress={() => focusOnRide(item, index)} activeOpacity={0.9} style={{ alignItems: 'center' }}>
                  <Text style={{
              fontWeight: '700',
              fontSize: 16,
              textAlign: 'center'
            }}>{item.passengerContact}</Text>
                  <Text style={{ textAlign: 'center' }}>{t.statusLabel}: {rideStatus} {item.paymentStatus ? `| ${item.paymentStatus}` : ''}</Text>
                  {hasTripStartedForCard ? (
                    <Text style={{ textAlign: 'center' }}>
                      <Text style={{ color: '#17803d', fontWeight: '700' }}>{compactProgressLiveText}</Text>
                      <Text style={{ color: '#e58d29', fontWeight: '900' }}> {t.of} </Text>
                      <Text style={{ color: '#0b63c7', fontWeight: '700' }}>{compactProgressRouteText}</Text>
                      <Text style={{ color: '#444', fontWeight: '700' }}> @ {compactRateText}</Text>
                    </Text>
                  ) : (
                    <Text style={{ textAlign: 'center' }}>
                      <Text style={{ color: '#0b63c7', fontWeight: '700' }}>{routeDistanceText}</Text>
                    </Text>
                  )}
                  {hasTripStartedForCard ? (
                    <Text style={{ textAlign: 'center' }}>
                      <Text style={{ color: '#17803d', fontWeight: '700' }}>{compactFareLiveText}</Text>
                      <Text style={{ color: '#e58d29', fontWeight: '900' }}> {t.of} </Text>
                      <Text style={{ color: '#0b63c7', fontWeight: '700' }}>{compactFareRouteText}</Text>
                    </Text>
                  ) : (
                    <Text style={{ textAlign: 'center' }}>{costText}</Text>
                  )}
                </TouchableOpacity>

                <View style={{ marginTop: 6, alignItems: 'center' }}>
                  <Text style={{ color: '#666', textAlign: 'center' }}>{t.selectRideToSeeActions}</Text>
                </View>
              </View>;
      }} />
      </Animated.View>
      )}
    </View>;
}

const styles = StyleSheet.create({
  actionBar: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.18 + 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    zIndex: 10
  },
  actionButton: {
    backgroundColor: '#1f8ef1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 6
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700'
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
  destinationMarkerDot: {
    backgroundColor: '#9b59b6',
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
  selectedDestinationMarkerDot: {
    backgroundColor: '#9b59b6',
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
  destinationTextChip: {
    backgroundColor: '#9b59b6',
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
  destinationConnectorLine: {
    backgroundColor: '#9b59b6',
  },
  cardsHideBtn: {
    position: 'absolute',
    top: 16,
    right: 34,
    zIndex: 20,
    backgroundColor: '#eef5ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardsHideBtnText: {
    color: '#1f8ef1',
    fontWeight: '700',
    fontSize: 12,
  },
  floatingShowCardsBtn: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    backgroundColor: '#1f8ef1',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 40,
    elevation: 8,
  },
  floatingShowCardsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  }
});