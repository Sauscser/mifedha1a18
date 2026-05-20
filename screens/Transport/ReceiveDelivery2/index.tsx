// Place at the very end of the file, after export default
const styles = StyleSheet.create({
  refreshBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 1000,
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
  },
});
// ...existing code...

  // Filter orders for carousel and map


  // Filter orders for carousel and map

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Modal,
  StyleSheet,
} from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import axios from "axios";
 
import MapView, { Marker, Polyline } from "react-native-maps";
import { getDistance } from "geolib";
// Removed PanResponder import
import { useNavigation } from "@react-navigation/native";

import { useExchange } from "../../../src/contexts/ExchangeContext";
import { formatAmountSync } from "../../../src/utils/exchange";
import { nationalityToCode } from "../../../src/utils/nationalityToCode";
import { useTranslation } from 'react-i18next';
import { translations } from './translation';

import { generateClient } from "aws-amplify/api";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import {
  listTransportOrders,
  getTransportOrder,
  getSMAccount,
  getBizna,
  getGroup,
  getCompany,
  getTransportRegister,
} from "../../../src/graphql/queries";
import {
  updateTransportOrder,
  updateSMAccount,
  updateGroup,
  updateCompany,
  createNonLoans,
  updateTransportRegister,
  updateBizna,
  createBenefitContributions2,
  sendNotification,
  createMessages,
} from "../../../src/graphql/mutations";
import { Linking } from "react-native";

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;
const CAROUSEL_HEIGHT = 220;
const MIN_CAROUSEL_TOP = 60;
const MAX_CAROUSEL_TOP = screenHeight - CAROUSEL_HEIGHT - 60;

  // Inline modal state for card details


const client = generateClient();

const TransportOrdersScreen = () => {

  // i18n translation setup
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  // ...existing state declarations...
  const [sellerToBuyerCoords, setSellerToBuyerCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [lastPolylineOrderId, setLastPolylineOrderId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalOrder, setModalOrder] = useState<any | null>(null);
  const [roadDistances, setRoadDistances] = useState<{ [orderId: string]: number }>({});
  const [roadDistanceLoading, setRoadDistanceLoading] = useState<string | null>(null);
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const flatListRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Filter orders for carousel and map (must be after orders and userEmail are declared)
  const filteredOrders = orders.filter(
    (item) =>
      item.customerEmail === userEmail &&
      item.transportRequest === "transportRequestYes"
  );

  // Polling: update transporter positions every minute from backend
  useEffect(() => {
    if (!filteredOrders.length) return;
    const interval = setInterval(async () => {
      try {
        const updatedOrders = await Promise.all(filteredOrders.map(async (order) => {
          const res = await client.graphql({ query: getTransportOrder, variables: { id: order.id } });
          const latest = ('data' in res && res.data.getTransportOrder) ? res.data.getTransportOrder : order;
          return {
            ...order,
            latitude: latest.latitude,
            longitude: latest.longitude,
          };
        }));
        setOrders((prevOrders) => prevOrders.map((o) => {
          const updated = updatedOrders.find((u) => u.id === o.id);
          return updated ? { ...o, latitude: updated.latitude, longitude: updated.longitude } : o;
        }));
      } catch (err) {
        // Ignore polling errors
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [filteredOrders.map(o => o.id).join(",")]);


  // Fetch road-following polyline from buyer to seller when selectedIndex changes
  useEffect(() => {
    if (selectedIndex === null || !filteredOrders[selectedIndex]) {
      setSellerToBuyerCoords([]);
      setLastPolylineOrderId(null);
      return;
    }
    const order = filteredOrders[selectedIndex];
    // Use sellerLatitude/sellerLongitude (seller) and deliveryLatitude/deliveryLongitude (buyer)
    if (
      order.sellerLatitude && order.sellerLongitude &&
      order.deliveryLatitude && order.deliveryLongitude
    ) {
      // Only fetch if not already fetched for this order
      if (lastPolylineOrderId === order.id) return;
      setLastPolylineOrderId(order.id);
      const url = `https://router.project-osrm.org/route/v1/driving/${order.deliveryLongitude},${order.deliveryLatitude};${order.sellerLongitude},${order.sellerLatitude}?overview=full&geometries=geojson`;
      axios.get(url)
        .then(res => {
          if (res.data.routes && res.data.routes.length > 0) {
            const coords = res.data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
            setSellerToBuyerCoords(coords);
          } else {
            setSellerToBuyerCoords([]);
          }
        })
        .catch(() => setSellerToBuyerCoords([]));
    } else {
      setSellerToBuyerCoords([]);
      setLastPolylineOrderId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, orders]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isLoading3, setIsLoading3] = useState(false);
  // Floating refresher spinner state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Animate spinner when refreshing
  useEffect(() => {
    if (isRefreshing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isRefreshing]);

  // Refresher handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Reuse fetch logic
      const attributes = await fetchUserAttributes();
      setUserEmail(attributes.email);
      let allOrders: any[] = [];
      let nextToken: string | null = null;
      do {
        const result: any = await client.graphql({
          query: listTransportOrders,
          variables: {
            nextToken,
            
          },
        });
        const { items, nextToken: newToken } = result.data.listTransportOrders;
        allOrders = [...allOrders, ...items];
        nextToken = newToken;
      } while (nextToken);
      setOrders(allOrders);
    } catch (err) {
      Alert.alert(t.error, t.errorRefreshOrders);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch user email and all transport orders with pagination
  useEffect(() => {
    const fetchOrdersAndUser = async () => {
      try {
        // Fetch user email
        const attributes = await fetchUserAttributes();
        setUserEmail(attributes.email);

        // Fetch orders
        let allOrders: any[] = [];
        let nextToken: string | null = null;

        do {
          const result: any = await client.graphql({
            query: listTransportOrders,
            variables: {
              nextToken,
              
            },
          });
          const { items, nextToken: newToken } = result.data.listTransportOrders;
          allOrders = [...allOrders, ...items];
          nextToken = newToken;
        } while (nextToken);

        setOrders(allOrders);
      } catch (err) {
        console.error("Error fetching orders or user:", err);
        Alert.alert(t.error, t.errorFetchOrders);
      } finally {
        setLoading(false);
      }
    };
    fetchOrdersAndUser();
  }, []);

  const { nationality, ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(nationality);

  const ChangeDeliveryLocation = (id: string) => {
    navigation.navigate("ChangeDeliveryLocation", { id });
  };


  

  const handleAcceptDelivery = async (id: string) => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const orderDtl: any = await client.graphql({ query: getTransportOrder, variables: { id } });
      const orderDtlz = orderDtl.data.getTransportOrder;

      // --- REFUND LOGIC ---
      if (orderDtlz.chmAcCommitmentStatus === "TransportChmCommitmentYes") {
        // Refund group (chama)
        // Fetch group to get current balance
        const groupRes = await client.graphql({
          query: getGroup,
          variables: { grpContact: orderDtlz.chmAcNumber },
        });
        const group = 'data' in groupRes ? groupRes.data.getGroup : null;
        const currentGrpBal = group && group.grpBal ? parseFloat(group.grpBal) : 0;


        await client.graphql({
          query: updateGroup,
          variables: {
            input: {
              grpContact: orderDtlz.chmAcNumber,
              grpBal: currentGrpBal + parseFloat(orderDtlz.orderCost),
            },
          },
        });
      } else if (orderDtlz.chmAcCommitmentStatus === "TransportChmCommitmentNo") {
        // Refund transporter SMAccount
        const smAccountRes = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: orderDtlz.transportOwnerEmail },
        });
        const smAccount = 'data' in smAccountRes ? smAccountRes.data.getSMAccount : null;
        if (smAccount) {
          await client.graphql({
            query: updateSMAccount,
            variables: {
              input: {
                awsemail: orderDtlz.transportOwnerEmail,
                balance: parseFloat(smAccount.balance) + parseFloat(orderDtlz.orderCost),
              },
            },
          });
        }
      }

      // ...existing code for all other mutations...
      const TransportDtls: any = await client.graphql({
        query: getTransportRegister,
        variables: { id: orderDtlz.bizAc },
      });
      const transportDtlz = TransportDtls.data.getTransportRegister;

      const bizResult: any = await client.graphql({
        query: getBizna,
        variables: { BusKntct: orderDtlz.sellerContact },
      });
      const biz = bizResult.data.getBizna;

      const buyerDtls: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: orderDtlz.customerEmail },
      });
      const buyerDtlsz = buyerDtls.data.getSMAccount;

      const CompDtls: any = await client.graphql({
        query: getCompany,
        variables: { AdminId: "BaruchHabaB'ShemAdonai2" },
      });
      const compDtls = CompDtls.data.getCompany;

      const compEarningShare = compDtls.transportCompanyShare;
      const CompEarning = compEarningShare * parseFloat(orderDtlz.deliveryCost);
      const TransporterEarning = parseFloat(orderDtlz.deliveryCost) - CompEarning;

      const fee = parseFloat(orderDtlz.orderCost) * parseFloat(compDtls.biznaCashSaleFee);
      const benefit = fee * parseFloat(compDtls.p2BBenCom) * 0.01;
      const compEarnings = fee - 2 * benefit;

      // All other mutations (unchanged)

      await client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            companyEarningBal:
              parseFloat(compDtls.companyEarningBal) + CompEarning + compEarnings,
            companyEarning: parseFloat(compDtls.companyEarning) + CompEarning + compEarnings,
          },
        },
      });

      await client.graphql({
        query: updateBizna,
        variables: {
          input: {
            BusKntct: orderDtlz.sellerContact,
            netEarnings: (biz.netEarnings + orderDtlz.orderCost).toFixed(0),
            earningsBal: (biz.earningsBal + orderDtlz.orderCost).toFixed(0),
            benefitsAmount: parseFloat(biz.benefitsAmount) + benefit,
          },
        },
      });

      await client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: orderDtlz.customerEmail,
            benefitsAmount: parseFloat(buyerDtlsz.benefitsAmount) + benefit,
            ttlNonLonsSentSM: parseFloat(buyerDtlsz.ttlNonLonsSentSM) + parseFloat(orderDtlz.orderCost),

          },
        },
      });

      await client.graphql({
        query: createBenefitContributions2,
        variables: {
          input: {
            benefitsID: "String",
            benefactorAc: orderDtlz.sellerContact,
            benefactorPhone: orderDtlz.sellerName,
            beneficiaryAc: attributes.email,
            beneficiaryPhone: attributes.phone_number || "String",
            creatorEmail: attributes.email,
            prodName: orderDtlz.deliveryDesc,
            creatorName: buyerDtlsz.name,
            owner: user.userId,
            prodCost: 0,
            benefitsAmount: benefit,
            beneficiaryType: "Pal",
            prodDesc: orderDtlz.deliveryDesc,
            benefitStatus: "Active",
            amount: benefit,
          },
        },
      });

      await client.graphql({
        query: updateTransportOrder,
        variables: {
          input: {
            id,
            engagementStatus: "TransportNotEngaged",
            transportRequest: "transportRequestNo",
          },
        },
      });

      await client.graphql({
        query: updateTransportRegister,
        variables: {
          input: {
            id: orderDtlz.bizAc,
            Earnings: TransporterEarning + parseFloat(transportDtlz.Earnings),
          },
        },
      });
      Alert.alert(t.success, t.deliveryReceived);

      // Notify transporter
      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail: orderDtlz.transportOwnerEmail,
          title: t.deliveryReceivedTitle,
          body: t.deliveryReceivedBody
            .replace('{buyerName}', orderDtlz.buyerName)
            .replace('{deliveryDesc}', orderDtlz.deliveryDesc)
            .replace('{buyerContact}', orderDtlz.buyerContact),
        },
      });
      // Create message for transporter
      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            sender: attributes.email,
            recipient: orderDtlz.transportOwnerEmail,
            content: t.deliveryReceivedBody
              .replace('{buyerName}', orderDtlz.buyerName)
              .replace('{deliveryDesc}', orderDtlz.deliveryDesc)
              .replace('{buyerContact}', orderDtlz.buyerContact),
            type: 'delivery',
          },
        },
      });
    } catch (err) {
      console.error("Accept error:", err);
      Alert.alert(t.error, t.deliveryAcceptError);
    } finally {
      setIsLoading(false);
    }
  };

  const CancelRequest = async (id: string) => {
    setIsLoading2(true);
    try {
      await client.graphql({
        query: updateTransportOrder,
        variables: { input: { id, transportRequest: "transportRequestNo" } },
      });
      Alert.alert("Success", "Delivery request cancelled!");
        Alert.alert(t.success, t.deliveryCancelSuccess);
      } catch (err) {
      console.error("Cancel error:", err);
      Alert.alert("Error", "Could not handle delivery.");
      Alert.alert(t.error, t.deliveryCancelError);
    } finally {
      setIsLoading2(false);
    }
  };

  // Carousel is now fixed, not draggable

  if (loading) return <Text>Loading...</Text>;
  if (loading) return <Text>{t.loading}</Text>;
  if (!orders.length || !userEmail) return <Text>{t.noOrders}</Text>;

  return (
    <View style={{ flex: 1 }}>
      {/* Floating refresher spinner */}
      {/* Floating Refresh Spinner Button (matches AcceptTransportRequest) */}
      <TouchableOpacity
        onPress={isRefreshing ? undefined : handleRefresh}
        style={styles.refreshBtn}
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
            }],
            opacity: isRefreshing ? 0.7 : 1,
          }}
        >
          <FontAwesome name="refresh" size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: -1.2921,
          longitude: 36.8219,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {filteredOrders.map((item, idx) => (
          <React.Fragment key={item.id}>
            {/* Polyline from buyer to seller (road-following, orange) for selected card/marker only */}
            {selectedIndex === idx && item.sellerLatitude && item.sellerLongitude && item.deliveryLatitude && item.deliveryLongitude && sellerToBuyerCoords.length >= 2 && (
              <Polyline
                coordinates={sellerToBuyerCoords}
                strokeColor="#e29d58"
                strokeWidth={5}
                zIndex={10}
              />
            )}
            {/* Transporter Marker (Blue #0077cc) */}
            <Marker
              key={item.id + "_transporter"}
              coordinate={{ latitude: item.latitude, longitude: item.longitude }}
              title={item.transportName}
              pinColor="#0077cc"
              onPress={() => {
                setSelectedIndex(idx);
                flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                mapRef.current?.animateToRegion({
                  latitude: item.latitude,
                  longitude: item.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }, 350);
              }}
            >
              <View style={{ backgroundColor: '#0077cc', padding: 6, borderRadius: 16, borderWidth: 2, borderColor: selectedIndex === idx ? '#e58d29' : '#fff' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>T</Text>
              </View>
            </Marker>
            {/* Seller Marker (Orange #e29d58) */}
            {item.sellerLatitude && item.sellerLongitude && (
              <Marker
                key={item.id + "_seller"}
                coordinate={{ latitude: item.sellerLatitude, longitude: item.sellerLongitude }}
                title={item.sellerName}
                pinColor="#e29d58"
                onPress={() => {
                  setSelectedIndex(idx);
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                  mapRef.current?.animateToRegion({
                    latitude: item.sellerLatitude,
                    longitude: item.sellerLongitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }, 350);
                }}
              >
                <View style={{ backgroundColor: '#e29d58', padding: 6, borderRadius: 16, borderWidth: 2, borderColor: selectedIndex === idx ? '#38b6ff' : '#fff' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>S</Text>
                </View>
              </Marker>
            )}
            {/* Buyer Marker (Green #2ca02c, uses deliveryLatitude/deliveryLongitude) */}
            {item.deliveryLatitude && item.deliveryLongitude && (
              <Marker
                key={item.id + "_buyer"}
                coordinate={{ latitude: item.deliveryLatitude, longitude: item.deliveryLongitude }}
                title={item.buyerName}
                pinColor="#2ca02c"
                onPress={() => {
                  setSelectedIndex(idx);
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                  mapRef.current?.animateToRegion({
                    latitude: item.deliveryLatitude,
                    longitude: item.deliveryLongitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }, 350);
                }}
              >
                <View style={{ backgroundColor: '#2ca02c', padding: 6, borderRadius: 16, borderWidth: 2, borderColor: selectedIndex === idx ? '#e29d58' : '#fff' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>B</Text>
                </View>
              </Marker>
            )}
          </React.Fragment>
        ))}
      </MapView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          zIndex: 100,
          bottom: 24,
          // height: CAROUSEL_HEIGHT, // Removed fixed height for responsive cards
        }}
      >
        <FlatList
          ref={flatListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          extraData={selectedIndex}
          renderItem={({ item, index }) => {
          const orderCostDisplay = formatAmountSync(
            Number(item.orderCost),
            userCurrencyKey,
            ratesMap
          );
          // Calculate delivery cost as transportRate * road distance (if available)
          let computedDeliveryCost = item.deliveryCost;
          if (
            item.transportRate !== undefined && item.transportRate !== null &&
            roadDistances[item.id]
          ) {
            computedDeliveryCost = Number(item.transportRate) * (roadDistances[item.id] / 1000);
          }
          const deliveryCostDisplay = formatAmountSync(
            Number(computedDeliveryCost),
            userCurrencyKey,
            ratesMap
          );
          let aerialDistance = null;
          if (
            item.sellerLatitude && item.sellerLongitude &&
            item.buyerLatitude && item.buyerLongitude
          ) {
            aerialDistance = getDistance(
              { latitude: Number(item.sellerLatitude), longitude: Number(item.sellerLongitude) },
              { latitude: Number(item.buyerLatitude), longitude: Number(item.buyerLongitude) }
            ) / 1000;
          }
          return (
            <View
              style={{
                width: screenWidth * 0.85,
                marginRight: 16,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: selectedIndex === index ? '#eaf6ff' : '#fff',
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 5,
                minHeight: 0,
                flexShrink: 1,
                justifyContent: 'center',
                borderWidth: selectedIndex === index ? 2 : 0,
                borderColor: selectedIndex === index ? '#38b6ff' : 'transparent',
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedIndex(index);
                  // Center transporter marker
                  mapRef.current?.animateToRegion({
                    latitude: item.latitude,
                    longitude: item.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }, 350);
                }}
                onLongPress={() => {
                  setModalOrder(item);
                  setModalVisible(true);
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  <Text style={{ color: '#0077cc' }}>{t.transporter} </Text>{item.transportName}
                  <Text style={{ color: '#888' }}>  ||  </Text>
                  <Text style={{ color: '#e58d29' }}>{t.seller} </Text>{item.sellerName}
                  <Text style={{ color: '#888' }}>  ||  </Text>
                  <Text style={{ color: '#2ca02c' }}>{t.buyer} </Text>{item.buyerName}
                </Text>
                <Text style={{ color: '#0077cc', marginTop: 8, fontWeight: '900', letterSpacing: 0.2 }}>
                  {t.longPressDetails}
                </Text>
              </TouchableOpacity>

              {/* Button logic below */}
              <View style={{ flexDirection: 'row', marginTop: 14, gap: 12 }}>
                {/* Receive Delivery button */}
                {item.engagementStatus === "TransportEngaged" && item.dutyStatus === "TransportNotOnduty" && (
                  <TouchableOpacity
                    style={{ backgroundColor: '#38b6ff', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 8 }}
                    onPress={() => handleAcceptDelivery(item.id)}
                    disabled={isLoading}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Receive Delivery</Text>
                                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{t.receiveDelivery}</Text>
                  </TouchableOpacity>
                )}

                {/* Change Location and Cancel buttons */}
                {item.transportRequest === "transportRequestYes" && item.engagementStatus === "TransportNotEngaged" && (
                  <>
                    <TouchableOpacity
                      style={{ backgroundColor: '#0077cc', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 8 }}
                      onPress={() => ChangeDeliveryLocation(item.id)}
                      disabled={isLoading2}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Change Location</Text>
                                          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{t.changeLocation}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: '#e58d29', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 8 }}
                      onPress={() => CancelRequest(item.id)}
                      disabled={isLoading2}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Cancel</Text>
                                          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{t.cancel}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        }}
      />
      {/* Inline Modal for more details */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Order Details</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{t.orderDetails}</Text>
            {modalOrder && (() => {
              // Calculate delivery cost as transportRate * road distance (if available)
              let computedDeliveryCost = modalOrder.deliveryCost;
              if (
                modalOrder.transportRate !== undefined && modalOrder.transportRate !== null &&
                roadDistances[modalOrder.id]
              ) {
                computedDeliveryCost = Number(modalOrder.transportRate) * (roadDistances[modalOrder.id] / 1000);
              }
              let hoursAgo = null;
              if (modalOrder.deliveryStart) {
                hoursAgo = ((Date.now() - modalOrder.deliveryStart) / 3600000).toFixed(2);
              }
              return (
                <>
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.transporter}</Text> {modalOrder.transportName}</Text>
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.seller}</Text> {modalOrder.sellerName}</Text>
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.buyer}</Text> {modalOrder.buyerName}</Text>
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.contact}</Text> {modalOrder.transportkntct}</Text>
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.orderCost}</Text> {formatAmountSync(Number(modalOrder.orderCost), userCurrencyKey, ratesMap)}</Text>
                  {modalOrder.transportRate !== undefined && modalOrder.transportRate !== null && (
                    <Text style={{ marginBottom: 4 }}>
                      <Text style={{ fontWeight: 'bold' }}>{t.transportRate}</Text> {formatAmountSync(Number(modalOrder.transportRate), userCurrencyKey, ratesMap)}
                    </Text>
                  )}
                  {modalOrder.sellerLatitude && modalOrder.sellerLongitude && modalOrder.deliveryLatitude && modalOrder.deliveryLongitude && (
                    roadDistanceLoading === modalOrder.id ? (
                      <Text style={{ marginBottom: 4, color: '#0077cc', fontWeight: 'bold' }}>{t.loadingRoadDistance}</Text>
                    ) : roadDistances[modalOrder.id] ? (
                      <Text style={{ marginBottom: 4, color: '#0077cc', fontWeight: 'bold' }}>
                        {t.roadDistance} {(roadDistances[modalOrder.id] / 1000).toFixed(2)} km
                      </Text>
                    ) : null
                  )}
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.deliveryCost}</Text> {formatAmountSync(Number(computedDeliveryCost), userCurrencyKey, ratesMap)}</Text>
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.status}</Text> {modalOrder.engagementStatus}</Text>
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.description}</Text> {modalOrder.deliveryDesc}</Text>
                  <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>{t.started}</Text> {modalOrder.deliveryStart ? new Date(modalOrder.deliveryStart).toLocaleString() : ''}</Text>
                  {hoursAgo && (
                    <Text style={{ marginBottom: 4, color: '#888' }}>({hoursAgo} {t.hoursAgo})</Text>
                  )}
                </>
              );
            })()}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 18, alignSelf: 'center', backgroundColor: '#e58d29', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
                          <Text style={{ color: 'white', fontWeight: 'bold' }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  </View>
);
};

export default TransportOrdersScreen;


