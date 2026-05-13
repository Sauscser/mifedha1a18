import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { View, Text, FlatList, Alert } from 'react-native';
import NonLnSent from "../../../components/MyAc/ViewRecNonLns";
import styles from './styles';
import { getCompany, getSMAccount, listNonLoans, VwMyRecMny } from '../../../src/graphql/queries';
import { updateCompany, updateSMAccount } from '../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const FetchSMNonLnsSnt = props => {
    const { i18n } = useTranslation();
    const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const t = translations[lang] || translations.en;
  const [loading, setLoading] = useState(false);
  const [Recvrs, setRecvrs] = useState([]);
  const fetchUsrDtls = async () => {
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const MFNDtls: any = await client.graphql({
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
          const Lonees: any = await client.graphql({
            query: VwMyRecMny,
            variables: {
              recPhn: attributes.email,
              sortDirection: "DESC",
              filter: {
                description: {
                  contains: "Payment for delivery of"
                }
              }
            }
          });
          const lds = Lonees.data.VwMyRecMny.items;
          if (lds.length < 1) {
            Alert.alert(t.noMoneyReceived);
          }
          setRecvrs(lds);
          const fetchCompDtls = async () => {
            try {
              const MFNDtls: any = await client.graphql({
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
                    Alert.alert(t.retryOrUpdate);
                    return;
                  }
                }
                await updtUsrAc();
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
        Alert.alert(t.createMainAccount);
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
  return <View style={styles.root}>
      <FlatList
        style={{ width: "100%" }}
        data={Recvrs}
        renderItem={({ item }) => <NonLnSent SMAc={item} />}
        keyExtractor={(item, index) => index.toString()}
        onRefresh={fetchUsrDtls}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        ListHeaderComponentStyle={{ alignItems: 'center' }}
        ListHeaderComponent={() => <>
          <Text style={styles.label}>{t.deliveryPayments}</Text>
          <Text style={styles.label2}>{t.swipeToLoad}</Text>
        </>}
      />
    </View>;
};
export default FetchSMNonLnsSnt;