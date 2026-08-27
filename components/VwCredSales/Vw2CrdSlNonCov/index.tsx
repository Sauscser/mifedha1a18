import { useNavigation } from '@react-navigation/core';
import React from 'react';
import {View, Text,  Pressable,  } from 'react-native';
import styles from './styles';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';



export interface ChmCvLnSttusRec {
    Loanee: {
      BiznaName: string,
      workerId:string,
      BusinessRegNo: string,
      workId:string    
      
    }}

const CredSlrCvLnStts = (props:ChmCvLnSttusRec) => {
   const {
    Loanee: {
      BiznaName,
      workerId,
      BusinessRegNo,
      workId
      
   }} = props ;
   const navigation = useNavigation();

   const SndChmMmbrMny = () => {
      safeNavigateFrom(navigation, 'CrdSlVw2GrantLnReqNonCov', {BusinessRegNo})
   }
    return (
      <Pressable 
      onPress={SndChmMmbrMny}
      style = {styles.container}>            
            <View style = {{alignItems:"center"}}>
            <Text style = {styles.loanAdvert}>                       
                       {/*loaner details */}   
                       {BiznaName}               
                    </Text>
            </View>
            
                     <Text style = {styles.ownerName}>                       
                       {/*loaner details */}   
                    Business Phone: {BusinessRegNo}                 
                    </Text>
                    

                    <Text style = {styles.interest}>                       
                       {/* interest*/}
                       Work ID: {workId}                    
                    </Text> 
                    
        
                
        </Pressable>
    );
}; 

export default CredSlrCvLnStts;