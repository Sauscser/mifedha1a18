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
      sellerContact:string,
      SellerName:string,
   
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
      sellerContact,
      itemName,
      SellerName,
   
      lonBala,
    
   }} = props ;
   const navigation = useNavigation();

   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'RpayCredSlrNonCovs', {id})
   }
    return (
      <Pressable 
      onPress={SndChmMmbrMny}
      style = {styles.container}>            
            <View style = {{alignItems:"center"}}>
            <Text style = {styles.loanAdvert}>                       
                       {/*loaner details */}   
                       {SellerName}               
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
                    
        
                
        </Pressable>
    );
}; 

export default CredSlrCvLnStts