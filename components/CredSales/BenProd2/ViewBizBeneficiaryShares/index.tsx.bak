import { useNavigation } from '@react-navigation/native';
import {View, Text,   ScrollView, Pressable} from 'react-native';


import styles from './styles';

import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import React, {useState, useEffect} from 'react';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { getSMAccount } from '../../../../src/graphql/queries';
import { useTranslation } from 'react-i18next';
import translations from './translation';


export interface SMAccount {
    SMAc: {
      id: string,
benefactorAc: string,
benefactorPhone: string,
beneficiaryPhone:string,
prodName: string,
creatorName: string,
prodCost: number,
prodDesc: string,
createdAt: string,
benefitsAmount:number,
beneficiaryAc:string,
benefitStatus:string,
beneficiaryType:string

    }}

const SMCvLnStts = (props:SMAccount) => {
   const {
      SMAc: {
        id ,
        benefitStatus,
        beneficiaryAc,
        benefactorAc,
        benefactorPhone,
        beneficiaryPhone,
        prodName,
        creatorName,
        beneficiaryType,
        prodCost,
        prodDesc,
        benefitsAmount
    
   }} = props ;

   const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
   
   const VwBenefactorContriDtls = () => {
    navigation.navigate("VwBeneficiaryContriDtls", 
      {beneficiaryAc, 
        benefactorAc, 
      
        prodName}
    )
}

   const client = generateClient();
   const { nationality, ratesMap } = useExchange();

   


    return (
        
             <View style = {styles.pageContainer}>
                  
            
            <View style = {styles.card}>              
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefactorName}</Text> {creatorName}</Text>
           <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefactorAccount}</Text> {benefactorAc}</Text>
         <Text style={styles.prodInfo}><Text style={styles.label}>{t.productCreatorAccount}</Text> {benefactorPhone}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.beneficiaryName}</Text> {beneficiaryPhone}</Text>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.status}</Text> {benefitStatus}</Text>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.cost}</Text> {formatAmountSync(Math.floor(prodCost), nationality, ratesMap)}</Text>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.benefitsPooled}</Text> {formatAmountSync((benefitsAmount), nationality, ratesMap)}</Text>
       <Text style={styles.prodDesc}>{prodDesc}</Text> 
                        
                    
        </View >
        <View style = {styles.buttonRow}>

<Pressable
onPress={VwBenefactorContriDtls}
style = {styles.loanFriendButton}
>            
  <Text>{t.viewMyContributions}</Text>            
</Pressable>
</View>   


</View>
     
    );
}; 

export default SMCvLnStts;