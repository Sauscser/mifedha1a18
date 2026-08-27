import { useNavigation } from '@react-navigation/core';
import React from 'react';
import {View, Text,  Pressable,  } from 'react-native';
import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';



export interface ChmCvLnSttusRec {
    Loanee: {
      BiznaName: string,
      workerId:string,
      BusinessRegNo: string,
      workId:string
    
      
    }}

const CredSlrCvLnStts = (props:ChmCvLnSttusRec) => {
   const { i18n } = useTranslation();
   const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
   const t = translations[lang] || translations.en;
   const {
    Loanee: {
      BiznaName,
      workerId,
      BusinessRegNo,
      workId
      
   }} = props ;
   const navigation = useNavigation();

   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'Vw2GrntBiz2Pal', {BusinessRegNo})
   }
    return (
      <View style = {styles.pageContainer}>
      <Pressable 
      onPress={SndChmMmbrMny}
      style = {styles.card}>            
           
            <Text style = {styles.prodName}>                       
                       {/*loaner details */}   
                       {BiznaName}               
                    </Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.businessPhoneLabel}:</Text> {BusinessRegNo}</Text>
              <Text style={styles.prodInfo}><Text style={styles.label}>{t.workIdLabel}:</Text> {workId}</Text>
            
        </Pressable>
        </View>

    );
}; 

export default CredSlrCvLnStts;