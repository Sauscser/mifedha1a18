import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, ActivityIndicator } from 'react-native';
import NonLnRec from "../../../../../components/MyAc/ViewRecNonLns";
import styles from './styles';
import { VwMyRecMny7, vwMyRecMny7 } from '../../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMNonLnsSnt = props => {
  const [loading, setLoading] = useState(false);
  const [Recvrs, setRecvrs] = useState<any[]>([]);
  const [itemPrys, setitemPrys] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchLoanees2 = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const Lonees: any = await client.graphql({
        query: VwMyRecMny7,
        variables: {
          recPhn: attributes.email,
          sortDirection: 'DESC',
          limit: 100
        }
      });
      setRecvrs(Lonees.data.vwMyRecMny7.items);
      if (Lonees.data.vwMyRecMny7.items.length < 1) {
        Alert.alert(t.noRecordsTitle, t.noMoneyReceived);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t.errorTitle, t.fetchError);
    } finally {
      setIsLoading(false);
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
              <Text style={styles.label}>{t.moneyReceivedFromBusinesses}</Text>
            </>} />
        {isLoading && <ActivityIndicator size="large" color="blue" />}
      </View>
    </View>;
};
export default FetchSMNonLnsSnt;