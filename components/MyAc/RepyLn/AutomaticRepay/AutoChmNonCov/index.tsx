import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { Text,  Pressable,  } from 'react-native';

import styles from './styles';
import { safeNavigateFrom } from '../../../../../src/utils/navigationHelper';



export interface ChamaMmbrshpInfo {
    ChamaMmbrshpDtls: {
      loanID: string,
      lonBala:number,
      loanerName:string,
      memberId:string,
      
    }}

const ChmMbrShpInfo = (props:ChamaMmbrshpInfo) => {
   const {
      ChamaMmbrshpDtls: {
         loanID,
         lonBala,
         loanerName,
         memberId
   }} = props ;

   const navigation = useNavigation();
    
   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'RepyChmNonCovLns', {loanID})
   }
   
    return (
       <Pressable 
       onPress={SndChmMmbrMny}
       style = {styles.container}>          
          
                     <Text style = {styles.ownerContact}>                       
                       {/*loaner details */}  
                       Loan ID: {loanID}                
                    </Text>  
                    <Text style = {styles.ownerContact}>                       
                       {/*loaner details */}  
                       Member Chama ID: {memberId}                
                    </Text>                                                     
                    <Text style = {styles.ownerContact}>                       
                       {/*loaner details */}  
                     Chama Name: {loanerName}                
                    </Text>  
                    <Text style = {styles.ownerContact}>                       
                       {/*loaner details */}  
                     Loan Balance: (Ksh) {lonBala.toFixed(2)}                
                    </Text>   
                                
               
        </Pressable>
    );
}; 

export default ChmMbrShpInfo