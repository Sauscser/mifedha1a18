import { useNavigation } from '@react-navigation/core';
import React from 'react';
import {View, Text,  Pressable,  } from 'react-native';
import styles from './styles';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';



export interface SMCvLnSttus {
    Loanee: {
        id:string,
        loaneePhn: string,
        amountgiven: number,
        amountexpected: number,
        amountrepaid: number,
        lonBala: number,
        repaymentPeriod: number,
        loanername:string,
        status: string,
        description: string,
        createdAt:string,
        updatedAt:string,
        
    }}

const SMCvLnStts = (props:SMCvLnSttus) => {
   const {
    Loanee: {
    id,
    
    lonBala,
   
    loanername,
    
   }} = props ;

   const navigation = useNavigation();

   const SndChmMmbrMny = () => {
       safeNavigateFrom(navigation, 'RepayNonCovLnss', {id})
   }
    return (
        <Pressable 
        onPress={SndChmMmbrMny}
        style = {styles.container}>  
             
            <View style = {{alignItems:"center"}}>
            <Text style = {styles.loanAdvert}>                       
                       {/*loaner details */}   
                       {loanername}               
                    </Text>
            </View>
           
                    <Text style = {styles.ownerName}>                       
                       {/*loaner details */}   
                       Loan Id: {id}                 
                    </Text>
                    
                    <Text style ={styles.amountoffered}>                       
                       {/* amount*/} 
                      Loan Balance (Ksh): {lonBala.toFixed(2)}
                    </Text>                   
                   
                    </Pressable>
    );
}; 

export default SMCvLnStts