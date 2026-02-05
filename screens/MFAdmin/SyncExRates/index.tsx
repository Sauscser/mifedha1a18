import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getCompany } from '../../../src/graphql/queries';
import { getCurrentUser } from 'aws-amplify/auth';
import { useExchange } from '../../../src/contexts/ExchangeContext';
const client = generateClient();

const SyncExRates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { refreshRates } = useExchange();
  const onSync = async () => {
    setIsLoading(true);
    try {
      const u = await getCurrentUser();
      const compDtls: any = await client.graphql({ query: getCompany, variables: { AdminId: "BaruchHabaB'ShemAdonai2" } });
      const ownersss = compDtls.data.getCompany.owner;
      if (ownersss !== u.userId) {
        Alert.alert('Access Denied');
        setIsLoading(false);
        return;
      }
      await refreshRates();
      Alert.alert('Success', 'Exchange rates synced from exchangerate.host');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Sync failed; check internet');
    }
    setIsLoading(false);
  };
  return <ScrollView style={{padding:20}}>
    <Text style={{fontSize:18, fontWeight:'bold', marginBottom:12}}>Sync Live Exchange Rates</Text>
    <Text style={{marginBottom:12}}>This will fetch free rates from exchangerate.host and update local ExRates records. Only owner can run this.</Text>
    <TouchableOpacity onPress={onSync} >
      <Text >Sync Live Rates</Text>
      {isLoading && <ActivityIndicator color="#fff" />}
    </TouchableOpacity>
  </ScrollView>;
};
export default SyncExRates;