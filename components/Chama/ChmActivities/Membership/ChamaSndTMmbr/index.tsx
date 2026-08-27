import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { Text,  Pressable,  } from 'react-native';

import styles from './styles';
import { safeNavigateFrom } from '../../../../../src/utils/navigationHelper';



export interface ChamaMmbrshpInfo {
    ChamaMmbrshpDtls: {
      id: string,
      
      memberName:string,
      
    }}

const ChmMbrShpInfo = (props:ChamaMmbrshpInfo) => {
   const {
      ChamaMmbrshpDtls: {
         id,
        
         memberName,
        
   }} = props ;

   const navigation = useNavigation();
    
   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'SndMbrsMnys', {id})
   }
   
    return (
       <Pressable 
       onPress={SndChmMmbrMny}
       style = {styles.pageContainer}>          
          
         <Text style={styles.prodInfo}><Text style={styles.label}>Member Chama ID:</Text> {id}</Text>
         <Text style={styles.prodInfo}><Text style={styles.label}>Member Name:</Text> {memberName}</Text>
           
           
        </Pressable>
    );
}; 

export default ChmMbrShpInfo;