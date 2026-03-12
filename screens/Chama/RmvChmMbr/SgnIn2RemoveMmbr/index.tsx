import React, { useEffect, useState } from 'react';
import { translations } from './translation';
import { useTranslation } from 'react-i18next';
import { listGroups, listChamaMembers } from '../../../../src/graphql/queries';
import { deleteChamaMembers } from '../../../../src/graphql/mutations';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import styles from './styles';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient();

const SgnIn2RemoveMmbr = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [adminGroups, setAdminGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pword, setPW] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [deregisteringId, setDeregisteringId] = useState(null);
  // Handle member deregistration
  const handleDeregisterMember = async (member) => {
    Alert.alert(
      t.confirmDeregisterTitle ,
      (t.confirmDeregisterMsg ) + `\n${member.memberName || member.name}`,
      [
        { text: t.cancel , style: 'cancel' },
        {
          text: t.deregister ,
          style: 'destructive',
          onPress: async () => {
            setDeregisteringId(member.MembaId || member.id);
            try {
              await client.graphql({
                query: deleteChamaMembers,
                variables: {
                  input: {
                    ChamaNMember: (member.MembaId || member.id) + selectedGroup.grpContact
                  }
                }
              });
              Alert.alert(t.deregistered );
              fetchMembers(selectedGroup.grpContact);
            } catch (error) {
              console.error(error);
              Alert.alert(t.deregisterFailed );
            }
            setDeregisteringId(null);
          }
        }
      ]
    );
  };

  // Fetch groups where current user is admin
  useEffect(() => {
    const fetchAdminGroups = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        const attrs = await fetchUserAttributes();
        const groupsData = await client.graphql({
          query: listGroups,
          variables: {
            filter: {
              or: [
                { Admin1: { eq: attrs.email } },
                { Admin2: { eq: attrs.email } },
                { Admin3: { eq: attrs.email } },
                { Admin4: { eq: attrs.email } },
                { Admin5: { eq: attrs.email } },
                { Admin6: { eq: attrs.email } },
                { Admin7: { eq: attrs.email } },
                { Admin8: { eq: attrs.email } },
                { Admin9: { eq: attrs.email } },
                { Admin10: { eq: attrs.email } },
                { Admin11: { eq: attrs.email } },
                { Admin12: { eq: attrs.email } },
                { Admin13: { eq: attrs.email } },
                { Admin14: { eq: attrs.email } },
                { Admin15: { eq: attrs.email } },
                { Admin16: { eq: attrs.email } },
                { Admin17: { eq: attrs.email } },
                { Admin18: { eq: attrs.email } },
                { Admin19: { eq: attrs.email } },
                { Admin20: { eq: attrs.email } }
              ]
            }
          }
        });
        if (groupsData && typeof groupsData === 'object' && groupsData !== null && Object.prototype.hasOwnProperty.call(groupsData, 'data')) {
          const data = (groupsData as { data?: any }).data;
          if (data?.listGroups?.items) {
            setAdminGroups(data.listGroups.items);
          } else {
            setAdminGroups([]);
          }
        } else {
          setAdminGroups([]);
        }
      } catch (error) {
        console.error(error);
        Alert.alert(t.groupNotExist );
      }
      setIsLoading(false);
    };
    fetchAdminGroups();
  }, []);

  // Fetch members for selected group
  const fetchMembers = async (groupContact) => {
    setLoadingMembers(true);
    try {
      const membersData = await client.graphql({
        query: listChamaMembers,
        variables: {
          filter: {
            groupContact: { eq: groupContact }
          }
        }
      });
      if (membersData && typeof membersData === 'object' && membersData !== null && Object.prototype.hasOwnProperty.call(membersData, 'data')) {
        const data = (membersData as { data?: any }).data;
        if (data?.listChamaMembers?.items) {
          setMembers(data.listChamaMembers.items);
        } else {
          setMembers([]);
        }
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t.groupNotExist );
    }
    setLoadingMembers(false);
  };

  // Handle group selection and password check
  const handleSelectGroup = async (group) => {
   
    setIsLoading(true);
    try {
      // Check password
     
      setSelectedGroup(group);
      await fetchMembers(group.grpContact);
    } catch (error) {
      console.error(error);
      Alert.alert(t.groupNotExist );
    }
    setIsLoading(false);
  };

  // UI
  if (!selectedGroup) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <MaterialIcons name="person-remove" size={38} color="#e58d29" style={{ marginBottom: 6 }} />
             </View>
        
          <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 10 }}>{t.selectGroup}</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#e58d29" style={{ marginVertical: 20 }} />
          ) : adminGroups.length > 0 ? (
            adminGroups.map(group => (
              <TouchableOpacity key={group.grpContact} style={{ marginBottom: 10, backgroundColor: '#e5e7eb', borderRadius: 8, padding: 12 }} onPress={() => handleSelectGroup(group)} disabled={isLoading}>
                <Text style={{ fontWeight: '600', color: '#1F2933' }}>{group.grpName}</Text>
              </TouchableOpacity>
            ))
          ) : !isLoading && (
            <Text style={{ color: 'red', marginVertical: 10 }}>{t.noGroups}</Text>
          )}
        </View>
      </ScrollView>
    );
  }
  // Member list step
  return (
    <View style={styles.root}>
      <FlatList
        style={{ width: '100%' }}
        data={members}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontWeight: '600' }}>{item.memberName || item.name}</Text>
              <Text>{item.memberContact}</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#e58d29', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6, opacity: deregisteringId === (item.MembaId || item.id) ? 0.6 : 1 }}
              onPress={() => handleDeregisterMember(item)}
              disabled={deregisteringId === (item.MembaId || item.id)}
            >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{deregisteringId === (item.MembaId || item.id) ? t.deregistering : t.deregister}</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        onRefresh={() => fetchMembers(selectedGroup.grpContact)}
        refreshing={loadingMembers}
        showsVerticalScrollIndicator={false}
        ListHeaderComponentStyle={{ alignItems: 'center' }}
        ListHeaderComponent={() => (
            <Text style={styles.label}>{t.groupMembers}</Text>
        )}
      />
    </View>
  );
};
export default SgnIn2RemoveMmbr;