import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, FlatList, Alert } from 'react-native';
import LnerStts from "../../../../components/MyAc/LoanReq/VwChama2Req";
import styles from './styles';
import { getCompany, getSMAccount, listChamaMembers, listGroups, } from '../../../../src/graphql/queries';
import { updateCompany, updateSMAccount } from '../../../../src/graphql/mutations';
import { useNavigation } from '@react-navigation/native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMCovLns = props => {
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchUsrDtls = async () => {
    const user = await getCurrentUser();
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
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        try {
          const Lonees: any = await client.graphql({
            query: listChamaMembers,
            variables: {
              filter: {
                memberContact: {
                  eq: attributes.email
                }
              }
            }
          });
          setLoanees(Lonees.data.listChamaMembers.items);
          if (Lonees.data.listChamaMembers.items.length < 1) {
            Alert.alert(t.notInGroup);
          }
        } catch (e) {
          if (e) {
            Alert.alert(t.retryOrUpdate);
            return;
          }
        } finally {
          setLoading(false);
        }
      };
      if (user.userId !== owner) {
        Alert.alert(t.pleaseCreateMainAccount);
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
    }) => <LnerStts ChamaMmbrshpDtls={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchUsrDtls} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponentStyle={{
      alignItems: 'center'
    }} ListHeaderComponent={() => <>
            <Text style={styles.label}>{t.selectGroup}</Text>
          </>} />
    </View>;
};
export default FetchSMCovLns;