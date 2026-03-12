
import { View, Text } from 'react-native';
import styles from './styles';
import React, { useEffect, useState } from 'react';
import { formatAmountSync } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import { useExchange } from '../../../../../src/contexts/ExchangeContext';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { getSMAccount } from '../../../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { translations } from './translation';
import { useTranslation } from 'react-i18next';


export interface MmbrContriInfo {
   memberContriDtls: {
     id: string,
     grpContact: string,
     
     SenderName:string,
     memberId:string,
     amountSent: number,
   
     description: string,
   
     status: string,
     createdAt:string,
     
   }}

const MmbrContriInfo = (props:MmbrContriInfo) => {
  const {
     memberContriDtls: {
        id,
        grpContact,
        memberId,
        SenderName,
        status,
        amountSent,
        createdAt,       
        description,
      
      
  }} = props ;


  const client = generateClient();
  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const { ratesMap } = useExchange();

  // --- TRANSLATION PATTERN ---
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

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
      } catch (error) {
        // handle error if needed
      }
    };
    fetchUserData();
  }, [Uzer]);

  return (
    <View style={styles.pageContainer}>
      <View style={styles.card}>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.transactionId} </Text>{id}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.memberChamaId} </Text>{memberId}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.chamaName} </Text>{SenderName}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.amount} </Text>{formatAmountSync(Math.floor(amountSent), userCode, ratesMap)}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.timeSent} </Text>{createdAt}</Text>
        <Text style={styles.prodDesc}>{description}</Text>
      </View>
    </View>
  );
}; 

export default MmbrContriInfo;