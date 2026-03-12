import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { updateCompany, updateSMAccount, updateCvrdGroupLoans, updateGroup, updateChamaMembers, createMessages, sendNotification } from '../../../src/graphql/mutations';
import { getCompany, getSMAccount, getCvrdGroupLoans, getGroup, getChamaMembers } from '../../../src/graphql/queries';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();
const BLChmCovLoanee = props => {
  // i18n translation pattern
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const navigation = useNavigation();
  const [LonId, setLonId] = useState("");
  const [ChmMbrId, setChmMbrId] = useState("");
  const [SigntryPW, setSigntryPW] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userNationality, setUserNationality] = useState<string>(null);
  const route = useRoute();
  
  const { ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(userNationality);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const userData = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: attributes.email },
        });
        setUserNationality(userData.data.getSMAccount.nationality);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);
  const gtCompDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const ttlChmLnsInBlTymsCovs = compDtls.data.getCompany.ttlChmLnsInBlTymsCov;
      const ttlChmLnsInBlAmtCovs = compDtls.data.getCompany.ttlChmLnsInBlAmtCov;
      const userClearanceFees = compDtls.data.getCompany.userClearanceFee;
      const ttlBLUsrss = compDtls.data.getCompany.ttlBLUsrs;
      const gtMmbrDtls = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          const compDtls2: any = await client.graphql({
            query: getChamaMembers,
            variables: {
              ChamaNMember: route.params.ChamaNMember
            }
          });
          const timeCrtd = compDtls2.data.getChamaMembers.timeCrtd;
          const subscribedAmt = compDtls2.data.getChamaMembers.subscribedAmt;
          const totalSubAmt = compDtls2.data.getChamaMembers.totalSubAmt;
          const groupContact = compDtls2.data.getChamaMembers.groupContact;
          const memberName = compDtls2.data.getChamaMembers.memberName;
          const memberContact = compDtls2.data.getChamaMembers.memberContact;
          const subscriptionFrequency = compDtls2.data.getChamaMembers.subscriptionFrequency;
          const subscriptionAmt = compDtls2.data.getChamaMembers.subscriptionAmt;
          const lateSubscriptionPenalty = compDtls2.data.getChamaMembers.lateSubscriptionPenalty;
          const ttlLateSubs = compDtls2.data.getChamaMembers.ttlLateSubs;
          const today = new Date();
          let hours = (today.getHours() < 10 ? '0' : '') + today.getHours();
          let minutes = (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();
          let seconds = (today.getSeconds() < 10 ? '0' : '') + today.getSeconds();
          let years = (today.getFullYear() < 10 ? '0' : '') + today.getFullYear();
          let months = (today.getMonth() < 10 ? '0' : '') + today.getMonth();
          let months2 = parseFloat(months);
          let days = (today.getDate() < 10 ? '0' : '') + today.getDate();
          const curYrs = parseFloat(years) * 365;
          const curMnths = months2 * 30.4375;
          const daysUpToDates = curYrs + curMnths + parseFloat(days);
          const daysUpToDate = Date.now();
          const gtChmDtls = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            try {
              const compDtls3: any = await client.graphql({
                query: getGroup,
                variables: {
                  grpContact: groupContact
                }
              });
              const objectionStatus = compDtls3.data.getGroup.objectionStatus;
              const grpName = compDtls3.data.getGroup.grpName;
              const tmDif = (daysUpToDate - timeCrtd) / (1000 * 60 * 60 * 24);
              ;
              const subFreq = tmDif / parseFloat(subscriptionFrequency);
              const Amt2HvBnSub = subFreq * parseFloat(subscriptionAmt);
              const subPnlties = parseFloat(totalSubAmt) - parseFloat(subscribedAmt);
              const ttlArrears = (parseFloat(ttlLateSubs) + Amt2HvBnSub).toFixed(2);
              const updateMmbrDtls3 = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  await client.graphql({
                    query: updateChamaMembers,
                    variables: {
                      input: {
                        ChamaNMember: route.params.ChamaNMember,
                        totalSubAmt: ttlArrears,
                        timeCrtd: daysUpToDate,
                        ttlLateSubs: parseFloat(ttlLateSubs) + parseFloat(lateSubscriptionPenalty)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    Alert.alert(t.retryUpdateCall);
                    return;
                  }
                }
                Alert.alert(
                  t.penalisedLatePayment.replace('{memberName}', memberName)
                );
                
                const notificationBody = t.notificationBody
                  .replace('{memberName}', memberName)
                  .replace('{grpName}', grpName)
                  .replace('{amountDone}', formatAmountSync(parseFloat(subscribedAmt), userCurrencyKey, ratesMap))
                  .replace('{amountExpected}', formatAmountSync(Amt2HvBnSub, userCurrencyKey, ratesMap))
                  .replace('{phone}', attributes.phone_number);
                
                await client.graphql({
                  query: createMessages,
                  variables: {
                    input: {
                      senderEmail: memberContact,
                      messageBody: notificationBody
                    }
                  }
                });
                
                await client.graphql({
                  query: sendNotification,
                  variables: {
                    riderEmail: memberContact,
                    title: t.notificationTitle,
                    body: notificationBody
                  }
                });
                
                setIsLoading(false);
              };
              if (parseFloat(subscriptionFrequency) > tmDif) {
                Alert.alert(t.timeToPenaliseNotYet);
              } else if (Amt2HvBnSub + parseFloat(ttlLateSubs) < subscribedAmt) {
                Alert.alert(t.subscriptionUpToDate);
              } else if (objectionStatus === "Objected") {
                Alert.alert(t.accountStoppedByAdmin);
              } else {
                updateMmbrDtls3();
              }
            } catch (error) {
              if (error) {
                console.log(error);
                Alert.alert(t.retryUpdateCall);
                return;
              }
            }
            setIsLoading(false);
          };
          await gtChmDtls();
        } catch (error) {
          console.log(error);
          if (error) {
            Alert.alert(t.retryUpdateCall);
            return;
          }
        }
        setIsLoading(false);
      };
      await gtMmbrDtls();
    } catch (error) {
      console.log(error);
      if (error) {
        Alert.alert(t.retryUpdateCall);
        return;
      }
    }
    setIsLoading(false);
    setLonId("");
    setChmMbrId("");
    setSigntryPW("");
  };
  useEffect(() => {
    const usId = LonId;
    if (!usId && usId !== "") {
      setLonId("");
      return;
    }
    setLonId(usId);
  }, [LonId]);
  useEffect(() => {
    const SigntryPWs = SigntryPW;
    if (!SigntryPWs && SigntryPWs !== "") {
      setSigntryPW("");
      return;
    }
    setSigntryPW(SigntryPWs);
  }, [SigntryPW]);
  useEffect(() => {
    const ChmMbrIds = ChmMbrId;
    if (!ChmMbrIds && ChmMbrIds !== "") {
      setChmMbrId("");
      return;
    }
    setChmMbrId(ChmMbrIds);
  }, [ChmMbrId]);
  return <View>
              <View style={styles.image}>
                <ScrollView>
           
                  <TouchableOpacity onPress={gtCompDtls} style={styles.sendLoanButton}>
                    <Text style={styles.sendLoanButtonText}>
                      {t.clickToPenalise}
                    </Text>
                    {isLoading && <ActivityIndicator size="large" color="blue" />}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>;
};
export default BLChmCovLoanee;