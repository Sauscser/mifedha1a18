import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Animated, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Easing } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
// import { getDistance } from 'geolib';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listTransportRegisters, getSMAccount, getTransportRegister } from '../../../src/graphql/queries';
import { createRideRequest, sendNotification } from '../../../src/graphql/mutations';
import GooglePlacesAutocompleteNew from './GooglePlacesAutoCompleteNew';
import messaging from '@react-native-firebase/messaging';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, getUserNationalityByEmail, convertForeignToKsh } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { buildOsrmRouteUrl } from '../../../src/config/osrm';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { generateClient } from "aws-amplify/api";
import { getUrl } from 'aws-amplify/storage';
const client = generateClient();
const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_RADIUS_KM = 0.1;
const RIDER_PANEL_HEIGHT = 140;
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
export default function RideRequestMapScreen({
  navigation
}: {
  navigation: any;
}) {
  // i18n translation pattern (as in RequestTransport)
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = { ...translations.en, ...(translations[lang] || {}) };
  // Collapsible filter panel state
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [pendingCheckDone, setPendingCheckDone] = useState(false);
  // Floating refresh animation state
  const [pendingRides, setPendingRides] = useState<any[]>([]);
  const [pickupInput, setPickupInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [locationInputMode, setLocationInputMode] = useState<'chooser' | 'search' | 'manual'>('chooser');
  const [manualPickupLat, setManualPickupLat] = useState('');
  const [manualPickupLng, setManualPickupLng] = useState('');
  const [manualDestinationLat, setManualDestinationLat] = useState('');
  const [manualDestinationLng, setManualDestinationLng] = useState('');
  const [selectionTarget, setSelectionTarget] = useState<'pickup' | 'destination' | null>(null);
  const [pickupSource, setPickupSource] = useState<'gps' | 'manual' | 'search'>('gps');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [allRiders, setAllRiders] = useState<any[]>([]);
  const [filteredRiders, setFilteredRiders] = useState<any[]>([]);
  const [mapLabelPoints, setMapLabelPoints] = useState<{
    rider: { x: number; y: number } | null;
    pickup: { x: number; y: number } | null;
    destination: { x: number; y: number } | null;
  }>({ rider: null, pickup: null, destination: null });
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
          query: LIST_RIDE_REQUESTS_SAFE_QUERY,
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
            const broadRes: any = await client.graphql({ query: LIST_RIDE_REQUESTS_SAFE_QUERY, variables: { limit: 50 } });
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
        // Startup pending-check failures should not look like a user request failure.
        console.warn('PassengerRequestRide: pending check failed, continuing without pending guard', err);
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
            const url = buildOsrmRouteUrl(rider, pickupPoint, { overview: 'false' });
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
          const url = buildOsrmRouteUrl(rider, pickupPoint, { overview: 'false' });
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
          const url = buildOsrmRouteUrl(pickupPoint, filters.destination!, { overview: 'false' });
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
          const url = buildOsrmRouteUrl(rider, filters.pickup!, { overview: 'full', geometries: 'geojson' });
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
            const url2 = buildOsrmRouteUrl(filters.pickup!, filters.destination!, { overview: 'full', geometries: 'geojson' });
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
  const isConfirmingRideRef = useRef(false);

  // ---------- Notification Handlers ----------
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      // Do not interrupt the ride confirmation prompt with another alert.
      if (isConfirmingRideRef.current) return;
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
          Alert.alert(t.permissionDeniedTitle, t.permissionDeniedBody);
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
        if (!filters.pickup) {
          setPickupSource('gps');
        }
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
  }, []);

  const activeRider = useMemo(() => {
    return filteredRiders.find(rider => rider.id === selectedRiderId) || null;
  }, [filteredRiders, selectedRiderId]);

  const refreshMapLabelPoints = useCallback(async () => {
    const map = mapRef.current as any;
    if (!map) return;
    try {
      const riderCoord = activeRider
        ? { latitude: Number(activeRider.latitude), longitude: Number(activeRider.longitude) }
        : null;
      const pickupCoord = filters.pickup;
      const destinationCoord = filters.destination;

      const [riderPt, pickupPt, destinationPt] = await Promise.all([
        riderCoord ? map.pointForCoordinate(riderCoord) : Promise.resolve(null),
        pickupCoord ? map.pointForCoordinate(pickupCoord) : Promise.resolve(null),
        destinationCoord ? map.pointForCoordinate(destinationCoord) : Promise.resolve(null),
      ]);

      setMapLabelPoints({
        rider: riderPt || null,
        pickup: pickupPt || null,
        destination: destinationPt || null,
      });
    } catch {
      // Ignore projection failures; positions refresh on the next map update.
    }
  }, [activeRider, filters.pickup, filters.destination]);

  useEffect(() => {
    refreshMapLabelPoints();
  }, [refreshMapLabelPoints, selectedRiderId, filters.pickup, filters.destination, cardsCollapsed]);

  // ---------- Fetch place details ----------
  const fetchPlaceDetails = (place: any, type: 'pickup' | 'destination') => {
    if (!place?.location) return;
    setFilters(prev => ({
      ...prev,
      [type]: place.location
    }));
    if (type === 'pickup') {
      setPickupSource('search');
      setPickupText(place.displayName || t.pickup);
      setPickupInput(place.displayName || '');
    } else {
      setDestinationText(place.displayName || t.destination);
      setDestinationInput(place.displayName || '');
    }
  };

  const openMapSelection = (target: 'pickup' | 'destination') => {
    setFilterPanelCollapsed(true);
    setSelectionTarget(target);
  };

  const handleMapLongPress = (event: any) => {
    if (!selectionTarget) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const location = { latitude, longitude };

    if (selectionTarget === 'pickup') {
      setFilters(prev => ({ ...prev, pickup: location }));
      setPickupSource('manual');
      setPickupText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      setPickupInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } else {
      setFilters(prev => ({ ...prev, destination: location }));
      setDestinationText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      setDestinationInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }

    setSelectionTarget(null);
  };

  const buildRideRequestNoticeBody = (senderName: string) => {
    const safeSender = senderName && senderName.trim() ? senderName.trim() : 'A passenger';
    if (typeof t.rideRequestNoticeBody === 'function') {
      return t.rideRequestNoticeBody(safeSender);
    }
    return `${safeSender} has sent you a ride request. Go to NiSenti app to accept or decline the request.`;
  };

  const notifyTransporterRideInitiated = async (riderEmail: string) => {
    if (!riderEmail) return;
    try {
      const attributes = await fetchUserAttributes();
      let senderName = 'A passenger';
      try {
        const userDtls: any = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: attributes.email }
        });
        senderName = userDtls?.data?.getSMAccount?.name || senderName;
      } catch (nameErr) {
        console.warn('PassengerRequestRide: failed to read sender name from SMAccount', nameErr);
      }

      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail,
          title: t.notifRequestInitiatedTitle,
          body: buildRideRequestNoticeBody(senderName),
        }
      });
    } catch (err) {
      console.warn('PassengerRequestRide: failed to send initiated notification', err);
    }
  };

  const parseCoordinate = (value: string) => {
    if (value == null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  };

  const applyManualCoordinates = () => {
    const pickupLat = parseCoordinate(manualPickupLat);
    const pickupLng = parseCoordinate(manualPickupLng);
    const destLat = parseCoordinate(manualDestinationLat);
    const destLng = parseCoordinate(manualDestinationLng);

    if (destLat == null || destLng == null || Number.isNaN(destLat) || Number.isNaN(destLng)) {
      Alert.alert(t.pickLocations, t.manualDestinationRequired);
      return;
    }

    if (destLat < -90 || destLat > 90 || destLng < -180 || destLng > 180) {
      Alert.alert(t.error, t.manualDestinationInvalid);
      return;
    }

    const hasAnyPickup = (manualPickupLat || '').trim().length > 0 || (manualPickupLng || '').trim().length > 0;
    if (hasAnyPickup) {
      if (pickupLat == null || pickupLng == null || Number.isNaN(pickupLat) || Number.isNaN(pickupLng)) {
        Alert.alert(t.error, t.manualPickupInvalid);
        return;
      }
      if (pickupLat < -90 || pickupLat > 90 || pickupLng < -180 || pickupLng > 180) {
        Alert.alert(t.error, t.manualPickupInvalid);
        return;
      }
    }

    setFilters(prev => ({
      ...prev,
      pickup: hasAnyPickup && pickupLat != null && pickupLng != null && !Number.isNaN(pickupLat) && !Number.isNaN(pickupLng)
        ? { latitude: pickupLat, longitude: pickupLng }
        : (userLocation || prev.pickup),
      destination: { latitude: destLat, longitude: destLng }
    }));

    if (hasAnyPickup && pickupLat != null && pickupLng != null && !Number.isNaN(pickupLat) && !Number.isNaN(pickupLng)) {
      setPickupSource('manual');
      setPickupText(`${pickupLat.toFixed(6)}, ${pickupLng.toFixed(6)}`);
      setPickupInput(`${pickupLat.toFixed(6)}, ${pickupLng.toFixed(6)}`);
    } else {
      setPickupSource('gps');
      setPickupText(t.currentLocation);
      setPickupInput('');
    }
    setDestinationText(`${destLat.toFixed(6)}, ${destLng.toFixed(6)}`);
    setDestinationInput(`${destLat.toFixed(6)}, ${destLng.toFixed(6)}`);
  };

  // ---------- Confirm ride ----------
  const confirmAndRequestRide = (rider: any) => {
    const est = formatAmountSync(Math.round(rider._estimatedCost || 0), natCode, ratesMap);
    isConfirmingRideRef.current = true;
    Alert.alert(
      t.confirmRideTitle,
      t.confirmRideBody(rider.transportName || t.rider, est, (rider._tripDistanceKm || 0).toFixed(2)),
      [
        {
          text: t.cancel,
          style: 'cancel',
          onPress: () => {
            isConfirmingRideRef.current = false;
          }
        },
        {
          text: t.confirm,
          onPress: () => {
            isConfirmingRideRef.current = false;
            requestRide(rider, true);
          }
        }
      ],
      {
        cancelable: true,
        onDismiss: () => {
          isConfirmingRideRef.current = false;
        }
      }
    );
  };

  // ---------- Request ride ----------
  const requestRide = async (rider: any, shouldSendInitiatedNotice = false) => {
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
        query: LIST_RIDE_REQUESTS_SAFE_QUERY,
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
                if (shouldSendInitiatedNotice && rider.transportOwnerEmail) {
                  await notifyTransporterRideInitiated(rider.transportOwnerEmail);
                }
                await actuallyRequestRide(rider, attributes, user, () => setLoadingRiders(prev => ({ ...prev, [rider.id]: false })));
              }
            },
            { text: t.cancel, style: 'cancel', onPress: () => setLoadingRiders(prev => ({ ...prev, [rider.id]: false })) }
          ]
        );
        return;
      }
      if (shouldSendInitiatedNotice && rider.transportOwnerEmail) {
        await notifyTransporterRideInitiated(rider.transportOwnerEmail);
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
        ownerShipType: selectedRider.ownerShipType,
        transportOwnerAc: selectedRider.transportOwnerAc,
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
        Alert.alert(t.rideRequestedTitle, t.rideRequestedBody(rider.transportName || t.rider));
        // 🔔 Trigger backend Lambda to send push notification
        const riderEmail = rider.transportOwnerEmail;
        if (!riderEmail) {
          Alert.alert(t.error, t.errorRiderEmail);
        } else {
          const notifTitle = t.notifNewRideTitle;
          const notifBody = buildRideRequestNoticeBody(passengerInfo?.name || ride.passengerName || 'A passenger');
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
        <Text>{t.loading}</Text>
      </View>;
  }

  const isModeChooserOpen = locationInputMode === 'chooser';
  const parsedRadiusKm = parseFloat(filters.radiusKm);
  const hasValidRadius = Number.isFinite(parsedRadiusKm) && parsedRadiusKm >= 0.05;
  const hasPickupPoint = !!(filters.pickup || userLocation);
  const hasDestinationPoint = !!filters.destination;
  const hasLocationSetup = hasPickupPoint && hasDestinationPoint;
  const isSearchReady = hasValidRadius && hasLocationSetup;
  const shouldLockRiderSelection = isModeChooserOpen || !isSearchReady || filteringLoading || loadingAllRiders;
  const lockOverlayMessage = isModeChooserOpen
    ? t.chooseLocationModeToContinue
    : !hasDestinationPoint
      ? t.setDestinationToContinue
      : !hasValidRadius
        ? t.setRadiusToContinue
        : t.waitingForSearchToFinish;

  return <View style={{
    flex: 1
  }}>
      {/* Map */}
      <MapView ref={mapRef} style={{
        flex: 1
      }}
      scrollEnabled={!shouldLockRiderSelection}
      zoomEnabled={!shouldLockRiderSelection}
      pitchEnabled={!shouldLockRiderSelection}
      rotateEnabled={!shouldLockRiderSelection}
      showsUserLocation initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }}
      onMapReady={refreshMapLabelPoints}
      onRegionChangeComplete={refreshMapLabelPoints}
      onLongPress={handleMapLongPress}>
        {/* Riders: custom marker using dot + overlay label */}
        {filteredRiders.map((rider, idx) => (
          <Marker
            key={rider.id}
            coordinate={{ latitude: rider.latitude, longitude: rider.longitude }}
            onPress={() => focusOnRider(rider, idx)}
          >
            <View
              style={[
                styles.mapMarkerDot,
                selectedRiderId === rider.id ? styles.selectedRiderMarkerDot : styles.riderMarkerDot,
              ]}
            />
          </Marker>
        ))}

        {/* Pickup marker */}
        {filters.pickup && (
          <Marker coordinate={{ latitude: filters.pickup.latitude, longitude: filters.pickup.longitude }}>
            <View style={[styles.mapMarkerDot, styles.pickupMarkerDot]} />
          </Marker>
        )}

        {/* Destination marker */}
        {filters.destination && (
          <Marker coordinate={{ latitude: filters.destination.latitude, longitude: filters.destination.longitude }}>
            <View style={[styles.mapMarkerDot, styles.destinationMarkerDot]} />
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

      <View style={styles.mapTextOverlay} pointerEvents="none">
        {mapLabelPoints.rider && activeRider && (
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
              {t.rider}
            </Text>
          </>
        )}

        {mapLabelPoints.pickup && filters.pickup && (
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
              {t.pickup}
            </Text>
          </>
        )}

        {mapLabelPoints.destination && filters.destination && (
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
                  transform: [{ translateX: -55 }],
                },
              ]}
              numberOfLines={1}
            >
              {t.destination}
            </Text>
          </>
        )}
      </View>

      {shouldLockRiderSelection && (
        <View style={styles.selectionLockOverlay}>
          <View style={styles.selectionLockCard}>
            {(filteringLoading || loadingAllRiders) && (
              <ActivityIndicator size="small" color="#e58d29" style={{ marginBottom: 6 }} />
            )}
            <Text style={styles.selectionLockText}>{lockOverlayMessage}</Text>
          </View>
        </View>
      )}

      {isModeChooserOpen && (
        <View style={styles.modeOverlay}>
          <View style={styles.modeOverlayCard}>
            <Text style={styles.inlineModalTitle}>{t.locationInputModeTitle}</Text>
            <Text style={styles.inlineModalBody}>{t.locationInputModeBody}</Text>
            <View style={styles.inlineModalButtonRow}>
              <TouchableOpacity style={[styles.modeBtn, styles.modeBtnPrimary]} onPress={() => setLocationInputMode('search')}>
                <Text style={styles.modeBtnPrimaryText}>{t.searchPlaces}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modeBtn, styles.modeBtnSecondary]} onPress={() => setLocationInputMode('manual')}>
                <Text style={styles.modeBtnSecondaryText}>{t.manualCoordinates}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {selectionTarget && (
        <View style={styles.modeOverlay}>
          <View style={[styles.modeOverlayCard, styles.selectorOverlayCard]}>
            <Text style={styles.inlineModalTitle}>
              {selectionTarget === 'pickup' ? t.selectPickupLocation : t.selectDestinationLocation}
            </Text>
            <Text style={styles.inlineModalBody}>{t.mapSelectionHint}</Text>
            <View style={styles.selectorMapContainer}>
              <MapView
                style={styles.selectorMap}
                initialRegion={{
                  latitude: (selectionTarget === 'pickup' ? filters.pickup?.latitude : filters.destination?.latitude) || userLocation?.latitude || 0,
                  longitude: (selectionTarget === 'pickup' ? filters.pickup?.longitude : filters.destination?.longitude) || userLocation?.longitude || 0,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                onLongPress={handleMapLongPress}
                showsUserLocation
                zoomEnabled
                scrollEnabled
              >
                {selectionTarget === 'pickup' && filters.pickup && (
                  <Marker coordinate={filters.pickup} />
                )}
                {selectionTarget === 'destination' && filters.destination && (
                  <Marker coordinate={filters.destination} />
                )}
              </MapView>
            </View>
            <TouchableOpacity style={[styles.modeBtn, styles.modeBtnSecondary]} onPress={() => setSelectionTarget(null)}>
              <Text style={styles.modeBtnSecondaryText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


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
            {locationInputMode === 'search' && (
              <>
                <View style={styles.modeHeaderRow}>
                  <Text style={styles.modeHeaderText}>{t.searchModeLabel}</Text>
                </View>
                <GooglePlacesAutocompleteNew
                  placeholder={t.pickupLocation}
                  loadingText={t.searching}
                  value={pickupInput}
                  onValueChange={setPickupInput}
                  onPlaceSelected={(place: any) => fetchPlaceDetails(place, 'pickup')}
                  clearOnSelect={false}
                />
                <GooglePlacesAutocompleteNew
                  placeholder={t.destination}
                  loadingText={t.searching}
                  value={destinationInput}
                  onValueChange={setDestinationInput}
                  onPlaceSelected={(place: any) => fetchPlaceDetails(place, 'destination')}
                  clearOnSelect={false}
                />
              </>
            )}

            {locationInputMode === 'manual' && (
              <>
                <View style={styles.modeHeaderRow}>
                  <Text style={styles.modeHeaderText}>{t.manualModeLabel}</Text>
                </View>
                <Text style={styles.manualHint}>{t.manualPickupHint}</Text>
                <TouchableOpacity style={styles.applyManualBtn} onPress={() => openMapSelection('pickup')}>
                  <Text style={styles.applyManualBtnText}>{t.selectPickupLocation}</Text>
                </TouchableOpacity>
                <Text style={styles.manualHint}>{pickupText || t.pickup}</Text>
                <Text style={styles.manualHint}>{t.manualDestinationHint}</Text>
                <TouchableOpacity style={styles.applyManualBtn} onPress={() => openMapSelection('destination')}>
                  <Text style={styles.applyManualBtnText}>{t.selectDestinationLocation}</Text>
                </TouchableOpacity>
                <Text style={styles.manualHint}>{destinationText || t.destination}</Text>
                <Text style={styles.manualHint}>{t.zoomForAccuracy}</Text>
              </>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                placeholder={t.radiusKm}
                placeholderTextColor="#444"
                value={filters.radiusKm}
                keyboardType="numeric"
                onChangeText={t => setFilters(f => ({ ...f, radiusKm: t }))}
                style={[styles.smallInput, { width: 80, marginTop: 6, fontWeight: 'bold', color: '#222' }]}
              />
              {filteringLoading && (
                <ActivityIndicator size="small" color="#e58d29" style={{ marginLeft: 8, marginTop: 6 }} />
              )}
              <TouchableOpacity onPress={fetchRiders} style={styles.refreshBtn}>
                {loadingAllRiders ? <ActivityIndicator size="small" color="#1f8ef1" style={{ marginLeft: 8, marginTop: 6 }} /> : <Text style={styles.refreshTxt}>{t.refresh}</Text>}
              </TouchableOpacity>
              {locationInputMode !== 'chooser' && (
                <TouchableOpacity onPress={() => setLocationInputMode('chooser')} style={styles.changeModeBtn}>
                  <Text style={styles.changeModeBtnTxt}>{t.changeMode}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.pickupSourceText}>
              {t.pickupSource}: {pickupSource === 'gps' ? t.pickupSourceGps : pickupSource === 'manual' ? t.pickupSourceManual : t.pickupSourceSearch}
            </Text>
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


      {/* Rider cards (fixed bottom panel) */}
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
        <View style={styles.carouselContainer}>
          <TouchableOpacity
            onPress={() => setCardsCollapsed(true)}
            style={styles.cardsHideBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.cardsHideBtnText}>{t.hide}</Text>
          </TouchableOpacity>

          <FlatList
            ref={carouselRef}
            data={filteredRiders}
            horizontal
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 26, paddingBottom: 6 }}
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
        </View>
      )}
    </View>;
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
  filterPanel: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 6,
    zIndex: 220
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
  inlineModalCard: {
    backgroundColor: '#fff8ef',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1c48a',
    padding: 10,
    marginBottom: 8,
  },
  modeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 310,
  },
  modeOverlayCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff8ef',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1c48a',
    padding: 14,
    elevation: 12,
  },
  selectionLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 150,
  },
  selectionLockCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  selectionLockText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3d3d3d',
    textAlign: 'center',
  },
  inlineModalTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: '#3f2a12',
  },
  inlineModalBody: {
    marginTop: 4,
    color: '#5d4a35',
    fontSize: 13,
  },
  selectorMapContainer: {
    width: '100%',
    height: 280,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#ddd',
  },
  selectorMap: {
    width: '100%',
    height: '100%',
  },
  selectorOverlayCard: {
    width: '100%',
    maxWidth: '100%',
    height: '90%',
    maxHeight: '90%',
    borderRadius: 14,
    padding: 14,
    justifyContent: 'flex-start',
  },
  inlineModalButtonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  modeBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  modeBtnPrimary: {
    backgroundColor: '#e58d29',
    marginRight: 6,
  },
  modeBtnSecondary: {
    borderWidth: 1,
    borderColor: '#e58d29',
    marginLeft: 6,
    backgroundColor: '#fff',
  },
  modeBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  modeBtnSecondaryText: {
    color: '#e58d29',
    fontWeight: '700',
  },
  modeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  modeHeaderText: {
    fontWeight: '700',
    color: '#333',
  },
  switchModeText: {
    color: '#1f8ef1',
    fontWeight: '700',
  },
  manualHint: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
    marginBottom: 4,
  },
  manualRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 6,
    fontWeight: 'bold',
    color: '#222',
  },
  applyManualBtn: {
    backgroundColor: '#1f8ef1',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  applyManualBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  pickupSourceText: {
    marginTop: 6,
    color: '#4a4a4a',
    fontSize: 12,
    fontWeight: '700',
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
    bottom: 12,
    left: 0,
    right: 0,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.90, // slightly less than full width for margin
    height: RIDER_PANEL_HEIGHT,
    backgroundColor: '#fff',
    zIndex: 100,
    paddingTop: 6,
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
    height: RIDER_PANEL_HEIGHT - 38,
  },
  cardsHideBtn: {
    position: 'absolute',
    top: 4,
    right: 8,
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
    zIndex: 130,
    elevation: 8,
  },
  floatingShowCardsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
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
  },
  changeModeBtn: {
    marginLeft: 8,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1f8ef1',
    justifyContent: 'center'
  },
  changeModeBtnTxt: {
    color: '#1f8ef1',
    fontWeight: '700'
  }
});