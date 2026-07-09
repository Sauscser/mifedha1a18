import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, FlatList, Alert } from 'react-native';
import LnerStts from "../../../../../components/VwCredSales/CrdStatus/Pal/Pal2BizLoanersDtld";
import styles from './styles';
import { getCompany, getSMAccount, listCovCreditSellers, listSMLoansCovereds } from '../../../../../src/graphql/queries';
import { updateCompany, updateSMAccount } from '../../../../../src/graphql/mutations';
import { useRoute } from '@react-navigation/native';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMCovLns = props => {
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const route = useRoute();
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
            query: listCovCreditSellers,
            variables: {
              filter: {
                and: {
                  lonBala: {
                    gt: 0
                  },
                  loanID: {
                    eq: route.params.loanID
                  }
                }
              }
            }
          });
          setLoanees(Lonees.data.listCovCreditSellers.items);
        } catch (e) {
          if (e) {
            console.log(e);
            Alert.alert(t.retryAlertTitle);
            return;
          }
          console.log(e);
        }
      };
      if (userInfo.userId !== owner) {
        Alert.alert(t.mainAccountAlert);
        return;
      } else {
        await fetchLoanees();
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
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
    }) => <LnerStts Loanee={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchUsrDtls} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponentStyle={{
      alignItems: 'center'
    }} ListHeaderComponent={() => <>
            
            <Text style={styles.label}>{t.myLoanersTitle}</Text>
            <Text style={styles.label2}>{t.pleaseSwipeDownToLoad}</Text>
          </>} />
    </View>;
};
export default FetchSMCovLns;