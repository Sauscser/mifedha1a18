import { useNavigation } from '@react-navigation/core';
import React from 'react';
import {View, Text,  Pressable,  } from 'react-native';
import styles from './styles';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';



export interface ChmCvLnSttusRec {
    Loanee: {
      id: string,
      itemName: string,
     
      buyerContact: string,
      
      buyerName:string,
   
      amountSold: number,
      amountexpectedBack: number,
      amountRepaid: number,
      repaymentPeriod: number,
      lonBala:number,
      description: string,
      status: string,
      advregnu: string,
      createdAt:string,
      updatedAt:string,
        
    }}

const CredSlrCvLnStts = (props:ChmCvLnSttusRec) => {
   const {
    Loanee: {
      id,
      itemName,
      
      buyerName,
   
      lonBala,
      createdAt
     
   }} = props ;
   const navigation = useNavigation();

   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'BListCredByrNonCovs', {id})
   }
    return (
      <Pressable 
      onPress={SndChmMmbrMny}
      style = {styles.container}>            
            <View style = {{alignItems:"center"}}>
            <Text style = {styles.loanAdvert}>                       
                       {/*loaner details */}   
                       {buyerName}               
                    </Text>
            </View>
            
                     <Text style = {styles.ownerName}>                       
                       {/*loaner details */}   
                       Loan Id: {id}                 
                    </Text>

                    <Text style = {styles.ownerName}>                       
                       {/*loaner details */}   
                       Item Name: {itemName}                 
                    </Text>                     

                    <Text style = {styles.interest}>                       
                       {/* interest*/}
                       Loan Balance: {formatAmountSync(lonBala, nationalityToCode(nationality), ratesMap)}                    
                    </Text>

                    <Text style = {styles.interest}>                       
                       {/* interest*/}
                       Time given: {createdAt}                    
                    </Text> 
                    
        
                
        </Pressable>
    );
}; 

export default CredSlrCvLnStts