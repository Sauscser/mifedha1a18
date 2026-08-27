import { useNavigation } from '@react-navigation/core';
import React, {useEffect, useState} from 'react';
import {View, Text,  Pressable,  } from 'react-native';
import styles from './styles';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import {useExchange} from '../../../../src/contexts/ExchangeContext';
import { getSMAccount } from '../../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';


export interface SMAccount {
    SMAc: {
      id:string,
      itemName:string
      loaneePhone:string,
      amount:number,
      repaymentAmt:number,
      repaymentPeriod:number
      loaneeName:string,
      status:string,
      installmentAmount:number,
      paymentFrequency:number,
    }}

const SMCvLnStts = (props:SMAccount) => {
   const {
      SMAc: {
        itemName,
        loaneePhone,
        amount,
        repaymentAmt,
        repaymentPeriod,
        loaneeName,
        id,
        status,
        installmentAmount,
        paymentFrequency
   }} = props ;

   const[isLoading, setIsLoading] = useState(false);
   const [Uzer, setUzer] = useState<string>(null);
   const [userNationality, setUserNationality] = useState<string>(null);
   const navigation = useNavigation();
   const client = generateClient();
   const { i18n } = useTranslation();
   const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
   const t = translations[lang] || translations.en;
   const userCode = nationalityToCode(userNationality);
   const {ratesMap} = useExchange();

   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'GrantPal2PalCrdSl', {id})
   }

   const SndChmMmbrMny2 = () => {
    safeNavigateFrom(navigation, 'DeclCredSls', {id})
   }

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
                      <View style = {styles.card}>
                      <Text style = {styles.prodName}>                          
                       {/*loaner details */}   
                      {t.loanRequestMessage
                        .replace('{name}', loaneeName)
                        .replace('{itemName}', itemName)
                        .replace('{amount}', formatAmountSync(amount, userCode, ratesMap))
                        .replace('{repaymentAmt}', repaymentAmt)
                        .replace('{period}', repaymentPeriod)
                        .replace('{installmentAmount}', installmentAmount)
                        .replace('{paymentFrequency}', paymentFrequency)
                        .replace('{phone}', loaneePhone)
                        .replace('{status}', status)}
                    </Text>
                    </View>  
                     
                    <View style = {styles.buttonRow}>
                    
                    <Pressable
                      onPress={SndChmMmbrMny}
                      style = {styles.loanFriendButton}
                      >            
                        <Text>{t.accept}</Text>            
                    </Pressable>
                   
                    <Pressable
                      onPress={SndChmMmbrMny2}
                      style = {styles.loanFriendButton}>            
                        <Text>{t.decline}</Text>            
                    </Pressable>  
                    </View>

            </View>
    );
}; 

export default SMCvLnStts