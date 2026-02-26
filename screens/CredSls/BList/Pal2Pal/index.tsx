import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { getCompany, getCovCreditSeller, getSMAccount } from '../../../../src/graphql/queries';
import { updateCompany, updateCovCreditSeller, updateSMAccount, createMessages, sendNotification } from '../../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import styles from './styles';

const client = generateClient();

const BLCovCredByr = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams: any = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const { ratesMap } = useExchange();

  const gtCompDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
      });

      const ttlSellerLnsInBlAmtCovs = compDtls.data.getCompany.ttlSellerLnsInBlAmtCov;
      const ttlSellerLnsInBlTymsCovs = compDtls.data.getCompany.ttlSellerLnsInBlTymsCov;
      const userClearanceFees = compDtls.data.getCompany.userClearanceFee;
      const ttlBLUsrss = compDtls.data.getCompany.ttlBLUsrs;

      const loanDtls: any = await client.graphql({
        query: getCovCreditSeller,
        variables: { loanID: routeParams.loanID }
      });

      const {
        buyerContact,
        sellerContact,
        amountexpectedBack,
        amountRepaid,
        interest,
        dfltUpdate,
        crtnDate,
        lonBala,
        status,
        DefaultPenaltyCredSl,
        paymentFrequency,
        repaymentPeriod,
        createdAt
      } = loanDtls.data.getCovCreditSeller;

      const today = new Date();
      const daysUpToDate = today.getFullYear() * 365 + (today.getMonth() + 1) * 30.4375 + today.getDate();
      const tmDif = daysUpToDate - dfltUpdate;
      const tmDif2 = daysUpToDate - crtnDate;

      const netLnBalz = amountexpectedBack - amountRepaid;
      const LonBal1a = amountexpectedBack * Math.pow(1 + parseFloat(interest) / 36500, tmDif2);
      const LonBal1 = netLnBalz * Math.pow(1 + parseFloat(interest) / 36500, tmDif2);
      const clearanceAmts = parseFloat(userClearanceFees) * parseFloat(amountexpectedBack);
      const ClrnceCosts = clearanceAmts + parseFloat(DefaultPenaltyCredSl);
      const LonBal4 = LonBal1 + ClrnceCosts;
      const LonBal5 = LonBal1 + parseFloat(DefaultPenaltyCredSl);

      const loanerDtls: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: sellerContact }
      });
      const loanerName = loanerDtls.data.getSMAccount.name;

      const loaneeDtls: any = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: buyerContact }
      });
      const loaneeName = loaneeDtls.data.getSMAccount.name;
      const acStatus = loaneeDtls.data.getSMAccount.acStatus;
      const MaxTymsBL = loaneeDtls.data.getSMAccount.MaxTymsBL;
      const receiverEmail = loaneeDtls.data.getSMAccount.awsemail || buyerContact;
      const loaneeNationality = loaneeDtls.data.getSMAccount.nationality;
      const userCode = nationalityToCode(loaneeNationality) || loaneeNationality || (attributes as any).nationality || 'KE';

      if (parseFloat(lonBala) === 0) {
        Alert.alert('Loanee has cleared this loan');
      } else if (acStatus === 'AccountInactive') {
        Alert.alert('Loanee account has been deactivated');
      } else if (tmDif < parseFloat(paymentFrequency)) {
        Alert.alert('Time to Blacklist is not yet');
      } else if (tmDif2 > parseFloat(paymentFrequency) && amountRepaid < LonBal1a && tmDif2 < repaymentPeriod && status !== 'LoanBL') {
        await client.graphql({
          query: updateCovCreditSeller,
          variables: {
            input: {
              loanID: routeParams.loanID,
              amountExpectedBackWthClrnc: LonBal5.toFixed(0),
              DefaultPenaltyCredSl2: parseFloat(DefaultPenaltyCredSl).toFixed(0),
              lonBala: LonBal5.toFixed(0),
              dfltUpdate: daysUpToDate,
              blOfficer: attributes.email
            }
          }
        });
        Alert.alert(`${loanerName}, you have Penalised ${loaneeName}`);

        const formattedLonBal5 = formatAmountSync(LonBal5, userCode, ratesMap);
        const blCredMsg1 = `MiFedha. Hi ${loaneeName}, your loan of ID ${routeParams.loanID} has been Penalised by ${loanerName}. Total repayable: ${formattedLonBal5}.`;

        try {
          const msgRes: any = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: receiverEmail, messageBody: blCredMsg1 } }
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: receiverEmail, title: 'MiFedha: Credit Loan Penalised', body: blCredMsg1 }
            });
          }
        } catch (notifErr) {
          console.log('Notification error:', notifErr);
        }
      } else if (tmDif2 > repaymentPeriod && status !== 'LoanBL') {
        await client.graphql({
          query: updateCovCreditSeller,
          variables: {
            input: {
              loanID: routeParams.loanID,
              amountExpectedBackWthClrnc: LonBal4.toFixed(0),
              status: 'LoanBL',
              DefaultPenaltyCredSl2: parseFloat(DefaultPenaltyCredSl).toFixed(0),
              lonBala: LonBal4.toFixed(0),
              clearanceAmt: clearanceAmts.toFixed(0),
              dfltUpdate: daysUpToDate,
              blOfficer: attributes.email
            }
          }
        });
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: buyerContact,
              MaxTymsBL: parseFloat(MaxTymsBL) + 1,
              blStatus: 'AccountBlackListed',
              loanStatus: 'LoanActive'
            }
          }
        });
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "BaruchHabaB'ShemAdonai2",
              ttlSellerLnsInBlTymsCov: parseFloat(ttlSellerLnsInBlTymsCovs) + 1,
              ttlSellerLnsInBlAmtCov: (parseFloat(ttlSellerLnsInBlAmtCovs) + clearanceAmts).toFixed(0),
              ttlBLUsrs: parseFloat(ttlBLUsrss) + 1
            }
          }
        });
        Alert.alert(`${loanerName}, you have blacklisted ${loaneeName}`);

        const formattedLonBal4 = formatAmountSync(LonBal4, userCode, ratesMap);
        const blCredMsg2 = `MiFedha. Hi ${loaneeName}, your loan of ID ${routeParams.loanID} has been blacklisted by ${loanerName}. Total repayable: ${formattedLonBal4}.`;

        try {
          const msgRes: any = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: receiverEmail, messageBody: blCredMsg2 } }
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: receiverEmail, title: 'MiFedha: Credit Loan Blacklisted', body: blCredMsg2 }
            });
          }
        } catch (notifErr) {
          console.log('Notification error:', notifErr);
        }
      } else if (tmDif > parseFloat(paymentFrequency) && status === 'LoanBL') {
        await client.graphql({
          query: updateCovCreditSeller,
          variables: {
            input: {
              loanID: routeParams.loanID,
              amountExpectedBackWthClrnc: LonBal5.toFixed(0),
              status: 'LoanBL',
              DefaultPenaltyCredSl2: parseFloat(DefaultPenaltyCredSl).toFixed(0),
              lonBala: LonBal5.toFixed(0),
              dfltUpdate: daysUpToDate,
              blOfficer: attributes.email
            }
          }
        });
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: buyerContact,
              blStatus: 'AccountBlackListed',
              loanStatus: 'LoanActive'
            }
          }
        });
        Alert.alert(`${loanerName}, you have penalised after blacklisting ${loaneeName}`);

        const formattedLonBal5After = formatAmountSync(LonBal5, userCode, ratesMap);
        const blCredMsg3 = `MiFedha. Hi ${loaneeName}, your loan of ID ${routeParams.loanID} has been Penalised after blacklisting by ${loanerName}. Total repayable: ${formattedLonBal5After}.`;

        try {
          const msgRes: any = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: receiverEmail, messageBody: blCredMsg3 } }
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: receiverEmail, title: 'MiFedha: Credit Loan Penalised', body: blCredMsg3 }
            });
          }
        } catch (notifErr) {
          console.log('Notification error:', notifErr);
        }
      } else {
        Alert.alert('Time to Blacklist/Penalise is not yet');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Retry or update app or call customer care');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <View style={styles.image}>
        <ScrollView>
          <TouchableOpacity onPress={gtCompDtls} style={styles.sendLoanButton}>
            <Text style={styles.sendLoanButtonText}>Click to Black List</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default BLCovCredByr;
