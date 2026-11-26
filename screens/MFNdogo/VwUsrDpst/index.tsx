import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import NonLnSent from "../../../components/MFNdogo/VwUsrDposit";
import styles from './styles';
import { VwMFNFltDeductns } from '../../../src/graphql/queries';
import { useRoute } from '@react-navigation/core';
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const FetchSMNonLnsSnt = props => {
  const [loading, setLoading] = useState(false);
  const [Recvrs, setRecvrs] = useState([]);
  const route = useRoute();
  const fetchLoanees = async () => {
    setLoading(true);
    try {
      const Lonees: any = await client.graphql({
        query: VwMFNFltDeductns,
        variables: {
          agContact: route.params.MFNId,
          sortDirection: "DESC"
        }
      });
      setRecvrs(Lonees.data.VwMFNFltDeductns.items || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLoanees();
  }, []);
  return (
    <View style={styles.root}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={Recvrs}
        renderItem={({ item }) => <NonLnSent SMAc={item} />}
        keyExtractor={item => String(item.id)}
        onRefresh={fetchLoanees}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.accent} />
            <Text style={styles.title}>User Deposits</Text>
            <Text style={styles.subtitle}>Deposit history for this NiSenti Ndogo account</Text>
            {!loading && Recvrs.length > 0 && (
              <Text style={styles.count}>{Recvrs.length} {Recvrs.length === 1 ? 'deposit' : 'deposits'}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#168DB3" />
              <Text style={styles.emptyText}>Loading deposits...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No deposits yet</Text>
              <Text style={styles.emptyText}>Pull down to refresh the deposit history.</Text>
            </View>
          )
        }
      />
    </View>
  );
};
export default FetchSMNonLnsSnt;