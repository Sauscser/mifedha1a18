import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import LnerStts from "../../../components/Transport/PurchaseDtls";
import styles from './styles';
import { useRoute } from '@react-navigation/core';
import { listGroups, listNonLoans, listSokoAds, VwMySntMny } from '../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const FetchSMCovLns = props => {
  const [LneePhn, setLneePhn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const route = useRoute();
  // i18n translation
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchLoanees = async () => {
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    setLoading(true);
    try {
      const Lonees: any = await client.graphql({
        query: VwMySntMny,
        variables: {
          senderPhn: attributes.email,
          sortDirection: 'DESC',
          limit: 100,
          filter: {
            status: {
              eq: "Biz2Pal"
            }
          }
        }
      });
      setLoanees(Lonees.data.VwMySntMny.items);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLoanees();
  }, []);
  return <View style={styles.root}>
      <FlatList style={{
      width: "100%"
    }} data={Loanees} renderItem={({
      item
    }) => <LnerStts SMAc={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchLoanees} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponentStyle={{
      alignItems: 'center'
    }} ListHeaderComponent={() => <>
            
            <Text style={styles.label}>{t.viewTransportOffers}</Text>
            <Text style={styles.label}>{t.swipeToReload}</Text>
          </>} />
    </View>;
};
export default FetchSMCovLns;