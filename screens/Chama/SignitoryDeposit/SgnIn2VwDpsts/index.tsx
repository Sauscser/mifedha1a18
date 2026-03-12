import React, { useEffect, useState } from 'react';
import { listChamaMembers, VwMFNFltDeductns, VwMyUsrDposits } from '../../../../src/graphql/queries';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { StyleSheet } from 'react-native';
import NonLnSent from '../../../../components/Chama/VwDepositsChm';
const client = generateClient();

const ChmSignIn = () => {
  const [ChamaMembers, setChamaMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const attributes = await fetchUserAttributes();
        const res: any = await client.graphql({
          query: listChamaMembers,
          variables: {
            filter: { memberContact: { eq: attributes.email } }
          }
        });
        setChamaMembers(res.data?.listChamaMembers?.items || []);
      } catch (e) {
        setError(t.errorAccessDenied || 'Failed to load groups');
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
      const res: any = await client.graphql({
        query: VwMyUsrDposits,
        variables: {
          depositerid: groupContact,
          sortDirection: 'DESC',
          limit: 100
        }
      });
      setDeposits(res.data?.VwMyUsrDposits?.items || []);
    } catch (e) {
      console.error('fetchDeposits error:', e);
      setError(t.errorAccessDenied || 'Failed to load deposits');
    } finally {
      setDepositsLoading(false);
    }
  };

  const handleSelectGroup = (ChamaMembers) => {
    setSelectedGroup(ChamaMembers);
    fetchDeposits(ChamaMembers.groupContact);
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
      <View style={styles.image}>
        <Text style={styles.title}>{t.selectGroup || 'Select a Group'}</Text>
        <FlatList
          data={ChamaMembers}
          keyExtractor={(item, index) => `${item.MembaId}_${item.groupName || ''}_${index}`}
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
    <View style={styles.image}>
      <TouchableOpacity onPress={handleBackToGroups} style={styles.sendLoanButton}>
        <Text style={styles.sendLoanButtonText}>{t.backToGroups || 'Back to Groups'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{selectedGroup.groupName}</Text>
      <Text style={styles.groupId}>{t.memberId || 'Member ID'}: {selectedGroup.MembaId}</Text>
      {depositsLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={deposits}
          keyExtractor={(item, index) => `${item.id || 'noid'}_${index}`}
          renderItem={({ item }) => <NonLnSent SMAc={item} />}
          ListEmptyComponent={<Text style={styles.center}>{t.noDeposits || 'No deposits found.'}</Text>}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  image: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 24,
  },
  card: {
    backgroundColor: '#f0f8ff',
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2471a3',
  },
  groupId: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  loanTitleView: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2471a3',
    marginBottom: 8,
  },
  sendLoanView: {
    marginBottom: 18,
  },
  sendLoanText: {
    fontSize: 15,
    color: '#e29d58',
    marginBottom: 6,
    fontWeight: '500',
    minWidth: 140,
  },
  sendLoanInput: {
    borderWidth: 1,
    borderColor: '#b3d8f7',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#222',
    minHeight: 48,
    width: '100%',
  },
  sendLoanButton: {
    backgroundColor: '#2471a3',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#e29d58',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 180,
    alignSelf: 'center',
  },
  sendLoanButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default ChmSignIn;