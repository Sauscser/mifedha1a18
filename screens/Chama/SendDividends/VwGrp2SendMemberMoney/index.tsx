import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, FlatList, Alert } from 'react-native';
import LnerStts from "../../../../components/Chama/ChmActivities/SendMemberMoney/VwChama2SendMoney";
import styles from './styles';
import { getSMAccount, listChamaMembers } from '../../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
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
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      const MFNDtls = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: attributes.email }
      });
      const balances = MFNDtls.data.getSMAccount.balance;
      const owner = MFNDtls.data.getSMAccount.owner;
      const fetchLoanees = async () => {
        setLoading(true);
        try {
          const Lonees = await client.graphql({
            query: listChamaMembers,
            variables: {
              filter: {
                and: {
                  memberContact: { eq: attributes.email }
                }
              }
            }
          });
          setLoanees(Lonees.data.listChamaMembers.items);
        } catch (e) {
          Alert.alert(t.retryOrCall);
          return;
        } finally {
          setLoading(false);
        }
      };
      if (user.userId !== owner) {
        Alert.alert(t.createMainAccount);
      } else {
        await fetchLoanees();
      }
    } catch (e) {
      console.log(e);
      Alert.alert(t.error);
      return;
    }
  };
  useEffect(() => {
    fetchUsrDtls();
  }, []);
  return <View style={styles.root}>
    <FlatList
      style={{ width: "100%" }}
      data={Loanees}
      renderItem={({ item }) => <LnerStts ChamaRemitDtls={item} />}
      keyExtractor={(item, index) => index.toString()}
      onRefresh={fetchUsrDtls}
      refreshing={loading}
      showsVerticalScrollIndicator={false}
      ListHeaderComponentStyle={{ alignItems: 'center' }}
      ListHeaderComponent={() => <>
        <Text style={styles.label}>{t.myChamas}</Text>
        <Text style={styles.label}>{t.swipeToLoad}</Text>
      </>}
    />
  </View>;
};
export default FetchSMCovLns;