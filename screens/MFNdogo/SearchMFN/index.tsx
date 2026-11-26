import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, FlatList, useWindowDimensions, Alert, TextInput, Text, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listAgents } from '../../../src/graphql/queries';
import * as Location from 'expo-location';
import { useRoute } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';
import CustomMarker from '../../../components/MFNdogo/CustomMarkr';
import Carousels from '../../../components/MFNdogo/MFNCarousel';
import { buildOsrmRouteUrl } from '../../../src/config/osrm';
import { generateClient } from "aws-amplify/api";
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';

const client = generateClient();
const GenralShpMpViewThree = props => {
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [MFN, setMFN] = useState([]);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [radiusKmText, setRadiusKmText] = useState('25');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [isCarouselExpanded, setIsCarouselExpanded] = useState(true);
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
      return;
    }

    const stillVisible = filteredMFN.some(place => getPlaceKey(place) === selectedPlaceId);
    if (!stillVisible) {
      const fallbackKey = getPlaceKey(filteredMFN[0]);
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
      setSelectedPlaceId(key);
    }
  });

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
        animated: true,
        viewPosition: 0.5
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
    const radiusKm = Number(radiusKmText);
    const visibleRadiusKm = Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : 25;
    const latitudeRadians = placeLat * Math.PI / 180;
    const region = {
      latitude: placeLat,
      longitude: placeLng,
      latitudeDelta: Math.min(180, Math.max(0.02, (visibleRadiusKm * 2) / 111.32)),
      longitudeDelta: Math.min(
        360,
        Math.max(0.02, (visibleRadiusKm * 2) / (111.32 * Math.max(Math.cos(latitudeRadians), 0.01)))
      )
    };
    map.current?.animateToRegion?.(region);
  }, [selectedPlaceId, filteredMFN, radiusKmText]);

  useEffect(() => {
    const selectedPlace = filteredMFN.find(place => getPlaceKey(place) === selectedPlaceId);
    if (!selectedPlace || !location?.coords) {
      setRoutePolyline([]);
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
      return;
    }

    const cacheKey = getRouteCacheKey(selectedPlaceId, start, end);
    const cachedPolyline = routeCacheRef.current[cacheKey];
    if (Array.isArray(cachedPolyline) && cachedPolyline.length > 1) {
      setRoutePolyline(cachedPolyline);
      return;
    }

    const now = Date.now();
    const previousEnd = lastRouteEndRef.current;
    const previousStart = lastRouteStartRef.current;
    const movedEnough = !previousEnd || Math.abs(previousEnd.latitude - end.latitude) > 0.0004 || Math.abs(previousEnd.longitude - end.longitude) > 0.0004;
    const startChangedEnough = !previousStart || Math.abs(previousStart.latitude - start.latitude) > 0.0004 || Math.abs(previousStart.longitude - start.longitude) > 0.0004;
    const cooledDown = now - lastRouteFetchAtRef.current > 5000;
    if (!movedEnough && !startChangedEnough && !cooledDown) {
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
        }
      } catch (error) {
        if (!isCancelled) {
          console.warn('SearchMFN: route request failed; drawing a direct fallback', error);
          const fallbackLine = [start, end];
          setRoutePolyline(fallbackLine);
          routeCacheRef.current[cacheKey] = fallbackLine;
          saveRouteCache();
        }
      }
    };

    fetchRoadPolyline();

    return () => {
      isCancelled = true;
    };
  }, [selectedPlaceId, location, filteredMFN]);

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
  return (
    <View style={{ flex: 1 }}>
      {isFilterExpanded ? (
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            zIndex: 20,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700', color: '#222' }}>Radius filter (KM)</Text>
            <TouchableOpacity
              onPress={() => setIsFilterExpanded(false)}
              style={{ padding: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Collapse radius filter"
            >
              <Ionicons name="close" size={20} color="#164458" />
            </TouchableOpacity>
          </View>
          <TextInput
            value={radiusKmText}
            onChangeText={setRadiusKmText}
            keyboardType="numeric"
            placeholder="Enter radius in KM"
            placeholderTextColor="#444"
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontWeight: 'bold',
              color: '#222'
            }}
          />
          <Text style={{ marginTop: 6, color: '#444', fontWeight: '600' }}>
            {filteredMFN.length} agents in range
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setIsFilterExpanded(true)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 20,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.96)',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 4
          }}
          accessibilityRole="button"
          accessibilityLabel="Open radius search filter"
        >
          <Ionicons name="search" size={22} color="#164458" />
        </TouchableOpacity>
      )}

      <MapView
        ref={map}
        style={{ width: '100%', height: '100%' }}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        initialRegion={{
          latitude: -0.5261561709274195,
          longitude: 37.58980744767201,
          latitudeDelta: 0.8,
          longitudeDelta: 0.8
        }}
      >
        {filteredMFN.map(place => (
          <CustomMarker
            key={place.phonecontact}
            coordinate={{
              latitude: Number(place.latitude),
              longitude: Number(place.longitude)
            }}
            totalDiscount={Number(place.totalDiscount || 0)}
            isSelected={getPlaceKey(place) === selectedPlaceId}
            onPress={() => setSelectedPlaceId(getPlaceKey(place))}
          />
        ))}
        {routePolyline.length > 1 ? (
          <Polyline coordinates={routePolyline} strokeColor="#0066ff" strokeWidth={6} geodesic zIndex={999} />
        ) : directFallbackLine.length > 1 ? (
          <Polyline
            coordinates={directFallbackLine}
            strokeColor="#ff3b30"
            strokeWidth={4}
            geodesic
            lineDashPattern={[8, 8]}
            zIndex={998}
          />
        ) : null}
      </MapView>

      {isCarouselExpanded ? (
        <>
          <TouchableOpacity
            onPress={() => setIsCarouselExpanded(false)}
            style={{
              position: 'absolute',
              bottom: 174,
              left: 16,
              zIndex: 20,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.96)',
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 4
            }}
            accessibilityRole="button"
            accessibilityLabel="Collapse agent cards"
          >
            <Ionicons name="chevron-down" size={22} color="#164458" />
          </TouchableOpacity>
          <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0 }}>
            <FlatList
              ref={flatlist}
              data={filteredMFN}
              horizontal
              pagingEnabled
              snapToAlignment="center"
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => String(getPlaceKey(item))}
              renderItem={item => (
                <Carousels
                  Agent={item.item}
                  isSelected={getPlaceKey(item.item) === selectedPlaceId}
                  onPress={() => setSelectedPlaceId(getPlaceKey(item.item))}
                  onLongPress={() => safeNavigateFrom(navigation, 'WithdrawFundsFromMap', {
                    phonecontact: item.item.phonecontact
                  })}
                />
              )}
              onViewableItemsChanged={onViewChanged.current}
              viewabilityConfig={viewConfig.current}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index
              })}
              onScrollToIndexFailed={info => {
                const safeIndex = Math.min(info.index, Math.max(filteredMFN.length - 1, 0));
                if (filteredMFN.length > 0 && safeIndex >= 0) {
                  setTimeout(() => {
                    try {
                      flatlist.current?.scrollToIndex?.({
                        index: safeIndex,
                        animated: true,
                        viewPosition: 0.5
                      });
                    } catch (_) {}
                  }, 120);
                }
              }}
            />
          </View>
        </>
      ) : (
        <TouchableOpacity
          onPress={() => setIsCarouselExpanded(true)}
          style={{
            position: 'absolute',
            bottom: 20,
            left: 16,
            zIndex: 20,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.96)',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 4
          }}
          accessibilityRole="button"
          accessibilityLabel="Open agent cards"
        >
          <Ionicons name="albums-outline" size={22} color="#164458" />
        </TouchableOpacity>
      )}
    </View>
  );
};
export default GenralShpMpViewThree;