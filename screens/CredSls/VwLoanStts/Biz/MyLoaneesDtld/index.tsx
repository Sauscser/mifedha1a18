import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import LnerStts from "../../../../../components/VwCredSales/CrdStatus/Biz/Biz2BizLoaneesDtld";
import styles from './styles';
import { useRoute } from '@react-navigation/native';
import { getSMAccount, listCovCreditSellers } from '../../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMCovLns = props => {
  const [LnerPhn, setLnerPhn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const route = useRoute<any>();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const routeParams = (route?.params || {}) as Record<string, any>;
  const loanId = routeParams.loanID;
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
          const filter: any = {
            and: {
              lonBala: {
                gt: 0
              },
              loanID: {
                eq: loanId
              }
            }
          };
          const Lonees: any = await client.graphql({
            query: listCovCreditSellers,
            variables: {
              filter
            }
          });
          setLoanees(Lonees.data.listCovCreditSellers.items);
        } catch (e) {
          if (e) {
            Alert.alert(t.retryOrUpdateApp);
            return;
          }
          console.log(e);
        }
      };
      if (userInfo.userId !== owner) {
        Alert.alert(t.pleaseCreateMainAccount);
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
      <FlatList style={{
      width: "100%"
    }} data={Loanees} renderItem={({
      item
    }) => <LnerStts Loanee={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchUsrDtls} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponentStyle={{
      alignItems: 'center'
    }} ListHeaderComponent={() => <>
            
            <Text style={styles.label}>{t.myLoaneesTitle}</Text>
            <Text style={styles.label2}>{t.pleaseSwipeDownToLoad}</Text>
          </>} />
    </View>;
};
export default FetchSMCovLns;