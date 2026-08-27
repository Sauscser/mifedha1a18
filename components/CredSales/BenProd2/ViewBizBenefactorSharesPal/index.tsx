import { useNavigation } from '@react-navigation/native';

import { View, Text, ActivityIndicator, Pressable, Alert } from 'react-native';

import styles from './styles';
import { getLinkBeneficiary2, getSMAccount } from '../../../../src/graphql/queries';
import { updateLinkBeneficiary2 } from '../../../../src/graphql/mutations';

import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import React, {useState, useEffect} from 'react';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';


export interface SMAccount {
  SMAc: {
    beneficiaryID: string,
    benefactorAc: string,
    benefactorPhone: string,
    beneficiaryPhone: string,
    prodName: string,
    creatorName: string,
    prodCost: number,
    prodDesc: string,
    createdAt: string,
    benefitsAmount: number,
    benefitStatus: string,
    beneficiaryType: string
  }
}

const client = generateClient();

const SMCvLnStts = (props: SMAccount) => {
  const {
    SMAc: {
      beneficiaryID,
      benefactorAc,
      benefactorPhone,
      beneficiaryPhone,
      prodName,
      creatorName,
      prodCost,
      beneficiaryType,
      prodDesc,
      benefitsAmount,
      benefitStatus
    }
  } = props;

  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const { nationality, ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

   

  const VwBenefactorContriDtls = () => {
    safeNavigateFrom(navigation, 'VwPalBenefactorContriDtls', {
      benefactorAc,
      benefactorPhone,
      creatorName,
      prodName
    });
  };

  const updtSendrAc = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);

    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    try {
      const result2: any = await client.graphql({
        query: getLinkBeneficiary2,
        variables: { beneficiaryID }
      });

      const result3: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: attributes.email }
      });

      const userDtl = result3.data.getSMAccount;

      const owners = result2.data.getLinkBeneficiary2.owner;
      const benefitStatusz = result2.data.getLinkBeneficiary2.benefitStatus;
      const benefitsAmountz = result2.data.getLinkBeneficiary2.benefitsAmount;

      const now = new Date();
      const currentDate = now.toLocaleDateString();
      const currentTime = now.toLocaleTimeString();
      const dateTime = `${currentDate} ${currentTime}`;
      const formattedBenefits = formatAmountSync(benefitsAmount, nationality, ratesMap);

      if (owners !== userDtl.name) {
        Alert.alert(t.notOwner);
      } else if (benefitsAmountz === 0) {
        Alert.alert(t.benefitsAtZero);
      } else {
        const result: any = await client.graphql({
          query: updateLinkBeneficiary2,
          variables: {
            input: {
              beneficiaryID,
              benefitStatus: benefitStatusz + ", Redeemed at " + formattedBenefits + " on " + dateTime,
              benefitsAmount: 0
            }
          }
        });

        const updateResult = result?.data?.updateLinkBeneficiary2;

        if (updateResult) {
          Alert.alert(t.redeemSuccess);
        } else {
          Alert.alert(t.redeemFailed);
        }
      }
    } catch (error: any) {
      console.log(error);
      Alert.alert(t.updateOrCall);
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.card}>
        <Text style={styles.prodName}>{prodName}</Text>

        <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefactorName}</Text> {creatorName}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.productCreatorAccount}</Text> {benefactorPhone}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.beneficiaryName}</Text> {beneficiaryPhone}</Text>

        <Text style={styles.prodInfo}><Text style={styles.label}>{t.status}</Text> {benefitStatus}</Text>

        <Text style={styles.prodInfo}><Text style={styles.label}>{t.cost}</Text> {formatAmountSync(Math.floor(prodCost), nationality, ratesMap)}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefitsPooled}</Text> {formatAmountSync(Math.floor(benefitsAmount), nationality, ratesMap)}</Text>
        <Text style={styles.prodDesc}>{prodDesc}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable onPress={VwBenefactorContriDtls} style={styles.loanFriendButton}>
          <Text>{t.viewMyContributions}</Text>
        </Pressable>

        <Pressable onPress={updtSendrAc} style={styles.loanFriendButton}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t.redeemBenefits}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default SMCvLnStts;
