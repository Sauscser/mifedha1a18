import { useNavigation } from '@react-navigation/core';
import React , {useEffect, useState} from 'react';
import {View, Text,  ScrollView, Pressable} from 'react-native';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { getSMAccount } from '../../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from '../../../../screens/Chama/ReqLoan/Vw2SelectChm2Req/translation';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';


export interface ChamaMmbrshpInfo {
    ChamaMmbrshpDtls: {
      MembaId: string,
      ChamaNMember: string,
      groupContact: string,
      
      groupName:string,
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
      memberChmBenefit:number,
      
    }}

const ChmMbrShpInfo = (props:ChamaMmbrshpInfo) => {
   const {
      ChamaMmbrshpDtls: {
         MembaId,
         ChamaNMember,
         groupContact,
       
         groupName,
         loanStatus,
         blStatus,
         GrossLnsGvn,
         LonAmtGven,
         AmtRepaid,
         LnBal,
         NonLoanAcBal,
         memberChmBenefit,
         createdAt,       
         AcStatus,
       
       
   }} = props ;

   const navigation = useNavigation();
   
 
   const VwFloatedLoans = () => {
      safeNavigateFrom(navigation, 'VwFloatedLoans', {groupContact, MembaId})
   }
  
   const client = generateClient();
       const [Uzer, setUzer] = useState<string>(null);
       const [userNationality, setUserNationality] = useState<string>(null);
       const userCode = nationalityToCode(userNationality);
       const { i18n } = useTranslation();
   const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
   const t = translations[lang] || translations.en;
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
                         if (userData && userData.data && userData.data.getSMAccount) {
                             setUserNationality(userData.data.getSMAccount.nationality);
                             console.log('User Data:', userData);
                         } else {
                             console.error('GraphQL result missing data:', userData);
                         }
                     } catch (error) {
                         console.error('Error fetching user data:', error);
                     }
                 };
                 fetchUserData();
             }, [Uzer]);

    return (
      <View style = {styles.pageContainer}>              
      <Pressable style = {styles.card}
      onPress={VwFloatedLoans}>
         <Text style={styles.prodInfo}><Text style={styles.label}>{t.groupName}</Text> {groupName}</Text>           
         <Text style={styles.prodInfo}><Text style={styles.label}>{t.groupContact}</Text> {groupContact}</Text>           
         <Text style={styles.prodInfo}><Text style={styles.label}>{t.membershipNumber}</Text> {MembaId}</Text>
      </Pressable>
  </View>
    );
}; 

export default ChmMbrShpInfo