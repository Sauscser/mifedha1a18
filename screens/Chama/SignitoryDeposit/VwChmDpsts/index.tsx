import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import NonLnSent from "../../../../components/Chama/VwDepositsChm";
import { listChamaMembers, VwMFNFltDeductns } from '../../../../src/graphql/queries';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import translations from './translation';
const client = generateClient();

const VwChmDpsts = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const t = translations['en']; // Replace with i18n if needed

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const attributes = await fetchUserAttributes();
        setEmail(attributes.email);
        const res = await client.graphql({
          query: listChamaMembers,
          variables: {
            filter: { memberContact: { eq: attributes.email } }
          }
        });
        setGroups(res.data.listChamaMembers.items || []);
      } catch (e) {
        setError('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const fetchDeposits = async (groupContact) => {
    setDepositsLoading(true);
    setError(null);
    try {
      const res = await client.graphql({
        query: VwMFNFltDeductns,
        variables: {
          depositerid: groupContact,
          sortDirection: 'DESC',
          limit: 100
        }
      });
      setDeposits(res.data.VwMFNFltDeductns.items || []);
    } catch (e) {
      setError('Failed to load deposits');
    } finally {
      setDepositsLoading(false);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    fetchDeposits(group.groupContact);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setDeposits([]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text>{t.loading || 'Loading...'}</Text></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }

  if (!selectedGroup) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>{t.selectGroup || 'Select a Group'}</Text>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.MembaId}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleSelectGroup(item)}>
              <Text style={styles.groupName}>{item.groupName}</Text>
              <Text style={styles.groupId}>{t.memberId || 'Member ID'}: {item.MembaId}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.center}>{t.noGroups || 'No groups found.'}</Text>}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBackToGroups} style={styles.backButton}>
        <Text style={styles.backButtonText}>{t.backToGroups || 'Back to Groups'}</Text>
      </TouchableOpacity>
      <Text style={styles.header}>{selectedGroup.groupName}</Text>
      <Text style={styles.groupId}>{t.memberId || 'Member ID'}: {selectedGroup.MembaId}</Text>
      {depositsLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={deposits}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => <NonLnSent SMAc={item} />}
          ListEmptyComponent={<Text style={styles.center}>{t.noDeposits || 'No deposits found.'}</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: { backgroundColor: '#f0f8ff', padding: 18, borderRadius: 10, marginBottom: 12, elevation: 2 },
  groupName: { fontSize: 18, fontWeight: '600', color: '#2471a3' },
  groupId: { fontSize: 14, color: '#888', marginTop: 4 },
  backButton: { marginBottom: 16, alignSelf: 'flex-start', backgroundColor: '#2471a3', padding: 10, borderRadius: 6 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  center: { textAlign: 'center', marginTop: 24, fontSize: 16 },
});

export default VwChmDpsts;