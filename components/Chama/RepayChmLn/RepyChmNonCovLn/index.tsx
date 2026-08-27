import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { Text,  Pressable,  } from 'react-native';

import styles from './styles';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';



export interface ChamaMmbrshpInfo {
    ChamaMmbrshpDtls: {
      id: string,
      lonBala:number,
      loanerName:string,
      memberId:string,
      
    }}

const ChmMbrShpInfo = (props:ChamaMmbrshpInfo) => {
   const {
      ChamaMmbrshpDtls: {
         id,
         lonBala,
         loanerName,
         memberId
   }} = props ;

   const navigation = useNavigation();
    
   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'RepyChmNonCovLns', {id})
   }
   
    return (
       <Pressable 
       onPress={SndChmMmbrMny}
       style = {styles.container}>          
          
                     <Text style = {styles.ownerContact}>                       
                       {/*loaner details */}  
                       Loan ID: {id}                
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
                     Loan Balance: {formatAmountSync(lonBala)}                
                    </Text>   
                                
               
        </Pressable>
    );
}; 

export default ChmMbrShpInfo;