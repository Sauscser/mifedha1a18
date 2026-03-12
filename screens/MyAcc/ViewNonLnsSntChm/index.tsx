import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, FlatList, Alert } from 'react-native';
import NonLnSent from "../../../components/MyAc/ViewSentNonLns";
import styles from './styles';
import { getCompany, getSMAccount, listLoanRepayments, listNonLoans, listSMAccounts, VwMySntMny } from '../../../src/graphql/queries';
import { updateCompany, updateSMAccount } from '../../../src/graphql/mutations';
import { useRoute } from '@react-navigation/native';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMNonLnsSnt = props => {
  const [loading, setLoading] = useState(false);
  const [Recvrs, setRecvrs] = useState([]);
  const route = useRoute();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchUsrDtls = async () => {
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const MFNDtls = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const balances = MFNDtls.data.getSMAccount.balance;
      const owner = MFNDtls.data.getSMAccount.owner;
      const fetchLoanees = async () => {
        setLoading(true);
        try {
          const Lonees = await client.graphql({
            query: listLoanRepayments,
            variables: {
              filter: {
                loanId3: {
                  eq: route.params.loanID
                }
              }
            }
          });
          setRecvrs(Lonees.data.listLoanRepayments.items);
          const fetchCompDtls = async () => {
            try {
              const MFNDtls = await client.graphql({
                query: getCompany,
                variables: {
                  AdminId: "BaruchHabaB'ShemAdonai2"
                }
              });
              const companyEarningBals = MFNDtls.data.getCompany.companyEarningBal;
              const companyEarnings = MFNDtls.data.getCompany.companyEarning;
              const enquiryFees = MFNDtls.data.getCompany.enquiryFee;
              const updtActAdm = async () => {
                try {
                  await client.graphql({
                    query: updateCompany,
                    variables: {
                      input: {
                        AdminId: "BaruchHabaB'ShemAdonai2",
                        companyEarningBal: parseFloat(companyEarningBals) + parseFloat(enquiryFees),
                        companyEarning: parseFloat(companyEarnings) + parseFloat(enquiryFees)
                      }
                    }
                  });
                } catch (error) {
                  if (error) {
                    Alert.alert(t.checkInternet);
                    return;
                  }
                }
                updtUsrAc();
              };
              const updtUsrAc = async () => {
                try {
                  await client.graphql({
                    query: updateSMAccount,
                    variables: {
                      input: {
                        awsemail: attributes.email,
                        balance: parseFloat(balances) - parseFloat(enquiryFees)
                      }
                    }
                  });
                } catch (error) {
                  if (error) {
                    Alert.alert(t.retryOrUpdate);
                    return;
                  }
                }
              };
              if (parseFloat(balances) < parseFloat(enquiryFees)) {
                Alert.alert(t.accountBalanceLow);
                return;
              } else {
                updtActAdm();
              }
            } catch (e) {
              if (e) {
                Alert.alert(t.userNotExist);
                return;
              }
              console.log(e);
            }
          };
          await fetchCompDtls();
        } catch (e) {
          if (e) {
            Alert.alert(t.retryOrUpdate);
            return;
          }
          console.log(e);
        }
      };
      if (userInfo.userId !== owner) {
        Alert.alert(t.pleaseCreateAccount);
        return;
      } else {
        await fetchLoanees();
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsrDtls();
  }, []);
  return (
    <View style={styles.root}>
      <FlatList
        style={{ width: "100%" }}
        data={Recvrs}
        renderItem={({ item }) => <NonLnSent SMAc={item} />}
        keyExtractor={(item, index) => index.toString()}
        onRefresh={fetchUsrDtls}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        ListHeaderComponentStyle={{ alignItems: 'center' }}
        ListHeaderComponent={() => (
          <>
            <Text style={styles.label}>{t.sentChamaLoan}</Text>
            <Text style={styles.label2}>{t.swipeToLoad}</Text>
          </>
        )}
      />
    </View>
  );
};

export default FetchSMNonLnsSnt;