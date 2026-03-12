import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import LnerStts from "../../../../components/Chama/GeneralInfo";
import { listChamaApply2s, listGroups } from '../../../../src/graphql/queries';
import * as Clipboard from 'expo-clipboard';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient();
const FetchSMNonCovLns = props => {
  const [Loanees, setLoanees] = useState([]);
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const fetchLoanees = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const Lonees = await client.graphql({
        query: listGroups,
        variables: {
          filter: {
            or: [
              { Admin1: { eq: attributes.email } },
              { Admin2: { eq: attributes.email } },
              { Admin3: { eq: attributes.email } },
              { Admin4: { eq: attributes.email } },
              { Admin5: { eq: attributes.email } },
              { Admin6: { eq: attributes.email } },
              { Admin7: { eq: attributes.email } },
              { Admin8: { eq: attributes.email } },
              { Admin9: { eq: attributes.email } },
              { Admin10: { eq: attributes.email } },
              { Admin11: { eq: attributes.email } },
              { Admin12: { eq: attributes.email } },
              { Admin13: { eq: attributes.email } },
              { Admin14: { eq: attributes.email } },
              { Admin15: { eq: attributes.email } },
              { Admin16: { eq: attributes.email } },
              { Admin17: { eq: attributes.email } },
              { Admin18: { eq: attributes.email } },
              { Admin19: { eq: attributes.email } },
              { Admin20: { eq: attributes.email } }
            ]
          }
        }
      });
      const Applications = Lonees.data.listGroups.items;
      setLoanees(Applications);
    } catch (error) {
      console.log(error);
      Alert.alert(t.errorFetching);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLoanees();
  }, []);
  return <KeyboardAvoidingView style={{
    flex: 1
  }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <FlatList style={{
        flex: 1
      }} data={Loanees} renderItem={({
        item
      }) => <View>
              <LnerStts ChmDtls={item} />
            </View>} keyExtractor={(item, index) => index.toString()} onRefresh={fetchLoanees} refreshing={loading} keyboardShouldPersistTaps="handled" />
      </View>
    </KeyboardAvoidingView>;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10
  },
  searchBar: {
    marginBottom: 10
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff'
  },
  placeholderText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20
  }
});
export default FetchSMNonCovLns;