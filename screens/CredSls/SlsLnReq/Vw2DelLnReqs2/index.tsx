import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import LnerStts from "../../../../components/CredSalesReq/Vw2DelLnReq";
import styles from './styles';
import { getSMAccount, listReqLoanChamas, listReqLoanCredSls, listReqLoans } from '../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
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
            query: listReqLoanCredSls,
            variables: {
              filter: {
                loaneeEmail: {
                  eq: attributes.email
                }
              }
            }
          });
          setLoanees(Lonees.data.listReqLoanCredSls.items);
        } catch (e) {
          console.log(e);
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
      if (e) {
        Alert.alert(t.retryOrUpdate);
        return;
      }
      console.log(e);
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
            
          <Text style={styles.label}> {t.swipeToViewMyLoanRequests}</Text>
          <Text style={styles.label2}> {t.selectToDelete}</Text>
          </>} />

  </View>;
};
export default FetchSMNonCovLns;