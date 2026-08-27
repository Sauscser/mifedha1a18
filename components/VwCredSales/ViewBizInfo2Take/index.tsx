
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {View, Text,   ScrollView, Pressable} from 'react-native';

import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';



export interface ChmaInfo {
    ChmDtls: {
      
      BusKntct: string,
      status: number,
      busName: string,
      TtlEarnings: number,
      earningsBal: number
      
      description: string,
        
    }}

const ChmInfo = (props:ChmaInfo) => {
   const { i18n } = useTranslation();
   const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
   const t = translations[lang] || translations.en;
   const {
      ChmDtls: {
        
      BusKntct,
      status,
      busName,
      TtlEarnings,
      earningsBal,
      
      description,
   }} = props ;

   const navigation = useNavigation();

   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'TakeOverBizna', {BusKntct})
   };

    return (

      <View style = {styles.pageContainer}>
      <Pressable 
      onPress={SndChmMmbrMny}
      style = {styles.card}>   

      <Text style={styles.prodInfo}><Text style={styles.label}>{t.businessNameLabel}:</Text> {busName}</Text>
      <Text style={styles.prodInfo}><Text style={styles.label}>{t.businessContactLabel}:</Text> {BusKntct}</Text>
      <Text style={styles.prodInfo}><Text style={styles.label}>{t.businessStatusLabel}:</Text> {status}</Text>
           
        </Pressable>
        </View>

    );
}; 

export default ChmInfo;