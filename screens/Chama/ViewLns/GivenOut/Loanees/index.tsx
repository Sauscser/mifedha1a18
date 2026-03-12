import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import ChmNonCvLns from "../../../../../components/Chama/Loans/Givenout/Loanees";
import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { getSMAccount, listCvrdGroupLoans } from '../../../../../src/graphql/queries';
import { useRoute } from '@react-navigation/native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient();
const FetchSMNonCovLns = () => {
  const [LnerPhn, setLneePhn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const route = useRoute();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchUser = async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setLneePhn(attributes.phone_number);
    } catch (error) {
      console.log(error);
      Alert.alert(t.errorFetchingUser);
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);
  const fetchLoanees = async () => {
    setLoading(true);
    try {
      const Lonees: any = await client.graphql({
        query: listCvrdGroupLoans,
        variables: {
          filter: {
            and: {
              lonBala: {
                gt: 0
              },
              grpContact: {
                eq: route.params.grpContact
              }
            }
          }
        }
      });
      setLoanees(Lonees.data.listCvrdGroupLoans.items);
      await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: (await fetchUserAttributes()).email
        }
      });
    } catch (error) {
      console.log(error);
      Alert.alert(t.errorFetchingLoans);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLoanees();
  }, []);
  return <View style={styles.root}>
      <FlatList
        style={{ width: "100%" }}
        data={Loanees}
        renderItem={({ item }) => <ChmNonCvLns Loaner={item} />}
        keyExtractor={(item, index) => index.toString()}
        onRefresh={fetchLoanees}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center' }}
        ListHeaderComponent={() => <>
          <Text style={styles.label}>{t.groupLoanees}</Text>
          <Text style={styles.label}>{t.swipeToReload}</Text>
        </>}
      />
    </View>;
};
export default FetchSMNonCovLns;