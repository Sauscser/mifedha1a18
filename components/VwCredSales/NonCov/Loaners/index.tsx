import React from 'react';
import {View, Text,    ScrollView} from 'react-native';
import styles from './styles';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';


export interface ChmCvLnSttusRec {
   Loanee: {
     id: string,
     itemName: string,

     sellerContact: string,
     
     SellerName:string,
  
     amountSold: number,
     amountexpectedBack: number,
     amountRepaid: number,
     repaymentPeriod: number,
     lonBala:number,
     description: string,
     status: string,
   
     createdAt:string,
     updatedAt:string,
       
   }}

const CredSlrCvLnStts = (props:ChmCvLnSttusRec) => {
  const {
   Loanee: {
     id,
     itemName,

     sellerContact,
     
     SellerName,
  
     amountSold,
     amountexpectedBack,
     amountRepaid,
     repaymentPeriod,
     lonBala,
     description,
     status,
     
     createdAt,
     updatedAt,
  }} = props ;
  const { nationality, ratesMap } = useExchange();
   return (
       <View style = {styles.container}>              
           <View style = {{alignItems:"center"}}>
           <Text style = {styles.loanAdvert}>                       
                      {/*loaner details */}   
                      {SellerName}               
                   </Text>
           </View>
           
           <ScrollView >              
                
                    <Text style = {styles.ownerName}>                       
                      {/*loaner details */}   
                      Loan Id: {id}                 
                   </Text>
                   
                   <Text style = {styles.ownerContact}>                       
                       {/*loaner details */}  
                       Cash Price: {formatAmountSync(amountSold, nationalityToCode(nationality), ratesMap)}                
                    </Text>                     
                    <Text style ={styles.amountoffered}>                       
                       {/* amount*/} 
                       Credit Sale Price: {formatAmountSync(amountexpectedBack, nationalityToCode(nationality), ratesMap)}
                    </Text>   
                   <Text style = {styles.repaymentPeriod}>                       
                      {/* repaymentPeriod*/}
                       Amount Repaid: {formatAmountSync(amountRepaid, nationalityToCode(nationality), ratesMap)}                   
                   </Text> 
                   <Text style = {styles.interest}>                       
                      {/* interest*/}
                      Loan Balance: {formatAmountSync(Number(lonBala), nationalityToCode(nationality), ratesMap)}                    
                   </Text> 
                   <Text style = {styles.interest}>                       
                      {/* interest*/}
                      Repayment Period in days: {repaymentPeriod}                    
                   </Text> 
                   <Text style = {styles.interest}>                       
                      {/* interest*/}
                    Seller Contact: {sellerContact}                    
                   </Text> 
                
                   <Text style = {styles.interest}>                       
                      {/* interest*/}
                     Item Name(s): {itemName}                    
                   </Text> 
               
                   <Text style = {styles.interest}>                       
                      {/* interest*/}
                     Loan Status: {status}                    
                   </Text> 
                   <ScrollView>
                   <Text style = {styles.loanerotherdescriptions} >                       
                      {/* other description*/} 
                      Created At: {createdAt}                 
                   </Text>   
                   <Text style = {styles.loanerotherdescriptions} >                       
                      {/* other description*/} 
                      Last Update: {updatedAt}                 
                   </Text>   
                   <Text style = {styles.loanerotherdescriptions} >                       
                      {/* other description*/} 
                      More: {description}                 
                   </Text>   
                   </ScrollView>              
           
           
       </ScrollView>
               
       </View>
   );
}; 

export default CredSlrCvLnStts