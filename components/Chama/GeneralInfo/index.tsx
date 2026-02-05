
import React from 'react';
import {View, Text,   ScrollView} from 'react-native';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';

import styles from './styles';


export interface ChmaInfo {
    ChmDtls: {
      grpContact:string,
      grpName: string,
      grpBal: number,
      regNo: string,
      ttlGrpMembers: number
      ttlDpst: number,
      ttlWthdrwn: number,
    
      ttlNonLonsRecChm: number,
      ttlNonLonsSentChm:number,
      
      GrpLoanOutSync: number,
                  GrpLoanRpymntSync: number,
                  MemberSubscrptnSync: number,
                  MemberDividendSync: number,
                  DepositSync:number,
                  WithdrawalSync:number,
                  BankName: string,
                  BranchNu: string,
      
    
      TtlActvLonsTmsLnrChmCov: number,
      TtlActvLonsAmtLnrChmCov: number,
      TtlBLLonsTmsLnrChmCov: number,
      TtlBLLonsAmtLnrChmCov: number,
      TtlClrdLonsTmsLnrChmCov: number,
      TtlClrdLonsAmtLnrChmCov: number,
    
      TtlActvLonsTmsLnrChmNonCov: number,
      TtlActvLonsAmtLnrChmNonCov: number,
      TtlBLLonsTmsLnrChmNonCov: number,
      TtlBLLonsAmtLnrChmNonCov: number,
      TtlClrdLonsTmsLnrChmNonCov: number,
      TtlClrdLonsAmtLnrChmNonCov: number,
      description: string,
        
    }}

const ChmInfo = (props:ChmaInfo) => {
   const {
      ChmDtls: {
         grpContact,
      grpName,
      grpBal,
      ttlGrpMembers,
      ttlDpst,
      ttlWthdrwn,
      regNo,
      
     
      
    
      ttlNonLonsRecChm,
      ttlNonLonsSentChm,
    
      GrpLoanOutSync,
      GrpLoanRpymntSync,
      MemberSubscrptnSync,
      MemberDividendSync,
      DepositSync,
      WithdrawalSync,
      BankName,
      BranchNu,
    
      TtlActvLonsTmsLnrChmCov,
      TtlActvLonsAmtLnrChmCov,
      TtlBLLonsTmsLnrChmCov,
      TtlBLLonsAmtLnrChmCov,
      TtlClrdLonsTmsLnrChmCov,
      TtlClrdLonsAmtLnrChmCov,
    
      TtlActvLonsTmsLnrChmNonCov,
      TtlActvLonsAmtLnrChmNonCov,
      TtlBLLonsTmsLnrChmNonCov,
      TtlBLLonsAmtLnrChmNonCov,
      TtlClrdLonsTmsLnrChmNonCov,
      TtlClrdLonsAmtLnrChmNonCov,
      description,
   }} = props ;

    const { nationality, ratesMap } = useExchange();

    return (
        <View style = {styles.pageContainer}>              
            
            
            <View style= {styles.card}>       

            <Text style={styles.prodInfo}><Text style={styles.label}>Chama Contact:</Text> {grpContact}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Chama Name:</Text> {grpName}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Registration Number:</Text> {regNo}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Account Balance:</Text> {formatAmountSync(Number(grpBal), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Chama Benefits:</Text> {formatAmountSync(Number(TtlActvLonsTmsLnrChmNonCov), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Chama Members:</Text>  {ttlGrpMembers}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Chama Deposits:</Text> {formatAmountSync(Number(ttlDpst), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Chama Withdrawals:</Text> {formatAmountSync(Number(ttlWthdrwn), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>After sync dividend balance:</Text> {formatAmountSync(Number(MemberDividendSync), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>After sync withrawal Balance:</Text> {formatAmountSync(Number(WithdrawalSync), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>After sync loan Balance:</Text> {formatAmountSync(Number(GrpLoanOutSync), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Total Loans Given:</Text> {formatAmountSync(Number(TtlActvLonsAmtLnrChmCov), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Loans Recovered:</Text> {formatAmountSync(Number(TtlClrdLonsAmtLnrChmCov), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Members Contributions:</Text> {formatAmountSync(Number(ttlNonLonsRecChm), nationality, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>Money Sent to Members:</Text> {formatAmountSync(Number(ttlNonLonsSentChm), nationality, ratesMap)}</Text>
            
        </View>
                
        </View>
    );
}; 

export default ChmInfo