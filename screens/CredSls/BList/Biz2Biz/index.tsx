import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getCompany, getCovCreditSeller, getBizna } from '../../../../src/graphql/queries';
import { updateCompany, updateCovCreditSeller, updateBizna, createMessages, sendNotification } from '../../../../src/graphql/mutations';
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
  const routeParams: any = route.params;
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
      const rawNationality = (attributes as any).nationality;
      const userCode = nationalityToCode(rawNationality) || rawNationality || 'KE';

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
          loanID: routeParams.loanID
        }
      });
      const {
        buyerContact,
        sellerContact,
        amountexpectedBack,
        amountRepaid,
        dfltUpdate,
        crtnDate,
        interest,
        repaymentPeriod,
        lonBala,
        amountExpectedBackWthClrnc,
        status,
        DefaultPenaltyCredSl,
        paymentFrequency,
        installmentAmount,
        createdAt
      } = loanDtls.data.getCovCreditSeller;

      // Calculate time differences
      const today = new Date();
      const daysUpToDate = today.getFullYear() * 365 + (today.getMonth() + 1) * 30.4375 + today.getDate();
      const tmDif = daysUpToDate - dfltUpdate;
      const tmDif2 = daysUpToDate - crtnDate;

      // Loan math
      const netLnBalz = amountexpectedBack - amountRepaid;
      const LonBal1 = netLnBalz * Math.pow(1 + parseFloat(interest) / 36500, tmDif2);
      const LonBal4 = LonBal1 + parseFloat(userClearanceFee) * parseFloat(amountexpectedBack) + parseFloat(DefaultPenaltyCredSl);
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
        query: getBizna,
        variables: {
          BusKntct: buyerContact
        }
      });
      const loaneeName = loaneeDtls.data.getBizna.busName;
      const acStatus = loaneeDtls.data.getBizna.status;
      const noBL = loaneeDtls.data.getBizna.noBL;
      const receiverEmail = loaneeDtls.data.getBizna.email;

      // Decision logic
      if (parseFloat(lonBala) === 0) {
        Alert.alert(t.loaneeCleared);
      } else if (acStatus === "AccountInactive") {
        Alert.alert(t.loaneeDeactivated);
      } else if (tmDif < parseFloat(paymentFrequency)) {
        Alert.alert(t.timeToBlacklistNotYet);
      } else if (tmDif2 > parseFloat(paymentFrequency) && amountRepaid < LonBal1 && tmDif2 < repaymentPeriod && status !== "LoanBL") {
        // Penalise
        await client.graphql({
          query: updateCovCreditSeller,
          variables: {
            input: {
              loanID: routeParams.loanID,
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
        const blCredMsg1 = `NiSenti. Hi ${loaneeName}, your loan of ID ${routeParams.loanID} has been Penalised by ${loanerName}. Total repayable: ${formattedLonBal5}.`;
        try {
          const msgRes: any = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: receiverEmail || buyerContact, messageBody: blCredMsg1 }}
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: receiverEmail || buyerContact, title: 'NiSenti: Credit Loan Penalised', body: blCredMsg1 }
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
              loanID: routeParams.loanID,
              amountExpectedBackWthClrnc: LonBal4.toFixed(0),
              status: "LoanBL",
              DefaultPenaltyCredSl2: DefaultPenaltyCredSl.toFixed(0),
              lonBala: LonBal4.toFixed(0),
              clearanceAmt: (parseFloat(userClearanceFee) * parseFloat(amountexpectedBack)).toFixed(0),
              dfltUpdate: daysUpToDate,
              blOfficer: attributes.email
            }
          }
        });
        await client.graphql({
          query: updateBizna,
          variables: {
            input: {
              BusKntct: buyerContact,
              noBL: parseFloat(noBL) + 1
            }
          }
        });
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "BaruchHabaB'ShemAdonai2",
              ttlSellerLnsInBlTymsCov: parseFloat(ttlSellerLnsInBlTymsCov) + 1,
              ttlSellerLnsInBlAmtCov: (parseFloat(ttlSellerLnsInBlAmtCov) + parseFloat(userClearanceFee) * parseFloat(amountexpectedBack)).toFixed(0),
              ttlBLUsrs: parseFloat(ttlBLUsrs) + 1
            }
          }
        });
        Alert.alert(fmt(t.blacklistedUser, { loanerName, loaneeName }));
        const formattedLonBal4 = formatAmountSync(LonBal4, userCode, ratesMap);
        const blCredMsg2 = `NiSenti. Hi ${loaneeName}, your loan of ID ${routeParams.loanID} has been blacklisted by ${loanerName}. Total repayable: ${formattedLonBal4}.`;
        try {
          const msgRes: any = await client.graphql({
            query: createMessages,
            variables: { input: { senderEmail: receiverEmail || buyerContact, messageBody: blCredMsg2 }}
          });
          if (msgRes?.data?.createMessages) {
            await client.graphql({
              query: sendNotification,
              variables: { riderEmail: receiverEmail || buyerContact, title: 'NiSenti: Credit Loan Blacklisted', body: blCredMsg2 }
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
                      {t.clickToPenaliseOrBlacklist}
                    </Text>
                    {isLoading && <ActivityIndicator size="large" color="blue" />}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>;
};
export default BLCovCredByr;