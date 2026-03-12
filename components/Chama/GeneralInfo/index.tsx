
import React, {useState, useEffect} from 'react';
import {View, Text,   ScrollView} from 'react-native';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {useExchange} from '../../../src/contexts/ExchangeContext';
import { translations } from './translation';
import { useTranslation } from 'react-i18next';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getSMAccount } from '../../../src/graphql/queries';



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

   const client = generateClient();


 const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const {ratesMap} = useExchange();     const { i18n } = useTranslation();
      const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
      const t = translations[lang] || translations.en;

      useEffect(() => {
        const fetchUserData = async () => {
                                
        const user = await fetchUserAttributes();
        setUzer(user.email);
        try {
        const userData = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: user.email },
        });
        setUserNationality(userData.data.getSMAccount.nationality);
        console.log('User Data:', userData);
        } catch (error) {
        console.error('Error fetching user data:', error);
        }
        };
        fetchUserData();
        }, [Uzer]);

    return (
        <View style = {styles.pageContainer}>              
            
            
            <View style= {styles.card}>       

            <Text style={styles.prodInfo}><Text style={styles.label}>{t.chamaContact}:</Text> {grpContact}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.chamaName}:</Text> {grpName}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.registrationNumber}:</Text> {regNo}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.accountBalance}:</Text> {formatAmountSync(Number(grpBal), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.chamaBenefits}:</Text> {formatAmountSync(Number(TtlActvLonsTmsLnrChmNonCov), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.chamaMembers}:</Text>  {ttlGrpMembers}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.chamaDeposits}:</Text> {formatAmountSync(Number(ttlDpst), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.chamaWithdrawals}:</Text> {formatAmountSync(Number(ttlWthdrwn), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.afterSyncDividend}:</Text> {formatAmountSync(Number(MemberDividendSync), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.afterSyncWithdrawal}:</Text> {formatAmountSync(Number(WithdrawalSync), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.afterSyncLoan}:</Text> {formatAmountSync(Number(GrpLoanOutSync), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.totalLoansGiven}:</Text> {formatAmountSync(Number(TtlActvLonsAmtLnrChmCov), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.loansRecovered}:</Text> {formatAmountSync(Number(TtlClrdLonsAmtLnrChmCov), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.membersContributions}:</Text> {formatAmountSync(Number(ttlNonLonsRecChm), userCode, ratesMap)}</Text>
            <Text style={styles.prodInfo}><Text style={styles.label}>{t.moneySentToMembers}:</Text> {formatAmountSync(Number(ttlNonLonsSentChm), userCode, ratesMap)}</Text>
            
        </View>
                
        </View>
    );
}; 

export default ChmInfo