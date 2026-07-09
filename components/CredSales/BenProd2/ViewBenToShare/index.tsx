import { useNavigation } from '@react-navigation/native';
import {View, Text,   ScrollView, Pressable} from 'react-native';


import styles from './styles';
import React, {useState, useEffect} from 'react';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { generateClient } from 'aws-amplify/api';  
import { getSMAccount } from '../../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { useTranslation } from 'react-i18next';
import translations from './translation';

export interface SMAccount {
    SMAc: {
      beneficiaryID: string,
benefactorAc: string,
benefactorPhone: string,
prodName: string,
creatorName: string,
prodCost: number,
prodDesc: string,
benefitsAmount: number,
beneficiaryPhone:string
    }}

const SMCvLnStts = (props:SMAccount) => {
   const {
      SMAc: {
        beneficiaryID ,
        benefactorAc,
        benefactorPhone,
        prodName,
        creatorName,
        prodCost,
        prodDesc,
        benefitsAmount,
        beneficiaryPhone
    
   }} = props ;

   const navigation = useNavigation();
   

   const BenefitPal = () => {
    navigation.navigate("SharePalBenefits", {beneficiaryID});
  }

  const BenefitBiz = () => {
    navigation.navigate("ShareBizBenefits", {beneficiaryID});
  }

  const BenDtls = () => {
    navigation.navigate("VwBenProdsDtls", {beneficiaryID});
  }

  const client = generateClient();
  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const {ratesMap} = useExchange();
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
        const nationality = userData?.data?.getSMAccount?.nationality;
        if (nationality) {
          setUserNationality(nationality);
        }
        console.log('User Data:', userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [Uzer]);   

    return (
      <View style={styles.pageContainer}>
        <Pressable style={styles.card} onPress={BenDtls}>
          <Text style={styles.prodName}>{prodName}</Text>

          <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefactorBusiness}</Text> {creatorName}</Text>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.beneficiaryName}</Text> {beneficiaryPhone}</Text>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.cost}</Text> {formatAmountSync(Math.floor(prodCost), userCode, ratesMap)}</Text>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefitsPooled}</Text> {formatAmountSync(Math.floor(benefitsAmount), userCode, ratesMap)}</Text>
          <Text style={styles.prodDesc}>{prodDesc}</Text>
        </Pressable>

        <View style={styles.buttonRow}>
          <Pressable onPress={BenefitPal} style={styles.loanFriendButton}>
            <Text>{t.sharePal}</Text>
          </Pressable>

          <Pressable onPress={BenefitBiz} style={styles.redeemButton}>
            <Text>{t.shareBiz}</Text>
          </Pressable>
        </View>
      </View>
    );
}; 

export default SMCvLnStts;