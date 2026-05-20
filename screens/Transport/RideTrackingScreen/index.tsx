import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { listRideRequests, getTransportRegister } from '../../../src/graphql/queries';
import { onUpdateRideRequest } from '../../../src/graphql/subscriptions';
import { Observable } from 'zen-observable-ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;




import { updateRideRequest } from '../../../src/graphql/mutations';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';

export default function RideTrackingScreen({ navigation }: any) {
    // 1-minute polling fallback for live ride updates
    useEffect(() => {
      let interval: any = null;
      let isMounted = true;
      (async () => {
        try {
          const user = await getCurrentUser();
          const attributes = await fetchUserAttributes();
          if (!attributes.email) return;
          interval = setInterval(async () => {
            try {
              const res: any = await client.graphql({
                query: listRideRequests,
                variables: {
                  filter: { passengerEmail: { eq: attributes.email } },
                  limit: 20,
                  sortDirection: 'DESC',
                }
              });
              const items = res?.data?.listRideRequests?.items || [];
              items.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              if (isMounted) setRides(items);
            } catch {}
          }, 60000); // 1 minute
        } catch {}
      })();
      return () => { isMounted = false; if (interval) clearInterval(interval); };
    }, []);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const mapRef = useRef<MapView | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { nationality, ratesMap } = useExchange();
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const natCode = nationalityToCode(safeNationality) || safeNationality || undefined;

  useEffect(() => {
    let sub: any = null;
    (async () => {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        if (attributes.email) setUserEmail(attributes.email);
        const res: any = await client.graphql({
          query: listRideRequests,
          variables: {
            filter: {
              passengerEmail: { eq: attributes.email }
            },
            limit: 20,
            sortDirection: 'DESC',
          }
        });
        const items = res?.data?.listRideRequests?.items || [];
        items.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setRides(items);

        // Subscribe to ride updates for live metrics
        sub = (client.graphql({ query: onUpdateRideRequest }) as unknown as Observable<any>).subscribe({
          next: ({ value }: any) => {
            const updated = value?.data?.onUpdateRideRequest;
            if (!updated) return;
            if (updated.passengerEmail === attributes.email) {
              setRides(prev => {
                const exists = prev.some(r => r.id === updated.id);
                if (exists) return prev.map(r => r.id === updated.id ? updated : r);
                // if new ride, append
                return [...prev, updated].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              });
            }
          },
          error: (err: any) => console.warn('ride updates subscription error', err)
        });
      } catch (err) {
        setRides([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => sub?.unsubscribe?.();
  }, []);

  // Focus map on selected ride
  useEffect(() => {
    if (!rides.length || !mapRef.current) return;
    const ride = rides[selectedIdx];
    if (ride && (ride.pickupLatitude && ride.pickupLongitude)) {
      mapRef.current.animateToRegion({
        latitude: ride.pickupLatitude,
        longitude: ride.pickupLongitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      }, 500);
    }
  }, [selectedIdx, rides]);

  // Route state for polylines
  const [routeToPickup, setRouteToPickup] = useState<Array<{latitude:number,longitude:number}>>([]);
  const [routeToDrop, setRouteToDrop] = useState<Array<{latitude:number,longitude:number}>>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  // Cache transport register lookups by id
  const transportMap = useRef<Record<string, any>>({});
  const [transporterTick, setTransporterTick] = useState(0);
  // Route cache load/save
  const routeCache = useRef<Record<string, any>>({});
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

  // Fetch route and distance using OSRM
  const fetchRouteWithDistance = async (start: { latitude:number, longitude:number }, end: { latitude:number, longitude:number }) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.routes && data.routes.length) {
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
        return { coords, distanceKm: data.routes[0].distance / 1000 };
      }
    } catch (err) {
      console.warn('OSRM Directions API error:', err);
    }
    return { coords: [], distanceKm: 0 };
  };

  // Fetch routes for the selected ride and transporter info
  useEffect(() => {
    (async () => {
      const ride = rides[selectedIdx];
      if (!ride) return;
      setRouteToPickup([]);
      setRouteToDrop([]);
      setRouteDistanceKm(null);
      try {
        // rider -> pickup (use cached if present)
        if (ride.riderLatitude && ride.riderLongitude && ride.pickupLatitude && ride.pickupLongitude) {
          const cache = routeCache.current[ride.id]?.pickup;
          if (cache && cache.length > 0) {
            setRouteToPickup(cache);
          } else {
            const res = await fetchRouteWithDistance({ latitude: ride.riderLatitude, longitude: ride.riderLongitude }, { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude });
            setRouteToPickup(res.coords);
            routeCache.current[ride.id] = { ...(routeCache.current[ride.id] || {}), pickup: res.coords };
            await AsyncStorage.setItem('routeCache', JSON.stringify(routeCache.current)).catch(() => {});
          }
        }
        // pickup -> destination OR rider -> destination when Active (use cache if present)
        if (ride.pickupLatitude && ride.pickupLongitude && ride.destinationLatitude && ride.destinationLongitude) {
          const cache2 = routeCache.current[ride.id]?.drop;
          if (cache2 && cache2.length > 0) {
            setRouteToDrop(cache2);
            setRouteDistanceKm(routeCache.current[ride.id]?.dropDistanceKm ?? null);
          } else {
            const useStart = (ride.rideStatus === 'Active' && ride.riderLatitude && ride.riderLongitude) ? { latitude: ride.riderLatitude, longitude: ride.riderLongitude } : { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude };
            const res2 = await fetchRouteWithDistance(useStart, { latitude: ride.destinationLatitude, longitude: ride.destinationLongitude });
            setRouteToDrop(res2.coords);
            setRouteDistanceKm(res2.distanceKm);
            routeCache.current[ride.id] = { ...(routeCache.current[ride.id] || {}), drop: res2.coords, dropDistanceKm: res2.distanceKm };
            await AsyncStorage.setItem('routeCache', JSON.stringify(routeCache.current)).catch(() => {});
          }
        }

        // Fetch transporter number plate (if any) using selectedRiderID
        if (ride.selectedRiderID && !transportMap.current[ride.selectedRiderID]) {
          try {
            const tRes: any = await client.graphql({ query: getTransportRegister, variables: { id: ride.selectedRiderID } });
            const transporter = tRes?.data?.getTransportRegister;
            if (transporter) {
              transportMap.current[ride.selectedRiderID] = transporter;
              setTransporterTick(t => t + 1);
            }
          } catch (err) {
            console.warn('Failed to fetch transporter info', err);
          }
        }
      } catch (err) {
        console.warn('Route fetch failed', err);
      }
    })();
  }, [selectedIdx, rides]);

  // Fit map to polylines when routes change
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [...routeToPickup, ...routeToDrop];
    if (coords.length > 1) {
      try {
        (mapRef.current as any).fitToCoordinates(coords, { edgePadding: { top: 80, right: 80, bottom: 180, left: 80 }, animated: true });
      } catch (e) {}
    }
  }, [routeToPickup, routeToDrop]);

  // Action handlers
  const updateRideStatus = async (ride: any, status: string) => {
    try {
      await client.graphql({
        query: updateRideRequest,
        variables: {
          input: {
            id: ride.id,
            rideStatus: status
          }
        }
      });
      // Refresh rides after update
      const res: any = await client.graphql({
        query: listRideRequests,
        variables: {
          filter: {
            passengerEmail: { eq: ride.passengerEmail }
          },
          limit: 20,
          sortDirection: 'DESC',
        }
      });
      const items = res?.data?.listRideRequests?.items || [];
      items.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setRides(items);
    } catch (err) {
      // Optionally show error
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Text>Loading your ride requests…</Text>
    </View>;
  }

  if (!rides.length) {
    return <View style={styles.loadingContainer}>
      <Text>No ride requests found.</Text>
    </View>;
  }

  const selectedRide = rides[selectedIdx];

  let initialRegion = {
    latitude: selectedRide?.pickupLatitude || 0.0236,
    longitude: selectedRide?.pickupLongitude || 37.9062,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <MapView
        ref={mapRef}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.45 }}
        initialRegion={initialRegion}
      >
        <UrlTile
          urlTemplate="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=IXsiA7phXPF3BeMY5KKp"
          maximumZ={19}
          flipY={false}
        />
        {selectedRide?.riderLatitude && selectedRide?.riderLongitude && (
          <Marker coordinate={{ latitude: selectedRide.riderLatitude, longitude: selectedRide.riderLongitude }}>
            <View style={{ backgroundColor: '#1f8ef1', padding: 6, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{` ${transportMap.current[selectedRide.selectedRiderID]?.numberPlate || selectedRide.riderName || 'Rider'}`}</Text>
            </View>
          </Marker>
        )}
        {selectedRide?.pickupLatitude && selectedRide?.pickupLongitude && (
          <Marker coordinate={{ latitude: selectedRide.pickupLatitude, longitude: selectedRide.pickupLongitude }}>
            <View style={{ backgroundColor: '#27ae60', padding: 6, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>📍 Pick up</Text>
            </View>
          </Marker>
        )}
        {selectedRide?.destinationLatitude && selectedRide?.destinationLongitude && (
          <Marker coordinate={{ latitude: selectedRide.destinationLatitude, longitude: selectedRide.destinationLongitude }}>
            <View style={{ backgroundColor: '#9b59b6', padding: 6, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>🎯 Destination</Text>
            </View>
          </Marker>
        )}
        {/* Polylines */}
        {routeToPickup.length > 0 && selectedRide?.rideStatus !== 'Active' && <Polyline coordinates={routeToPickup} strokeColor="blue" strokeWidth={4} />}
        {routeToDrop.length > 0 && <Polyline coordinates={routeToDrop} strokeColor="#e58d29" strokeWidth={4} /> }
      </MapView>
      <Text style={styles.header}>Your Ride Requests</Text>
      <FlatList
        data={rides}
        horizontal
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        extraData={selectedIdx}
        renderItem={({ item, index }) => {
          const estCostNum = (selectedIdx === index && routeDistanceKm != null) ? ((item.riderRate || 0) * routeDistanceKm) : (item.estimatedCost || 0);
          return (
            <View style={[styles.card, selectedIdx === index && { borderColor: '#1f8ef1', borderWidth: 2 }]} 
              onTouchStart={() => setSelectedIdx(index)}>
              <Text style={styles.cardTitle}>{item.riderName || t.transporter}</Text>
              <Text>{t.status}: {item.rideStatus}</Text>
              {/* Route distance (pickup -> destination) */}
              <Text>{t.tripDistance}: {(selectedIdx === index && routeDistanceKm != null) ? routeDistanceKm.toFixed(2) : (item.distance ? item.distance.toFixed(2) : '...')} km</Text>
              <Text>{t.tripCost}: {(selectedIdx === index && routeDistanceKm != null)
                ? formatAmountSync((item.riderRate || 0) * routeDistanceKm, natCode, ratesMap)
                : (item.estimatedCost ? formatAmountSync(item.estimatedCost, natCode, ratesMap) : '...')}</Text>
              {/* Estimated / live cost */}
              <Text>{t.cost}: {formatAmountSync(estCostNum, natCode, ratesMap)}</Text>
              {/* Live backend-saved distance and cost */}
              <Text style={{ color: '#1f8ef1', fontWeight: 'bold' }}>{t.liveDistance}: {item.distance ? item.distance.toFixed(2) : '...'} km</Text>
              <Text style={{ color: '#1f8ef1', fontWeight: 'bold' }}>{t.liveCost}: {item.estimatedCost ? formatAmountSync(item.estimatedCost, natCode, ratesMap) : '...'}</Text>
              {/* Distance to pickup or live trip metrics for selected ride */}
              {/* Distance to pickup (OSRM road distance) */}
              {selectedIdx === index && item.riderLatitude && item.riderLongitude && item.rideStatus !== 'Active' && routeToPickup.length > 1 && (
                <Text>{t.distanceToPickup}: {(() => {
                  if (routeToPickup.length > 1) {
                    return (routeCache.current[item.id]?.pickupDistanceKm ?? '...');
                  }
                  return '...';
                })()} km</Text>
              )}
              {selectedIdx === index && item.rideStatus === 'Active' && routeDistanceKm != null ? <Text>{t.liveDistance}: {routeDistanceKm.toFixed(2)} km • {t.cost}: {formatAmountSync(item.estimatedCost || 0, natCode, ratesMap)}</Text> : null}
              <Text>{t.requested}: {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
              {/* Action buttons depending on status */}
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  {item.rideStatus === 'transportRequestYes' && (
                  <Text style={styles.actionBtn} onPress={() => updateRideStatus(item, 'Cancelled')}>{t.cancelRide}</Text>
                )}
                {/* Passenger cannot start/complete trips; those actions are performed by the transporter */}
              </View>
            </View>
          );
        }}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginLeft: 16
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    marginRight: 16,
    width: SCREEN_WIDTH * 0.8,
    elevation: 2,
    minHeight: 180,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  actionBtn: {
    color: '#fff',
    backgroundColor: '#1f8ef1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    overflow: 'hidden',
    fontWeight: 'bold',
  }
});