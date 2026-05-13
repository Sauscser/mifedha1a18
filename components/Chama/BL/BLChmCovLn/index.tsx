import { useNavigation } from '@react-navigation/native';
import { Alert, Text, TouchableOpacity, Pressable } from 'react-native';

import React, {useEffect, useState} from 'react';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import styles from './styles';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { getSMAccount } from '../../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';


export interface ChamaMmbrshpInfo {
    ChamaMmbrshpDtls: {
      loanID: string,
      lonBala:number,
      amountExpectedBackWthClrnc: number,
      loaneeName:string,
      createdAt:string,
      crtnDate: number,
      interest:number
        amountExpectedBack
:number,
      amountRepaid:number
      
    }}

const ChmMbrShpInfo = (props:ChamaMmbrshpInfo) => {
   const { i18n } = useTranslation();
   const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
   const t = translations[lang] || translations.en;
   const {
      ChamaMmbrshpDtls: {
         loanID,
         lonBala,
         loaneeName,
         createdAt,
         amountExpectedBackWthClrnc,
         crtnDate,
         interest,
         amountExpectedBack,
         amountRepaid
         
   }} = props ;

   

   const navigation = useNavigation();
    
   const SndChmMmbrMny = () => {
      navigation.navigate("BLChmMmberCovs", {loanID})
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

   const today = new Date();
              let hours = (today.getHours() < 10 ? '0' : '') + today.getHours();
              let minutes = (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();
              let seconds = (today.getSeconds() < 10 ? '0' : '') + today.getSeconds();
              let years = (today.getFullYear() < 10 ? '0' : '') + today.getFullYear();
              let months = (today.getMonth() < 10 ? '0' : '') + today.getMonth();
              let months2 = parseFloat(months)
              let days = (today.getDate() < 10 ? '0' : '') + today.getDate();
              
              const now:any = years+ "-"+ "0"+months2 +"-"+ days+"T"+hours + ':' + minutes + ':' + seconds;

              const curYrs = parseFloat(years)*365;
              const curMnths = (months2)*30.4375;
              const daysUpToDates = curYrs + curMnths + parseFloat(days)

                const nows = Date.now();


              const daysUpToDate = Date.parse(now) ;

              const dayselapsed = (crtnDate - daysUpToDate)/(1000 * 60 * 60 * 24);

              const netLnBal = amountExpectedBack - amountRepaid

              const lonBalance = ((netLnBal) * 
              ((Math.pow(1 + interest/36500, dayselapsed) ))
    )
   
   return (
      <Pressable 
      onPress={SndChmMmbrMny}
      style = {styles.pageContainer}>          
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.loanId}: </Text> {loanID}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.memberName}: </Text> {loaneeName}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.timeLoanTaken}: </Text> {createdAt}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.loanBalanceWithPenalties}: </Text> {formatAmountSync((lonBalance), userCode, ratesMap)}</Text>
      </Pressable>
   );
}; 

export default ChmMbrShpInfo