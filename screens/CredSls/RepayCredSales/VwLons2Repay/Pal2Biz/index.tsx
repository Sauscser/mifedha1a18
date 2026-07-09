import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, FlatList, Alert } from 'react-native';
import { getSMAccount, listCovCreditSellers } from '../../../../../src/graphql/queries';
import LnerStts from "../../../../../components/VwCredSales/2RepayCov";
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMCovLns = props => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
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
        const userInfo = await getCurrentUser();
        try {
          const Lonees: any = await client.graphql({
            query: listCovCreditSellers,
            variables: {
              filter: {
                and: {
                  buyerContact: {
                    eq: attributes.email
                  },
                  lonBala: {
                    gt: 0
                  }
                }
              }
            }
          });
          setLoanees(Lonees.data.listCovCreditSellers.items);
        } catch (e) {
          console.log(e);
        } finally {
          setLoading(false);
        }
      };
      if (userInfo.userId !== owner) {
        Alert.alert(t.createMainAccount);
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
            
          <Text style={styles.label}> {t.title}</Text>
          <Text style={styles.label2}> {t.swipeToLoad}</Text>
          </>} />
    </View>;
};
export default FetchSMCovLns;