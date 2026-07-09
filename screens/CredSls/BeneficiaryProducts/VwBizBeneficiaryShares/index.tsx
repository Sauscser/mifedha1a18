import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import LnerStts from "../../../../components/CredSales/BenProd2/ViewBizBeneficiaryShares";
import { listBiznas, listLinkBeneficiary2s } from '../../../../src/graphql/queries';
import * as Clipboard from 'expo-clipboard';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const FetchSMNonCovLns = props => {
  const [Loanees, setLoanees] = useState([]);
  const [UsrDtls, setUsrDtls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [awsEmail, setAWSEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const ChckPersonelExistence = async () => {
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const UsrDtlsRes: any = await client.graphql({
        query: listBiznas,
        variables: {
          filter: {
            BusKntct: {
              eq: awsEmail
            },
            owner: {
              eq: userInfo.userId
            }
          }
        }
      });
      const benefitContributors = UsrDtlsRes.data.listBiznas.items;
      setUsrDtls(benefitContributors);
      const fetchLoanees = async () => {
        try {
          const Lonees: any = await client.graphql({
            query: listLinkBeneficiary2s,
            variables: {
              filter: {
                benefitStatus: {
                  eq: "Active"
                },
                beneficiaryAc: {
                  eq: awsEmail
                }
              }
            }
          });
          const contribution = Lonees.data.listLinkBeneficiary2s.items;
          setLoanees(contribution);
          if (contribution.length < 1) {
            Alert.alert(t.noContribution);
          }
        } catch (e) {
          console.error("Error fetching accounts:", e);
        }
      };
      if (benefitContributors.length < 1) {
        Alert.alert(t.notYourBusiness);
      } else {
        await fetchLoanees();
      }
    } catch (e) {
      console.log(e);
      Alert.alert(t.accessDenied);
      return;
    }
    setIsLoading(false);
    setAWSEmail("");
  };
  return <KeyboardAvoidingView style={{
    flex: 1
  }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput placeholder={t.companyBizAccountNumber} value={awsEmail} onChangeText={setAWSEmail} style={styles.searchInput} />
          <Text style={styles.placeholderText}>
            {t.swipeToLoadRefresh}
          </Text>
        </View>

        {/* Results */}
        <FlatList style={{
        flex: 1
      }} data={Loanees} renderItem={({
        item
      }) => <View>
              <LnerStts SMAc={item} />
            </View>} keyExtractor={(item, index) => index.toString()} onRefresh={ChckPersonelExistence} refreshing={loading} keyboardShouldPersistTaps="handled" />
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