import { useNavigation } from '@react-navigation/core';
import React from 'react';
import {View, Text,  Pressable,  } from 'react-native';
import { translations } from './translation';
import { useTranslation } from 'react-i18next';
import styles from './styles';


export interface ChmCvLnSttusRec {
    Loanee: {
      BiznaName: string,
      workerId:string,
      BusinessRegNo: string,
      workId:string
    
      
    }}

const CredSlrCvLnStts = (props:ChmCvLnSttusRec) => {
  const { i18n } = useTranslation();
  const t = translations[i18n.language] || translations.en;
   const {
    Loanee: {
      BiznaName,
      workerId,
      BusinessRegNo,
      workId
      
   }} = props ;
   const navigation = useNavigation();

   const SndChmMmbrMny = () => {
      navigation.navigate("ItemAds", {BusinessRegNo})
   }
    return (
      <Pressable 
        onPress={SndChmMmbrMny}
        style={styles.pageContainer}
      >
        <View style={styles.card}>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.biznaNameLabel}</Text> {BiznaName}</Text>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.biznaAccountLabel}</Text> {BusinessRegNo}</Text>
          <Text style={styles.prodInfo}><Text style={styles.label}>{t.personnelIdLabel}</Text> {workerId}</Text>
        </View>
      </Pressable>
    );
}; 

export default CredSlrCvLnStts