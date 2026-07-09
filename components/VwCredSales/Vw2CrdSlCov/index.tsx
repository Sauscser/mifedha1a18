import { useNavigation } from '@react-navigation/core';
import React from 'react';
import {View, Text,  Pressable,  } from 'react-native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import styles from './styles';


export interface ChmCvLnSttusRec {
    Loanee: {
      BiznaName: string,
      workerId:string,
      BusinessRegNo: string,
      workId:string
    
      
    }}

const CredSlrCvLnStts = (props:ChmCvLnSttusRec) => {
   const {
    Loanee: {
      BiznaName,
      workerId,
      BusinessRegNo,
      workId
      
   }} = props ;
   const navigation = useNavigation();
   const { i18n } = useTranslation();
   const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
   const t = translations[lang] || translations.en;

   const SndChmMmbrMny = () => {
      navigation.navigate("CrdSlVw2GrantLnReqCov", {BusinessRegNo})
   }
    return (
      <Pressable 
      onPress={SndChmMmbrMny}
      style = {styles.container}>            
            <View style = {{alignItems:"center"}}>
            <Text style = {styles.loanAdvert}>                       
                       {/*loaner details */}   
                       {BiznaName}               
                    </Text>
            </View>
            
                     <Text style = {styles.ownerName}>                       
                       {/*loaner details */}   
                    {t.businessPhone}: {BusinessRegNo}                 
                    </Text>
                    

                    <Text style = {styles.interest}>                       
                       {/* interest*/}
                       {t.workId}: {workId}                    
                    </Text> 
                    
        
                
        </Pressable>
    );
}; 

export default CredSlrCvLnStts;