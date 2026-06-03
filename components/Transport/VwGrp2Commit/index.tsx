import { useNavigation } from '@react-navigation/core';
import React, { useState } from 'react';
import { View, Text, Pressable, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';

import styles from './styles';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { getTransportOrder, getSMAccount, getBizna, getGroup, getChamaMembers } from '../../../src/graphql/queries';
import { updateTransportOrder, updateSMAccount, updateGroup } from '../../../src/graphql/mutations';
import { Linking } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';

export interface ChamaMmbrshpInfo {
  ChamaMmbrshpDtls: {
    MembaId: string;
    ChamaNMember: string;
    memberContact: string;
    groupName: string;
    memberNatId: string;
    GrossLnsGvn: number;
    LonAmtGven: number;
    AmtRepaid: number;
    groupContact: string;
    NonLoanAcBal: number;
    ttlNonLonAcBal: number;
    AcStatus: string;
    loanStatus: string;
    blStatus: string;
    createdAt: string;
    subscriptionFrequency: number;
    subscriptionAmt: number;
    lateSubscriptionPenalty: number;
    ttlLateSubs: number;
    timeCrtd: number;
    subscribedAmt: number;
    totalSubAmt: number;
  };
}

const client = generateClient();

type VwGrp2CommitRouteParams = { id: string };

const ChmMbrShpInfo = (props: ChamaMmbrshpInfo) => {
  const {
    ChamaMmbrshpDtls: {
      MembaId,
      ChamaNMember,
      memberNatId,
      memberContact,
      groupName,
      loanStatus,
      blStatus,
      GrossLnsGvn,
      LonAmtGven,
      AmtRepaid,
      groupContact,
      NonLoanAcBal,
      ttlNonLonAcBal,
      createdAt,
      AcStatus,
      subscribedAmt,
      totalSubAmt,
      subscriptionFrequency,
      subscriptionAmt,
      lateSubscriptionPenalty,
      ttlLateSubs,
      timeCrtd,
    },
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [shareRateModalVisible, setShareRateModalVisible] = useState(false);
  const [transportShareRateInput, setTransportShareRateInput] = useState('20');
  const [isApplyingShareRate, setIsApplyingShareRate] = useState(false);
  const route = useRoute<RouteProp<Record<string, VwGrp2CommitRouteParams>, string>>();

  const openShareRateModal = () => {
    setTransportShareRateInput('20');
    setShareRateModalVisible(true);
  };

  const closeShareRateModal = () => {
    if (isApplyingShareRate) return;
    setShareRateModalVisible(false);
  };

  const validateShareRate = () => {
    const trimmedValue = transportShareRateInput.trim();
    const parsedRate = Number(trimmedValue);
    if (!trimmedValue || Number.isNaN(parsedRate)) {
      Alert.alert('Invalid Rate', 'Please enter a transport share rate between 1 and 100.');
      return null;
    }
    if (parsedRate < 1 || parsedRate > 100) {
      Alert.alert('Invalid Rate', 'Transport share rate must be between 1 and 100.');
      return null;
    }
    return parsedRate;
  };

  const handleAcceptDelivery = async (transportShareRate: number) => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();

      const orderDtl: any = await client.graphql({
        query: getTransportOrder,
        variables: { id: route.params.id },
      });
      const orderDtlz = orderDtl.data.getTransportOrder;

      const totalCost = orderDtlz.deliveryCost + orderDtlz.orderCost;

      const userDtls: any = await client.graphql({
        query: getGroup,
        variables: { grpContact: groupContact },
      });
      const userDtlsz = userDtls.data.getGroup;

      const membaDtls: any = await client.graphql({
        query: getChamaMembers,
        variables: { ChamaNMember },
      });
      const membaDtlz = membaDtls.data.getChamaMembers;

      const BuyerDtls: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: orderDtlz.customerEmail },
      });
      const BuyerDtlsz = BuyerDtls.data.getSMAccount;

      if (orderDtlz.engagementStatus === "TransportEngaged") {
        Alert.alert("Error", "This delivery has already been accepted.");
        return;
      } else if (BuyerDtlsz.balance < orderDtlz.deliveryCost) {
        Alert.alert("Sorry", "Buyer cannot cover delivery cost.");
        return;
      } else if (membaDtlz.transportApproved === "ChamaTransportApprovedNo") {
        Alert.alert("Sorry", "Group Admin has cancelled your approval.");
        return;
      } else if (parseFloat(orderDtlz.orderCost) > parseFloat(userDtlsz.grpBal)) {
        Alert.alert(
          "Sorry!",
          "Your group's balance is less than the purchase cost: Ksh." + orderDtlz.orderCost
        );
        return;
      } else if (parseFloat(userDtlsz.grpBal) >= parseFloat(orderDtlz.orderCost)) {
        await client.graphql({
          query: updateGroup,
          variables: {
            input: {
              grpContact: groupContact,
              transportShareRates: transportShareRate,
              grpBal: parseFloat(userDtlsz.grpBal) - parseFloat(orderDtlz.orderCost),
            },
          },
        });

        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: orderDtlz.customerEmail,
              balance: parseFloat(BuyerDtlsz.balance) - parseFloat(orderDtlz.deliveryCost),
            },
          },
        });

        const updateOrdr: any = await client.graphql({
          query: updateTransportOrder,
          variables: {
            input: {
              id: route.params.id,
              engagementStatus: "TransportEngaged",
              ChmAcCommitment: orderDtlz.orderCost,
              deliveryStart: Date.now(),
              chmAcNumber: groupContact,
              chmAcCommitmentStatus: "TransportChmCommitmentYes",
            },
          },
        });

        if (updateOrdr?.data?.updateTransportOrder) {
          Alert.alert("Success", "Delivery accepted!");
          const sendSMS = (phoneNumber: string, message: string) => {
            const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
            Linking.openURL(url);
          };

          sendSMS(
            orderDtlz.buyerContact,
            orderDtlz.transportName +
              " has accepted your transport request from " +
              orderDtlz.sellerName +
              ". " +
              " You may contact them through " +
              orderDtlz.transportkntct
          );
        }
      }
    } catch (err) {
      console.error("Accept error:", err);
      Alert.alert("Error", "Could not accept delivery.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmShareRate = async () => {
    const parsedRate = validateShareRate();
    if (parsedRate === null) return;

    setIsApplyingShareRate(true);
    try {
      setShareRateModalVisible(false);
      await handleAcceptDelivery(parsedRate);
    } finally {
      setIsApplyingShareRate(false);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <Pressable style={styles.card}>
        <Text style={styles.prodName}>{groupName} Self Help Group</Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>Member Chama Number:</Text> {MembaId}
        </Text>
      </Pressable>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={openShareRateModal}
          style={[
            styles.loanFriendButton,
            {
              backgroundColor: "#e58d29",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          disabled={isLoading}
        >
          {isLoading && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
          <Text style={{ color: "white", fontSize: 12 }}>
            {isLoading ? "Processing..." : "Accept Transport Request"}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={shareRateModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={closeShareRateModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Set Group Transport Share Rate</Text>
              <Text style={styles.modalSubtitle}>{groupName} Self Help Group</Text>
              <TextInput
                value={transportShareRateInput}
                onChangeText={setTransportShareRateInput}
                keyboardType="number-pad"
                style={styles.modalInput}
                placeholder="Enter rate 1-100"
                placeholderTextColor="#444"
                maxLength={3}
              />
              <Text style={styles.modalHint}>Allowed range: 1 to 100</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={closeShareRateModal} style={styles.modalCancelButton}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmShareRate}
                  style={[styles.modalConfirmButton, isApplyingShareRate ? { opacity: 0.7 } : null]}
                  disabled={isApplyingShareRate}
                >
                  <Text style={styles.modalConfirmText}>
                    {isApplyingShareRate ? 'Processing...' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default ChmMbrShpInfo;
