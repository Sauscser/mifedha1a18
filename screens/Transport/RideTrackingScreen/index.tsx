import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { getTransportRegister } from '../../../src/graphql/queries';
import { onUpdateRideRequest } from '../../../src/graphql/subscriptions';
import { Observable } from 'zen-observable-ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { buildOsrmRouteUrl } from '../../../src/config/osrm';

const client = generateClient();
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

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




import { updateRideRequest } from '../../../src/graphql/mutations';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';

export default function RideTrackingScreen({ navigation, route }: any) {
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
                query: LIST_RIDE_REQUESTS_SAFE_QUERY,
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
  const [rides, setRides] = useState<any[]>(() => route?.params?.pendingRides || []);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [mapLabelPoints, setMapLabelPoints] = useState<{
    rider: { x: number; y: number } | null;
    pickup: { x: number; y: number } | null;
    destination: { x: number; y: number } | null;
  }>({ rider: null, pickup: null, destination: null });
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
          query: LIST_RIDE_REQUESTS_SAFE_QUERY,
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
      const url = buildOsrmRouteUrl(start, end, { overview: 'full', geometries: 'geojson' });
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
        query: LIST_RIDE_REQUESTS_SAFE_QUERY,
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

  const selectedRide = rides[selectedIdx];

  const refreshMapLabelPoints = async () => {
    const map = mapRef.current as any;
    if (!map || !selectedRide) return;
    try {
      const [riderPt, pickupPt, destPt] = await Promise.all([
        selectedRide?.riderLatitude && selectedRide?.riderLongitude
          ? map.pointForCoordinate({ latitude: selectedRide.riderLatitude, longitude: selectedRide.riderLongitude })
          : Promise.resolve(null),
        selectedRide?.pickupLatitude && selectedRide?.pickupLongitude
          ? map.pointForCoordinate({ latitude: selectedRide.pickupLatitude, longitude: selectedRide.pickupLongitude })
          : Promise.resolve(null),
        selectedRide?.destinationLatitude && selectedRide?.destinationLongitude
          ? map.pointForCoordinate({ latitude: selectedRide.destinationLatitude, longitude: selectedRide.destinationLongitude })
          : Promise.resolve(null),
      ]);
      setMapLabelPoints({
        rider: riderPt || null,
        pickup: pickupPt || null,
        destination: destPt || null,
      });
    } catch {
      // Ignore mapping failures; labels will refresh on next region callback.
    }
  };

  useEffect(() => {
    refreshMapLabelPoints();
  }, [selectedIdx, rides, cardsCollapsed]);

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

  let initialRegion = {
    latitude: selectedRide?.pickupLatitude || 0.0236,
    longitude: selectedRide?.pickupLongitude || 37.9062,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[styles.mapContainer, { height: cardsCollapsed ? SCREEN_HEIGHT * 0.78 : SCREEN_HEIGHT * 0.40 }]}> 
        <MapView
          ref={mapRef}
          style={{ width: SCREEN_WIDTH, height: '100%' }}
          initialRegion={initialRegion}
          onMapReady={refreshMapLabelPoints}
          onRegionChangeComplete={refreshMapLabelPoints}
        >
          <UrlTile
            urlTemplate="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=IXsiA7phXPF3BeMY5KKp"
            maximumZ={19}
            flipY={false}
          />
          {selectedRide?.riderLatitude && selectedRide?.riderLongitude && (
            <Marker
              coordinate={{ latitude: selectedRide.riderLatitude, longitude: selectedRide.riderLongitude }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges
            >
              <View style={[styles.mapMarkerDot, styles.riderMarkerDot]} />
            </Marker>
          )}
          {selectedRide?.pickupLatitude && selectedRide?.pickupLongitude && (
            <Marker
              coordinate={{ latitude: selectedRide.pickupLatitude, longitude: selectedRide.pickupLongitude }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges
            >
              <View style={[styles.mapMarkerDot, styles.pickupMarkerDot]} />
            </Marker>
          )}
          {selectedRide?.destinationLatitude && selectedRide?.destinationLongitude && (
            <Marker
              coordinate={{ latitude: selectedRide.destinationLatitude, longitude: selectedRide.destinationLongitude }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges
            >
              <View style={[styles.mapMarkerDot, styles.destinationMarkerDot]} />
            </Marker>
          )}
          {/* Polylines */}
          {routeToPickup.length > 0 && selectedRide?.rideStatus !== 'Active' && <Polyline coordinates={routeToPickup} strokeColor="blue" strokeWidth={4} />}
          {routeToDrop.length > 0 && <Polyline coordinates={routeToDrop} strokeColor="#e58d29" strokeWidth={4} /> }
        </MapView>

        <View style={styles.mapTextOverlay} pointerEvents="none">
          {mapLabelPoints.rider && (
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
                Rider: {transportMap.current[selectedRide.selectedRiderID]?.numberPlate || selectedRide.riderName || 'Rider'}
              </Text>
            </>
          )}

          {mapLabelPoints.pickup && (
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
                Pick up
              </Text>
            </>
          )}

          {mapLabelPoints.destination && (
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
                Destination
              </Text>
            </>
          )}
        </View>
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
        <View style={styles.cardsPanel}>
          <View style={styles.cardsHeaderRow}>
            <Text style={styles.header}>Your Ride Requests</Text>
            <TouchableOpacity style={styles.panelToggleBtn} onPress={() => setCardsCollapsed(true)}>
              <Text style={styles.panelToggleText}>{t.hide}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={rides}
            horizontal
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 18 }}
            extraData={selectedIdx}
            renderItem={({ item, index }) => {
              const isSelected = selectedIdx === index;
              const liveDistanceNum = typeof item.distance === 'number' ? item.distance : null;
              const routeDistanceNum = (isSelected && routeDistanceKm != null) ? routeDistanceKm : null;
              const riderRateNum = Number(item.riderRate || 0);
              const liveCostNum = typeof item.estimatedCost === 'number' ? item.estimatedCost : null;
              const routeCostNum = routeDistanceNum != null ? (routeDistanceNum * riderRateNum) : null;
              const liveRateText = `${formatAmountSync(riderRateNum, natCode, ratesMap)}/km`;
              return (
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[styles.card, isSelected && styles.cardSelected, isSelected && styles.cardExpanded]}
                  onPress={() => setSelectedIdx(index)}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.riderName || t.transporter}</Text>
                    <View style={styles.statusChip}>
                      <Text style={styles.statusChipText}>{item.rideStatus}</Text>
                    </View>
                  </View>

                  <View style={styles.metricStack}>
                    <Text style={styles.compactMetricLine}>
                      <Text style={styles.compactMetricLive}>{liveDistanceNum != null ? `${liveDistanceNum.toFixed(2)} km` : '...'}</Text>
                      <Text style={styles.compactMetricConnector}> {t.of} </Text>
                      <Text style={styles.compactMetricRoute}>{routeDistanceNum != null ? `${routeDistanceNum.toFixed(2)} km` : '...'}</Text>
                      <Text style={styles.compactMetricRate}> @ {liveRateText}</Text>
                    </Text>
                    <Text style={styles.compactMetricLine}>
                      <Text style={styles.compactMetricLive}>{liveCostNum != null ? formatAmountSync(liveCostNum, natCode, ratesMap) : '...'}</Text>
                      <Text style={styles.compactMetricConnector}> {t.of} </Text>
                      <Text style={styles.compactMetricRoute}>{routeCostNum != null ? formatAmountSync(routeCostNum, natCode, ratesMap) : '...'}</Text>
                    </Text>
                  </View>

                  <Text style={styles.metaText}>{t.requested}: {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>

                  {isSelected && (
                    <>
                      {item.riderLatitude && item.riderLongitude && item.rideStatus !== 'Active' && routeToPickup.length > 1 && (
                        <Text style={styles.metaText}>{t.distanceToPickup}: {(routeCache.current[item.id]?.pickupDistanceKm ?? '...')} km</Text>
                      )}
                      <View style={{ flexDirection: 'row', marginTop: 8 }}>
                        {item.rideStatus === 'transportRequestYes' && (
                          <Text style={styles.actionBtn} onPress={() => updateRideStatus(item, 'Cancelled')}>{t.cancelRide}</Text>
                        )}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            }}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
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
    marginTop: 0,
    marginLeft: 0
  },
  mapContainer: {
    width: SCREEN_WIDTH,
  },
  cardsPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  cardsHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelToggleBtn: {
    backgroundColor: '#eef5ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  panelToggleText: {
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
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginRight: 16,
    width: SCREEN_WIDTH * 0.68,
    elevation: 2,
    minHeight: 122,
    justifyContent: 'flex-start',
  },
  cardSelected: {
    borderColor: '#1f8ef1',
    borderWidth: 2,
  },
  cardExpanded: {
    minHeight: 220,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    backgroundColor: '#e8f3ff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusChipText: {
    color: '#1f8ef1',
    fontSize: 12,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricItem: {
    width: '48%',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    color: '#1b1b1b',
    fontWeight: '700',
  },
  metaText: {
    fontSize: 12,
    color: '#555',
  },
  liveMetaText: {
    fontSize: 12,
    color: '#1f8ef1',
    fontWeight: '700',
  },
  metricStack: {
    marginTop: 8,
    gap: 6,
  },
  compactMetricLine: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  compactMetricLive: {
    color: '#17803d',
    fontWeight: '700',
  },
  compactMetricConnector: {
    color: '#e58d29',
    fontWeight: '900',
  },
  compactMetricRoute: {
    color: '#0b63c7',
    fontWeight: '700',
  },
  compactMetricRate: {
    color: '#444',
    fontWeight: '700',
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
});