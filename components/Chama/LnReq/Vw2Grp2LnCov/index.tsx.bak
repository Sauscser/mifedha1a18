import { useNavigation } from '@react-navigation/native';
import {View, Text,   ScrollView, Pressable} from 'react-native';



import styles from './styles';
import React, {useEffect, useState} from 'react';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { generateClient } from 'aws-amplify/api';  
import { getSMAccount } from '../../../../src/graphql/queries';
import translations from './translation';
import { useTranslation } from 'react-i18next';

export interface SMAccount {
    SMAc: {
      groupContact:string,
      groupName:string,
      
      
    }}

const SMCvLnStts = (props:SMAccount) => {
   const {
      SMAc: {
        groupName,
        
        groupContact
   }} = props ;


   const [isLoading, setIsLoading] = useState(false);
   const navigation = useNavigation();

   // Translation wiring
   const { i18n } = useTranslation();
   const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
   const t = translations[lang] || translations.en;

   const SndChmMmbrMny = () => {
       navigation.navigate("ChamaVw2GrantLnReqCov", {groupContact})
   }

   

    return (
        <Pressable onPress={SndChmMmbrMny} style={styles.pageContainer}>
            <Text style={styles.prodInfo}>
                <Text style={styles.label}>{t.groupName}</Text> {groupName}
            </Text>
            <Text style={styles.prodInfo}>
                <Text style={styles.label}>{t.groupContact}</Text> {groupContact}
            </Text>
        </Pressable>
    );
}; 

export default SMCvLnStts;