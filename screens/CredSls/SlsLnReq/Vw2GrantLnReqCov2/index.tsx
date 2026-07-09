import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import LnerStts from "../../../../components/CredSalesReq/Vw2GrantLnReqCov";
import styles from './styles';
import { listReqLoanCredSls, listSMAccounts } from '../../../../src/graphql/queries';
import { useRoute } from '@react-navigation/native';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMNonCovLns = props => {
  const [LneePhn, setLneePhn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const route = useRoute();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  /*
  
    Grant Biz2Biz
    
    */

  const fetchUser = async () => {
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    setLneePhn(attributes.phone_number);
  };
  useEffect(() => {
    fetchUser();
  }, []);
  const fetchLoanees = async () => {
    setLoading(true);
    try {
      const Lonees: any = await client.graphql({
        query: listReqLoanCredSls,
        variables: {
          filter: {
            businessNo: {
              eq: route.params.BusinessRegNo
            },
            status: {
              eq: "AwaitingResponse"
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
            
            
          <Text style={styles.label}> {t.swipeDownToRefresh}</Text>
            
          <Text style={styles.label2}> {t.selectLoanRequestToGrant}</Text>
            
          </>} />



    </View>;
};
export default FetchSMNonCovLns;