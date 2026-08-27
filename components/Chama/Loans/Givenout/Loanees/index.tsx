import { useNavigation } from '@react-navigation/native';
import {View, Text, Pressable} from 'react-native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import styles from './styles';

import React, {useEffect, useState} from 'react';
import { formatAmountSync } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../../src/contexts/ExchangeContext';
import { generateClient } from 'aws-amplify/api';  
import { getSMAccount } from '../../../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { safeNavigateFrom } from '../../../../../src/utils/navigationHelper';



export interface ChmNonCvLnSttusSent {
  Loaner: {
    loanID: string;
    loaneeName: string;
    amountGiven: number;
    amountExpectedBack: number;
    amountRepaid: number;
    lonBala: number;
    repaymentPeriod: number;
    loaneePhn: string;
    status: string;
    grpContact: string;
    memberId: string;
    description: string;
    loanername: string;
    createdAt: string;
    updatedAt: string;
    amountExpectedBackWthClrnc: number;
    crtnDate: number;
    interest: number;
    clearanceAmt: number;
    DefaultPenaltyChm2: number;
  };
}

const ChmNonCvLnSttsSent = (props: ChmNonCvLnSttusSent) => {
    const { i18n } = useTranslation();
    const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const t = translations[lang] || translations.en;
  const {
    Loaner: {
      loanID,
      loaneePhn,
      clearanceAmt,
      DefaultPenaltyChm2,
      amountRepaid,
      lonBala,
      amountExpectedBackWthClrnc,
      amountExpectedBack,
      status,
      loaneeName,
      memberId,
      description,
      createdAt,
      updatedAt,
      crtnDate,
      interest,
    },
  } = props;

  const navigation = useNavigation();
  const client = generateClient();
  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const { ratesMap } = useExchange();

  const SndChmMmbrMny = () => {
    safeNavigateFrom(navigation, 'ChmLoaneesDtls', { loanID });
  };

  const VwRpayments = () => {
    safeNavigateFrom(navigation, 'ViewNonLnsRecChm', { loanID });
  };

  const Blacklist = () => {
    safeNavigateFrom(navigation, 'BLChmMmberCovs', { loanID });
  };

  const WaiveChmCov = () => {
    safeNavigateFrom(navigation, 'WaiveChmCov', { loanID });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await fetchUserAttributes();
      setUzer(user.email);
      try {
        const userData = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: user.email },
        });
        setUserNationality(userData.data.getSMAccount.nationality);
        console.log('User Data:', userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [Uzer]);

  const today = new Date();
  const hours = (today.getHours() < 10 ? '0' : '') + today.getHours();
  const minutes = (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();
  const seconds = (today.getSeconds() < 10 ? '0' : '') + today.getSeconds();
  const years = (today.getFullYear() < 10 ? '0' : '') + today.getFullYear();
  const months = (today.getMonth() < 10 ? '0' : '') + today.getMonth();
  const months2 = parseFloat(months);
  const days = (today.getDate() < 10 ? '0' : '') + today.getDate();

  const nows = Date.now();
  const daysElapsed = (nows - crtnDate) / (1000 * 60 * 60 * 24);

  const netLnBal = amountExpectedBack - amountRepaid;
  const netLnBal2 = netLnBal * Math.pow(1 + interest / 36500, daysElapsed);
  const LonBal1 = netLnBal2 + clearanceAmt + DefaultPenaltyChm2;

  return (
    <View style={styles.pageContainer}>
      <Pressable onPress={SndChmMmbrMny} style={styles.card}>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.loaneeName}:</Text> {loaneeName}
        </Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.loanId}:</Text> {loanID}
        </Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.loaneeContact}:</Text> {loaneePhn}
        </Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.loanBalanceWithPenalties}:</Text>{' '}
          {formatAmountSync(Math.floor(LonBal1), userCode, ratesMap)}
        </Text>
      </Pressable>

      <View style={styles.buttonRow}>
        <Pressable onPress={VwRpayments} style={styles.loanFriendButton}>
          <Text style={styles.buttonText}>{t.viewRepayments}</Text>
        </Pressable>

        <Pressable onPress={WaiveChmCov} style={styles.redeemButton}>
          <Text style={styles.buttonText}>{t.waive}</Text>
        </Pressable>

        <Pressable onPress={Blacklist} style={styles.loanFriendButton}>
          <Text style={styles.buttonText}>{t.blacklist}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ChmNonCvLnSttsSent;