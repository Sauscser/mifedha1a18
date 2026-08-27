import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { Text,  Pressable,  View, ScrollView} from 'react-native';

import { translations } from './translation';
import styles from './styles';


export interface ChamaMmbrshpInfo {
    ChamaMmbrshpDtls: {
      id: string,
      memberContact:string,
      memberName:string,
      
    }}

const ChmMbrShpInfo = (props:ChamaMmbrshpInfo) => {
   const {
      ChamaMmbrshpDtls: {
         id,
         memberContact,
         memberName,
         
   }} = props ;

   const navigation = useNavigation();
   const lang = (navigator.language || 'en').split('-')[0];
   const t = translations[lang] || translations.en;
   
   const SndChmMmbrMny = () => {
      navigation.navigate("RemoveChmMbrs", {id})
   }
   
    return (
       <Pressable 
       onPress={SndChmMmbrMny}
       style = {styles.pageContainer}>          
          
          <View style = {styles.card}>
         
         <Text style={styles.prodInfo}><Text style={styles.label}>{t.memberName}:</Text> {memberName}</Text>
         <Text style={styles.prodInfo}><Text style={styles.label}> {t.memberChamaId}:</Text> {id}</Text>
         <Text style={styles.prodInfo}><Text style={styles.label}>{t.memberContact}:</Text> {memberContact}</Text>
        
             </View>                   
               
        </Pressable>
    );
}; 

export default ChmMbrShpInfo