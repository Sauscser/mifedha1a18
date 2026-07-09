import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import NonLnRec from "../../../../../../components/MyAc/ViewRecNonLns";
import { listPersonels, VwMyRecMny } from '../../../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMNonLnsSnt = () => {
  const [loading, setLoading] = useState(false);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [bizPhone, setBizPhone] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchLoanees = async () => {
    if (loading || !bizPhone) return;
    setLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const personnelCheck: any = await client.graphql({
        query: listPersonels,
        variables: {
          filter: {
            phoneKontact: {
              eq: attributes.email
            },
            BusinessRegNo: {
              eq: bizPhone
            }
          }
        }
      });
      if (!personnelCheck?.data?.listPersonels?.items?.length) {
        Alert.alert(t.accessDenied, t.retryIfWorkHere);
        return;
      }
      const result: any = await client.graphql({
        query: VwMyRecMny,
        variables: {
          recPhn: bizPhone,
          sortDirection: "DESC",
          limit: 100,
          filter: {
            status: {
              eq: "cashSales"
            }
          }
        }
      });
      const items = result?.data?.VwMyRecMny?.items || [];
      setAllRecords(items);
      setFilteredRecords(items);
      if (!items.length) {
        Alert.alert(t.noRecords, t.noMoneyReceived);
      }
    } catch (e) {
      console.error("Error fetching records:", e);
      Alert.alert(t.errorTitle, t.fetchError);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!buyerFilter) {
      setFilteredRecords(allRecords);
    } else {
      const filtered = allRecords.filter(item => item?.SenderName?.toLowerCase().includes(buyerFilter.toLowerCase()));
      setFilteredRecords(filtered);
    }
  }, [buyerFilter, allRecords]);
  return <View style={styles.container}>
      <View style={styles.inputBlock}>
        <TextInput placeholder={t.fullBusinessNumber} value={bizPhone} onChangeText={setBizPhone} style={styles.input} />
        <TextInput placeholder={t.buyerNamePartial} value={buyerFilter} onChangeText={setBuyerFilter} style={styles.input} />
      </View>

      <FlatList data={filteredRecords} renderItem={({
      item
    }) => <NonLnRec SMAc={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchLoanees} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponent={() => <>
            <Text style={styles.label2}>{t.swipeToReload}</Text>
            <Text style={styles.label}>{t.businessSales}</Text>
          </>} />
      {loading && <ActivityIndicator size="large" color="blue" />}
    </View>;
};
export default FetchSMNonLnsSnt;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 16,
    paddingTop: 20
  },
  inputBlock: {
    marginBottom: 16
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginVertical: 10
  },
  label2: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginBottom: 4
  }
});