import { useNavigation } from '@react-navigation/native';
import React, {useState} from 'react';
import {View, Text,   ScrollView, Pressable, Alert} from 'react-native';



import styles from './styles';
import { createChamaDepositSync, createChamaDividendsSync, createChamaLoanSync, updateGroup } from '../../../src/graphql/mutations';
import { getGroup } from '../../../src/graphql/queries';


export interface SMAccount {
    SMAc: {
      
      GrpAc: string,
     
      ChamaName: string,
      amount:number,
      createdAt: string
    }}

const SMCvLnStts = (props:SMAccount) => {
   const {
      SMAc: {
        GrpAc,
     
        ChamaName,
        amount,
        createdAt
        
   }} = props ;

   const navigation = useNavigation();
   const[isLoading, setIsLoading] = useState(false);
   
  
                                                               


    return (
       <View style={styles.pageContainer}>
          <View style={styles.card}>
            <Text style={styles.prodInfo}><Text style={styles.label}>Group Name:</Text> {ChamaName}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Group Account:</Text> {GrpAc}</Text>
            {/* Replace KES with dynamic currency */}
            <Text style={styles.prodInfo}><Text style={styles.label}>Sync Amount:</Text> {formatAmountSync(amount)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Time Synced:</Text> {createdAt}</Text>
          </View>
        </View> 

    );
}; 

export default SMCvLnStts