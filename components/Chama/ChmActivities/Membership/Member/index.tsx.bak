import { useNavigation } from '@react-navigation/core';
import {View, Text,  ScrollView, Pressable, Alert} from 'react-native';

import styles from './styles';

import React, {useEffect, useState} from 'react';
import { formatAmountSync } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';
import { useExchange } from '../../../../../src/contexts/ExchangeContext';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getSMAccount } from '../../../../../src/graphql/queries';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';


export interface ChamaMmbrshpInfo {
    ChamaMmbrshpDtls: {
      MembaId: string,
      ChamaNMember: string,
      memberContact: string,
      groupName:string,
      memberNatId:string,
      GrossLnsGvn:number,
      LonAmtGven: number,
      AmtRepaid:number,
      LnBal: number,
      NonLoanAcBal:number,
      ttlNonLonAcBal: number,
      AcStatus: string,
      loanStatus: string,
      blStatus: string,
      createdAt:string,
      
                  subscriptionFrequency:number,
      subscriptionAmt:number,
      lateSubscriptionPenalty:number,
      ttlLateSubs:number,
      timeCrtd:number,
      subscribedAmt:number,
      totalSubAmt:number
      
    }}

const ChmMbrShpInfo = (props:ChamaMmbrshpInfo) => {
   const {
      ChamaMmbrshpDtls: {
         MembaId,
         ChamaNMember,
         memberNatId,
         memberContact,
         groupName,
         loanStatus,
         blStatus,
         GrossLnsGvn,
         LonAmtGven,
         AmtRepaid,
         LnBal,
         NonLoanAcBal,
         ttlNonLonAcBal,
         createdAt,       
         AcStatus,
         subscribedAmt,
         totalSubAmt,
         subscriptionFrequency,
         subscriptionAmt,
         lateSubscriptionPenalty,
         ttlLateSubs,
         timeCrtd,
         
   }} = props ;

  const client = generateClient();
  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const { ratesMap } = useExchange();
  // Translation pattern
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
         console.log('User Data:', userData);
       } catch (error) {
         Alert.alert(t.errorFetchingUser);
       }
     };
     fetchUserData();
   }, [Uzer]);

   const today = new Date();
              let hours = (today.getHours() < 10 ? '0' : '') + today.getHours();
              let minutes = (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();
              let seconds = (today.getSeconds() < 10 ? '0' : '') + today.getSeconds();
              let years = (today.getFullYear() < 10 ? '0' : '') + today.getFullYear();
              let months = (today.getMonth() < 10 ? '0' : '') + today.getMonth();
              let months2 = parseFloat(months)
              let days = (today.getDate() < 10 ? '0' : '') + today.getDate();
              
              const now:any = years+ "-"+ "0"+months2 +"-"+ days+"T"+hours + ':' + minutes + ':' + seconds;

              const now1:any = "2024-05-20";
             
              const curYrs = parseFloat(years)*365;
              const curMnths = (months2)*30.4375;
              const daysUpToDate = curYrs + curMnths + parseFloat(days)  
              const daysCrtd = Math.floor(timeCrtd / (1000 * 60 * 60 * 24));
              const tmDif = daysUpToDate - daysCrtd;
              const subFreq = tmDif/subscriptionFrequency        
            
              const Amt2HvBnSub = subFreq*subscriptionAmt
              const subPnlties = totalSubAmt - subscribedAmt
              const ttlArrears = (ttlLateSubs + Amt2HvBnSub).toFixed(0)

   const navigation = useNavigation();
   const SndChmMmbrMny = () => {
      navigation.navigate("Contributionssss", {ChamaNMember})
   }

   const ViewMmberDtls = () => {
      navigation.navigate ("MemberDtls", {ChamaNMember})
   }

   const ViewSubs = () => {
      navigation.navigate ("VwMbrSubsDirectly", {ChamaNMember})
   }
   
    return (
      <View style = {styles.pageContainer}>              
            
      <Pressable onPress={ViewMmberDtls} style = {styles.card}>
      <Text style={styles.prodName}>{groupName}</Text>

  <Text style={styles.prodInfo}><Text style={styles.label}>{t.memberChamaNumber}:</Text> {MembaId}</Text>
  <Text style={styles.prodInfo}><Text style={styles.label}>{t.subscriptionUpToDate}:</Text> {formatAmountSync(Math.floor(subscribedAmt), userCode, ratesMap)}</Text>
  <Text style={styles.prodInfo}><Text style={styles.label}>{t.subscriptionWithPenalties}:</Text> {formatAmountSync(Math.floor(parseFloat(ttlArrears)), userCode, ratesMap)}</Text>

              </Pressable>

              <View style = {styles.buttonRow}>
              <Pressable
                onPress={ViewSubs}
                style = {styles.loanFriendButton}
                >            
                  <Text style = {styles.buttonText}>{t.subscriptions}</Text>            
              </Pressable>
              <Pressable
                onPress={SndChmMmbrMny}
                style = {styles.loanFriendButton}>            
                  <Text style = {styles.buttonText}>{t.subscribe}</Text>            
              </Pressable>
             
            
             
               
              </View>
  </View>
    );
}; 

export default ChmMbrShpInfo