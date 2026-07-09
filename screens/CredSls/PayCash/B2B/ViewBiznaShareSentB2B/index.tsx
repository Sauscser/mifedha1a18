import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, TextInput, StyleSheet } from 'react-native';
import NonLnRec from '../../../../../components/MyAc/ViewSentNonLns';
import { listPersonels, VwMySntMny } from '../../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMNonLnsSnt = () => {
  const [loading, setLoading] = useState(false);
  const [recvrs, setRecvrs] = useState<any[]>([]);
  const [bizPhone, setBizPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchLoanees = async () => {
    if (loading || !bizPhone) return;
    setLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      // Check personnel existence
      const personnelRes: any = await client.graphql({
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
      const personnels = personnelRes?.data?.listPersonels?.items || [];
      if (personnels.length < 1) {
        Alert.alert(t.accessDenied, t.sorryNoWorkHere);
        return;
      }

      // Fetch sent records
      const recordsRes: any = await client.graphql({
        query: VwMySntMny,
        variables: {
          senderPhn: bizPhone,
          sortDirection: "DESC",
          limit: 100,
          filter: {
            status: {
              eq: 'BiznaShare'
            }
          }
        }
      });
      const items = recordsRes?.data?.VwMySntMny?.items || [];
      if (!items.length) {
        Alert.alert(t.noRecords, t.noMoneySent);
      }
      setRecvrs(items);
    } catch (e) {
      console.error('Error fetching loanees:', e);
      Alert.alert(t.errorTitle, t.fetchError);
    } finally {
      setLoading(false);
    }
  };
  const filteredRecvrs = recvrs.filter(item => {
    const q = searchQuery.toLowerCase();
    return item.RecName?.toLowerCase().includes(q);
  });
  useEffect(() => {
    if (bizPhone.length > 6) {
      fetchLoanees();
    }
  }, [bizPhone]);
  return <View style={styles.container}>
      <View style={styles.inputBlock}>
        <TextInput placeholder={t.enterMyBusinessPhone} value={bizPhone} onChangeText={setBizPhone} style={styles.input} />
        <TextInput placeholder={t.sellerNamePartial} value={searchQuery} onChangeText={setSearchQuery} style={styles.input} />
      </View>

      <FlatList data={filteredRecvrs} renderItem={({
      item
    }) => <NonLnRec SMAc={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchLoanees} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponent={() => <>
            <Text style={styles.label2}>{t.swipeToLoad}</Text>
            <Text style={styles.label}>{t.purchasesFromBusinesses}</Text>
          </>} />
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