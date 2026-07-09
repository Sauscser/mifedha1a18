import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, ActivityIndicator } from 'react-native';
import NonLnRec from "../../../../../../components/MyAc/ViewSentNonLns";
import styles from './styles';
import { VwMySntMny } from '../../../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMNonLnsSnt = () => {
  const [loading, setLoading] = useState(false);
  const [Recvrs, setRecvrs] = useState<any[]>([]);
  const [itemPrys, setitemPrys] = useState('');
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchLoanees2 = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const Lonees: any = await client.graphql({
        query: VwMySntMny,
        variables: {
          senderPhn: attributes.email,
          sortDirection: "DESC",
          limit: 100,
          filter: {
            status: {
              eq: "cashSales"
            }
          }
        }
      });
      setRecvrs(Lonees.data.VwMySntMny.items);
      if (Lonees.data.VwMySntMny.items.length < 1) {
        Alert.alert(t.noRecords, t.noMoneySentToBusinesses);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t.errorTitle, t.fetchError);
    } finally {
      setLoading(false);
      setitemPrys("");
    }
  };
  useEffect(() => {
    fetchLoanees2();
  }, []);
  return <View style={styles.image}>
      <View style={styles.root}>
        <FlatList style={{
        width: "100%"
      }} data={Recvrs} renderItem={({
        item
      }) => <NonLnRec SMAc={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchLoanees2} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponentStyle={{
        alignItems: 'center'
      }} ListHeaderComponent={() => <>
              <Text style={styles.label2}>{t.swipeToLoad}</Text>
              <Text style={styles.label}>{t.moneySentToBusiness}</Text>
            </>} />
        {loading && <ActivityIndicator size="large" color="blue" />}
      </View>
    </View>;
};
export default FetchSMNonLnsSnt;