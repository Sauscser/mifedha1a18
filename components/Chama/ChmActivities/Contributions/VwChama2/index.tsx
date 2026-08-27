import { useNavigation } from '@react-navigation/core';
import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView} from 'react-native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';

import styles from './styles';

import { formatAmountSync } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../../src/contexts/ExchangeContext';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { getSMAccount } from '../../../../../src/graphql/queries';

import { generateClient } from 'aws-amplify/api';
import { safeNavigateFrom } from '../../../../../src/utils/navigationHelper';


export interface ChamaContriInfo {
   ChamaContriDtls: {
     id: string,
     grpContact: string,
     memberPhn: string,
     mmberNme:string,
     memberId:string,
     contriAmount: number,
   
    
   
     status: string,
     createdAt:string,
     
   }}

const ChmContriInfo = (props:ChamaContriInfo) => {
  const {
     ChamaContriDtls: {
        id,
        grpContact,
        memberPhn,
        mmberNme,
        status,
        memberId,
        contriAmount,
        createdAt,       
      
      
      
  }} = props ;

  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  const TryChmLn = () => {
    safeNavigateFrom(navigation, 'ChmLnsGvnOuts', {grpContact});
  }

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
       <View style = {styles.pageContainer}>              
           <View style={styles.card}>

       <Text style={styles.prodInfo}><Text style={styles.label}>{t.transactionId}: </Text> {id}</Text>
       <Text style={styles.prodInfo}><Text style={styles.label}> {t.memberName}: </Text> {mmberNme}</Text>
       <Text style={styles.prodInfo}><Text style={styles.label}> {t.memberChamaId}:</Text> {memberId}</Text>
       <Text style={styles.prodInfo}><Text style={styles.label}> {t.amount}: </Text> {formatAmountSync(Math.floor(contriAmount), userCode, ratesMap)}</Text>
       <Text style={styles.prodInfo}><Text style={styles.label}> {t.memberContact} :</Text> {memberPhn}</Text>
       <Text style={styles.prodInfo}><Text style={styles.label}> {t.timeSent} :</Text> {createdAt}</Text>
       
                  
       </View>
               
       </View>
   );
}; 

export default ChmContriInfo;