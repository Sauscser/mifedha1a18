import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, ActivityIndicator } from 'react-native';
import LnerStts from "../../../../../components/CredSales/PayCash/Biz2Pal/Vw2GrantB2P";
import styles from './styles';
import { getSMAccount, listBizSlsReqs } from '../../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMNonCovLns = props => {
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchUsrDtls = async () => {
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
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
            query: listBizSlsReqs,
            variables: {
              filter: {
                attendingAdmin: {
                  eq: attributes.email
                },
                status: {
                  eq: "cashSales"
                }
              }
            }
          });
          setLoanees(Lonees.data.listBizSlsReqs.items);
          if (Lonees.data.listBizSlsReqs.items.length < 1) {
            Alert.alert(t.noRequestsToApprove);
          }
        } catch (e) {
          console.error(e);
          Alert.alert(t.errorFetchingRequests);
        } finally {
          setLoading(false);
        }
      };
      if (userInfo.userId !== owner) {
        Alert.alert(t.createMainAccount);
      } else {
        await fetchLoanees();
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t.retryOrUpdate);
    }
  };
  useEffect(() => {
    fetchUsrDtls();
  }, []);
  return <View style={styles.root}>
      <FlatList style={{
      width: "100%"
    }} data={Loanees} renderItem={({
      item
    }) => <LnerStts SMAc={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchUsrDtls} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponentStyle={{
      alignItems: 'center'
    }} ListHeaderComponent={() => <>
          <Text style={styles.label}> {t.swipeToViewSaleRequests}</Text>
          <Text style={styles.label2}> {t.selectToDelete}</Text>
          </>} />
    </View>;
};
export default FetchSMNonCovLns;