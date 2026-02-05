import React from 'react';
import {View, Text,   ScrollView} from 'react-native';

import styles from './styles';


export interface SMAccount {
   SMAc: {
     id: string,
     
     withdrawerid: string,  
     agentPhonecontact: string,
     amount: number,
     agentName:string,
     
     createdAt:string,
     updatedAt:string,
             
   }}

const ViewSMWithdrwls = (props:SMAccount) => {
  const {
     SMAc: {
        id,
          
        agentPhonecontact,
        amount,
        agentName,
        createdAt,
        updatedAt,
                
  }} = props ;


   return (

      <View style={styles.pageContainer}>
        <View style={styles.card}>
        <Text style={styles.prodName}>{agentName}</Text>

        <Text style={styles.prodInfo}><Text style={styles.label}>Transaction ID:</Text> {id}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>MFNdogo Number:</Text> {agentPhonecontact}</Text>
      {/* Replace KES with dynamic currency */}
      <Text style={styles.prodInfo}><Text style={styles.label}>Amount:</Text> {formatAmountSync(amount)}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>Transaction Time:</Text> {createdAt}</Text>
    
       </View>               
       </View>
   );
}; 

export default ViewSMWithdrwls