import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, FlatList, Alert } from 'react-native';
import { getSMAccount, listBiznas, listPersonels } from '../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import LnerStts from "../../../components/Ads/VwBiz2AddItem";
import styles from './styles';
const client = generateClient();
import { translations } from './translation';
import { useTranslation } from 'react-i18next';
const FetchSMCovLns = props => {
  const { i18n } = useTranslation();
  const t = translations[i18n.language] || translations.en;
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);


  useEffect(() => {
    fetchUsrDtls();
  }, []);


  const fetchUsrDtls = async () => {
    if (loading) return;
    setLoading(true);
    const attrs = await fetchUserAttributes();
    try {
      const res: any = await client.graphql({
        query: listPersonels,
        variables: {
          filter: {
            phoneKontact: {
              eq: attrs.email
            }
          }
        }
      });
      const items = res.data.listPersonels.items;
      if (items.length === 0) {
        Alert.alert(t.noBusinessesAlert);
      } else {
        setLoanees(items);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t.error, t.failedToFetch);
    } finally {
      setLoading(false);
    }
  };
  
  return <View style={styles.root}>
      <FlatList style={{
      width: "100%"
    }} data={Loanees} renderItem={({
      item
    }) => <LnerStts Loanee={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchUsrDtls} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponentStyle={{
      alignItems: 'center'
    }} ListHeaderComponent={() => <>
            <Text style={styles.label}>{t.selectBusinessLabel}</Text>
            <Text style={styles.label2}>{t.swipeToLoadLabel}</Text>
          </>} />
    </View>;
};
export default FetchSMCovLns;