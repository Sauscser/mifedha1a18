import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {View, Text,   ScrollView, Pressable} from 'react-native';
import { deleteReqLoan, updateReqLoan, updateReqLoanChama } from '../../../../src/graphql/mutations';
import {StyleSheet, Dimensions} from 'react-native';

import styles from './styles';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';



export interface SMAccount {
    SMAc: {
      id:string,
      loaneeEmail:string,
      loaneePhone:string,
      amount:number,
      repaymentAmt:number,
      repaymentPeriod:number
      loaneeName:string,
    }}

const SMCvLnStts = (props:SMAccount) => {
   const {
      SMAc: {
        loaneeEmail,
        loaneePhone,
        amount,
        repaymentAmt,
        repaymentPeriod,
        loaneeName,
        id
   }} = props ;

   const [isLoading, setIsLoading] = useState(false);
   const navigation = useNavigation();
   

   const SndChmMmbrMny = () => {
       safeNavigateFrom(navigation, 'ChmNonCovLons', {id})

   }

   const SndChmMmbrMny2 = () => {
    safeNavigateFrom(navigation, 'DeclChamaReq', {id})

}
    return (
        
                  
                  
            <View style = {styles.pageContainer}>

                  
                       
                      <View style = {styles.card}>
                      <Text style = {styles.prodInfo}>                       
                       {/*loaner details */}   
                      Hi! it's {loaneeName}. Kindly Loan me Ksh. {amount}. I 
                      commit to repay a Total of Ksh. {repaymentAmt} within {repaymentPeriod} days. 
                      You can reach me through {loaneePhone}.       
                    </Text>
                    </View>  
                     
                    <View style = {styles.buttonRow}>
                   
                    <Pressable
                      onPress={SndChmMmbrMny}
                      style = {styles.loanFriendButton}
                      >            
                        <Text>Accept</Text>            
                    </Pressable>
                   
                    <Pressable
                      onPress={SndChmMmbrMny2}
                      style = {styles.redeemButton}>            
                        <Text>Decline</Text>            
                    </Pressable>  
                     
                    </View>
                      

      
            </View>
            
                
        
    );
}; 

export default SMCvLnStts;