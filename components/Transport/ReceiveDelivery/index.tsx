

import React, { useState, useMemo, useEffect } from 'react';
import {View, Text,  ScrollView, Pressable, TouchableOpacity, ActivityIndicator, Alert, FlatList, Dimensions, Animated, StyleSheet} from 'react-native';
import { PanResponder } from 'react-native';
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const CAROUSEL_HEIGHT = 180;
const MIN_CAROUSEL_TOP = 60;
const MAX_CAROUSEL_TOP = screenHeight - CAROUSEL_HEIGHT - 60;
import MapView, { Marker } from 'react-native-maps';

import styles from './styles';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { getTransportOrder, getSMAccount, getBizna, getGroup, getChamaMembers, getCompany, getTransportRegister } from '../../../src/graphql/queries';
import { updateTransportOrder, updateSMAccount, updateGroup, updateCompany, createNonLoans, updateTransportRegister, updateBizna, createBenefitContributions2 } from '../../../src/graphql/mutations';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import {useRoute, useNavigation} from '@react-navigation/native';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';




export interface SMAccount {
  SMAc: {
    id: string;
    sellerName: string;
    buyerName: string;
    distance: number;
    
    orderCost: number;
    buyerContact: string;
    transportRequest: string;
   deliveryDesc:string
   deliveryCost: number;
    transportName: string;
    engagementStatus: string;
    chmAcNumber: string;
    deliveryStart: number;
    transportkntct: string;
  };
}

const ViewSMDeposts = ({ SMAc }: SMAccount) => {
  const {
    id,
    transportName,
    sellerName,
    buyerName,
   deliveryCost,
    distance,
    chmAcNumber,
    orderCost,
    buyerContact,
    transportRequest,
    deliveryDesc,
    engagementStatus,
    deliveryStart,
    transportkntct,
  
  } = SMAc;

   const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);
     const [isLoading2, setIsLoading2] = useState(false);
      const [isLoading3, setIsLoading3] = useState(false);
      const client = generateClient();

  // Currency context (pattern from AcceptTransportRequest)
  const { nationality, ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(nationality);
  const orderCostDisplay = formatAmountSync(Number(orderCost), userCurrencyKey, ratesMap);
  const deliveryCostDisplay = formatAmountSync(Number(deliveryCost), userCurrencyKey, ratesMap);
     
const [distanceMeters, setDistanceMeters] = useState<number>(0);
  

  
   const navigation = useNavigation();
   

   const ChangeDeliveryLocation = () => {
    safeNavigateFrom(navigation, 'ChangeDeliveryLocation', {id})
}
 

     const handleAcceptDelivery = async () => {
        setIsLoading(true);
       try {
         const user = await fetchUserAttributes();
         const user2 = await getCurrentUser();
         
         const orderDtl = await client.graphql({
           query: getTransportOrder,
           variables: { id: id },
         });
         const orderDtlz = (orderDtl as any).data.getTransportOrder;

             const TransportDtls = await client.graphql({
               query: getTransportRegister,
               variables: { id: orderDtlz.bizAc },
             });
             const transportDtlz = (TransportDtls as any).data.getTransportRegister;

             const bizResult = await client.graphql({
               query: getBizna,
               variables: { BusKntct: orderDtlz.sellerContact },
             });
             const biz = (bizResult as any).data.getBizna;

             const buyerDtls = await client.graphql({
               query: getSMAccount,
               variables: { awsemail: orderDtlz.customerEmail },
             });
             const buyerDtlsz = (buyerDtls as any).data.getSMAccount;

             
              const CompDtls:any = await client.graphql({
                         query: getCompany,
                         variables: { AdminId: "BaruchHabaB'ShemAdonai2" },
                       }
                       );

                       const compDtls = (CompDtls as any).data.getCompany;
                       const compEarningShare = compDtls.transportCompanyShare;
                       const CompEarning = compEarningShare * parseFloat(orderDtlz.deliveryCost);
                       const TransporterEarning = parseFloat(orderDtlz.deliveryCost) - CompEarning
                       
                       const fee = parseFloat(orderDtlz.orderCost) * parseFloat(compDtls.biznaCashSaleFee);
                       const totalDebit = parseFloat(orderDtlz.orderCost) + fee;
                        const benefit = fee * parseFloat(compDtls.p2BBenCom)*0.01;
                        const compEarnings = fee - (2 * benefit);


                       
                       

             if (orderDtlz.engagementStatus === "TransportNotEngaged")
   
           {
             Alert.alert("Sorry", "This delivery has already been Received.");
             return;
           }

          else if (orderDtlz.chmAcCommitmentStatus === "TransportChmCommitmentYes")
            {              
   
             const userDtls = await client.graphql({
               query: getGroup,
               variables: { grpContact: orderDtlz.chmAcNumber },
             });
             const userDtlsz = (userDtls as any).data.getGroup;

            
             const BuyerDtls = await client.graphql({
               query: getSMAccount,
               variables: { awsemail: orderDtlz.customerEmail },
             });
             const BuyerDtlsz = (BuyerDtls as any).data.getSMAccount;

             const BuyerDtls3 = await client.graphql({
               query: getSMAccount,
               variables: { awsemail: user.email },
             });
             const BuyerDtlsz3 = (BuyerDtls3 as any).data.getSMAccount;

            
             
             console.log(orderDtlz);
             console.log(userDtlsz);
               console.log(BuyerDtlsz);
               console.log(Date.now());
   
        
   
             // Update the user's and buyer's account balances
   
             /*if (orderDtlz.engagementStatus === "TransportNotEngaged")
   
           {
             Alert.alert("Sorry", "This delivery has already been Received.");
             return;
           }

          else if (orderDtlz.chmAcCommitmentStatus === "TransportChmCommitmentYes")
            {
              Alert.alert("Sorry", "Group Admin has cancelled your approval.");
              return;
            }
         
         else if (parseFloat(orderDtlz.orderCost) > parseFloat(userDtlsz.grpBal)) 
         {
           Alert.alert("Sorry!", "Your group's balance is less than the purchase cost: Ksh."
            + orderDtlz.orderCost )
             return;
         }
   
         else if (parseFloat(userDtlsz.grpBal ) >= parseFloat(orderDtlz.orderCost)) 
         
         */{
         
          await client.graphql({
                           query: updateGroup,
                           variables: {
                             input: {
                               grpContact: orderDtlz.chmAcNumber,
                               grpBal: parseFloat(userDtlsz.grpBal) + parseFloat(orderDtlz.orderCost),
                               
                             }
                           }
                         })
   
                          

                           await client.graphql({
                           query: createNonLoans,
                           variables: {
                             input: {
                               senderPhn: orderDtlz.customerEmail,
                               recPhn: orderDtlz.transportOwnerEmail,
                               RecName: orderDtlz.transportName,
                             description: `Payment for delivery of ${orderDtlz.deliveryDesc} to ${orderDtlz.buyerName}.`,
                             SenderName: orderDtlz.buyerName,
                             amount: parseFloat(orderDtlz.deliveryCost) - CompEarning,
                             status: "DeliveryPayment",
                             owner: user.userID,
                             fees: 0
                           }}
                         })

                           

                            await client.graphql({
                           query: updateCompany,
                           variables: {
                             input: {
                               AdminId: "BaruchHabaB'ShemAdonai2",
                               companyEarningBal: parseFloat(compDtls.companyEarningBal) + CompEarning + compEarnings,
                               companyEarning: parseFloat(compDtls.companyEarning) + CompEarning + compEarnings,
                             
                           }}})
                         

                           await client.graphql({
                           query: updateBizna,
                           variables: {
                            input: {
                             BusKntct: orderDtlz.sellerContact,
                            netEarnings: (biz.netEarnings + orderDtlz.orderCost).toFixed(0),
                            earningsBal: (biz.earningsBal + orderDtlz.orderCost).toFixed(0),
                            benefitsAmount: parseFloat(biz.benefitsAmount) + benefit,
       
                           }}})

                           await client.graphql({
                           query: updateSMAccount,
                           variables: {
                             input: {
                               awsemail: orderDtlz.customerEmail,
                                benefitsAmount: parseFloat(buyerDtlsz.benefitsAmount) + benefit,
                                   }
                                 }});

                            await client.graphql({
                              query: createBenefitContributions2,
                              variables: {
                                input: {
                                  benefitsID: "String",
                                  benefactorAc: orderDtlz.sellerContact,
                                benefactorPhone: orderDtlz.sellerName,
                                beneficiaryAc: user.email,
                                beneficiaryPhone: user.phone_number || "String",
                                creatorEmail: user.email,
                                prodName: orderDtlz.deliveryDesc,
                                creatorName: BuyerDtlsz3.name,
                                owner: user.userID,
                                prodCost: 0,
                                benefitsAmount: benefit,
                                beneficiaryType: "Pal",
                                prodDesc: orderDtlz.deliveryDesc,
                                benefitStatus: "Active",
                                amount: benefit,
                              }
                            }});
                            
   
        
        await client.graphql({
           query: updateTransportOrder,
           variables: {
             input:
             {
             id: id,
             engagementStatus: "TransportNotEngaged",
             transportRequest: "transportRequestNo",
             
             chmAcCommitmentStatus: "TransportChmCommitmentNo",
            
         }}});
         
         const TransportUpdate =  await client.graphql({
           query: updateTransportRegister,
           variables: {
             input:
             {
             id: orderDtlz.bizAc,
             
             Earnings: TransporterEarning + parseFloat(transportDtlz.Earnings),

             
         }}});
         if ((TransportUpdate as any)?.data?.updateTransportRegister) {
         Alert.alert("Success", "Delivery Received!");
       // Send SMS notification
             const sendSMS = (phoneNumber: string, message: string) => {
         const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
         Linking.openURL(url);
       };
       
       // Example usage inside registerTransport or on button press:
       sendSMS(orderDtlz.transportkntct, 
         orderDtlz.buyerName +' has received your delivery of ' 
         + orderDtlz.deliveryDesc + '. '
        
         + ' You may contact them through '+ orderDtlz.buyerContact);}
       }
      } 

      else if (orderDtlz.chmAcCommitmentStatus !== "TransportChmCommitmentYes")
            {  

             const BuyerDtls = await client.graphql({ query: getSMAccount, variables: { awsemail: orderDtlz.customerEmail } });
             const BuyerDtlsz = (BuyerDtls as any).data.getSMAccount;

              const TransporterDtls = await client.graphql({ query: getSMAccount, variables: { awsemail: orderDtlz.transportOwnerEmail } });
             const TransporterDtlsz = (TransporterDtls as any).data.getSMAccount;

             const BuyerDtls4 = await client.graphql({ query: getSMAccount, variables: { awsemail: user.email } });
             const BuyerDtlsz4 = (BuyerDtls4 as any).data.getSMAccount;

            
             console.log(orderDtlz);
             
               console.log(BuyerDtlsz);
               console.log(Date.now());
   
            {


                           await client.graphql({
                           query: createNonLoans,
                           variables: {
                             input: {
                               senderPhn: orderDtlz.customerEmail,
                               recPhn: orderDtlz.transportOwnerEmail,
                               RecName: orderDtlz.transportName,
                               description: `Payment for delivery of ${orderDtlz.deliveryDesc} to ${orderDtlz.buyerName}.`,
                               SenderName: orderDtlz.buyerName,
                               amount: parseFloat(orderDtlz.deliveryCost) - CompEarning,
                               status: "DeliveryPayment",
                               owner: user.userID,
                               fees:0
                           }}})

                           

                           await client.graphql({
                           query: updateCompany,
                           variables: {
                           input: {
                             AdminId: "BaruchHabaB'ShemAdonai2",
                            companyEarningBal: parseFloat(compDtls.companyEarningBal) + CompEarning + compEarnings,
                             companyEarning: parseFloat(compDtls.companyEarning) + CompEarning + compEarnings,
                             
                           }}})

                           
   
          
          await client.graphql({
           query: updateTransportRegister,
           variables: {
             input:
             {
             id: orderDtlz.bizAc,
             Earnings: TransporterEarning + parseFloat(transportDtlz.Earnings),

             
         }}});

         await client.graphql({
                           query: updateBizna,
                           variables: {
                            input: {
                            BusKntct: orderDtlz.sellerContact,
                            netEarnings: (biz.netEarnings + orderDtlz.orderCost).toFixed(0),
                            earningsBal: (biz.earningsBal + orderDtlz.orderCost).toFixed(0),
                            benefitsAmount: parseFloat(biz.benefitsAmount) + benefit,
       
                           }}})

                           await client.graphql({
                           query: updateSMAccount,
                           variables: {
                                   input: {
                                     awsemail: orderDtlz.customerEmail,
                                      benefitsAmount: parseFloat(buyerDtlsz.benefitsAmount) + benefit,
                                   }
                                 }});

                                 await client.graphql({
                              query: createBenefitContributions2,
                              variables: {
                                input: {
                                  benefitsID: "String",
                                  benefactorAc: orderDtlz.sellerContact,
                                benefactorPhone: orderDtlz.sellerName,
                                beneficiaryAc: user.email,
                                beneficiaryPhone: user.phone_number || "String",
                                creatorEmail: user.email,
                                prodName: orderDtlz.deliveryDesc,
                                creatorName: BuyerDtlsz4.name,
                                owner: user.userID,
                                prodCost: 0,
                                benefitsAmount: benefit,
                                beneficiaryType: "Pal",
                                prodDesc: orderDtlz.deliveryDesc,
                                benefitStatus: "Active",
                                amount: benefit,
                              }
                            }});
                            
         
         const updateOrdr =  await client.graphql(
           {
            query: updateTransportOrder, variables: {
             input:
             {
             id: id,
             engagementStatus: "TransportNotEngaged",
             transportRequest: "transportRequestNo",
            
         }}});

         if ((updateOrdr as any)?.data?.updateTransportOrder) {
         Alert.alert("Success", "Delivery Received!");
       // Send SMS notification
             const sendSMS = (phoneNumber: string, message: string) => {
         const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
         Linking.openURL(url);
       };
       
       // Example usage inside registerTransport or on button press:
       sendSMS(orderDtlz.transportkntct, 
         orderDtlz.buyerName +' has received your delivery of ' 
         + orderDtlz.deliveryDesc + '. '
        
         + ' You may contact them through '+ orderDtlz.buyerContact);}
       }
      } 
       
        
       } catch (err) {
         console.error("Accept error:", err);
         Alert.alert("Error", "Could not accept delivery.");
       }
       finally {
       setIsLoading(false); 
     }
     };

   const CancelRequest = async () => {
        setIsLoading2(true);
       try {
         const user = await fetchUserAttributes();
         
         const orderDtl = await client.graphql(
          { query: getTransportOrder, variables: { id: id } });
             const orderDtlz = (orderDtl as any).data.getTransportOrder;
   
             
             if (orderDtlz.engagementStatus === "TransportEngaged")
   
           {
             Alert.alert("Sorry", " this delivery request has already been accepted.");
             return;
           }

          
   else {
                         const updateOrdr =  await client.graphql(
           { query: updateTransportOrder, variables: {
             input:
             {
             id: id,
           
             transportRequest: "transportRequestNo",
             
           
         }}});
         if ((updateOrdr as any)?.data?.updateTransportOrder) {
         Alert.alert("Success", "Delivery request cancelled!");
       // Send SMS notification
             const sendSMS = (phoneNumber: string, message: string) => {
         const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
         Linking.openURL(url);
       };
       
       // Example usage inside registerTransport or on button press:
       sendSMS(orderDtlz.transportkntct, 
         +' your delivery request has been cancelled by ' 
         + orderDtlz.buyerName + '. '
        
         + ' You may contact them through '+ orderDtlz.buyerContact);
        }
       }
   

     
       
        
       } catch (err) {
         console.error("Accept error:", err);
         Alert.alert("Error", "Could not handle delivery.");
       }
       finally {
       setIsLoading2(false); 
     }
     };

       const fetchLocation = async () => {
       setIsLoading(true);
       try {
         

         
       } catch (error) {
         console.warn("Error fetching location:", error);
         Alert.alert("Failed to get location. Try again.");
       } finally {
         setIsLoading(false);
       }
     };
   

    // Placeholder data for carousel; replace with real data as needed
    const cards = [
      {
        id,
        transportName,
        sellerName,
        buyerName,
        deliveryCost,
        distance,
        orderCost,
        buyerContact,
        transportRequest,
        deliveryDesc,
        engagementStatus,
        deliveryStart,
        transportkntct,
        orderCostDisplay,
        deliveryCostDisplay,
      },
    ];

    // Floating carousel state
    const INITIAL_CAROUSEL_TOP = screenHeight - (CAROUSEL_HEIGHT + 40) - 20;
    const carouselPosition = React.useRef(new Animated.Value(INITIAL_CAROUSEL_TOP)).current;
    const lastTop = React.useRef(INITIAL_CAROUSEL_TOP);
    const panResponder = React.useRef(
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

    return (
      <View style={{ flex: 1 }}>
        {/* MapView as background */}
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: -1.2921,
            longitude: 36.8219,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{ latitude: -1.2921, longitude: 36.8219 }}
            title="Transporter"
            description="Current location"
          />
        </MapView>

        {/* Floating horizontal carousel */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            zIndex: 100,
            top: carouselPosition,
            minHeight: CAROUSEL_HEIGHT,
            maxHeight: screenHeight * 0.85,
            pointerEvents: 'box-none',
            overflow: 'visible',
          }}
          {...panResponder.panHandlers}
        >
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            <View style={{ width: 40, height: 6, borderRadius: 3, backgroundColor: '#ccc', marginBottom: 4 }} />
          </View>
          <FlatList
            horizontal
            pagingEnabled
            data={cards}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => (
              <View style={[styles.card, { marginHorizontal: 8, width: 320, minHeight: 140, flexGrow: 1, paddingBottom: 24, justifyContent: 'flex-start' }]}> 
                <Text style={styles.prodInfo}>
                  {item.transportName} transport services ||
                  {item.sellerName} to {item.buyerName}
                  || Aerial Distance: {item.distance} Kilometer ||
                  Order Total Cost: {item.orderCostDisplay} || Transport Cost: {item.deliveryCostDisplay}
                  || Contact: {item.transportkntct} || {item.engagementStatus}
                  || {((Date.now() - (item.deliveryStart))/3600000).toFixed(4)} hours ago
                </Text>
                <Text style={styles.prodDesc}>Order Description: {item.deliveryDesc}</Text>
                {/* Action buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={() => handleAcceptDelivery()}
                    style={[
                      styles.loanFriendButton,
                      {
                        backgroundColor: '#e58d29',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isLoading ? 0.7 : 1,
                      },
                    ]}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                    )}
                    <Text style={{ color: 'white', fontSize: 12 }}>
                      {isLoading ? 'Processing...' : 'Accept Delivery'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => CancelRequest()}
                    style={[
                      styles.loanFriendButton,
                      {
                        backgroundColor: '#e58d29',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isLoading ? 0.7 : 1,
                      },
                    ]}
                    disabled={isLoading2}
                  >
                    {isLoading2 && (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                    )}
                    <Text style={{ color: 'white', fontSize: 12 }}>
                      {isLoading2 ? 'Processing...' : 'Cancel Request'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => ChangeDeliveryLocation()}
                    style={[
                      styles.loanFriendButton,
                      {
                        backgroundColor: '#e58d29',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isLoading ? 0.7 : 1,
                      },
                    ]}
                    disabled={isLoading3}
                  >
                    {isLoading3 && (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                    )}
                    <Text style={{ color: 'white', fontSize: 12 }}>
                      {isLoading3 ? 'Processing...' : 'Change Delivery Location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </Animated.View>

              <View style = {styles.buttonRow}>
             <TouchableOpacity
  onPress= {() => handleAcceptDelivery()}
  style={[
    styles.loanFriendButton,
    {
      backgroundColor: '#e58d29',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isLoading ? 0.7 : 1,
    },
  ]}
  disabled={isLoading}
>
  {isLoading && (
    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
  )}
  <Text style={{ color: 'white', fontSize: 12 }}>
    {isLoading ? 'Processing...' : 'Accept Delivery'}
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress= {() => CancelRequest()}
  style={[
    styles.loanFriendButton,
    {
      backgroundColor: '#e58d29',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isLoading ? 0.7 : 1,
    },
  ]}
  disabled={isLoading2}
>
  {isLoading2 && (
    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
  )}
  <Text style={{ color: 'white', fontSize: 12 }}>
    {isLoading2 ? 'Processing...' : 'Cancel Request'}
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress= {() => ChangeDeliveryLocation()}
  style={[
    styles.loanFriendButton,
    {
      backgroundColor: '#e58d29',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isLoading ? 0.7 : 1,
    },
  ]}
  disabled={isLoading3}
>
  {isLoading3 && (
    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
  )}
  <Text style={{ color: 'white', fontSize: 12 }}>
    {isLoading3 ? 'Processing...' : 'Change Delivery Location'}
  </Text>
</TouchableOpacity>


              </View>
  </View>
    );
}; 

export default ViewSMDeposts