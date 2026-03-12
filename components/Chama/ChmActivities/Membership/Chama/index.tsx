import React, {useEffect, useState} from 'react';
import { useNavigation, useRoute } from '@react-navigation/core';

import { View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { LinearGradient } from 'expo-linear-gradient';
import { formatAmountSync } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import { useExchange } from '../../../../../src/contexts/ExchangeContext';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { updateChamaMembers } from '../../../../../src/graphql/mutations';
import { getSMAccount } from '../../../../../src/graphql/queries';
import styles from './styles';

export interface ChamaMmbrshpInfo {
  ChamaMmbrshpDtls: {
    MembaId: string;
    ChamaNMember: string;
    memberContact: string;
    memberName: string;
    memberNatId: string;
    GrossLnsGvn: number;
    LonAmtGven: number;
    AmtRepaid: number;
    LnBal: number;
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

const ChmMbrShpInfo = (props: ChamaMmbrshpInfo) => {
  // i18n translation pattern
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  
  const {
    ChamaMmbrshpDtls: {
      MembaId,
      ChamaNMember,
      memberNatId,
      memberContact,
      memberName,
      loanStatus,
      blStatus,
      GrossLnsGvn,
      LonAmtGven,
      AmtRepaid,
      LnBal,
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

  const client = generateClient();
  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const { ratesMap } = useExchange();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await fetchUserAttributes();
        setUzer(user.email);
        const userData = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: user.email },
        });
        setUserNationality(userData.data.getSMAccount.nationality);
      } catch (error) {
        Alert.alert(t.errorFetchingUser);
      }
    };
    fetchUserData();
  }, [Uzer]);

  // Corrected: convert both today and timeCrtd to days since epoch
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
  const daysCrtd = Math.floor(timeCrtd / (1000 * 60 * 60 * 24));
  const tmDif = daysSinceEpoch - daysCrtd;
  const subFreq = tmDif / subscriptionFrequency;
  const Amt2HvBnSub = subFreq * subscriptionAmt;
  const ttlArrears = (ttlLateSubs + Amt2HvBnSub).toFixed(0);

  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const route = useRoute();
  const Penalise = () => navigation.navigate('PenaliseMember', { ChamaNMember });
  const ViewMmberDtls = () => navigation.navigate('ChamaDtls', { ChamaNMember });
  const ViewSubs = () => navigation.navigate('VwMbrSubsDirectly', { ChamaNMember });
  const SendNonLoans = () => navigation.navigate('SndMbrsMnys', { ChamaNMember });


  const ApproveMembaTransport = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const approval = await client.graphql({
        query: updateChamaMembers,
        variables: {
          input: {
            ChamaNMember: ChamaNMember,
            transportApproved: 'ChamaTransportApprovedYes',
          },
        },
      });
      if (approval?.data?.updateChamaMembers) {
        Alert.alert(t.transportApproved);
      }
    } catch (error) {
      Alert.alert(t.disapprovalUnsuccessful);
    }
    setIsLoading(false);
  };

  const DisapproveMembaTransport = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const disapprove = await client.graphql({
        query: updateChamaMembers,
        variables: {
          input: {
            ChamaNMember: ChamaNMember,
            transportApproved: 'ChamaTransportApprovedNo',
          },
        },
      });
      if (disapprove?.data?.updateChamaMembers) {
        Alert.alert(t.transportDisapproved);
      }
    } catch (error) {
      Alert.alert(t.disapprovalUnsuccessful);
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.pageContainer}>
      <Pressable onPress={ViewMmberDtls} style={styles.card}>
        <Text style={styles.prodName}>{t.memberName}: {memberName}</Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.memberChamaNumber}:</Text> {MembaId}
        </Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.subscriptionUpToDate}:</Text> {formatAmountSync(Math.floor(subscribedAmt), userCode, ratesMap)}
        </Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.subscriptionWithPenalties}:</Text> {formatAmountSync(Math.floor(parseFloat(ttlArrears)), userCode, ratesMap)}
        </Text>
      </Pressable>
      <View style={styles.buttonRow}>
        <LinearGradient colors={['#FFA500', '#FF8C00']} style={styles.gradientButton}>
          <Pressable onPress={ViewSubs} style={styles.pressableContent}>
            <Text style={styles.buttonText}>{t.viewSubscriptions}</Text>
          </Pressable>
        </LinearGradient>
        <LinearGradient colors={['#00BFFF', '#1E90FF']} style={styles.gradientButton}>
          <Pressable onPress={Penalise} style={styles.pressableContent}>
            <Text style={styles.buttonText}>{t.penalise}</Text>
          </Pressable>
        </LinearGradient>
        <LinearGradient colors={['#FFA500', '#FF8C00']} style={styles.gradientButton}>
          <Pressable onPress={SendNonLoans} style={styles.pressableContent}>
            <Text style={styles.buttonText}>{t.sendNonLoansDividends}</Text>
          </Pressable>
        </LinearGradient>
        <LinearGradient colors={['#FFA500', '#FF8C00']} style={styles.gradientButton}>
          <Pressable onPress={ApproveMembaTransport} style={styles.pressableContent}>
            <Text style={styles.buttonText}>{t.approveTransport}</Text>
          </Pressable>
        </LinearGradient>
        <LinearGradient colors={['#FFA500', '#FF8C00']} style={styles.gradientButton}>
          <Pressable onPress={DisapproveMembaTransport} style={styles.pressableContent}>
            <Text style={styles.buttonText}>{t.disapproveTransport}</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
};

export default ChmMbrShpInfo;
