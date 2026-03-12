import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, FlatList } from 'react-native';
import LnerStts from "../../../../components/Chama/DeRegMmbr";
import styles from './styles';
import { translations } from './translation';
import { useTranslation } from 'react-i18next';
import { listChamaMembers } from '../../../../src/graphql/queries';
import { useRoute } from '@react-navigation/native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
const client = generateClient();

const FetchSMCovLns = props => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [step, setStep] = useState<'auth' | 'list'>('auth');
  const [grpContact, setChmPhn] = useState('');
  const [memberPhn, setmemberPhn] = useState('');
  const [pword, setPW] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const [loading, setLoading] = useState(false);
  const route = useRoute();

  // Authentication logic (from SgnIn2RemoveMmbr)
  const handleAuth = async () => {
    if (!grpContact || !memberPhn || !pword) {
      Alert.alert(t.fillAllFields || 'Please fill all fields');
      return;
    }
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const compDtls = await client.graphql({
        query: require('../../../../src/graphql/queries').getGroup,
        variables: { grpContact }
      });
      const signitoryPWs = compDtls.data.getGroup.signitoryPW;
      const owners = compDtls.data.getGroup.owner;
      const signitory2Subs = compDtls.data.getGroup.signitory2Sub;
      if (signitoryPWs !== pword) {
        Alert.alert(t.wrongAuthorCredentials || 'Wrong credentials');
      } else if (user.userId !== owners && signitory2Subs !== user.userId) {
        Alert.alert(t.notAuthorOrSignatory || 'Not authorized');
      } else {
        setStep('list');
        fetchLoanees();
      }
    } catch (e) {
      console.log(e);
      Alert.alert(t.groupNotExist || 'Group does not exist');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch members logic (from ChmVwMmbr2Remove)
  const fetchLoanees = async () => {
    setLoading(true);
    try {
      const Lonees = await client.graphql({
        query: listChamaMembers,
        variables: {
          filter: {
            ChamaNMember: {
              eq: grpContact + memberPhn
            }
          }
        }
      });
      setLoanees(Lonees.data.listChamaMembers.items);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // UI
  if (step === 'auth') {
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.label}>{t.fillChamaDetails || 'Enter Chama Details'}</Text>
          <TextInput
            placeholder={t.chamaPhoneNumber || '+2547xxxxxxxx'}
            value={grpContact}
            onChangeText={setChmPhn}
            style={styles.input}
            editable={!isLoading}
          />
          <TextInput
            placeholder={t.memberEmail || 'member@email.com'}
            value={memberPhn}
            onChangeText={setmemberPhn}
            style={styles.input}
            editable={!isLoading}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder={t.chamaPassword || 'Password'}
            value={pword}
            onChangeText={setPW}
            style={styles.input}
            editable={!isLoading}
            secureTextEntry
          />
          <TouchableOpacity onPress={handleAuth} style={styles.button} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t.clickToView || 'View Members'}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  // Member list step
  return (
    <View style={styles.root}>
      <FlatList
        style={{ width: '100%' }}
        data={Loanees}
        renderItem={({ item }) => <LnerStts ChamaMmbrshpDtls={item} />}
        keyExtractor={(item, index) => index.toString()}
        onRefresh={fetchLoanees}
        refreshing={loading}
        showsVerticalScrollIndicator={false}
        ListHeaderComponentStyle={{ alignItems: 'center' }}
        ListHeaderComponent={() => (
          <Text style={styles.label}>{t.chamaMembers}</Text>
        )}
      />
    </View>
  );
};

export default FetchSMCovLns;