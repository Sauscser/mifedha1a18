
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import styles from './styles';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { formatAmountSync } from '../../../src/utils/exchange';

export interface SMAccount {
   SMAc: {
      loanID: string,
      itemName: string,
      itemSerialNumber: string,
      buyerContact: string,
      sellerContact: string,
      buyerName: string,
      SellerName: string,
      amountSold: number,
      amountexpectedBack: number,
      amountRepaid: number,
      advregnu: string,
      repaymentPeriod: number,
      lonBala: number,
      description: string,
      createdAt: string,
      updatedAt: string,
   }
}

const ViewSMDeposts = (props: SMAccount) => {
   const {
      SMAc: {
         loanID,
         itemName,
         itemSerialNumber,
         buyerContact,
         sellerContact,
         buyerName,
         SellerName,
         amountSold,
         amountexpectedBack,
         amountRepaid,
         repaymentPeriod,
         lonBala,
         description,
         createdAt,
         updatedAt,
      },
   } = props;
   const { nationality, ratesMap } = useExchange();
   const natCode = nationalityToCode(nationality);

   return (
      <View style={styles.container}>
         <View style={{ alignItems: 'center' }}>
            <Text style={styles.subTitle}>Loan ID: {loanID}</Text>
         </View>
         <ScrollView>
            <Text style={styles.ownerName}>Seller Name : {SellerName}</Text>
            <Text style={styles.ownerName}>Buyer Name: {buyerName}</Text>
            <Text style={styles.ownerName}>Item Name: {itemName}</Text>
            <Text style={styles.ownerName}>Item Serial Number: {itemSerialNumber}</Text>
            <Text style={styles.ownerName}>Cost: {formatAmountSync(amountSold, natCode, ratesMap)}</Text>
            <Text style={styles.ownerName}>Amount Expected Back: {formatAmountSync(amountexpectedBack, natCode, ratesMap)}</Text>
            <Text style={styles.ownerName}>Repayment Period: {repaymentPeriod}</Text>
            <Text style={styles.ownerName}>Amount Repaid: {formatAmountSync(amountRepaid, natCode, ratesMap)}</Text>
            <Text style={styles.ownerName}>Loan Balance: {formatAmountSync(lonBala, natCode, ratesMap)}</Text>
            <Text style={styles.ownerName}>Seller Contact : {sellerContact}</Text>
            <Text style={styles.ownerName}>Buyer Contact: {buyerContact}</Text>
            <Text style={styles.amountoffered}>Created At: {createdAt}</Text>
            <Text style={styles.amountoffered}>Last Update: {updatedAt}</Text>
            <Text style={styles.ownerName}>More: {description}</Text>
         </ScrollView>
      </View>
   );
};

export default ViewSMDeposts