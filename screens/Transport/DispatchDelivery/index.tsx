import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import LnerStts from "../../../components/Transport/DispatchDelivery";
import { BySellerAccount, listBenProd2s, listTransportOrders } from '../../../src/graphql/queries';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const FetchSMNonCovLns = props => {
  const [Loanees, setLoanees] = useState([]); // Stores fetched accounts
  const [filteredLoanees, setFilteredLoanees] = useState([]); // Stores filtered results
  const [loading, setLoading] = useState(false);
  const [awsEmail, setAWSEmail] = useState("");
  const route = useRoute();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  useEffect(() => {
    fetchLoanees();
  }, []);
  const fetchLoanees = async () => {
    setLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const Lonees = await client.graphql({
        query: BySellerAccount,
        variables: {
          sellerContact: route.params.BusinessRegNo,
          sortDirection: "DESC",
          limit: 100
        }
      });
      setLoanees(Lonees.data.BySellerAccount.items);
    } catch (e) {
      console.error(t.errorFetching, e);
      Alert.alert(t.errorFetching, e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Filtering based on input
  const handleSearch = text => {
    setAWSEmail(text);
    const filtered = Loanees.filter(SMAccount => SMAccount.transportName.includes(text));
    setFilteredLoanees(filtered);
  };
  return <KeyboardAvoidingView style={{
    flex: 1
  }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.container}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <TextInput placeholder={t.searchPlaceholder} value={awsEmail} onChangeText={handleSearch} style={styles.searchInput} />
                </View>

                {/* Results */}
                {awsEmail.length > 0 ? <FlatList style={{
        flex: 1
      }} data={filteredLoanees} renderItem={({
        item
      }) => <View>
                                <LnerStts SMAc={item} />
                            </View>} keyExtractor={(item, index) => index.toString()} refreshing={loading} keyboardShouldPersistTaps="handled" /> : <Text style={styles.placeholderText}>
                        {t.startTyping}
                    </Text>}
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