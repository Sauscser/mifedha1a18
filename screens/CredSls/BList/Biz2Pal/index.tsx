import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getBizna, getCompany, getCovCreditSeller, getSMAccount } from '../../../../src/graphql/queries';
import { updateCompany, updateCovCreditSeller, updateSMAccount, createMessages, sendNotification } from '../../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import styles from './styles';
const client = generateClient();
const BLCovCredByr = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isLoading, setIsLoading] = useState(false);
  const { ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  const fmt = (template: string, values: Record<string, string>) =>
    template.replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] ?? '');

  const gtCompDtls = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      // Fetch company details
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const {
        ttlSellerLnsInBlAmtCov,
        ttlSellerLnsInBlTymsCov,
        userClearanceFee,
        ttlBLUsrs
      } = compDtls.data.getCompany;

      // Fetch loan details
      const loanDtls: any = await client.graphql({
        query: getCovCreditSeller,
        variables: {
          loanID: route.params.loanID
        }
      });
      const {
        buyerContact,
        sellerContact,
        amountexpectedBack,
        amountRepaid,
        interest,
        lonBala,
        dfltUpdate,
        crtnDate,
        repaymentPeriod,
        amountExpectedBackWthClrnc,
        status,
        DefaultPenaltyCredSl,
        paymentFrequency,
        installmentAmount,
        createdAt
      } = loanDtls.data.getCovCreditSeller;

      // Time calculations
      const today = new Date();
      const daysUpToDate = today.getFullYear() * 365 + (today.getMonth() + 1) * 30.4375 + today.getDate();
      const tmDif = daysUpToDate - dfltUpdate;
      const tmDif2 = daysUpToDate - crtnDate;

      // Loan math
      const netLnBalz = amountexpectedBack - amountRepaid;
      const LonBal1a = amountexpectedBack * Math.pow(1 + parseFloat(interest) / 36500, tmDif2);
      const LonBal1 = netLnBalz * Math.pow(1 + parseFloat(interest) / 36500, tmDif2);
      const clearanceAmts = parseFloat(userClearanceFee) * parseFloat(amountexpectedBack);
      const ClrnceCosts = clearanceAmts + parseFloat(DefaultPenaltyCredSl);
      const ClrnceCost = clearanceAmts;
      const LonBal4 = LonBal1 + ClrnceCosts;
      const LonBal5 = LonBal1 + parseFloat(DefaultPenaltyCredSl);

      // Fetch loaner details
      const loanerDtls: any = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: sellerContact
        }
      });
      const loanerName = loanerDtls.data.getBizna.busName;

      // Fetch loanee details
      const loaneeDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: buyerContact
        }
      });
      const loaneeName = loaneeDtls.data.getSMAccount.name;
      const acStatus = loaneeDtls.data.getSMAccount.acStatus;
      const MaxTymsBL = loaneeDtls.data.getSMAccount.MaxTymsBL;
      const receiverEmail = loaneeDtls.data.getSMAccount.awsemail;
      const loaneeNationality = loaneeDtls.data.getSMAccount.nationality;
      const userCode = nationalityToCode(loaneeNationality) || loaneeNationality || (attributes as any).nationality || 'KE';

      // Decision logic
      if (parseFloat(lonBala) === 0) {
        Alert.alert(t.loaneeCleared);
      } else if (acStatus === "AccountInactive") {
        Alert.alert(t.loaneeDeactivated);
      } else if (tmDif < parseFloat(paymentFrequency)) {
        Alert.alert(t.timeToBlacklistNotYet);
      } else if (tmDif2 > parseFloat(paymentFrequency) && amountRepaid < LonBal1a && tmDif2 < repaymentPeriod && status !== "LoanBL") {
        // Penalise
        await client.graphql({
          query: updateCovCreditSeller,
          variables: {
            input: {
              loanID: route.params.loanID,
              amountExpectedBackWthClrnc: LonBal5.toFixed(0),
              DefaultPenaltyCredSl2: DefaultPenaltyCredSl.toFixed(0),
              lonBala: LonBal5.toFixed(0),
              dfltUpdate: daysUpToDate,
              blOfficer: attributes.email
            }
          }
        });
        Alert.alert(fmt(t.penalisedUser, { loanerName, loaneeName }));
        const formattedLonBal5 = formatAmountSync(LonBal5, userCode, ratesMap);
        const blCredMsg3 = `NiSenti. Hi ${loaneeName}, your loan of ID ${route.params.loanID} has been Penalised by ${loanerName}. Total repayable: ${formattedLonBal5}.`;
        try {
          const msgRes = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: receiverEmail || buyerContact, messageBody: blCredMsg3 }}
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: receiverEmail || buyerContact, title: 'NiSenti: Credit Loan Penalised', body: blCredMsg3 }
            });
          }
        } catch (notifErr) {
          console.log('Notification error:', notifErr);
        }
      } else if (tmDif2 > repaymentPeriod && status !== "LoanBL") {
        // Blacklist
        await client.graphql({
          query: updateCovCreditSeller,
          variables: {
            input: {
              loanID: route.params.loanID,
              amountExpectedBackWthClrnc: LonBal4.toFixed(0),
              status: "LoanBL",
              clearanceAmt: clearanceAmts.toFixed(0),
              DefaultPenaltyCredSl2: DefaultPenaltyCredSl.toFixed(0),
              lonBala: LonBal4.toFixed(0),
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
              blStatus: "AccountBlackListed",
              loanStatus: "LoanActive"
            }
          }
        });
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "BaruchHabaB'ShemAdonai2",
              ttlSellerLnsInBlTymsCov: parseFloat(ttlSellerLnsInBlTymsCov) + 1,
              ttlSellerLnsInBlAmtCov: (parseFloat(ttlSellerLnsInBlAmtCov) + clearanceAmts).toFixed(0),
              ttlBLUsrs: parseFloat(ttlBLUsrs) + 1
            }
          }
        });
        Alert.alert(fmt(t.blacklistedUser, { loanerName, loaneeName }));
        const formattedLonBal4 = formatAmountSync(LonBal4, userCode, ratesMap);
        const blCredMsg4 = `NiSenti. Hi ${loaneeName}, your loan of ID ${route.params.loanID} has been blacklisted by ${loanerName}. Total repayable: ${formattedLonBal4}.`;
        try {
          const msgRes = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: receiverEmail || buyerContact, messageBody: blCredMsg4 }}
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: receiverEmail || buyerContact, title: 'NiSenti: Credit Loan Blacklisted', body: blCredMsg4 }
            });
          }
        } catch (notifErr) {
          console.log('Notification error:', notifErr);
        }
      } else if (tmDif > parseFloat(paymentFrequency) && status === "LoanBL") {
        // Penalise after blacklist
        await client.graphql({
          query: updateCovCreditSeller,
          variables: {
            input: {
              loanID: route.params.loanID,
              amountExpectedBackWthClrnc: LonBal5.toFixed(0),
              status: "LoanBL",
              DefaultPenaltyCredSl2: DefaultPenaltyCredSl.toFixed(0),
              lonBala: LonBal5.toFixed(0),
              dfltUpdate: daysUpToDate,
              blOfficer: attributes.email
            }
          }
        });
        Alert.alert(fmt(t.penalisedAfterBlacklistUser, { loanerName, loaneeName }));
        const formattedLonBal5AfterBl = formatAmountSync(LonBal5, userCode, ratesMap);
        const blCredMsg5 = `NiSenti. Hi ${loaneeName}, your loan of ID ${route.params.loanID} has been Penalised after blacklisting by ${loanerName}. Total repayable: ${formattedLonBal5AfterBl}.`;
        try {
          const msgRes = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: receiverEmail || buyerContact, messageBody: blCredMsg5 }}
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: receiverEmail || buyerContact, title: 'NiSenti: Credit Loan Penalised', body: blCredMsg5 }
            });
          }
        } catch (notifErr) {
          console.log('Notification error:', notifErr);
        }
      } else {
        Alert.alert(t.timeToBlacklistPenaliseNotYet);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t.retryOrUpdate);
    } finally {
      setIsLoading(false);
    }
  };
  return <View>
              <View style={styles.image}>
                <ScrollView>
           
                  <TouchableOpacity onPress={gtCompDtls} style={styles.sendLoanButton}>
                    <Text style={styles.sendLoanButtonText}>
                      {t.clickToBlacklist}
                    </Text>
                    {isLoading && <ActivityIndicator size="large" color="blue" />}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>;
};
export default BLCovCredByr;