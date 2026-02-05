
import React from 'react';
      import { View, Text } from 'react-native';
      import styles from './styles';
      import { useExchange } from '../../../src/contexts/ExchangeContext';
      import { nationalityToCode } from '../../../src/utils/nationalityToCode';
      import { formatAmountSync } from '../../../src/utils/exchange';




      
      export interface SMAccount {
         SMAc: {
            loanID: string,
            loaneePhn: string,
            loanerPhn: string,
            loanername: string,
            loaneename: string,
            amountgiven: number,
            amountexpected: number,
            amountrepaid: number,
            lonBala: number,
            repaymentPeriod: number,
            advregnu: number,
            description: string,
            createdAt: string,
            updatedAt: string,
         }
      }

      const ViewSMDeposts = (props: SMAccount) => {
         const {
            SMAc: {
               loanID,
               loaneePhn,
               loanerPhn,
               loanername,
               loaneename,
               amountgiven,
               amountexpected,
               amountrepaid,
               lonBala,
               repaymentPeriod,
               description,
               createdAt,
               updatedAt,
            },
         } = props;
         const { nationality, ratesMap } = useExchange();
         const natCode = nationalityToCode(nationality);

         return (
            <View style={styles.pageContainer}>
               <View style={styles.card}>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Loan ID: </Text> {loanID}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Loaner Name: </Text> {loanername}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Loanee Name: </Text> {loaneename}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Loaner Contact: </Text> {loanerPhn}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Loanee Contact: </Text> {loaneePhn}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Time taken: </Text> {createdAt}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Loan Amount:</Text> {formatAmountSync(amountgiven, natCode, ratesMap)}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Amount Expected Back: </Text> {formatAmountSync(amountexpected, natCode, ratesMap)}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Repayment Period: </Text> {repaymentPeriod} days</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}> Amount Repaid:</Text> {formatAmountSync(amountrepaid, natCode, ratesMap)}</Text>
                  <Text style={styles.prodInfo}><Text style={styles.label}>Loan Balance:</Text> {formatAmountSync(lonBala, natCode, ratesMap)}</Text>
                  <Text style={styles.prodDesc}>{description}</Text>
               </View>
            </View>
         );
      };

      export default ViewSMDeposts