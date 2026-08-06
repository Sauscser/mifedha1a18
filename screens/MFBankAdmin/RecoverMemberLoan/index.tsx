import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { listGroups, listCvrdGroupLoans, getCompany, getChamaMembers, getGroup, getSMAccount, listAgents, getSAgent, listSAgents } from '../../../src/graphql/queries';
import { updateGroup, updateCvrdGroupLoans, updateChamaMembers, updateCompany, updateSMAccount, updateAgent, updateSAgent } from '../../../src/graphql/mutations';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { Modal, Pressable } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fafafa' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  toggleText: { color: '#333' },
  groupItem: { padding: 12, marginBottom: 10, backgroundColor: '#fff', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  balanceText: { color: '#333', marginBottom: 6 },
  loanRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 8 },
  loanTitle: { fontWeight: '600' },
  small: { color: '#666', fontSize: 13, marginTop: 4 },
  recoverBtn: { marginTop: 8, backgroundColor: '#FF8C00', padding: 10, borderRadius: 6, alignSelf: 'flex-start' },
  recoverBtnDisabled: { opacity: 0.7 },
  recoverText: { color: '#fff', textAlign: 'center' },
});

const RecoverMemberLoan = () => {
  const client = generateClient();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const { nationality, ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(nationality || undefined);

  const formatCurrency = (value: any) => {
    const n = Number(value || 0);
    return formatAmountSync(n, userCurrencyKey, ratesMap);
  };

  const tr = (template: string, vars: Record<string, string>) => {
    return Object.keys(vars).reduce((acc, key) => acc.split(`{${key}}`).join(vars[key]), template);
  };

  const tk = (key: string) => (t as any)[key] || (translations.en as any)[key] || key;

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [loansMap, setLoansMap] = useState<Record<string, any[]>>({});
  const [showDueOnly, setShowDueOnly] = useState<boolean>(true);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [agentCandidates, setAgentCandidates] = useState<any[]>([]);
  const [sAgentModalVisible, setSAgentModalVisible] = useState(false);
  const [sAgentCandidates, setSAgentCandidates] = useState<any[]>([]);
  const [recoveringLoanId, setRecoveringLoanId] = useState<string | null>(null);
  const agentSelectionResolverRef = useRef<((agent: any | null) => void) | null>(null);
  const sAgentSelectionResolverRef = useRef<((sAgent: any | null) => void) | null>(null);

  const promptConfirm = (title: string, message: string, confirmText = tk('yesLabel')) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(title, message, [
        { text: tk('cancelLabel'), style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, onPress: () => resolve(true) }
      ]);
    });
  };

  const openAgentSelection = (agents: any[]) => {
    return new Promise<any | null>((resolve) => {
      agentSelectionResolverRef.current = resolve;
      setAgentCandidates(agents);
      setAgentModalVisible(true);
    });
  };

  const resolveAgentSelection = (agent: any | null) => {
    if (agentSelectionResolverRef.current) {
      agentSelectionResolverRef.current(agent);
      agentSelectionResolverRef.current = null;
    }
    setAgentModalVisible(false);
    setAgentCandidates([]);
  };

  const openSAgentSelection = (sAgents: any[]) => {
    return new Promise<any | null>((resolve) => {
      sAgentSelectionResolverRef.current = resolve;
      setSAgentCandidates(sAgents);
      setSAgentModalVisible(true);
    });
  };

  const resolveSAgentSelection = (sAgent: any | null) => {
    if (sAgentSelectionResolverRef.current) {
      sAgentSelectionResolverRef.current(sAgent);
      sAgentSelectionResolverRef.current = null;
    }
    setSAgentModalVisible(false);
    setSAgentCandidates([]);
  };

  const stopRecovery = () => setRecoveringLoanId(null);

  const calculateLoanBalance = (loan: any) => {
    const amountExpectedBackWthClrnc = loan.amountExpectedBackWthClrnc !== undefined && loan.amountExpectedBackWthClrnc !== null
      ? Number(loan.amountExpectedBackWthClrnc)
      : NaN;
    if (!Number.isNaN(amountExpectedBackWthClrnc)) {
      return Math.max(0, amountExpectedBackWthClrnc);
    }
    const amountExpectedBack = Number(loan.amountExpectedBack || 0);
    const amountRepaid = Number(loan.amountRepaid || loan.amountRepaidClr || 0);
    const clearanceAmt = Number(loan.clearanceAmt || 0);
    const DefaultPenaltyChm2 = Number(loan.DefaultPenaltyChm2 || 0);
    const interest = Number(loan.interest || 0);
    const crtnDate = loan.crtnDate ? parseDate(loan.crtnDate) : null;
    const ClranceAmt = clearanceAmt + DefaultPenaltyChm2;
    const netLnBal = amountExpectedBack - amountRepaid;
    const daysElapsed = crtnDate ? Math.max(0, (Date.now() - crtnDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const balance = netLnBal * Math.pow(1 + interest / 36500, daysElapsed) + ClranceAmt;
    return Math.max(0, Number(balance || 0));
  };

  const loadGroupLoans = async (group: any) => {
    const loansRes: any = await client.graphql({ query: listCvrdGroupLoans, variables: { filter: { grpContact: { eq: group.grpContact } } } });
    const loans = loansRes?.data?.listCvrdGroupLoans?.items || [];
    return await Promise.all(loans.map(async (loan: any) => {
      const memberRes: any = await client.graphql({ query: getChamaMembers, variables: { ChamaNMember: loan.memberId } });
      const chamaMember = memberRes?.data?.getChamaMembers;
      const loanBalance = calculateLoanBalance(loan);
      return {
        ...loan,
        loanBalance,
        installmentDue: loanBalance > 0 ? Number(loan.installmentAmount || 0) : 0,
        memberGroupRedeemedLoan: chamaMember?.groupRedeemedLoan || 0,
        groupRedeemedLoan: group.groupRedeemedLoan || 0,
        groupBalance: group.grpBal || 0
      };
    }));
  };

  const reloadGroupLoans = async (group: any) => {
    const enrichedLoans = await loadGroupLoans(group);
    setLoansMap(prev => ({ ...prev, [group.grpContact]: enrichedLoans }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        const attrs = await fetchUserAttributes();
        const email = attrs?.email;
        if (!email) throw new Error('no email');

        const grpRes: any = await client.graphql({ query: listGroups, variables: { filter: { BankAdminEmail: { eq: email } } } });
        const adminGroups = grpRes?.data?.listGroups?.items || [];
        setGroups(adminGroups);

        const lmMap: Record<string, any[]> = {};
        await Promise.all(adminGroups.map(async (g: any) => {
          lmMap[g.grpContact] = await loadGroupLoans(g);
        }));
        setLoansMap(lmMap);
      } catch (err) {
        console.error(err);
        Alert.alert(tk('errorTitle'), tk('errorLoadGroupsAndLoans'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const parseDate = (v: any) => {
    if (!v) return null;
    try {
      if (typeof v === 'object' && v !== null) {
        if ('seconds' in v) {
          const secs = Number(v.seconds || 0);
          const nanos = Number((v as any).nanoseconds || 0);
          return new Date(secs * 1000 + Math.floor(nanos / 1e6));
        }
        if ('toDate' in v && typeof (v as any).toDate === 'function') {
          return (v as any).toDate();
        }
      }
      if (typeof v === 'number') {
        if (v < 1e11) return new Date(v * 1000);
        return new Date(v);
      }
      return new Date(String(v));
    } catch (e) {
      return null;
    }
  };

  const getLoanDueInfo = (loan: any) => {
    const crtn = loan.crtnDate ? parseDate(loan.crtnDate) : (loan.createdAt ? parseDate(loan.createdAt) : null);
    const freq = Number(loan.paymentFrequency || loan.repaymentFrequency || loan.repaymentPeriod || 0);
    const repaymentPeriod = Number(loan.repaymentPeriod || 0);
    const installment = Number(loan.installmentAmount || 0);
    const outstanding = Number(calculateLoanBalance(loan) || loan.loanBalance || loan.amountExpectedBackWthClrnc || loan.amountExpectedBack || loan.lonBala || 0);
    const amountRepaid = Number(loan.amountRepaid || loan.amountRepaidClr || 0);

    if (!crtn || !freq || outstanding <= 0) {
      return {
        nextDue: null,
        paidInstallments: 0,
        expectedInstallments: 0,
        missedInstallments: 0,
        isDue: false
      };
    }

    const now = new Date();
    const days = Math.floor((now.getTime() - crtn.getTime()) / (24 * 3600 * 1000));
    const expectedInstallments = Math.floor(days / freq);
    const paidInstallments = installment > 0 ? Math.floor(amountRepaid / installment) : 0;

    // missedInstallments represents how many installment cycles the borrower has missed
    let missedInstallments = Math.max(0, expectedInstallments - paidInstallments);

    // If repaymentPeriod elapsed, treat as having missed multiple installments (force full recovery behavior)
    const isPastRepaymentPeriod = repaymentPeriod > 0 && days > repaymentPeriod;
    if (isPastRepaymentPeriod && outstanding > 0) {
      missedInstallments = Math.max(missedInstallments, 2);
    }

    // Next due should be the earliest unpaid installment date: date of (paidInstallments + 1)th installment
    const nextDue = new Date(crtn.getTime() + (paidInstallments + 1) * freq * 24 * 3600 * 1000);

    return {
      nextDue: outstanding > 0 ? nextDue : null,
      paidInstallments,
      expectedInstallments,
      missedInstallments,
      isDue: (missedInstallments > 0) || (nextDue.getTime() <= now.getTime()) || isPastRepaymentPeriod
    };
  };

  const computeNextDue = (loan: any) => getLoanDueInfo(loan).nextDue;
  const computeIsDue = (loan: any) => getLoanDueInfo(loan).isDue;

  const getRecoveryAmounts = (loan: any, clearanceFee: number) => {
    const dueInfo = getLoanDueInfo(loan);
    const currentBalance = Number(calculateLoanBalance(loan) || loan.loanBalance || loan.amountExpectedBackWthClrnc || loan.lonBala || 0);
    const repaymentPeriod = Number(loan.repaymentPeriod || 0);
    const loaneeName = loan.loaneeName || 'Unknown';
        const loaneeId = loan.memberId || 'Unknown';

    const crtn = loan.crtnDate ? parseDate(loan.crtnDate) : null;
    const daysSinceLoan = crtn ? Math.floor((Date.now() - crtn.getTime()) / (24 * 3600 * 1000)) : 0;
    const shouldRecoverFullBalance = repaymentPeriod > 0 && daysSinceLoan > repaymentPeriod;
    const amountToRecover = shouldRecoverFullBalance
      ? Math.max(0, currentBalance)
      : dueInfo.missedInstallments > 1
        ? Math.max(0, currentBalance)
        : Number(loan.installmentAmount || 0);
    const feeAmount = Number((amountToRecover * clearanceFee).toFixed(2));
    return {
      amountToRecover,
      feeAmount,
      recoverAmount: amountToRecover + feeAmount
    };
  };

  const recoverPayment = async (group: any, loan: any) => {
    try {
      const installment = Number(loan.installmentAmount || 0);
      if (installment <= 0) {
        Alert.alert(tk('invalidTitle'), tk('invalidInstallmentZero'));
        stopRecovery();
        return;
      }

      const companyRes: any = await client.graphql({ query: getCompany, variables: { AdminId: "BaruchHabaB'ShemAdonai2" } });
      const company = companyRes?.data?.getCompany;
      const clearanceFee = Number(company?.userClearanceFee || 0);
      const { amountToRecover, recoverAmount } = getRecoveryAmounts(loan, clearanceFee);
      if (amountToRecover <= 0) {
        Alert.alert(tk('invalidTitle'), tk('invalidNoRecoverableAmount'));
        stopRecovery();
        return;
      }

      const feeRate = clearanceFee > 0 ? clearanceFee : 0;
      const principalFromGross = (gross: number) => {
        if (feeRate <= 0) return Number(gross.toFixed(2));
        return Number((gross / (1 + feeRate)).toFixed(2));
      };

      let remainingGross = Number(recoverAmount.toFixed(2));
      let smCollected = 0;
      let agentCollected = 0;
      let sAgentCollected = 0;
      let groupCollected = 0;
      let selectedAgent: any | null = null;

      // Step 1: try loanee e-wallet (SMAccount) using loan.loaneePhn as awsemail.
      try {
        const smRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: loan.loaneePhn } });
        const sm = smRes?.data?.getSMAccount;
        const smBal = Number(sm?.balance || 0);
        if (sm && smBal > 0 && remainingGross > 0) {
          const smDeduct = Number(Math.min(smBal, remainingGross).toFixed(2));
          const useSm = await promptConfirm(
            t.confirmTitle,
            tr(tk('recoverFromEwalletMessage'), {
              deduct: formatCurrency(smDeduct),
              balance: formatCurrency(smBal)
            }),
            tk('recoverLabel')
          );
          if (useSm) {
            const newSmBal = Number((smBal - smDeduct).toFixed(2));
            await client.graphql({ query: updateSMAccount, variables: { input: { awsemail: sm.awsemail, balance: String(newSmBal) } } });
            smCollected = smDeduct;
            remainingGross = Number((remainingGross - smDeduct).toFixed(2));
          }
        }
      } catch (e) {
        console.warn('SMAccount lookup failed', e);
      }

      // Step 2: ask to recover from Agent and allow selecting one agent by phonecontact.
      if (remainingGross > 0) {
        const askAgent = await promptConfirm(
          tk('attemptAgentRecoveryTitle'),
          tr(tk('attemptAgentRecoveryMessage'), {
            remaining: formatCurrency(remainingGross)
          })
        );
        if (askAgent) {
          try {
            const agentsRes: any = await client.graphql({ query: listAgents, variables: { filter: { email: { eq: loan.loaneePhn } } } });
            const agents = (agentsRes?.data?.listAgents?.items || []).filter((a: any) => !!a?.phonecontact);

            if (agents.length > 0) {
              selectedAgent = await openAgentSelection(agents);
              if (selectedAgent) {
                const ttlBal = Number(selectedAgent.ttlEarnings || 0);
                const floatBal = Number(selectedAgent.floatBal || 0);
                const available = Number((ttlBal + floatBal).toFixed(2));
                if (available > 0 && remainingGross > 0) {
                  const deductAgent = Number(Math.min(available, remainingGross).toFixed(2));
                  const useAgent = await promptConfirm(
                    t.confirmTitle,
                    tr(tk('recoverFromAgentMessage'), {
                      agent: selectedAgent.name || selectedAgent.phonecontact,
                      phone: selectedAgent.phonecontact,
                      available: formatCurrency(available),
                      deduct: formatCurrency(deductAgent)
                    }),
                    tk('recoverLabel')
                  );
                  if (useAgent) {
                    let rem = deductAgent;
                    const deductTtl = Number(Math.min(ttlBal, rem).toFixed(2));
                    rem = Number((rem - deductTtl).toFixed(2));
                    const deductFloat = Number(Math.min(floatBal, rem).toFixed(2));

                    const agentInput: any = {
                      phonecontact: selectedAgent.phonecontact,
                      ttlEarnings: String(Number((ttlBal - deductTtl).toFixed(2))),
                      floatBal: String(Number((floatBal - deductFloat).toFixed(2)))
                    };
                    await client.graphql({ query: updateAgent, variables: { input: agentInput } });

                    agentCollected = deductAgent;
                    remainingGross = Number((remainingGross - deductAgent).toFixed(2));
                  }
                }
              }
            }
          } catch (err) {
            console.error(err);
            Alert.alert(tk('errorTitle'), tk('errorQueryAgents'));
          }
        }
      }

      // Step 3: if still remaining, ask admin to try associated NSKubwa (SAgent) accounts.
      if (remainingGross > 0) {
        try {
          const askSAgent = await promptConfirm(
            tk('useNskubwaTitle'),
            tr(tk('attemptNskubwaRecoveryMessage'), { remaining: formatCurrency(remainingGross) }),
            tk('useNskubwaLabel')
          );

          if (askSAgent) {
            const sAgentMap: Record<string, any> = {};

            const sAgentsByEmailRes: any = await client.graphql({ query: listSAgents, variables: { filter: { email: { eq: loan.loaneePhn } } } });
            const sAgentsByEmail = sAgentsByEmailRes?.data?.listSAgents?.items || [];
            sAgentsByEmail.forEach((sa: any) => {
              if (sa?.saPhoneContact) sAgentMap[sa.saPhoneContact] = sa;
            });

            if (selectedAgent?.sagentregno) {
              const linkedRes: any = await client.graphql({ query: getSAgent, variables: { saPhoneContact: selectedAgent.sagentregno } });
              const linked = linkedRes?.data?.getSAgent;
              if (linked?.saPhoneContact) sAgentMap[linked.saPhoneContact] = linked;
            }

            const sAgentList = Object.values(sAgentMap);
            if (sAgentList.length > 0) {
              const selectedSAgent = await openSAgentSelection(sAgentList);
              if (selectedSAgent) {
                const latestRes: any = await client.graphql({ query: getSAgent, variables: { saPhoneContact: selectedSAgent.saPhoneContact } });
                const latestSAgent = latestRes?.data?.getSAgent;
                const saBal = Number(latestSAgent?.saBalance || 0);
                if (latestSAgent && saBal > 0) {
                  const deductSAgent = Number(Math.min(saBal, remainingGross).toFixed(2));
                  const sAgentName = latestSAgent?.name || latestSAgent?.saPhoneContact;
                  const useSAgent = await promptConfirm(
                    tk('useNskubwaTitle'),
                    tr(tk('useNskubwaMessage'), {
                      name: String(sAgentName),
                      balance: formatCurrency(saBal),
                      deduct: formatCurrency(deductSAgent)
                    }),
                    tk('useNskubwaLabel')
                  );
                  if (useSAgent) {
                    const newSaBalance = Number((saBal - deductSAgent).toFixed(2));
                    await client.graphql({ query: updateSAgent, variables: { input: { saPhoneContact: latestSAgent.saPhoneContact, saBalance: String(newSaBalance) } } });
                    sAgentCollected = deductSAgent;
                    remainingGross = Number((remainingGross - deductSAgent).toFixed(2));
                  }
                } else {
                  Alert.alert(tk('insufficientTitle'), tk('insufficientSelectedNskubwa'));
                }
              }
            }
          }
        } catch (err) {
          console.error(err);
          Alert.alert(tk('errorTitle'), tk('errorQueryNskubwa'));
        }
      }

      // Step 4 (last resort): recover remaining from group account.
      if (remainingGross > 0) {
        const grpBal = Number(group.grpBal || 0);
        if (grpBal > 0) {
          const deductGroup = Number(Math.min(grpBal, remainingGross).toFixed(2));
          const useGroup = await promptConfirm(
            t.confirmTitle,
            tr(tk('recoverFromGroupRemainingMessage'), {
              remaining: formatCurrency(remainingGross),
              deduct: formatCurrency(deductGroup),
              group: group.grpName || group.grpContact
            }),
            tk('recoverLabel')
          );
          if (useGroup) {
            const groupPrincipalPart = principalFromGross(deductGroup);
            const newGrpBal = Number((grpBal - deductGroup).toFixed(2));
            await client.graphql({ query: updateGroup, variables: { input: { grpContact: group.grpContact, grpBal: String(newGrpBal), groupRedeemedLoan: String(Number(group.groupRedeemedLoan || 0) + groupPrincipalPart) } } });
            groupCollected = deductGroup;
            remainingGross = Number((remainingGross - deductGroup).toFixed(2));
            setGroups(prev => prev.map(g => g.grpContact === group.grpContact ? { ...g, grpBal: String(newGrpBal), groupRedeemedLoan: String(Number(g.groupRedeemedLoan || 0) + groupPrincipalPart) } : g));
          }
        }
      }

      const totalCollected = Number((smCollected + agentCollected + sAgentCollected + groupCollected).toFixed(2));
      if (totalCollected <= 0) {
        stopRecovery();
        Alert.alert(tk('insufficientTitle'), tk('insufficientNoRecoverySources'));
        return;
      }

      const oldBalance = Number(calculateLoanBalance(loan) || loan.amountExpectedBackWthClrnc || loan.lonBala || 0);
      const principalRecoveredRaw = principalFromGross(totalCollected);
      const principalRecovered = Number(Math.min(oldBalance, principalRecoveredRaw).toFixed(2));
      const feeRecovered = Number(Math.max(0, totalCollected - principalRecovered).toFixed(2));

      const newAmountRepaid = Number(loan.amountRepaid || 0) + principalRecovered;
      const newAmountExpected = Math.max(0, Number((oldBalance - principalRecovered).toFixed(2)));
      const isCleared = newAmountExpected === 0;
      await client.graphql({ query: updateCvrdGroupLoans, variables: { input: { loanID: loan.loanID, amountRepaid: newAmountRepaid, lonBala: isCleared ? 0 : newAmountExpected, amountExpectedBackWthClrnc: isCleared ? 0 : newAmountExpected, DefaultPenaltyChm2: 0, clearanceAmt: 0, status: isCleared ? 'LoanCleared' : 'Active', groupRedeemedLoan: String(Number(loan.groupRedeemedLoan || 0) + principalRecovered) } } });

      const chamaMemberRes: any = await client.graphql({ query: getChamaMembers, variables: { ChamaNMember: loan.memberId } });
      const chamaMember = chamaMemberRes?.data?.getChamaMembers;
      if (chamaMember) {
        await client.graphql({ query: updateChamaMembers, variables: { input: { ChamaNMember: chamaMember.ChamaNMember, groupRedeemedLoan: String(Number(chamaMember.groupRedeemedLoan || 0) + principalRecovered) } } });
      }

      if (feeRecovered > 0) {
        await client.graphql({ query: updateCompany, variables: { input: { AdminId: "BaruchHabaB'ShemAdonai2", companyEarning: String(Number(company?.companyEarning || 0) + feeRecovered) } } });
      }

      const unrecovered = Math.max(0, Number((recoverAmount - totalCollected).toFixed(2)));
      const breakdownLines = [
        tr(tk('breakdownSMAccount'), { amount: formatCurrency(smCollected) }),
        tr(tk('breakdownAgent'), { amount: formatCurrency(agentCollected) }),
        tr(tk('breakdownNskubwa'), { amount: formatCurrency(sAgentCollected) }),
        tr(tk('breakdownGroup'), { amount: formatCurrency(groupCollected) }),
        tr(tk('breakdownPrincipalRecovered'), { amount: formatCurrency(principalRecovered) }),
        tr(tk('breakdownFeeRecovered'), { amount: formatCurrency(feeRecovered) }),
      ];
      Alert.alert(
        t.successTitle,
        `${t.successMessage.replace('{amount}', formatCurrency(totalCollected))}\n\n${breakdownLines.join('\n')}${unrecovered > 0 ? `\n${tr(tk('remainingNotRecovered'), { amount: formatCurrency(unrecovered) })}` : ''}`
      );
      stopRecovery();
      await reloadGroupLoans(group);
    } catch (err) {
      console.error(err);      stopRecovery();      Alert.alert(tk('errorTitle'), tk('errorRecoverPayment'));
    }
  };

  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t.screenTitle}</Text>
        <TouchableOpacity onPress={() => setShowDueOnly(s => !s)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>{showDueOnly ? t.showDueOnly : t.showAll}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={groups}
        keyExtractor={g => g.grpContact}
        renderItem={({ item: g }) => (
          <View style={styles.groupItem}>
            <Text style={styles.title}>{g.grpName || g.grpContact}</Text>
            <Text style={styles.balanceText}>{t.balanceLabel}: {formatCurrency(g.grpBal)}</Text>
            {(loansMap[g.grpContact] || [])
              .filter((ln: any) => {
                if (!showDueOnly) return true;
                const loanBalance = Number(ln.loanBalance || 0);
                return loanBalance > 0 && computeIsDue(ln);
              })
              .map((ln: any) => (
                <View key={ln.loanID} style={styles.loanRow}>
                  <Text style={styles.loanTitle}>{t.loanLabel}: {ln.loanID}</Text>
                <Text style={styles.small}>{t.membername}: {ln.loaneeName}</Text>
                <Text style={styles.small}>{t.memberIdentity}: {ln.memberId}</Text>

                  <Text style={styles.small}>{t.crtnDateLabel}: {ln.crtnDate ? new Intl.DateTimeFormat(i18n.language || 'en-US').format(parseDate(ln.crtnDate)) : t.na}</Text>
                  <Text style={styles.small}>{t.repaymentFrequencyLabel}: {ln.paymentFrequency ? `${ln.paymentFrequency} ${t.daysLabel || 'days'}` : t.na}</Text>
                  {ln.loanBalance > 0 && computeNextDue(ln) ? (
                    <Text style={styles.small}>{t.nextDueLabel}: {new Intl.DateTimeFormat(i18n.language || 'en-US').format(computeNextDue(ln))}</Text>
                  ) : null}
                  <Text style={styles.small}>{t.missedInstallmentsLabel}: {getLoanDueInfo(ln).missedInstallments}</Text>
                  <Text style={styles.small}>{t.loanBalanceLabel}: {formatCurrency(ln.loanBalance)}</Text>
                  <Text style={styles.small}>{t.installmentLabel}: {formatCurrency(ln.installmentDue)}</Text>
                  <Text style={styles.small}>{t.groupRedeemedLoanLabel}: {formatCurrency(ln.groupRedeemedLoan)}</Text>
                  <Text style={styles.small}>{t.memberGroupRedeemedLoanLabel}: {formatCurrency(ln.memberGroupRedeemedLoan)}</Text>
                  <Text style={styles.small}>{t.groupGroupRedeemedLoanLabel}: {formatCurrency(g.groupRedeemedLoan)}</Text>
                  <Text style={styles.small}>{t.groupBalanceLabel}: {formatCurrency(g.grpBal)}</Text>
                  <TouchableOpacity
                    style={[styles.recoverBtn, recoveringLoanId === ln.loanID && styles.recoverBtnDisabled]}
                    onPress={() => { setRecoveringLoanId(ln.loanID); recoverPayment(g, ln); }}
                    disabled={recoveringLoanId === ln.loanID}
                  >
                    {recoveringLoanId === ln.loanID ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.recoverText}>{t.recoverBtn}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        )}
      />
      <Modal
        visible={agentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => resolveAgentSelection(null)}
      >
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',padding:16}}>
          <View style={{backgroundColor:'#fff',borderRadius:8,maxHeight:'80%',padding:12}}>
            <Text style={{fontWeight:'700',marginBottom:8}}>{tk('selectAgentTitle')}</Text>
            <FlatList
              data={agentCandidates}
              keyExtractor={(a:any) => a.phonecontact || a.email || String(a.sagentregno)}
              renderItem={({item: a}) => (
                <View style={{padding:8,borderBottomWidth:1,borderBottomColor:'#eee'}}>
                  <Text style={{fontWeight:'600'}}>{a.name || a.phonecontact}</Text>
                  <Text style={{color:'#666'}}>{tk('agentPhonecontactLabel')}: {a.phonecontact || t.na}</Text>
                  <Text style={{color:'#666'}}>{tk('agentSagentRegNoLabel')}: {a.sagentregno || t.na}</Text>
                  <View style={{flexDirection:'row',marginTop:8}}>
                    <Pressable onPress={() => resolveAgentSelection(a)} style={{backgroundColor:'#007bff',padding:8,borderRadius:6}}>
                      <Text style={{color:'#fff'}}>{tk('selectAgentButton')}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity onPress={() => resolveAgentSelection(null)} style={{marginTop:12,alignSelf:'flex-end'}}>
              <Text style={{color:'#007bff'}}>{tk('closeLabel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={sAgentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => resolveSAgentSelection(null)}
      >
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',padding:16}}>
          <View style={{backgroundColor:'#fff',borderRadius:8,maxHeight:'80%',padding:12}}>
            <Text style={{fontWeight:'700',marginBottom:8}}>{tk('selectNskubwaTitle')}</Text>
            <FlatList
              data={sAgentCandidates}
              keyExtractor={(a:any) => a.saPhoneContact || String(a.email || Math.random())}
              renderItem={({item: a}) => (
                <View style={{padding:8,borderBottomWidth:1,borderBottomColor:'#eee'}}>
                  <Text style={{fontWeight:'600'}}>{a.name || a.saPhoneContact}</Text>
                  <Text style={{color:'#666'}}>{tk('sAgentPhonecontactLabel')}: {a.saPhoneContact || t.na}</Text>
                  <View style={{flexDirection:'row',marginTop:8}}>
                    <Pressable onPress={() => resolveSAgentSelection(a)} style={{backgroundColor:'#007bff',padding:8,borderRadius:6}}>
                      <Text style={{color:'#fff'}}>{tk('selectNskubwaButton')}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity onPress={() => resolveSAgentSelection(null)} style={{marginTop:12,alignSelf:'flex-end'}}>
              <Text style={{color:'#007bff'}}>{tk('closeLabel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RecoverMemberLoan;
