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
import { BASE_EXCHANGE_SYMBOL, countryToCurrency, formatAmountSync, getExRatesForNationality } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { generateClient } from 'aws-amplify/api';  
import { getSMAccount } from '../../../../src/graphql/queries';


import styles from './styles';
import { getReqLoanChama } from '../../../../src/graphql/queries';
import translations from './translation';
import { useTranslation } from 'react-i18next';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';


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
    safeNavigateFrom(navigation, 'ChmCovLons', { id });
  };

  const SndChmMmbrMny2 = () => {
    safeNavigateFrom(navigation, 'DeclChamaReq', { id });
  };
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const currencyIso = userCode ? countryToCurrency[userCode] : undefined;
  const { ratesMap } = useExchange();
  const [fallbackRate, setFallbackRate] = useState<{ buyingPrice: number; symbol?: string } | null>(null);

  // Translation wiring
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await fetchUserAttributes();
        if (!user.email) throw new Error('Signed-in user email is unavailable');
        const userData: any = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: user.email },
        });
        const nationality = userData?.data?.getSMAccount?.nationality;
        if (!nationality) throw new Error('Signed-in user nationality is unavailable');
        setUserNationality(nationality);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    let active = true;
    const fetchFallbackRate = async () => {
      if (!userNationality || currencyIso === 'CHF') {
        if (active) setFallbackRate(null);
        return;
      }

      const rateKeyCandidates = [userCode, currencyIso, userNationality].filter(Boolean) as string[];
      const rate = ratesMap
        ? Object.entries(ratesMap).find(([key]) =>
            rateKeyCandidates.some(candidate => candidate.toUpperCase() === key.trim().toUpperCase())
          )?.[1]
        : undefined;
      const mappedBuyingPrice = Number(rate?.buyingPrice);
      if (Number.isFinite(mappedBuyingPrice) && mappedBuyingPrice > 0) {
        if (active) setFallbackRate(null);
        return;
      }

      try {
        const fetchedRate = await getExRatesForNationality(userNationality);
        const buyingPrice = Number(fetchedRate?.buyingPrice);
        if (!fetchedRate || !Number.isFinite(buyingPrice) || buyingPrice <= 0) {
          throw new Error(`No valid display rate for nationality "${userNationality}"`);
        }
        if (active) setFallbackRate({ buyingPrice, symbol: fetchedRate.symbol });
      } catch (error) {
        console.error('Failed to fetch signed-in user exchange rate:', error);
        if (active) setFallbackRate(null);
      }
    };

    fetchFallbackRate();
    return () => {
      active = false;
    };
  }, [userNationality, userCode, currencyIso, ratesMap]);

  const formatUserMoney = (amount: number) => {
    const chfAmount = Number(amount);
    if (!Number.isFinite(chfAmount) || !userNationality) return t.currencyUnavailable;
    if (currencyIso === 'CHF') return `${BASE_EXCHANGE_SYMBOL} ${chfAmount.toFixed(2)}`;

    const rateKeyCandidates = [userCode, currencyIso, userNationality].filter(Boolean) as string[];
    const rateEntry = ratesMap
      ? Object.entries(ratesMap).find(([key]) =>
          rateKeyCandidates.some(candidate => candidate.toUpperCase() === key.trim().toUpperCase())
        )
      : undefined;
    const rate = rateEntry?.[1];
    if (Number.isFinite(Number(rate?.buyingPrice)) && Number(rate?.buyingPrice) > 0) {
      return formatAmountSync(chfAmount, rateEntry?.[0], ratesMap || undefined, currencyIso || BASE_EXCHANGE_SYMBOL);
    }
    if (fallbackRate) {
      return `${fallbackRate.symbol || currencyIso || userCode} ${(chfAmount * fallbackRate.buyingPrice).toFixed(2)}`;
    }
    return t.currencyUnavailable;
  };

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

      console.log('Signatory 3 email comparison:', {
        signedInEmail: attributes.email,
        loanSignatory3: signatory3,
      });

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
    .replace('{amount}', formatUserMoney(Number(amount)))
    .replace('{interest}', String(repaymentAmt))
    .replace('{days}', String(repaymentPeriod))
    .replace('{installment}', formatUserMoney(Number(installmentAmount)))
    .replace('{frequency}', String(paymentFrequency))
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
