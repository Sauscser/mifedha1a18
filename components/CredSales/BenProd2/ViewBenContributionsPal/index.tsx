import { useNavigation } from '@react-navigation/native';
import {View, Text,   ScrollView, Pressable} from 'react-native';


import styles from './styles';

import { formatAmountSync } from '../../../../src/utils/exchange';
import React, {useState, useEffect} from 'react';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { generateClient } from 'aws-amplify/api';  
import { getSMAccount } from '../../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import translations from './translation';


export interface SMAccount {
    SMAc: {
      id: string,
benefactorAc: string,
benefactorPhone: string,
beneficiaryPhone:string,
beneficiaryAc:string,
prodName: string,
creatorName: string,
prodCost: number,
prodDesc: string,
createdAt: string,
amount: number,
benefitsID:string

    }}

const SMCvLnStts = (props:SMAccount) => {
   const {
      SMAc: {
        id ,
        benefactorAc,
        beneficiaryPhone,
        creatorName,
        beneficiaryAc,
        benefactorPhone,
        prodDesc,
        createdAt,
        amount,
        benefitsID
    
   }} = props ;

   const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
   
   const client = generateClient();
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

    return (
        <View style={styles.pageContainer}>
            <View style={styles.card}>
              
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.contributionId}</Text> {id}</Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefactorName}</Text> {benefitsID}</Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefactorAccount}</Text> {benefactorAc}</Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.productCreatorAccount}</Text> {benefactorPhone}</Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.productCreatorName}</Text> {prodDesc}</Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.beneficiaryAccount}</Text> {beneficiaryAc}</Text>
              
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.beneficiaryName}</Text> {beneficiaryPhone}</Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.contributionAmount}</Text> {formatAmountSync(Math.floor(amount), userCode, ratesMap)}</Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.contributionTime}</Text> {createdAt}</Text>
             <Text style={styles.prodDesc}>{prodDesc}</Text>
             
        </View >
           </View> 

    );
}; 

export default SMCvLnStts;