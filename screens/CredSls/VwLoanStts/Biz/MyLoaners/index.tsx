import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, TextInput, StyleSheet } from 'react-native';
import NonLnRec from "../../../../../components/VwCredSales/CrdStatus/Biz/Biz2BizLoaners";
import { listPersonels, VwMyCrdBys7 } from '../../../../../src/graphql/queries';
import { fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
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
    if (loading) return;
    setLoading(true);
    try {
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
      if (personnelCheck.data.listPersonels.items.length < 1) {
        Alert.alert(t.accessDeniedTitle, t.accessDeniedMessage);
        return;
      }
      const result: any = await client.graphql({
        query: VwMyCrdBys7,
        variables: {
          buyerContact: bizPhone,
          sortDirection: "DESC",
          limit: 100,
          filter: {
            lnType: {
              eq: "Biz2Biz"
            },
            lonBala: {
              gt: 0
            }
          }
        }
      });
      const items = result.data.VwMyCrdBys7.items || [];
      setAllRecords(items);
      setFilteredRecords(items);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!buyerFilter) {
      setFilteredRecords(allRecords);
    } else {
      const filtered = allRecords.filter(item => item?.SellerName?.toLowerCase().includes(buyerFilter.toLowerCase()));
      setFilteredRecords(filtered);
    }
  }, [buyerFilter, allRecords]);
  return <View style={styles.container}>
      <View style={styles.inputBlock}>
        <TextInput placeholder={t.myFullBusinessNumberPlaceholder} value={bizPhone} onChangeText={setBizPhone} style={styles.input} />
      

      <TextInput placeholder={t.sellersNamePlaceholder} value={buyerFilter} onChangeText={setBuyerFilter} style={styles.input} />

    </View>
      
        <FlatList data={filteredRecords} renderItem={({
      item
    }) => <NonLnRec Loanee={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchLoanees} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponent={() => <>
              <Text style={styles.label2}>{t.pleaseSwipeDownToReload}</Text>
              <Text style={styles.label}>{t.businessCreditPurchasesTitle}</Text>
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