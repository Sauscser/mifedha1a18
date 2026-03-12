import { useNavigation } from '@react-navigation/native';
import { View, Text, ScrollView } from 'react-native';
import styles from './styles';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { formatAmountSync } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import { useExchange } from '../../../../../src/contexts/ExchangeContext';
import { generateClient } from 'aws-amplify/api';  
import { getSMAccount } from '../../../../../src/graphql/queries';
import { fetchUserAttributes } from 'aws-amplify/auth';

export interface ChmCvLnSttusSent {
  Loaner: {
    loanID: string;
    loaneeName: string;
    amountGiven: number;
    amountExpectedBack: number;
    amountRepaid: number;
    lonBala: number;
    repaymentPeriod: number;
    advRegNu: string;
    status: string;
    description: string;
    loaneePhn: string;
    memberId: string;
    createdAt: string;
    updatedAt: string;
    grpContact: string;
    amountExpectedBackWthClrnc: number;
    crtnDate: number;
    interest: number;
    clearanceAmt: number;
    DefaultPenaltyChm2: number;
  };
}

const ChmCvLnSttsSent = (props: ChmCvLnSttusSent) => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const {
    Loaner: {
      loanID,
      amountExpectedBackWthClrnc,
      amountGiven,
      amountExpectedBack,
      amountRepaid,
      lonBala,
      repaymentPeriod,
      advRegNu,
      status,
      loaneeName,
      memberId,
      description,
      loaneePhn,
      grpContact,
      createdAt,
      updatedAt,
      crtnDate,
      interest,
      clearanceAmt,
      DefaultPenaltyChm2,
    },
  } = props;

  const navigation = useNavigation();
  const client = generateClient();
  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const { ratesMap } = useExchange();

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

  const nows = Date.now();
  const daysElapsed = (nows - crtnDate) / (1000 * 60 * 60 * 24);

  const netLnBal = amountExpectedBack - amountRepaid;
  const netLnBal2 = netLnBal * Math.pow(1 + interest / 36500, daysElapsed);
  const LonBal1 = netLnBal2 + clearanceAmt + DefaultPenaltyChm2;

  return (
      <View style={styles.card}>
        <Text style={styles.prodName}>{t.loaneeName}: {loaneeName}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.loanId}:</Text> {loanID}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.memberChamaId}:</Text> {memberId}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.amountGiven}:</Text> {formatAmountSync(amountGiven, userCode, ratesMap)}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.amountRepaid}:</Text> {formatAmountSync(amountRepaid, userCode, ratesMap)}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.loanBalanceWithPenalties}:</Text> {formatAmountSync(Math.floor(LonBal1), userCode, ratesMap)}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.repaymentPeriod}:</Text> {repaymentPeriod}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.memberContact}:</Text> {loaneePhn}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.advocateRegNum}:</Text> {advRegNu}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.loanStatus}:</Text> {status}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.timeLoanTaken}:</Text> {createdAt}</Text>
        <Text style={styles.prodDesc}>{t.description}: {description}</Text>
      </View>
  );
};

export default ChmCvLnSttsSent;