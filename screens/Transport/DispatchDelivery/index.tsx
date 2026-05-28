import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import LnerStts from "../../../components/Transport/DispatchDelivery";
import { BySellerAccount, listBenProd2s, listTransportOrders, getBizna, getTransportOrder } from '../../../src/graphql/queries';
import { sendNotification, createMessages } from '../../../src/graphql/mutations';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const FetchSMNonCovLns = props => {
    // --- Notification/Message Logic for Dispatching Delivery ---
    // Call this function when a delivery is dispatched (e.g., from a button or event)
    const handleDispatchDelivery = async (transportOrderId) => {
      try {
        // Fetch the transport order details
        const res = await client.graphql({
          query: getTransportOrder,
          variables: { id: transportOrderId }
        });
        const order = (res as any)?.data?.getTransportOrder;
        if (!order) {
          Alert.alert('Error', 'Could not fetch delivery details.');
          return;
        }
        // Log the TransportOrder after filtering
        console.log('[handleDispatchDelivery] TransportOrder:', order);
        // Determine purchaseType and buyer email
        let buyerEmail = order.customerEmail;
        if (order.purchaseType === 'B2B' && order.customerEmail) {
          // For B2B, customerEmail is BusKntct; get actual email from getBizna
          const biznaRes = await client.graphql({ query: getBizna, variables: { BusKntct: order.customerEmail } });
          const bizna = (biznaRes as any)?.data?.getBizna;
          if (bizna && bizna.email) {
            buyerEmail = bizna.email;
          }
        }
        // Notify Transporter (transportOwnerEmail)
        const notifTitleTransporter = t.dispatchDeliveryTitle || 'Delivery Dispatched';
        const notifBodyTransporter = t.dispatchDeliveryNotifTransporter
          ? t.dispatchDeliveryNotifTransporter.replace('{deliveryID}', order.deliveryID)
          : `Delivery ${order.deliveryID} has been dispatched.`;
        await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: order.transportOwnerEmail,
              messageBody: notifBodyTransporter
            }
          }
        });
        await client.graphql({
          query: sendNotification,
          variables: {
            riderEmail: order.transportOwnerEmail,
            title: notifTitleTransporter,
            body: notifBodyTransporter
          }
        });
        // Notify Buyer
        if (buyerEmail) {
          const notifTitleBuyer = t.dispatchDeliveryTitle || 'Delivery Dispatched';
          const notifBodyBuyer = t.dispatchDeliveryNotifBuyer
            ? t.dispatchDeliveryNotifBuyer.replace('{deliveryID}', order.deliveryID)
            : `Your delivery ${order.deliveryID} has been dispatched.`;
          await client.graphql({
            query: createMessages,
            variables: {
              input: {
                senderEmail: buyerEmail,
                messageBody: notifBodyBuyer
              }
            }
          });
          await client.graphql({
            query: sendNotification,
            variables: {
              riderEmail: buyerEmail,
              title: notifTitleBuyer,
              body: notifBodyBuyer
            }
          });
        }
        Alert.alert(t.dispatchDeliverySuccess || 'Delivery dispatched and notifications sent.');
      } catch (err) {
        Alert.alert(t.errorTitle || 'Error', t.failedDispatchDelivery || 'Failed to dispatch delivery or send notifications.');
        console.log('[handleDispatchDelivery] Error:', err);
      }
    };
  const [Loanees, setLoanees] = useState([]); // Stores fetched accounts
  const [filteredLoanees, setFilteredLoanees] = useState([]); // Stores filtered results
  const [loading, setLoading] = useState(false);
  const [awsEmail, setAWSEmail] = useState("");
  const route = useRoute();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  useEffect(() => {
    fetchLoanees();
  }, []);
  const fetchLoanees = async () => {
    setLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const Lonees = await client.graphql({
        query: BySellerAccount,
        variables: {
          sellerContact: (route.params as any).BusinessRegNo,
          sortDirection: "DESC",
          limit: 100
        }
      });
      setLoanees((Lonees as any).data.BySellerAccount.items);
    } catch (e) {
      console.error(t.errorFetching, e);
      Alert.alert(t.errorFetching, e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Filtering based on input
  const handleSearch = text => {
    setAWSEmail(text);
    const filtered = Loanees.filter(SMAccount => SMAccount.transportName.includes(text));
    setFilteredLoanees(filtered);
  };
  // Example usage: <TouchableOpacity onPress={() => handleDispatchDelivery(orderId)}>Dispatch</TouchableOpacity>
  // You should call handleDispatchDelivery with the correct transportOrderId when dispatching a delivery.
  return <KeyboardAvoidingView style={{
    flex: 1
  }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.container}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <TextInput placeholder={t.searchPlaceholder} value={awsEmail} onChangeText={handleSearch} style={styles.searchInput} />
                </View>

                {/* Results */}
                {awsEmail.length > 0 ? <FlatList style={{
        flex: 1
      }} data={filteredLoanees} renderItem={({
        item
      }) => <View>
                                <LnerStts SMAc={item} />
                            </View>} keyExtractor={(item, index) => index.toString()} refreshing={loading} keyboardShouldPersistTaps="handled" /> : <Text style={styles.placeholderText}>
                        {t.startTyping}
                    </Text>}
            </View>
        </KeyboardAvoidingView>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10
  },
  searchBar: {
    marginBottom: 10
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff'
  },
  placeholderText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20
  }
});
export default FetchSMNonCovLns;