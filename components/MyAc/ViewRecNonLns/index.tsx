
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {useExchange} from '../../../src/contexts/ExchangeContext';
import { getSMAccount } from '../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';


export interface SMAccount {
    SMAc: {
      id: string,
      
      senderPhn: string,  
      SenderName: string,
      amount: number,
      description: string, 
      status: string,
      createdAt:string,
      updatedAt:string,
              
    }}

const SMNonLnRec = (props:SMAccount) => {
    const { i18n } = useTranslation();
    const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const t = translations[lang] || translations.en;
   const {
      SMAc: {
         id,
         senderPhn,  
         SenderName,
         amount,
         description, 
         status,
         createdAt,
         updatedAt,
                 
   }} = props ;

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
                <Text style={styles.prodInfo}><Text style={styles.label}>{t.senderName}:</Text> {SenderName}</Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>{t.transactionId}: </Text> {id}</Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>{t.amount}:</Text> {formatAmountSync(amount, userCode, ratesMap)}</Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>{t.senderContact}:</Text> {senderPhn}</Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>{t.createdAt}:</Text> {createdAt}</Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>{t.transactionType}:</Text> {status}</Text>
                <Text style={styles.prodDesc}>{t.description}: {description}</Text>
            </View>
        </View>
    );
}; 

export default SMNonLnRec