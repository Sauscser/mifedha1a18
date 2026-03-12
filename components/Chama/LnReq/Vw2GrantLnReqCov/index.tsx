import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  updateReqLoanChama,
} from '../../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

import React, {useEffect, useState} from 'react';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { generateClient } from 'aws-amplify/api';  
import { getSMAccount } from '../../../../src/graphql/queries';


import styles from './styles';
import { getReqLoanChama } from '../../../../src/graphql/queries';
import translations from './translation';
import { useTranslation } from 'react-i18next';

export interface SMAccount {
  SMAc: {
    id: string;
    loaneePhone: string;
    amount: number;
    repaymentAmt: number;
    repaymentPeriod: number;
    loaneeName: string;
    installmentAmount: number;
    paymentFrequency: number;
    confirm1: string;
    confirm2: string;
    owner: string;
  };
}

const client = generateClient();

const SMCvLnStts = (props: SMAccount) => {
  const {
    SMAc: {
      loaneePhone,
      amount,
      owner,
      repaymentAmt,
      repaymentPeriod,
      loaneeName,
      id,
      installmentAmount,
      paymentFrequency,
      confirm1,
      confirm2
    },
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const SndChmMmbrMny = () => {
    navigation.navigate('ChmCovLons', { id });
  };

  const SndChmMmbrMny2 = () => {
    navigation.navigate('DeclChamaReq', { id });
  };
  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const { ratesMap } = useExchange();

  // Translation wiring
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await fetchUserAttributes();
      setUzer(user.email);
      try {
        const userData: any = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: user.email },
        });
        setUserNationality(userData?.data?.getSMAccount?.nationality);
        console.log('User Data:', userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [Uzer]);

  const FetchSign4 = async () => {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    setIsLoading(true);
    try {
      const result: any = await client.graphql({
        query: getReqLoanChama,
        variables: { id }
      });

      const { signatory2, confirm1, confirm2, owner, signatory3 } = result.data.getReqLoanChama;

      if (confirm1 !== 'YES') {
        Alert.alert('Info', t.alertInfoSign2NotConfirmed);
      } else if (confirm2 !== 'YES') {
        Alert.alert('Info', t.alertInfoSign2NotConfirmed);
      } else if (owner !== attributes.email) {
        Alert.alert('Info', t.alertErrorNotGroupAdmin);
      } else {
        SndChmMmbrMny();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
    setIsLoading(false);
  };

  const FetchSign2 = async () => {
    const attributes = await fetchUserAttributes();
    setIsLoading(true);
    try {
      const result: any = await client.graphql({
        query: getReqLoanChama,
        variables: { id }
      });

      const { signatory2, confirm1 } = result.data.getReqLoanChama;

      if (attributes.email !== signatory2) {
        Alert.alert('Error', t.alertErrorNotSignatory2);
      } else if (confirm1 === 'YES') {
        Alert.alert('Info', t.alertInfoAlreadyConfirmed);
      } else {
        await client.graphql({
          query: updateReqLoanChama,
          variables: { input: { id, confirm1: 'YES' } }
        });
        Alert.alert('Success', t.alertSuccessSign2);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
    setIsLoading(false);
  };

  const FetchSign3 = async () => {
    const attributes = await fetchUserAttributes();
    setIsLoading(true);
    try {
      const result: any = await client.graphql({
        query: getReqLoanChama,
        variables: { id }
      });

      const { signatory3, confirm1, confirm2 } = result.data.getReqLoanChama;

      if (attributes.email !== signatory3) {
        Alert.alert('Error', t.alertErrorNotSignatory3);
      } else if (confirm1 !== 'YES') {
        Alert.alert('Info', t.alertInfoSign3NotConfirmed);
      } else if (confirm2 === 'YES') {
        Alert.alert('Info', t.alertInfoAlreadyConfirmed3);
      } else {
        await client.graphql({
          query: updateReqLoanChama,
          variables: { input: { id, confirm2: 'YES' } }
        });
        Alert.alert('Success', t.alertSuccessSign3);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
    setIsLoading(false);
  };

  const updtRecAc2 = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await client.graphql({
        query: updateReqLoanChama,
        variables: { input: { id, WithdrawCnfrmtn2: 'YES' } }
      });
      Alert.alert('Success', t.alertSuccessWithdraw2);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
    setIsLoading(false);
  };

  const updtRecAc3 = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await client.graphql({
        query: updateReqLoanChama,
        variables: { input: { id, WithdrawCnfrmtn3: 'YES' } }
      });
      Alert.alert('Success', t.alertSuccessWithdraw3);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
    setIsLoading(false);
  };

  // Interpolate variables into the translation string
  const loanerDetails = t.loanerDetails
    .replace('{name}', loaneeName)
    .replace('{amount}', formatAmountSync(Math.floor(amount), userCode, ratesMap))
    .replace('{interest}', repaymentAmt)
    .replace('{days}', repaymentPeriod)
    .replace('{installment}', installmentAmount)
    .replace('{frequency}', paymentFrequency)
    .replace('{phone}', loaneePhone);
  const confirmation1 = t.confirmation1.replace('{confirm1}', confirm1);
  const confirmation2 = t.confirmation2.replace('{confirm2}', confirm2);

  return (
    <View style={styles.pageContainer}>
      <View style={styles.card}>
        <Text style={styles.prodInfo}>{loanerDetails}</Text>
        <Text style={styles.prodInfo}>{confirmation1}</Text>
        <Text style={styles.prodInfo}>{confirmation2}</Text>
        {isLoading && (
          <ActivityIndicator
            size="small"
            color="#0000ff"
            style={{ marginTop: 10 }}
          />
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable onPress={FetchSign4} style={styles.loanFriendButton}>
          <Text>{t.accept}</Text>
        </Pressable>

        <Pressable onPress={SndChmMmbrMny2} style={styles.redeemButton}>
          <Text>{t.decline}</Text>
        </Pressable>

        <Pressable onPress={FetchSign2} style={styles.loanFriendButton}>
          <Text>{t.confirmation1.replace('{confirm1}', '2')}</Text>
        </Pressable>

        <Pressable onPress={FetchSign3} style={styles.redeemButton}>
          <Text>{t.confirmation1.replace('{confirm1}', '3')}</Text>
        </Pressable>
      </View>


    </View>
  );
}

export default SMCvLnStts;
