import { useNavigation } from '@react-navigation/native';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { deleteReqLoan, deleteReqLoanChama, updateReqLoan } from '../../../../src/graphql/mutations';
import { StyleSheet, Dimensions } from 'react-native';

import styles from './styles';
import React, {useEffect, useState} from 'react';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';  
import { getSMAccount } from '../../../../src/graphql/queries';
import translations from './translation';
import { useTranslation } from 'react-i18next';


export interface SMAccount {
  SMAc: {
    id: string,
    status: string,
    loaneePhone: string,
    amount: number,
    repaymentAmt: number,
    repaymentPeriod: number,
    loaneeName: string,
  }
}

const client = generateClient();

const SMCvLnStts = (props: SMAccount) => {
  const {
    SMAc: {
      status,
      loaneePhone,
      amount,
      repaymentAmt,
      repaymentPeriod,
      loaneeName,
      id
    }
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const {ratesMap} = useExchange();

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

  const SndChmMmbrMny = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      await client.graphql({
        query: deleteReqLoanChama,
        variables: {
          input: {
            id: id,
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  // Interpolate variables into the translation string
  const loanerDetails = t.loanerDetails
    .replace('{name}', loaneeName)
    .replace('{amount}', formatAmountSync(Math.floor(amount), userCode, ratesMap))
    .replace('{interest}', repaymentAmt)
    .replace('{days}', repaymentPeriod)
    .replace('{phone}', loaneePhone)
    .replace('{status}', status);

  return (
    <Pressable onPress={SndChmMmbrMny} style={styles.pageContainer}>
      <Text style={styles.prodInfo}>{loanerDetails}</Text>
    </Pressable>
  );
};

export default SMCvLnStts;
