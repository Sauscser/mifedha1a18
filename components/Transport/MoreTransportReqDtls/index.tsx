

import { View, Text, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import styles from './styles';

import React, {useEffect, useState} from 'react';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {useExchange} from '../../../src/contexts/ExchangeContext';
import { getSMAccount } from '../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';

export interface SMAccount {
  SMAc: {
    id: string;
    sellerName: string;
    buyerName: string;
    distance: number;
    
    orderCost: number;
    buyerContact: string;
    transportRequest: string;
   deliveryDesc:string
   deliveryCost: number;
   engagementStatus: string;
    
  };
}

const ViewSMDeposts = ({ SMAc }: SMAccount) => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const {
    id,
    engagementStatus,
    sellerName,
    buyerName,
   deliveryCost,
    distance,
    orderCost,
    buyerContact,
    transportRequest,
    deliveryDesc
  
  } = SMAc;


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
    <ScrollView contentContainerStyle={styles.pageContainer}>
      <View style={styles.pageContainer}>
       

        <View style={styles.card}>
         
         <Text style={styles.prodInfo}> 
           {t.sellerToBuyer(sellerName, buyerName)}
           || {t.aerialDistance}: {distance} {t.kilometer} || {t.orderTotalCost}: {formatAmountSync(orderCost, userCode, ratesMap)} || {t.transportCost}: {formatAmountSync((distance * SMAc.transportRate), userCode, ratesMap)}
           || {t.contact}: {buyerContact} || {t.transportRequest}: {transportRequest} || {t.engagementStatus}: {engagementStatus}
         </Text>
         <Text style={styles.prodDesc}>{(t.orderDescription || 'Order Description:')} {deliveryDesc}</Text>
         
             </View>
      </View>
    </ScrollView>
  );
};

export default ViewSMDeposts;
