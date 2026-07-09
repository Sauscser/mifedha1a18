import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {View, Text,   ScrollView, Pressable} from 'react-native';


import styles from './styles';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { updateReqLoanCredSl } from '../../../src/graphql/mutations';
import { useTranslation } from 'react-i18next';
import translations from './translation';


export interface SMAccount {
    SMAc: {
      id:string,
      itemName:string,
      loaneeEmail:string,
      loaneePhone:string,
      amount:number,
      repaymentAmt:number,
      repaymentPeriod:number
      loaneeName:string,
      status:string
    }}

const SMCvLnStts = (props:SMAccount) => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fmt = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
   const {
      SMAc: {
        loaneeEmail,
        loaneePhone,
        itemName,
        amount,
        repaymentAmt,
        repaymentPeriod,
        loaneeName,
        id,
        status
   }} = props ;

   const[isLoading, setIsLoading] = useState(false);
   const navigation = useNavigation();
   

   const SndChmMmbrMny = () => {
       navigation.navigate("NonCovCredSlss", {id})

   }

   const SndChmMmbrMny2 = () => {
    navigation.navigate("DeclCredSls", {id})

}
    return (
        
                  
                  
            <View style = {styles.pageContainer}>

                  
                       
                      <View style = {styles.card}>
                      <Text style = {styles.prodName}>                       
                       {/*loaner details */}   
                      {fmt(t.requestSummary, {
                        name: loaneeName,
                        item: itemName,
                        amount,
                        repaymentAmt,
                        repaymentPeriod,
                        phone: loaneePhone,
                        status,
                      })}
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
                      style = {styles.redeemButton}>            
                        <Text>{t.decline}</Text>            
                    </Pressable>  
                    </View>
                    
            </View>
            
                
        
    );
}; 

export default SMCvLnStts