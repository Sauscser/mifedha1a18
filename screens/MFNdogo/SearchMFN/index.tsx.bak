import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, FlatList, useWindowDimensions, Alert, TextInput, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listAgents } from '../../../src/graphql/queries';
import * as Location from 'expo-location';
import { useRoute } from '@react-navigation/core';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CustomMarker from '../../../components/MFNdogo/CustomMarkr';
import Carousels from '../../../components/MFNdogo/MFNCarousel';
import { buildOsrmRouteUrl } from '../../../src/config/osrm';
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const dbg = (...args) => {
  console.log(...args);
};
dbg('SMFDBG SearchMFN module loaded');
const GenralShpMpViewThree = props => {
  dbg('SMFDBG SearchMFN render');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [MFN, setMFN] = useState([]);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [radiusKmText, setRadiusKmText] = useState('25');
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const flatlist = useRef<any>(null);
  const map = useRef<any>(null);
  const locationSubscriptionRef = useRef(null);
  const lastRouteFetchAtRef = useRef(0);
  const lastRouteEndRef = useRef(null);
  const lastRouteStartRef = useRef(null);
  const routeCacheRef = useRef<Record<string, Array<{ latitude: number; longitude: number }>>>({});
  const width = useWindowDimensions().width;
  const getPlaceKey = place => place?.phonecontact;
  const getRouteCacheKey = (agentKey, start, end) => {
    return [String(agentKey), start.latitude.toFixed(4), start.longitude.toFixed(4), end.latitude.toFixed(4), end.longitude.toFixed(4)].join('|');
  };

  useEffect(() => {
    dbg('SMFDBG SearchMFN mounted');
    return () => {
      dbg('SMFDBG SearchMFN unmounted');
    };
  }, []);
  const fetchMFN = async () => {
    try {
      const town = route?.params?.town;
      const trimmedTown = typeof town === 'string' ? town.trim() : '';
      const variables = trimmedTown ? {
        filter: {
          and: {
            town: {
              contains: trimmedTown
            }
          }
        }
      } : undefined;
      const response: any = await client.graphql({
        query: listAgents,
        variables
      });
      setMFN(response.data.listAgents.items);
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    fetchMFN();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('searchMfnRouteCache');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          routeCacheRef.current = parsed;
        }
      } catch (e) {
        console.warn('SearchMFN: failed to load route cache', e);
      }
    })();
  }, []);

  const saveRouteCache = async () => {
    try {
      await AsyncStorage.setItem('searchMfnRouteCache', JSON.stringify(routeCacheRef.current));
    } catch (e) {
      console.warn('SearchMFN: failed to save route cache', e);
    }
  };

  useEffect(() => {
    console.error(`SMFDBG fetched agents count=${MFN.length}`);
  }, [MFN]);

  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredMFN = useMemo(() => {
    const radiusKm = Number(radiusKmText);
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || !location?.coords) {
      return MFN;
    }

    const userLat = Number(location.coords.latitude);
    const userLng = Number(location.coords.longitude);
    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
      return MFN;
    }

    return MFN.filter(agent => {
      const lat = Number(agent.latitude);
      const lng = Number(agent.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return false;
      }
      return distanceKm(userLat, userLng, lat, lng) <= radiusKm;
    });
  }, [MFN, location, radiusKmText]);

  useFocusEffect(useCallback(() => {
    dbg(`SMFDBG SearchMFN focused | selected=${String(selectedPlaceId)} | filtered=${filteredMFN.length} | hasLocation=${Boolean(location?.coords)}`);
    return () => {
      dbg('SMFDBG SearchMFN blurred');
    };
  }, [selectedPlaceId, filteredMFN.length, location]));

  const selectedPlaceForRender = useMemo(() => {
    return filteredMFN.find(place => getPlaceKey(place) === selectedPlaceId) || null;
  }, [filteredMFN, selectedPlaceId]);

  const directFallbackLine = useMemo(() => {
    if (!selectedPlaceForRender || !location?.coords) {
      return [];
    }

    const start = {
      latitude: Number(selectedPlaceForRender.latitude),
      longitude: Number(selectedPlaceForRender.longitude)
    };
    const end = {
      latitude: Number(location.coords.latitude),
      longitude: Number(location.coords.longitude)
    };

    if (!Number.isFinite(start.latitude) || !Number.isFinite(start.longitude) || !Number.isFinite(end.latitude) || !Number.isFinite(end.longitude)) {
      return [];
    }

    return [start, end];
  }, [selectedPlaceForRender, location]);

  useEffect(() => {
    if (filteredMFN.length === 0) {
      setSelectedPlaceId(null);
      setRoutePolyline([]);
      console.error('SMFDBG filtered list empty');
      return;
    }

    const stillVisible = filteredMFN.some(place => getPlaceKey(place) === selectedPlaceId);
    if (!stillVisible) {
      const fallbackKey = getPlaceKey(filteredMFN[0]);
      console.error(`SMFDBG selected key reset -> ${String(fallbackKey)} | filtered=${filteredMFN.length}`);
      setSelectedPlaceId(fallbackKey);
    }
  }, [filteredMFN, selectedPlaceId]);
  const viewConfig = useRef({
    itemVisiblePercentThreshold: 70
  });
  const onViewChanged = useRef(({
    viewableItems
  }) => {
    if (viewableItems.length > 0) {
      const selectedPlace = viewableItems[0].item;
      const key = getPlaceKey(selectedPlace);
      console.error(`SMFDBG carousel view changed -> ${String(key)}`);
      setSelectedPlaceId(key);
    }
  });

  useEffect(() => {
    console.error(`SMFDBG selected=${String(selectedPlaceId)} | filtered=${filteredMFN.length} | radiusKm=${radiusKmText}`);
  }, [selectedPlaceId, filteredMFN.length, radiusKmText]);
  useEffect(() => {
    if (!selectedPlaceId || !flatlist.current || filteredMFN.length === 0) {
      return;
    }
    const index = filteredMFN.findIndex(place => getPlaceKey(place) === selectedPlaceId);
    if (index < 0) {
      return;
    }
    try {
      flatlist.current?.scrollToIndex?.({
        index,
        animated: true
      });
    } catch (_) {
      // Ignore transient out-of-range errors while list data is being recalculated.
    }
    const selectedPlace = filteredMFN[index];
    const placeLat = Number(selectedPlace.latitude);
    const placeLng = Number(selectedPlace.longitude);
    if (!Number.isFinite(placeLat) || !Number.isFinite(placeLng)) {
      return;
    }
    const region = {
      latitude: placeLat,
      longitude: placeLng,
      latitudeDelta: 0.8,
      longitudeDelta: 0.8
    };
    map.current.animateToRegion(region);
  }, [selectedPlaceId, filteredMFN]);

  useEffect(() => {
    dbg(`SMFDBG polyline effect run | selected=${String(selectedPlaceId)} | filtered=${filteredMFN.length} | hasLocation=${Boolean(location?.coords)}`);
    const selectedPlace = filteredMFN.find(place => getPlaceKey(place) === selectedPlaceId);
    if (!selectedPlace || !location?.coords) {
      setRoutePolyline([]);
      dbg(`SMFDBG polyline skipped (no-route) | selected=${String(selectedPlaceId)} | hasLocation=${Boolean(location?.coords)} | filtered=${filteredMFN.length}`);
      console.error(`SMFDBG no route | selected=${String(selectedPlaceId)} | hasLocation=${Boolean(location?.coords)} | filtered=${filteredMFN.length}`);
      return;
    }

    const start = {
      latitude: Number(selectedPlace.latitude),
      longitude: Number(selectedPlace.longitude)
    };
    const end = {
      latitude: Number(location.coords.latitude),
      longitude: Number(location.coords.longitude)
    };

    if (!Number.isFinite(start.latitude) || !Number.isFinite(start.longitude) || !Number.isFinite(end.latitude) || !Number.isFinite(end.longitude)) {
      setRoutePolyline([]);
      dbg(`SMFDBG polyline skipped (invalid-coordinates) | selected=${String(selectedPlaceId)} | start=${start.latitude},${start.longitude} | end=${end.latitude},${end.longitude}`);
      console.error(`SMFDBG invalid coordinates | selected=${String(selectedPlaceId)} | start=${start.latitude},${start.longitude} | end=${end.latitude},${end.longitude}`);
      return;
    }

    const cacheKey = getRouteCacheKey(selectedPlaceId, start, end);
    const cachedPolyline = routeCacheRef.current[cacheKey];
    if (Array.isArray(cachedPolyline) && cachedPolyline.length > 1) {
      setRoutePolyline(cachedPolyline);
      dbg(`SMFDBG polyline drawn (cache-hit) | selected=${String(selectedPlaceId)} | points=${cachedPolyline.length}`);
      if (map.current?.fitToCoordinates) {
        map.current.fitToCoordinates(cachedPolyline, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 280,
            left: 50
          },
          animated: true
        });
      }
      return;
    }

    const now = Date.now();
    const previousEnd = lastRouteEndRef.current;
    const previousStart = lastRouteStartRef.current;
    const movedEnough = !previousEnd || Math.abs(previousEnd.latitude - end.latitude) > 0.0004 || Math.abs(previousEnd.longitude - end.longitude) > 0.0004;
    const startChangedEnough = !previousStart || Math.abs(previousStart.latitude - start.latitude) > 0.0004 || Math.abs(previousStart.longitude - start.longitude) > 0.0004;
    const cooledDown = now - lastRouteFetchAtRef.current > 5000;
    if (!movedEnough && !startChangedEnough && !cooledDown) {
      dbg(`SMFDBG polyline skipped (throttled) | selected=${String(selectedPlaceId)} | points=${routePolyline.length} | start=${start.latitude.toFixed(6)},${start.longitude.toFixed(6)} | end=${end.latitude.toFixed(6)},${end.longitude.toFixed(6)}`);
      console.error(`SMFDBG throttled | selected=${String(selectedPlaceId)} | points=${routePolyline.length} | start=${start.latitude.toFixed(6)},${start.longitude.toFixed(6)} | end=${end.latitude.toFixed(6)},${end.longitude.toFixed(6)}`);
      return;
    }

    lastRouteFetchAtRef.current = now;
    lastRouteEndRef.current = end;
    lastRouteStartRef.current = start;

    let isCancelled = false;

    const fetchRoadPolyline = async () => {
      try {
        const url = buildOsrmRouteUrl(start, end, {
          overview: 'full',
          geometries: 'geojson'
        });
        const response = await fetch(url);
        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates || [];
        const decoded = coordinates
          .map(([lng, lat]) => ({
            latitude: Number(lat),
            longitude: Number(lng)
          }))
          .filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

        if (!isCancelled) {
          const lineToDraw = decoded.length > 1 ? decoded : [start, end];
          setRoutePolyline(lineToDraw);
          routeCacheRef.current[cacheKey] = lineToDraw;
          saveRouteCache();
          const source = decoded.length > 1 ? 'osrm' : 'fallback-direct';
          dbg(`SMFDBG polyline drawn (${source}) | selected=${String(selectedPlaceId)} | points=${lineToDraw.length} | start=${start.latitude.toFixed(6)},${start.longitude.toFixed(6)} | end=${end.latitude.toFixed(6)},${end.longitude.toFixed(6)}`);
          if (lineToDraw.length > 1 && map.current?.fitToCoordinates) {
            map.current.fitToCoordinates(lineToDraw, {
              edgePadding: {
                top: 100,
                right: 50,
                bottom: 280,
                left: 50
              },
              animated: true
            });
          }
        }
      } catch (error) {
        if (!isCancelled) {
          const fallbackLine = [start, end];
          setRoutePolyline(fallbackLine);
          routeCacheRef.current[cacheKey] = fallbackLine;
          saveRouteCache();
          dbg(`SMFDBG polyline drawn (fetch-error-fallback) | selected=${String(selectedPlaceId)} | points=2 | start=${start.latitude.toFixed(6)},${start.longitude.toFixed(6)} | end=${end.latitude.toFixed(6)},${end.longitude.toFixed(6)} | error=${String(error)}`);
        }
      }
    };

    fetchRoadPolyline();

    return () => {
      isCancelled = true;
    };
  }, [selectedPlaceId, location, filteredMFN]);

  useEffect(() => {
    dbg(`SMFDBG polyline points=${routePolyline.length}`);
  }, [routePolyline]);
  useEffect(() => {
    let mounted = true;

    const startTrackingLocation = async () => {
      const {
        status
      } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Location permission required', 'Permission to access location was denied');
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      if (mounted) {
        setLocation(currentLocation);
      }

      const subscription = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 25
      }, latestLocation => {
        if (mounted) {
          setLocation(latestLocation);
        }
      });

      locationSubscriptionRef.current = subscription;
    };

    startTrackingLocation().catch(err => {
      console.error(err);
      setErrorMsg('Unable to fetch live location');
    });

    return () => {
      mounted = false;
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, []);
  return <View style={{
    flex: 1
  }}>
      <View style={{
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      zIndex: 20,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10
    }}>
        <Text style={{
        fontWeight: '700',
        color: '#222',
        marginBottom: 6
      }}>Radius filter (KM)</Text>
        <TextInput value={radiusKmText} onChangeText={setRadiusKmText} keyboardType="numeric" placeholder="Enter radius in KM" placeholderTextColor="#444" style={{
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontWeight: 'bold',
        color: '#222'
      }} />
        <Text style={{
        marginTop: 6,
        color: '#444',
        fontWeight: '600'
      }}>{filteredMFN.length} agents in range</Text>
      </View>

      <MapView ref={map} style={{
      width: '100%',
      height: '100%'
    }} provider={PROVIDER_GOOGLE} showsUserLocation={true} initialRegion={{
      latitude: -0.5261561709274195,
      longitude: 37.58980744767201,
      latitudeDelta: 0.8,
      longitudeDelta: 0.8
    }}>
        {filteredMFN.map(place => <CustomMarker key={place.phonecontact} coordinate={{
        latitude: Number(place.latitude),
        longitude: Number(place.longitude)
      }} totalDiscount={Number(place.totalDiscount || 0)} isSelected={getPlaceKey(place) === selectedPlaceId} onPress={() => {
        const key = getPlaceKey(place);
        console.error(`SMFDBG marker press -> ${String(key)}`);
        setSelectedPlaceId(key);
      }} />)}

        {routePolyline.length > 1 ? <Polyline coordinates={routePolyline} strokeColor="#0066ff" strokeWidth={6} geodesic zIndex={999} /> : directFallbackLine.length > 1 ? <Polyline coordinates={directFallbackLine} strokeColor="#ff3b30" strokeWidth={4} geodesic lineDashPattern={[8, 8]} zIndex={998} /> : null}
      </MapView>

      <View style={{
      position: 'absolute',
      bottom: 20
    }}>
        <FlatList ref={flatlist} data={filteredMFN} horizontal pagingEnabled snapToAlignment="center" showsHorizontalScrollIndicator={false} keyExtractor={item => String(getPlaceKey(item))} renderItem={item => <Carousels Agent={item.item} isSelected={getPlaceKey(item.item) === selectedPlaceId} onPress={() => {
        const key = getPlaceKey(item.item);
        console.error(`SMFDBG card press -> ${String(key)}`);
        setSelectedPlaceId(key);
      }} onLongPress={() => navigation.navigate('WithdrawFundsFromMap', {
        phonecontact: item.item.phonecontact
      })} />} onViewableItemsChanged={onViewChanged.current} viewabilityConfig={viewConfig.current} getItemLayout={(_, index) => ({
        length: width,
        offset: width * index,
        index
      })} onScrollToIndexFailed={info => {
        const safeIndex = Math.min(info.index, Math.max(filteredMFN.length - 1, 0));
        if (filteredMFN.length > 0 && safeIndex >= 0) {
          setTimeout(() => {
            try {
              flatlist.current?.scrollToIndex?.({
                index: safeIndex,
                animated: true
              });
            } catch (_) {}
          }, 120);
        }
      }} />
      </View>
    </View>;
};
export default GenralShpMpViewThree;