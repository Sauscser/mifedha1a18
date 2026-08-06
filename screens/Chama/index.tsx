import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView, Modal, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { getSMAccount, listAgents, listGroups, listSAgents } from '../../src/graphql/queries';
import { createMessages, updateAgent, updateGroup } from '../../src/graphql/mutations';
import { useExchange } from '../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../src/utils/exchange';
import { nationalityToCode } from '../../src/utils/nationalityToCode';
import translations from './translation';
import styles from './styles';

const client = generateClient();

// Reusable Gradient Button
const GradientButton = ({
  onPress,
  text
}) => <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
  x: 0,
  y: 0
}} end={{
  x: 1,
  y: 1
}} style={styles.gradientPressable}>
    <Pressable onPress={onPress} style={styles.clientsPressable}>
      <Text style={styles.clientsPressableText}>{text}</Text>
    </Pressable>
  </LinearGradient>;
const MyLoanAccount = () => {
  const navigation = useNavigation();
  const [id, setID] = useState('');
  const [ChamaNMember, setChamaNMember] = useState('');
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const { nationality, ratesMap } = useExchange();
  const safeNationality = typeof nationality === 'string' ? nationality : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const [resolvedUserNationality, setResolvedUserNationality] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const userCurrencyKey = nationalityToCode(resolvedUserNationality || safeNationality || '') || (resolvedUserNationality || safeNationality || '') || undefined;
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkStep, setLinkStep] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [sAgents, setSAgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedSAgent, setSelectedSAgent] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [groupFloatStatusInput, setGroupFloatStatusInput] = useState('YES');
  const [groupFloatAmountInput, setGroupFloatAmountInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Navigation functions
  const navigateTo = (screen, params) => () => navigation.navigate(screen, params);

  const closeLinkModal = () => {
    setLinkModalVisible(false);
    setLinkStep('groups');
    setGroups([]);
    setSAgents([]);
    setAgents([]);
    setSelectedGroup(null);
    setSelectedSAgent(null);
    setSelectedAgent(null);
    setGroupFloatStatusInput('YES');
    setGroupFloatAmountInput('');
  };

  const resolveUserNationalityFromAccount = async (userEmail?: string) => {
    try {
      const attributes = await fetchUserAttributes();
      const currentEmail = userEmail || attributes?.email;
      if (!currentEmail) {
        return '';
      }

      const accountRes: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: currentEmail
        }
      });

      const accountNationality = accountRes?.data?.getSMAccount?.nationality || '';
      setResolvedUserNationality(accountNationality);

      const resolvedCode = nationalityToCode(accountNationality) || accountNationality;
      const nextCurrencySymbol = resolvedCode && ratesMap?.[resolvedCode]?.symbol
        ? String(ratesMap[resolvedCode].symbol)
        : '';
      setCurrencySymbol(nextCurrencySymbol);
      return accountNationality;
    } catch (error) {
      console.warn(error);
      return '';
    }
  };

  const openLinkFlow = async () => {
    setIsLinking(true);
    try {
      const attributes = await fetchUserAttributes();
      const userEmail = attributes?.email;
      if (!userEmail) {
        Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoErrorMessage);
        return;
      }

      await resolveUserNationalityFromAccount(userEmail);

      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            senderEmail: userEmail,
            messageBody: `Link NSNdogo initiated at ${new Date().toISOString()}`,
            createdAt: new Date().toISOString(),
            readStatus: 'unread'
          }
        }
      });

      const groupsRes: any = await client.graphql({
        query: listGroups,
        variables: {
          filter: {
            or: [
              { SignatoryEmail: { eq: userEmail } },
              { signatory2Email: { eq: userEmail } },
              { Signatory3Email: { eq: userEmail } }
            ]
          }
        }
      });
      const availableGroups = groupsRes?.data?.listGroups?.items || [];
      setGroups(availableGroups);
      setSelectedGroup(null);
      setSelectedSAgent(null);
      setSelectedAgent(null);
      setGroupFloatStatusInput('YES');
      setGroupFloatAmountInput('');
      setLinkStep('groups');
      setLinkModalVisible(true);
    } catch (error) {
      console.warn(error);
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoErrorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  const selectGroup = async (group) => {
    setSelectedGroup(group);
    setIsLinking(true);
    try {
      const sAgentsRes: any = await client.graphql({
        query: listSAgents,
        variables: {
          filter: { bkAcNo: { eq: group.grpContact } }
        }
      });
      setSAgents(sAgentsRes?.data?.listSAgents?.items || []);
      setLinkStep('sagents');
    } catch (error) {
      console.warn(error);
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoErrorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  const selectSAgent = async (sAgent) => {
    setSelectedSAgent(sAgent);
    setIsLinking(true);
    try {
      const agentsRes: any = await client.graphql({
        query: listAgents,
        variables: {
          filter: { sagentregno: { eq: sAgent.saPhoneContact } }
        }
      });
      setAgents(agentsRes?.data?.listAgents?.items || []);
      setLinkStep('agents');
    } catch (error) {
      console.warn(error);
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoErrorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    setLinkStep('form');
    setGroupFloatStatusInput('YES');
    setGroupFloatAmountInput('');
  };

  const delinkAgent = async (agent) => {
    setIsLinking(true);
    try {
      await client.graphql({
        query: updateAgent,
        variables: {
          input: {
            phonecontact: agent.phonecontact,
            groupFloatStatus: 'NO'
          }
        }
      });

      const agentsRes: any = await client.graphql({
        query: listAgents,
        variables: {
          filter: { sagentregno: { eq: selectedSAgent.saPhoneContact } }
        }
      });
      setAgents(agentsRes?.data?.listAgents?.items || []);
      Alert.alert(
        t.delinkNsndogoSuccessTitle || 'Group link removed',
        (t.delinkNsndogoSuccessMessage || '{{agent}} was delinked from group funding.')
          .replace('{{agent}}', agent.name || agent.phonecontact)
      );
    } catch (error) {
      console.warn(error);
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoErrorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  const selectedGroupBalance = selectedGroup ? parseFloat(String(selectedGroup.grpBal || '0')) : 0;
  const selectedGroupFloatLoan = selectedGroup ? parseFloat(String(selectedGroup.groupFloatLoan || '0')) : 0;
  const selectedAgentFloatBalance = selectedAgent ? parseFloat(String(selectedAgent.groupFloatBalance || selectedAgent.floatBal || '0')) : 0;
  const selectedAgentFloatCommitment = selectedAgent ? parseFloat(String(selectedAgent.groupFloatAmount || '0')) : 0;
  const formattedGroupBalance = selectedGroupBalance
    ? formatAmountSync(selectedGroupBalance, userCurrencyKey, ratesMap, currencySymbol || '')
    : '0';
  const formattedGroupFloatLoan = selectedGroupFloatLoan
    ? formatAmountSync(selectedGroupFloatLoan, userCurrencyKey, ratesMap, currencySymbol || '')
    : '0';
  const formattedAgentFloatBalance = selectedAgentFloatBalance
    ? formatAmountSync(selectedAgentFloatBalance, userCurrencyKey, ratesMap, currencySymbol || '')
    : '0';
  const formattedAgentFloatCommitment = selectedAgentFloatCommitment
    ? formatAmountSync(selectedAgentFloatCommitment, userCurrencyKey, ratesMap, currencySymbol || '')
    : '0';

  const saveLink = async () => {
    if (!selectedGroup || !selectedSAgent || !selectedAgent) {
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoErrorMessage);
      return;
    }

    const parsedAmount = Number(groupFloatAmountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoAmountError);
      return;
    }

    if (String(groupFloatStatusInput).trim().toUpperCase() !== 'YES') {
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoStatusError);
      return;
    }

    const groupBalance = parseFloat(String(selectedGroup.grpBal || '0'));
    const userNationality = resolvedUserNationality || nationality || undefined;
    const backendAmount = await convertForeignToKsh(parsedAmount, userNationality);
    if (!Number.isFinite(backendAmount) || backendAmount <= 0) {
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoAmountError);
      return;
    }
    if (backendAmount > groupBalance) {
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoBalanceError);
      return;
    }

    setIsLinking(true);
    try {
      const nextGroupFloatLoan = parseFloat(String(selectedGroup.groupFloatLoan || '0')) + backendAmount;
      const nextGroupBalance = groupBalance - backendAmount;

      await client.graphql({
        query: updateAgent,
        variables: {
          input: {
            phonecontact: selectedAgent.phonecontact,
            groupFloatStatus: groupFloatStatusInput.toUpperCase(),
          }
        }
      });

      await client.graphql({
        query: updateGroup,
        variables: {
          input: {
            grpContact: selectedGroup.grpContact,
          }
        }
      });

      const formattedAmount = formatAmountSync(backendAmount, userCurrencyKey, ratesMap, currencySymbol || '');
      Alert.alert(t.linkNsndogoSuccessTitle, t.linkNsndogoSuccessMessage.replace('{{agent}}', selectedAgent.name || selectedAgent.phonecontact).replace('{{amount}}', formattedAmount));
      closeLinkModal();
    } catch (error) {
      console.warn(error);
      Alert.alert(t.linkNsndogoErrorTitle, t.linkNsndogoErrorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  return <>
      <SafeAreaView style={{
        flex: 1
      }}>
        <ScrollView>
          <View style={styles.adminImage}>

            {/* ------------------- Group Advance ------------------- */}
            <View style={styles.clientsView}>
              <Text style={styles.salesText}>{t.groupAdvance}</Text>
              <GradientButton onPress={navigateTo('Vw2SelectChm2Req', {})} text={t.requestLoan} />
              <GradientButton onPress={navigateTo('ChamaVw2DelLnReqs', {})} text={t.deleteLoanRequest} />
              <GradientButton onPress={navigateTo('VwGrp2LnCov', {})} text={t.giveMemberAdvance} />
              <GradientButton onPress={navigateTo('Vw2FloatGrpLoans', {})} text={t.floatGroupLoans} />
              <GradientButton onPress={navigateTo('Vw2SignLoanRequests', {})} text={t.approveMemberLoan} />
              <GradientButton onPress={navigateTo('CreateChamaMinutes', {})} text={t.groupMinutes} />
            </View>

            {/* ------------------- Group Status ------------------- */}
            <View style={styles.clientsView}>
              <Text style={styles.salesPressableText}>{t.viewGroupStatus}</Text>
              <GradientButton onPress={navigateTo('ChmSignInss', {})} text={t.viewGroupDebtsStatus} />
            </View>

            {/* ------------------- Member Status ------------------- */}
            <View style={styles.clientsView}>
              <Text style={styles.salesPressableText}>{t.viewMemberStatus}</Text>
              <GradientButton onPress={navigateTo('ChmLnsRec', {})} text={t.viewMemberDebtsStatus} />
            </View>

            {/* ------------------- Registration ------------------- */}
            <View style={styles.clientsView}>
              <Text style={styles.salesText}>{t.registration}</Text>
              <GradientButton onPress={navigateTo('AddChmMembrsss', {})} text={t.registerMember} />
              <GradientButton onPress={navigateTo('SgnIn2RemoveMmbrs', {
              id
            })} text={t.deregisterMember} />
            </View>

            {/* ------------------- Group Remittance ------------------- */}
            <View style={styles.clientsView}>
              <Text style={styles.salesText}>{t.groupRemittance}</Text>
              <GradientButton onPress={navigateTo('ViewGrp2ConfirmDividends', {})} text={t.viewGroupRemittances} />
              <GradientButton onPress={navigateTo('ChamaMmbrRemts', {})} text={t.viewMyRemittances} />
            </View>

            {/* ------------------- Membership ------------------- */}
            <View style={styles.clientsView}>
              <Text style={styles.salesText}>{t.membership}</Text>
              <GradientButton onPress={navigateTo('ViewGrp2ShareDividends', {})} text={t.viewMembers} />
              <GradientButton onPress={navigateTo('ChmMmbrMmbrss', {})} text={t.viewMyGroups} />
            </View>

            {/* ------------------- Group Account ------------------- */}
            <View style={styles.clientsView2}>
              <Text style={styles.salesText}>{t.groupAccount}</Text>
              <GradientButton onPress={navigateTo('ViewGrpApplications', {})} text={t.create} />
              <GradientButton onPress={navigateTo('DissolveChms', {})} text={t.dissolve} />
              <GradientButton onPress={navigateTo('UpdateChmAc', {})} text={t.update} />
              <GradientButton onPress={navigateTo('ChamSignIn3s', {})} text={t.viewGroupAccount} />
            </View>

            {/* ------------------- Signatory Works ------------------- */}
            <View style={styles.clientsView2}>
              <Text style={styles.salesText}>{t.signatoryWorks}</Text>
              <GradientButton onPress={navigateTo('Sgn2CnfrmWthdrwlsss', {})} text={t.signatory2ConfirmWithdrawals} />
              <GradientButton onPress={navigateTo('SignitoryWthdrwFndss3', {})} text={t.signatory3ConfirmWithdrawals} />
              <GradientButton onPress={navigateTo('SignitoryWthdrwFndsss', {})} text={t.signatory3ConfirmWithdrawals} />
              <GradientButton onPress={navigateTo('SgnIn2VwChmDpstss', {})} text={t.viewGroupDeposits} />
              <GradientButton onPress={navigateTo('SgnIn2VwChmWthdrwlss', {})} text={t.viewGroupWithdrawals} />
            </View>

            <View style={styles.clientsView2}>
              <Text style={styles.salesText}>{t.linkNsndogo}</Text>
              <GradientButton onPress={openLinkFlow} text={t.linkNsndogo} />
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
      <Modal visible={linkModalVisible} animationType="slide" transparent onRequestClose={closeLinkModal}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>{t.linkNsndogo}</Text>
              <Pressable onPress={closeLinkModal}>
                <Text style={modalStyles.closeText}>{t.close}</Text>
              </Pressable>
            </View>
            {isLinking ? <ActivityIndicator size="large" color="#FF8C00" /> : null}
            {linkStep === 'groups' ? <ScrollView style={modalStyles.body}>
              {groups.length === 0 ? <Text style={modalStyles.emptyText}>{t.noGroupsFound}</Text> : groups.map((group) => <Pressable key={group.grpContact} onPress={() => selectGroup(group)} style={modalStyles.optionButton}><Text style={modalStyles.optionText}>{group.grpName || group.grpContact}</Text></Pressable>)}
            </ScrollView> : null}
            {linkStep === 'sagents' ? <ScrollView style={modalStyles.body}>
              {sAgents.length === 0 ? <Text style={modalStyles.emptyText}>{t.noSAgentsFound}</Text> : sAgents.map((sAgent) => <Pressable key={sAgent.saPhoneContact} onPress={() => selectSAgent(sAgent)} style={modalStyles.optionButton}><Text style={modalStyles.optionText}>{sAgent.name || sAgent.saPhoneContact}</Text></Pressable>)}
            </ScrollView> : null}
            {linkStep === 'agents' ? <ScrollView style={modalStyles.body}>
              {agents.length === 0 ? <Text style={modalStyles.emptyText}>{t.noAgentsFound}</Text> : agents.map((agent) => <View key={agent.phonecontact} style={modalStyles.agentOption}>
                <Text style={modalStyles.optionText}>{agent.name || agent.phonecontact}</Text>
                <View style={modalStyles.agentActions}>
                  <Pressable onPress={() => selectAgent(agent)} style={modalStyles.linkButton}>
                    <Text style={modalStyles.actionButtonText}>{t.linkGroup || 'Link Group'}</Text>
                  </Pressable>
                  <Pressable onPress={() => delinkAgent(agent)} style={modalStyles.delinkButton} disabled={isLinking}>
                    <Text style={modalStyles.actionButtonText}>{t.delinkGroup || 'Delink Group'}</Text>
                  </Pressable>
                </View>
              </View>)}
            </ScrollView> : null}
            {linkStep === 'form' ? <ScrollView style={modalStyles.body}>
              <Text style={modalStyles.label}>{t.selectAgentLabel}</Text>
              <Text style={modalStyles.valueText}>{selectedAgent?.name || selectedAgent?.phonecontact}</Text>
              <Text style={modalStyles.label}>{t.groupBalanceLabel}</Text>
              <Text style={modalStyles.valueText}>{selectedGroup ? `${currencySymbol || ''}${formattedGroupBalance}` : `${currencySymbol || ''}0`}</Text>
              <Text style={modalStyles.label}>{t.groupNsndogoCommitmentLabel}</Text>
              <Text style={modalStyles.valueText}>{selectedGroup ? `${currencySymbol || ''}${formattedGroupFloatLoan}` : `${currencySymbol || ''}0`}</Text>
              <Text style={modalStyles.label}>{t.nsndogoBalanceLabel}</Text>
              <Text style={modalStyles.valueText}>{selectedAgent ? `${currencySymbol || ''}${formattedAgentFloatBalance}` : `${currencySymbol || ''}0`}</Text>
              <Text style={modalStyles.label}>{t.nsndogoGroupCommitmentLabel}</Text>
              <Text style={modalStyles.valueText}>{selectedAgent ? `${currencySymbol || ''}${formattedAgentFloatCommitment}` : `${currencySymbol || ''}0`}</Text>
              <Text style={modalStyles.label}>{t.groupFloatStatusLabel}</Text>
              <TextInput value={groupFloatStatusInput} onChangeText={setGroupFloatStatusInput} style={modalStyles.input} placeholder={t.groupFloatStatusLabel} />
              <Text style={modalStyles.label}>{t.groupFloatAmountLabel}</Text>
              <TextInput value={groupFloatAmountInput} onChangeText={setGroupFloatAmountInput} keyboardType="decimal-pad" style={modalStyles.input} placeholder={currencySymbol ? `${currencySymbol} 0.00` : t.groupFloatAmountLabel} />
              <Pressable onPress={saveLink} style={modalStyles.primaryButton}><Text style={modalStyles.primaryButtonText}>{t.saveLink}</Text></Pressable>
            </ScrollView> : null}
          </View>
        </View>
      </Modal>
    </>;
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937'
  },
  closeText: {
    color: '#2563eb',
    fontWeight: '600'
  },
  body: {
    maxHeight: 420
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  agentOption: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  agentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  linkButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center'
  },
  delinkButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  optionText: {
    color: '#111827',
    fontSize: 15
  },
  emptyText: {
    color: '#6b7280',
    fontStyle: 'italic'
  },
  label: {
    color: '#374151',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4
  },
  valueText: {
    color: '#111827',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  }
});
export default MyLoanAccount;