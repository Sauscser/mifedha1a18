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
} from "react-native";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from "react-native-maps";
import { getDistance } from "geolib";
import { buildOsrmRouteUrl } from "../../../src/config/osrm";
// Removed PanResponder import
import { useNavigation } from "@react-navigation/native";

import { useExchange } from "../../../src/contexts/ExchangeContext";
import { formatAmountSync } from "../../../src/utils/exchange";
import { nationalityToCode } from "../../../src/utils/nationalityToCode";
import { useTranslation } from "react-i18next";
import { translations } from "./translation";

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
  getNonLoans,
  getTransportBizna,
} from "../../../src/graphql/queries";
import {
  updateTransportOrder,
  updateSMAccount,
  updateGroup,
  updateCompany,
  updateNonLoans,
  updateTransportRegister,
  updateBizna,
  createBenefitContributions2,
} from "../../../src/graphql/mutations";
import { Linking } from "react-native";

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;
const CAROUSEL_HEIGHT = 220;
const MIN_CAROUSEL_TOP = 60;
const MAX_CAROUSEL_TOP = screenHeight - CAROUSEL_HEIGHT - 60;

  // Inline modal state for card details


const client = generateClient();

const decodeOSRMLine = (coordinates: number[][]) =>
  coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));

const TransportOrdersScreen = () => {
  // Route state for selected order legs
  const [routeSellerToBuyerCoords, setRouteSellerToBuyerCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeTransportToSellerCoords, setRouteTransportToSellerCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeTransportToBuyerCoords, setRouteTransportToBuyerCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  // Inline modal state for card details (must be inside component)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalOrder, setModalOrder] = useState<any | null>(null);
  // Road distance cache and loading state (must be inside component)
  const [roadDistances, setRoadDistances] = useState<{ [orderId: string]: number }>({});
  const [roadDistanceLoading, setRoadDistanceLoading] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  const fetchOrdersAndUser = async () => {
    try {
      setRefreshingOrders(true);
      const attributes = await fetchUserAttributes();
      setUserEmail(attributes.email);

      let allOrders: any[] = [];
      let nextToken: string | null = null;

      do {
        const result: any = await client.graphql({
          query: listTransportOrders,
          variables: { nextToken },
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
      setRefreshingOrders(false);
    }
  };

  const reloadOrderById = async (id: string) => {
    try {
      const result: any = await client.graphql({
        query: getTransportOrder,
        variables: { id },
      });
      const freshOrder = result.data.getTransportOrder;
      if (freshOrder) {
        setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...freshOrder } : order)));
      }
      return freshOrder;
    } catch (err) {
      console.error('Reload order failed:', err);
      return null;
    }
  };

  const handleSelectOrder = async (index: number, item: any) => {
    setSelectedIndex(index);
    const freshOrder = await reloadOrderById(item.id);
    const target = freshOrder || item;
    mapRef.current?.animateToRegion(
      {
        latitude: Number(target.latitude),
        longitude: Number(target.longitude),
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      350
    );
  };

  // Fetch road distance when modalOrder changes and has valid coordinates
  useEffect(() => {
    const fetchRoadDistance = async () => {
      if (!modalOrder || !modalOrder.sellerLatitude || !modalOrder.sellerLongitude || !modalOrder.deliveryLatitude || !modalOrder.deliveryLongitude) return;
      if (roadDistances[modalOrder.id]) return;
      setRoadDistanceLoading(modalOrder.id);
      try {
        const url = buildOsrmRouteUrl(
          {
            latitude: Number(modalOrder.sellerLatitude),
            longitude: Number(modalOrder.sellerLongitude),
          },
          {
            latitude: Number(modalOrder.deliveryLatitude),
            longitude: Number(modalOrder.deliveryLongitude),
          },
          { overview: 'false' }
        );
        const res = await axios.get(url);
        if (res.data.routes && res.data.routes.length > 0) {
          const meters = res.data.routes[0].distance;
          setRoadDistances(prev => ({ ...prev, [modalOrder.id]: meters }));
        }
      } catch (e) {
        // ignore
      } finally {
        setRoadDistanceLoading(null);
      }
    };
    fetchRoadDistance();
  }, [modalOrder]);

  // Fetch the selected order's OSRM route geometry for the polyline legs
  useEffect(() => {
    const fetchRoute = async (
      start: { latitude: number; longitude: number },
      end: { latitude: number; longitude: number }
    ) => {
      try {
        const url = buildOsrmRouteUrl(start, end, { overview: 'full', geometries: 'geojson' });
        const res = await axios.get(url);
        if (res.data.routes && res.data.routes.length > 0 && res.data.routes[0].geometry?.coordinates) {
          return decodeOSRMLine(res.data.routes[0].geometry.coordinates);
        }
      } catch (e) {
        console.warn('Failed to fetch OSRM route:', e);
      }
      return [];
    };

    const fetchSelectedRoute = async () => {
      if (selectedIndex === null || !userEmail) {
        setRouteSellerToBuyerCoords([]);
        setRouteTransportToSellerCoords([]);
        setRouteTransportToBuyerCoords([]);
        return;
      }

      const filteredOrders = orders.filter((item) => item.buyerOfficerEmail === userEmail);
      const selectedOrder = filteredOrders[selectedIndex];
      if (!selectedOrder) {
        setRouteSellerToBuyerCoords([]);
        setRouteTransportToSellerCoords([]);
        setRouteTransportToBuyerCoords([]);
        return;
      }

      const sellerCoords =
        selectedOrder.sellerLatitude && selectedOrder.sellerLongitude
          ? {
              latitude: Number(selectedOrder.sellerLatitude),
              longitude: Number(selectedOrder.sellerLongitude),
            }
          : null;
      const buyerCoords =
        selectedOrder.deliveryLatitude && selectedOrder.deliveryLongitude
          ? {
              latitude: Number(selectedOrder.deliveryLatitude),
              longitude: Number(selectedOrder.deliveryLongitude),
            }
          : null;
      const transporterCoords =
        selectedOrder.latitude && selectedOrder.longitude
          ? {
              latitude: Number(selectedOrder.latitude),
              longitude: Number(selectedOrder.longitude),
            }
          : null;

      if (!sellerCoords || !buyerCoords) {
        setRouteSellerToBuyerCoords([]);
        setRouteTransportToSellerCoords([]);
        setRouteTransportToBuyerCoords([]);
        return;
      }

      if (
        selectedOrder.engagementStatus === 'TransportEngaged' &&
        selectedOrder.dutyStatus === 'TransportNotOnduty' &&
        transporterCoords &&
        buyerCoords
      ) {
        const transportToBuyer = await fetchRoute(transporterCoords, buyerCoords);
        setRouteTransportToBuyerCoords(transportToBuyer);
        setRouteTransportToSellerCoords([]);
        setRouteSellerToBuyerCoords([]);
      } else {
        const sellerToBuyer = await fetchRoute(sellerCoords, buyerCoords);
        setRouteSellerToBuyerCoords(sellerToBuyer);
        if (transporterCoords) {
          const transportToSeller = await fetchRoute(transporterCoords, sellerCoords);
          setRouteTransportToSellerCoords(transportToSeller);
        } else {
          setRouteTransportToSellerCoords([]);
        }
        setRouteTransportToBuyerCoords([]);
      }
    };

    fetchSelectedRoute();
  }, [selectedIndex, orders, userEmail]);

  const navigation = useNavigation();
  const mapRef = useRef(null);
  const flatListRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isLoading3, setIsLoading3] = useState(false);

  // Fetch user email and all transport orders with pagination
  useEffect(() => {
    (async () => {
      await fetchOrdersAndUser();
      setLoading(false);
    })();
  }, []);

  const { nationality, ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(nationality);

  const [changeLocationModalVisible, setChangeLocationModalVisible] = useState(false);
  const [changeLocationOrder, setChangeLocationOrder] = useState<any | null>(null);
  const [selectedChangeLocation, setSelectedChangeLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isChangeLocationLoading, setIsChangeLocationLoading] = useState(false);

  const openChangeLocationModal = (order: any) => {
    setChangeLocationOrder(order);
    setSelectedChangeLocation(
      order?.deliveryLatitude && order?.deliveryLongitude
        ? {
            latitude: Number(order.deliveryLatitude),
            longitude: Number(order.deliveryLongitude),
          }
        : null
    );
    setChangeLocationModalVisible(true);
  };

  const closeChangeLocationModal = () => {
    setChangeLocationModalVisible(false);
    setChangeLocationOrder(null);
    setSelectedChangeLocation(null);
  };

  const handleChangeLocationMapLongPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedChangeLocation({ latitude, longitude });
  };

  const confirmChangeDeliveryLocation = async () => {
    if (!changeLocationOrder) return;
    if (!selectedChangeLocation) {
      Alert.alert(t.selectLocation, t.selectLocationInstruction);
      return;
    }

    setIsChangeLocationLoading(true);
    try {
      const orderDtl: any = await client.graphql({
        query: getTransportOrder,
        variables: { id: changeLocationOrder.id },
      });
      const orderDtlz = orderDtl?.data?.getTransportOrder;
      if (!orderDtlz) {
        Alert.alert(t.error, t.couldNotFetchOrderDetails);
        return;
      }
      if (orderDtlz.engagementStatus === "TransportEngaged") {
        Alert.alert(t.error, t.cannotChangeLocationEngaged);
        return;
      }

      await client.graphql({
        query: updateTransportOrder,
        variables: {
          input: {
            id: changeLocationOrder.id,
            deliveryLatitude: String(selectedChangeLocation.latitude),
            deliveryLongitude: String(selectedChangeLocation.longitude),
          },
        },
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === changeLocationOrder.id
            ? {
                ...order,
                deliveryLatitude: String(selectedChangeLocation.latitude),
                deliveryLongitude: String(selectedChangeLocation.longitude),
              }
            : order
        )
      );

      Alert.alert(t.success, t.deliveryLocationUpdated);
      closeChangeLocationModal();
    } catch (err) {
      console.error("Change location failed:", err);
      Alert.alert(t.error, t.failedUpdateDeliveryLocation);
    } finally {
      setIsChangeLocationLoading(false);
    }
  };

  const handleAcceptDelivery = async (id: string) => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const orderDtl: any = await client.graphql({ query: getTransportOrder, variables: { id } });
      const orderDtlz = orderDtl.data.getTransportOrder;

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

      const nonLoanResult: any = await client.graphql({
        query: getNonLoans,
        variables: { id: orderDtlz.deliveryID },
      });
      const nonLoanDtlz = nonLoanResult?.data?.getNonLoans;

      const compEarningShare = Number(compDtls.transportCompanyShare ?? 0) / 100;
      const companyShare = parseFloat(orderDtlz.deliveryCost) * compEarningShare;
      const transporterShare = parseFloat(orderDtlz.deliveryCost) - companyShare;

      let transportRegisterShare = transporterShare;
      let transportBiznaShare = 0;
      let transportBizna: any = null;
      const rideOwnershipType = transportDtlz?.ownerShipType;
      const rideTransportOwnerAc = transportDtlz?.transportOwnerAc;
      if (rideOwnershipType === 'Company' && rideTransportOwnerAc) {
        try {
          const transportBiznaRes: any = await client.graphql({
            query: getTransportBizna,
            variables: { BizAc: rideTransportOwnerAc },
          });
          transportBizna = transportBiznaRes?.data?.getTransportBizna || null;
          if (transportBizna) {
            const rate = Math.max(0, Math.min(100, Number(transportBizna.shareRates ?? 0)));
            transportRegisterShare = Number((transporterShare * (rate / 100)).toFixed(2));
            transportBiznaShare = Number((transporterShare - transportRegisterShare).toFixed(2));
          }
        } catch (e) {
          console.warn('Failed to load TransportBizna for delivery receipt split; falling back to transport register only', e);
        }
      }

      const fee = parseFloat(nonLoanDtlz?.fees || "0");
      const benefit = fee * parseFloat(compDtls.p2BBenCom) * 0.01;
      const compEarnings = fee - 2 * benefit;

      // Full mutation workflow
      await client.graphql({
        query: updateGroup,
        variables: {
          input: {
            grpContact: orderDtlz.chmAcNumber,
            grpBal: parseFloat(orderDtlz.orderCost),
          },
        },
      });

      if (!nonLoanDtlz?.id) {
        Alert.alert(t.error, t.couldNotFetchOrderDetails);
        return;
      }

      await client.graphql({
        query: updateNonLoans,
        variables: {
          input: {
            id: nonLoanDtlz.id,
            status: "cashSales",
          },
        },
      });

      await client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            companyEarningBal:
              parseFloat(compDtls.companyEarningBal) + companyShare + compEarnings,
            companyEarning: parseFloat(compDtls.companyEarning) + companyShare + compEarnings,
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
            Earnings: transportRegisterShare + parseFloat(transportDtlz.Earnings),
          },
        },
      });

      if (transportBizna && transportBiznaShare > 0) {
        await client.graphql({
          query: updateBizna,
          variables: {
            input: {
              BusKntct: transportBizna.biznaOwnerEmail || transportBizna.owner,
              Earnings: Number((Number(transportBizna.Earnings ?? 0) + transportBiznaShare).toFixed(2)),
            },
          },
        });
      }

      Alert.alert(t.success, t.deliveryReceived);

      const sendSMS = (phoneNumber: string, message: string) => {
        const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
        Linking.openURL(url);
      };
      sendSMS(
        orderDtlz.transportkntct,
        `${orderDtlz.buyerName} has received your delivery of ${orderDtlz.deliveryDesc}. Contact them via ${orderDtlz.buyerContact}`
      );
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
      Alert.alert(t.success, t.deliveryCancelSuccess);
      } catch (err) {
      console.error("Cancel error:", err);
      Alert.alert(t.error, t.deliveryCancelError);
    } finally {
      setIsLoading2(false);
    }
  };

  // Carousel is now fixed, not draggable

  if (loading) return <Text>{t.loading}</Text>;
  if (!orders.length || !userEmail) return <Text>{t.noOrders}</Text>;

  // Filter orders for carousel and map
  const filteredOrders = orders.filter(
    (item) => item.buyerOfficerEmail === userEmail
  );

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        onPress={fetchOrdersAndUser}
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          zIndex: 200,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#fff',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 7,
        }}
        disabled={refreshingOrders}
      >
        {refreshingOrders ? (
          <ActivityIndicator size="small" color="#1f8ef1" />
        ) : (
          <Ionicons name="refresh" size={22} color="#1f8ef1" />
        )}
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
            {/* Conditional polylines for the selected order */}
            {selectedIndex === idx && item.engagementStatus === 'TransportEngaged' && item.dutyStatus === 'TransportNotOnduty' && routeTransportToBuyerCoords.length >= 2 && (
              <Polyline
                coordinates={routeTransportToBuyerCoords}
                strokeColor="#38b6ff"
                strokeWidth={5}
                zIndex={10}
              />
            )}
            {selectedIndex === idx && item.engagementStatus !== 'TransportEngaged' && item.sellerLatitude && item.sellerLongitude && item.deliveryLatitude && item.deliveryLongitude && routeTransportToSellerCoords.length >= 2 && (
              <Polyline
                coordinates={routeTransportToSellerCoords}
                strokeColor="#2ca02c"
                strokeWidth={5}
                zIndex={10}
              />
            )}
            {selectedIndex === idx && item.engagementStatus !== 'TransportEngaged' && item.sellerLatitude && item.sellerLongitude && item.deliveryLatitude && item.deliveryLongitude && routeSellerToBuyerCoords.length >= 2 && (
              <Polyline
                coordinates={routeSellerToBuyerCoords}
                strokeColor="#8b4513"
                strokeWidth={5}
                zIndex={10}
              />
            )}
            {/* Transporter Marker (Black) */}
            <Marker
              key={item.id + "_transporter"}
              coordinate={{ latitude: Number(item.latitude), longitude: Number(item.longitude) }}
              title={item.transportName}
              pinColor={selectedIndex === idx ? '#222' : '#222'}
              onPress={() => {
                setSelectedIndex(idx);
                flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                mapRef.current?.animateToRegion({
                  latitude: Number(item.latitude),
                  longitude: Number(item.longitude),
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }, 350);
              }}
            >
              <View style={{ backgroundColor: '#222', padding: 6, borderRadius: 16, borderWidth: 2, borderColor: selectedIndex === idx ? '#e58d29' : '#fff' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>T</Text>
              </View>
            </Marker>
            {/* Seller Marker (Orange #e29d58) */}
            {item.sellerLatitude && item.sellerLongitude && (
              <Marker
                key={item.id + "_seller"}
                coordinate={{ latitude: Number(item.sellerLatitude), longitude: Number(item.sellerLongitude) }}
                title={item.sellerName}
                pinColor="#e29d58"
                onPress={() => {
                  setSelectedIndex(idx);
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                  mapRef.current?.animateToRegion({
                    latitude: Number(item.sellerLatitude),
                    longitude: Number(item.sellerLongitude),
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
            {/* Buyer Marker (Sky Blue #38b6ff) */}
            {item.deliveryLatitude && item.deliveryLongitude && (
              <Marker
                key={item.id + "_buyer"}
                coordinate={{ latitude: Number(item.deliveryLatitude), longitude: Number(item.deliveryLongitude) }}
                title={item.buyerName}
                pinColor="#38b6ff"
                onPress={() => {
                  console.log('Buyer coords for order', item.id, ':', item.deliveryLatitude, item.deliveryLongitude);
                  setSelectedIndex(idx);
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                  mapRef.current?.animateToRegion({
                    latitude: Number(item.deliveryLatitude),
                    longitude: Number(item.deliveryLongitude),
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }, 350);
                }}
              >
                <View style={{ backgroundColor: '#38b6ff', padding: 6, borderRadius: 16, borderWidth: 2, borderColor: selectedIndex === idx ? '#e29d58' : '#fff' }}>
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
            item.deliveryLatitude && item.deliveryLongitude
          ) {
            aerialDistance = getDistance(
              { latitude: Number(item.sellerLatitude), longitude: Number(item.sellerLongitude) },
              { latitude: Number(item.deliveryLatitude), longitude: Number(item.deliveryLongitude) }
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
                onPress={() => handleSelectOrder(index, item)}
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
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{t.receiveDelivery}</Text>
                  </TouchableOpacity>
                )}

                {/* Change Location and Cancel buttons */}
                {item.transportRequest === "transportRequestYes" && item.engagementStatus === "TransportNotEngaged" && (
                  <>
                    <TouchableOpacity
                      style={{ backgroundColor: '#0077cc', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 8 }}
                      onPress={() => openChangeLocationModal(item)}
                      disabled={isLoading2}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{t.changeLocation}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: '#e58d29', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 8 }}
                      onPress={() => CancelRequest(item.id)}
                      disabled={isLoading2}
                    >
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
                        {t.roadDistance}: {(roadDistances[modalOrder.id] / 1000).toFixed(2)} km
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
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={changeLocationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeChangeLocationModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '92%', maxHeight: '90%', backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{t.selectNewDeliveryLocation}</Text>
            <Text style={{ color: '#333', marginBottom: 12 }}>{t.selectLocationInstruction}</Text>
            <MapView
              style={{ width: '100%', height: 280, borderRadius: 14, overflow: 'hidden' }}
              initialRegion={{
                latitude: (selectedChangeLocation?.latitude ?? Number(changeLocationOrder?.deliveryLatitude ?? '')) || -1.2921,
                longitude: (selectedChangeLocation?.longitude ?? Number(changeLocationOrder?.deliveryLongitude ?? '')) || 36.8219,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              onLongPress={handleChangeLocationMapLongPress}
              showsUserLocation
            >
              {selectedChangeLocation && (
                <Marker coordinate={selectedChangeLocation} />
              )}
            </MapView>
            <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#f3f3f3' }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{t.selectedCoordinates}</Text>
              <Text>{selectedChangeLocation ? `${selectedChangeLocation.latitude.toFixed(6)}, ${selectedChangeLocation.longitude.toFixed(6)}` : t.noLocationSelectedYet}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#999', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                onPress={closeChangeLocationModal}
                disabled={isChangeLocationLoading}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#0077cc', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                onPress={confirmChangeDeliveryLocation}
                disabled={isChangeLocationLoading}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isChangeLocationLoading ? t.saving : t.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  </View>
);
};

export default TransportOrdersScreen;


