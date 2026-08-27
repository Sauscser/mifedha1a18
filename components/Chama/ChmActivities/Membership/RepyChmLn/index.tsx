import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { Text,  Pressable,  } from 'react-native';

import styles from './styles';
import { safeNavigateFrom } from '../../../../../src/utils/navigationHelper';



export interface ChamaMmbrshpInfo {
    ChamaMmbrshpDtls: {
      id: string,
     
      groupName:string,
      
    }}

const ChmMbrShpInfo = (props:ChamaMmbrshpInfo) => {
   const {
      ChamaMmbrshpDtls: {
         id,
        
         groupName,
         
   }} = props ;

   const navigation = useNavigation();
    
   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'Contributionssss', {id})
   }
   
    return (
       <Pressable 
       onPress={SndChmMmbrMny}
       style = {styles.pageContainer}>          
          
          <Text style={styles.prodInfo}><Text style={styles.label}>Member Chama ID:</Text> {id}</Text>
         <Text style={styles.prodInfo}><Text style={styles.label}>Chama Name:</Text> {groupName}</Text>
              
               
        </Pressable>
    );
}; 

export default ChmMbrShpInfo;