import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { byCOMBConsumer } from '../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import translations from './translation';

const FetchSMNonCovLns = () => {
  const [loading, setLoading] = useState(false);
  const [loanees, setLoanees] = useState<any[]>([]);
  const navigation = useNavigation();
  const client = generateClient();
const { i18n } = useTranslation();
const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
const t = translations[lang] || translations.en;
  const navigateTo = (screen: string, params: any = {}) => {
    navigation.navigate(screen as never, params as never);
  };
  const fetchUsrDtls = async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setLoading(true);
      const response: any = await client.graphql({
        query: byCOMBConsumer,
        variables: {
          consumerEmail: attributes.email,
          sortDirection: 'DESC',
          limit: 100,
          
        }
      });
      const acc = response.data.byCOMBConsumer.items;
      setLoanees(acc);
      if (acc.length < 1) {
        Alert.alert(t.noContractsFound);
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
  // Helper to translate enum values using translation keys
  const translateEnum = (enumValue: string) => {
    if (!enumValue) return '';
    const key = `status${enumValue}`;
    return t[key] || enumValue;
  };
  const renderCard = ({ item }: { item: any }) => (
    <Pressable style={styles.card} onPress={() => navigateTo('LinkCOMBSeller', { id: item.id })}>
      <Text style={styles.cardTitle}>{t.funderNameLabel }: {item.funderEmail || t.contractLabel || 'Contract'}</Text>
      <Text style={styles.cardSubtitle}>{t.funderContactLabel }: {item.funderContact}</Text>
      <Text style={styles.cardTitle}>{t.funderTypeLabel }: {translateEnum(item.funderType)}</Text>
      <Text style={styles.cardSubtitle}>{t.consumerTypeLabel }: {translateEnum(item.consumerType)}</Text>
      <Text style={styles.cardTitle}>{t.prepostPayLabel }: {translateEnum(item.prepostPay) || t.contractLabel || 'Contract'}</Text>
      <Text style={styles.cardSubtitle}>{t.consumptionCappingLabel }: {item.consumptionCapping}</Text>
      <Text style={styles.cardDetail}>
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : (t.naLabel || 'N/A')}
      </Text>
    </Pressable>
  );
  return (
    <View style={styles.root}>
      <FlatList
        style={{ width: '100%' }}
        data={loanees}
        renderItem={renderCard}
        keyExtractor={(item, index) => index.toString()}
        onRefresh={fetchUsrDtls}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        ListHeaderComponentStyle={{ alignItems: 'center' }}
        ListHeaderComponent={() => <>
          <Text style={styles.label}>{t.myCombContractsLabel }</Text>
          <Text style={styles.label2}>{t.swipeDownLabel}</Text>
        </>}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10
  },
  label2: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  cardDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 6
  }
});
export default FetchSMNonCovLns;