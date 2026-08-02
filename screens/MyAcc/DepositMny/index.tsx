// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync, getExRatesForNationality, parseBackendNumericValue } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { createFloatReduction, createMessages, sendNotification, updateAgent, updateCompany, updateGroup, updateSMAccount } from '../../../src/graphql/mutations';
import { getAgent, getCompany, getGroup, getSAgent, getSMAccount } from '../../../src/graphql/queries';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import translations from './translation';
import CustomAlert from '../../../components/CustomAlert/CustomAlert';
const client = generateClient();
const SMADepositForm = props => {
  const [nationalId, setNationalid] = useState("");
  const [agPWd, setAgPWd] = useState("");
  const [AgentPhn, setAgentPhn] = useState("");
  const [amount, setAmount] = useState("");
  const [UsrId, setUsrId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ownr, setownr] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [fundingPromptVisible, setFundingPromptVisible] = useState(false);
  const [fundingPromptMessage, setFundingPromptMessage] = useState('');
  const [fundingPromptResolve, setFundingPromptResolve] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const { nationality, ratesMap } = useExchange();
  const safeNationality = typeof nationality === 'string'
    ? nationality
    : (nationality && typeof nationality === 'object' && 'nationality' in nationality ? (nationality as any).nationality : null);
  const userCurrencyKey = nationalityToCode(safeNationality || '') || safeNationality || undefined;
  const currencySymbol = userCurrencyKey && ratesMap?.[userCurrencyKey]?.symbol ? String(ratesMap[userCurrencyKey].symbol) : '';
  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const askToUseLinkedGroup = (message: string) => new Promise((resolve) => {
    setFundingPromptMessage(message);
    setFundingPromptResolve(() => resolve);
    setFundingPromptVisible(true);
  });

  const resolveFundingPrompt = (proceed: boolean) => {
    fundingPromptResolve?.(proceed);
    setFundingPromptResolve(null);
    setFundingPromptVisible(false);
  };

  const updateProgress = (message: string) => {
    console.log('[deposit-flow]', message);
    setProgressMessage(message);
  };

  const fetchUser = async () => {
    const userInfo = await getCurrentUser();
    setownr(userInfo.userId);
  };
  useEffect(() => {
    fetchUser();
  }, []);
  const fetchAcDtls = async () => {
    console.log('[deposit-flow] submit started', { amount, nationalId, AgentPhn, agPWd });
    if (isLoading) {
      console.log('[deposit-flow] already loading, exiting');
      return;
    }
    setIsLoading(true);
    setProgressMessage('Starting deposit flow...');
    const amountForeign = parseFloat(amount);
    if (!Number.isFinite(amountForeign) || amountForeign <= 0) {
      console.log('[deposit-flow] invalid amount', { amountForeign });
      showAlert(t.validAmount);
      setIsLoading(false);
      setProgressMessage('Invalid amount entered.');
      return;
    }
    const currencyKey = userCurrencyKey;
    let accountDtlNationality = safeNationality || '';
    let depositCurrencyKey = nationalityToCode(accountDtlNationality) || currencyKey;
    let officerNationality = safeNationality || '';
    let officerCurrencyKey = currencyKey;
    let debugRates = null;
    let amountBackend = 0;
    try {
      const userInfo = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const signedInEmail = String(attributes?.email || attributes?.preferred_username || userInfo?.username || userInfo?.userId || '').trim();

      if (!signedInEmail) {
        console.log('[deposit-flow] missing signed-in email');
        showAlert(t.passwordVerificationError);
        setIsLoading(false);
        return;
      }

      console.log('[deposit-flow] fetching signed-in account', { signedInEmail });
      const signedInAccountRes: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: signedInEmail
        }
      });
      const signedInAccount = signedInAccountRes?.data?.getSMAccount;
      const signedInAccountPw = signedInAccount?.pw;
      if (!signedInAccountPw) {
        console.log('[deposit-flow] signed-in account password missing');
        showAlert(t.passwordVerificationError);
        setIsLoading(false);
        return;
      }
      officerNationality = signedInAccount.nationality || safeNationality || '';
      officerCurrencyKey = nationalityToCode(officerNationality) || officerNationality || currencyKey;
      depositCurrencyKey = officerCurrencyKey;
      console.log('[deposit-flow] officer account currency context', {
        signedInEmail,
        officerNationality,
        officerCurrencyKey,
        note: 'Officer account supplies password and display/input currency; depositor account supplies limits and balances.'
      });

      updateProgress('Loading depositor account details...');
      console.log('[deposit-flow] fetching depositor account', { nationalId });
      const accountDtl: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: nationalId
        }
      });
      const depositorAccount = accountDtl?.data?.getSMAccount;
      if (!depositorAccount) {
        showAlert('Depositor account details could not be loaded.');
        setIsLoading(false);
        setProgressMessage('Depositor account details could not be loaded.');
        return;
      }
      const usrBala = depositorAccount.balance;
      const usrTlDpst = depositorAccount.ttlDpstSM;
      const usrStts = depositorAccount.acStatus;
      const depositLimits = depositorAccount.depositLimit;
      const nonLoanLimit = depositorAccount.nonLonLimit;
      const effectiveLimit = parseBackendNumericValue(nonLoanLimit ?? depositLimits ?? 0);
      const names = depositorAccount.name;
      const nationalids = depositorAccount.nationalid;
      const MaxAcBals = depositorAccount.MaxAcBal;
      const phonecontact = depositorAccount.phonecontact;
      accountDtlNationality = depositorAccount.nationality || '';
      updateProgress(`Converting ${amountForeign} ${depositCurrencyKey || 'CHF'} to backend value...`);
      debugRates = await getExRatesForNationality(officerNationality || depositCurrencyKey || '');
      amountBackend = await convertForeignToKsh(amountForeign, depositCurrencyKey);
      console.log('[deposit-debug] conversion inputs', {
        amountForeign,
        currencyKey: depositCurrencyKey,
        officerNationality,
        depositorNationality: accountDtlNationality,
        debugRates,
        amountBackend
      });
      console.log('[deposit-debug] converted amount comparison input', {
        enteredAmount: amountForeign,
        convertedEnteredAmountCHF: amountBackend,
        conversionCurrency: depositCurrencyKey,
        conversionNationality: officerNationality
      });
      if (!Number.isFinite(amountBackend) || amountBackend <= 0) {
        console.log('[deposit-flow] conversion failed', { amountBackend, depositCurrencyKey });
        showAlert(t.conversionError);
        setIsLoading(false);
        setProgressMessage('Amount conversion failed.');
        return;
      }
      const WalCap = parseBackendNumericValue(usrBala) + amountBackend;
      console.log('[deposit-flow] wallet capacity check', {
        depositorBalance: parseBackendNumericValue(usrBala),
        amountBackend,
        walletCapacityAfterDeposit: WalCap,
        maxAccountBalance: parseBackendNumericValue(MaxAcBals),
        willExceedWalletCapacity: WalCap > parseBackendNumericValue(MaxAcBals)
      });
      const fetchAgtBal = async () => {
        setIsLoading(true);
        try {
          console.log('[deposit-flow] fetching agent', { phonecontact: AgentPhn });
          updateProgress('Looking up agent details...');
          const AgentBal: any = await client.graphql({
            query: getAgent,
            variables: {
              phonecontact: AgentPhn
            }
          });
          console.log('[deposit-flow] agent lookup result', AgentBal?.data?.getAgent);
          if (!AgentBal?.data?.getAgent) {
            showAlert('Agent details could not be loaded.');
            setIsLoading(false);
            setProgressMessage('Agent details could not be loaded.');
            return;
          }
          const agtTtlFtOut = AgentBal.data.getAgent.TtlFltOut;
          const agtFltBl = AgentBal.data.getAgent.floatBal;
          const agentNames = AgentBal.data.getAgent.name;
          const AgAcAct = AgentBal.data.getAgent.status;
          const gtCompDtls = async () => {
            setIsLoading(true);
            try {
              const compDtls: any = await client.graphql({
                query: getCompany,
                variables: {
                  AdminId: "BaruchHabaB'ShemAdonai2"
                }
              });
              const ttlUsrDpsts = compDtls.data.getCompany.ttlUsrDep;
              const agentFloatOuts = compDtls.data.getCompany.agentFloatOut;
              let groupFallbackUsed = 0;
              let linkedGroupContact: string | null = null;
              let linkedGroupBalanceBefore = 0;
              let linkedGroupFloatLoanBefore = 0;
              let fallbackAmount = 0;
              const CrtFltRed = async () => {
                try {
                  console.log('[deposit-flow] creating float reduction record', {
                    depositorEmail: nationalId,
                    agentPhone: AgentPhn,
                    amountCHF: amountBackend,
                    fundingSource: groupFallbackUsed > 0 ? 'LINKED_GROUP' : 'AGENT'
                  });
                  const floatReductionResult: any = await client.graphql({
                    query: createFloatReduction,
                    variables: {
                      input: {
                        depositerid: nationalId,
                        agContact: AgentPhn,
                        agentName: agentNames,
                        userName: names,
                        amount: amountBackend.toFixed(2),
                        status: 'AccountActive'
                      }
                    }
                  });
                  console.log('[deposit-flow] float reduction record created', {
                    record: floatReductionResult?.data?.createFloatReduction,
                    fundingSource: groupFallbackUsed > 0 ? 'LINKED_GROUP' : 'AGENT'
                  });
                } catch (error) {
                  if (error) {
                    showAlert(t.depositUnsuccessful);
                    return;
                  }
                }
                await onUpdtUsrBal();
              };
              const onUpdtUsrBal = async () => {
                setIsLoading(true);
                try {
                  await client.graphql({
                    query: updateSMAccount,
                    variables: {
                      input: {
                        awsemail: nationalId,
                        balance: (parseFloat(usrBala) + amountBackend).toFixed(2),
                        ttlDpstSM: (parseFloat(usrTlDpst) + amountBackend).toFixed(2)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    showAlert(t.genericError);
                    return;
                  }
                }
                await onUpdtAgntBal();
              };
              const onUpdtAgntBal = async () => {
                setIsLoading(true);
                try {
                  const prevAgentGroupFloatAmount = parseFloat(AgentBal.data.getAgent.groupFloatAmount || '0');
                  if (groupFallbackUsed > 0 && linkedGroupContact) {
                    const nextGroupBalance = linkedGroupBalanceBefore - groupFallbackUsed;
                    const nextGroupFloatLoan = linkedGroupFloatLoanBefore + groupFallbackUsed;
                    await client.graphql({
                      query: updateGroup,
                      variables: {
                        input: {
                          grpContact: linkedGroupContact,
                          grpBal: nextGroupBalance,
                          groupFloatLoan: nextGroupFloatLoan
                        }
                      }
                    });
                  }
                  const nextAgentGroupFloatAmount = prevAgentGroupFloatAmount + groupFallbackUsed;
                  const nextAgentFloatBalance = parseBackendNumericValue(agtFltBl) - amountBackend + groupFallbackUsed;
                  const agentUpdateInput: any = {
                    phonecontact: AgentPhn,
                    floatBal: nextAgentFloatBalance.toFixed(2),
                    groupFloatAmount: nextAgentGroupFloatAmount,
                    groupFloatStatus: nextAgentGroupFloatAmount > 0 ? 'YES' : 'NO'
                  };
                  if (groupFallbackUsed <= 0) {
                    agentUpdateInput.TtlFltOut = (parseFloat(agtTtlFtOut) + amountBackend).toFixed(2);
                  }
                  await client.graphql({
                    query: updateAgent,
                    variables: {
                      input: agentUpdateInput
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    showAlert(t.genericError);
                    return;
                  }
                }
                await onUpdtCompBal();
              };
              const onUpdtCompBal = async () => {
                setIsLoading(true);
                try {
                  await client.graphql({
                    query: updateCompany,
                    variables: {
                      input: {
                        AdminId: "BaruchHabaB'ShemAdonai2",
                        ttlUsrDep: parseFloat(ttlUsrDpsts) + amountBackend,
                        agentFloatOut: parseFloat(agentFloatOuts) + amountBackend
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                }
                updateProgress('Deposit completed successfully.');
                showAlert(`${formatAmountSync(amountBackend, officerCurrencyKey, ratesMap)} ${t.depositSuccess} ${names}'s ac`);
                
                // Send Firebase notification
                const depositMessage = `${t.depositConfirmation} ${formatAmountSync(amountBackend, officerCurrencyKey, ratesMap)} ${t.depositConfirmationTail}`;
                try {
                  const msgRes: any = await client.graphql({
                    query: createMessages,
                    variables: {
                      input: {
                        senderEmail: phonecontact,
                        messageBody: depositMessage
                      }
                    }
                  });
                  if (msgRes?.data?.createMessages) {
                    await client.graphql({
                      query: sendNotification,
                      variables: {
                        riderEmail: phonecontact,
                        title: 'NiSenti: Deposit Confirmation',
                        body: depositMessage
                      }
                    });
                  }
                } catch (notifError) {
                  console.log('Notification error:', notifError);
                }
                
                setIsLoading(false);
              };
              if (usrStts === "AccountInactive") {
                showAlert(t.accountInactive);
                setProgressMessage('Depositor account is inactive.');
                return;
              } else if (nationalids !== UsrId) {
                showAlert(t.depositorIdMismatch);
                setProgressMessage('Depositor ID does not match the loaded account.');
                return;
              } else {
                const exceedsLimit = amountBackend > effectiveLimit;
                console.log('[deposit-debug] non-loan limit check', {
                  enteredAmount: amountForeign,
                  convertedAmount: amountBackend,
                  storedNonLoanLimit: effectiveLimit,
                  comparison: `${amountBackend} > ${effectiveLimit}`,
                  willExceedLimit: exceedsLimit,
                  currencyKey,
                  nationality: safeNationality,
                  rates: debugRates
                });
                if (exceedsLimit) {
                  showAlert(t.limitExceeded);
                  setProgressMessage('Converted deposit amount exceeds the depositor non-loan limit.');
                  return;
                }
              }
              if (AgAcAct === "AccountInactive") {
                showAlert(t.agentInactive);
                setProgressMessage('Agent account is inactive.');
                return;
              } else if (parseBackendNumericValue(agtFltBl) < amountBackend) {
                const agentGroupFloatStatus = String(AgentBal.data.getAgent.groupFloatStatus || '').toUpperCase();
                const prevAgentGroupFloatAmount = parseFloat(AgentBal.data.getAgent.groupFloatAmount || '0');
                const agentBalance = parseBackendNumericValue(agtFltBl);
                const shortfall = amountBackend - agentBalance;
                console.log('[deposit-flow] agent shortfall decision', {
                  rawGroupFloatStatus: AgentBal.data.getAgent.groupFloatStatus,
                  normalizedGroupFloatStatus: agentGroupFloatStatus,
                  agentBalance,
                  convertedDepositAmount: amountBackend,
                  shortfall,
                  groupFloatAmount: prevAgentGroupFloatAmount,
                  willShowGroupPrompt: agentGroupFloatStatus === 'YES'
                });
                if (agentGroupFloatStatus !== 'YES') {
                  showAlert(`${t.insufficientBalance}\n\n${t.agentBalanceLabel}: ${formatAmountSync(agentBalance, officerCurrencyKey, ratesMap)}\n${t.amountNeededLabel}: ${formatAmountSync(shortfall, officerCurrencyKey, ratesMap)}\n\n${t.askGroupsToLink}`);
                  setProgressMessage('Agent group-float status is not YES; linked-group funding is unavailable.');
                  return;
                }
                const proceedWithGroup = await askToUseLinkedGroup(
                  `${t.agentBalanceInsufficient}\n\n${t.agentBalanceLabel}: ${formatAmountSync(agentBalance, officerCurrencyKey, ratesMap)}\n${t.amountNeededLabel}: ${formatAmountSync(shortfall, officerCurrencyKey, ratesMap)}\n\n${t.useLinkedGroup}`
                );
                if (!proceedWithGroup) {
                  setProgressMessage(t.groupFundingDeclined);
                  return;
                }
                updateProgress(`Proceed selected. Wiring linked-group funds for the ${formatAmountSync(shortfall, officerCurrencyKey, ratesMap)} shortfall...`);
                const sAgentPhone = AgentBal.data.getAgent.sagentregno;
                if (!sAgentPhone) {
                  showAlert('Agent is not linked to any SAgent, so linked group funding cannot be used.');
                  setProgressMessage('Agent has no linked SAgent for fallback funding.');
                  return;
                }
                console.log('[deposit-flow] fetching sagent', { sAgentPhone });
                const sAgentRes: any = await client.graphql({ query: getSAgent, variables: { saPhoneContact: sAgentPhone } });
                const linkedSAgent = sAgentRes?.data?.getSAgent;
                console.log('[deposit-flow] sagent lookup result', linkedSAgent);
                if (!linkedSAgent?.bkAcNo) {
                  showAlert('The linked SAgent does not have a group account for fallback funding.');
                  setProgressMessage('The linked SAgent does not have a linked group.');
                  return;
                }
                console.log('[deposit-flow] fetching group', { grpContact: linkedSAgent.bkAcNo });
                const groupRes: any = await client.graphql({ query: getGroup, variables: { grpContact: linkedSAgent.bkAcNo } });
                const linkedGroup = groupRes?.data?.getGroup;
                console.log('[deposit-flow] group lookup result', linkedGroup);
                const groupBalance = parseFloat(linkedGroup?.grpBal || '0');
                fallbackAmount = Math.max(0, shortfall);
                console.log('[deposit-debug] group funding comparison', {
                  groupContact: linkedGroup?.grpContact || linkedSAgent.bkAcNo,
                  rawGroupBalanceFromBackend: linkedGroup?.grpBal,
                  groupBalanceCHF: groupBalance,
                  convertedEnteredAmountCHF: amountBackend,
                  agentBalanceCHF: agentBalance,
                  shortfallCHF: shortfall,
                  agentGroupFloatAmountCHF: prevAgentGroupFloatAmount,
                  proposedFallbackAmountCHF: fallbackAmount,
                  groupCanCoverFallback: groupBalance >= fallbackAmount,
                  comparison: `${groupBalance} >= ${fallbackAmount}`
                });
                if (!linkedGroup || fallbackAmount <= 0 || groupBalance < fallbackAmount) {
                  showAlert(`The linked group cannot cover the shortfall. Available group balance is ${formatAmountSync(groupBalance, officerCurrencyKey, ratesMap)}.`);
                  setProgressMessage('Linked group balance is too low to cover the shortfall.');
                  return;
                }
                groupFallbackUsed = fallbackAmount;
                linkedGroupContact = linkedGroup.grpContact;
                linkedGroupBalanceBefore = groupBalance;
                linkedGroupFloatLoanBefore = parseFloat(linkedGroup?.groupFloatLoan || '0');
                updateProgress(`Linked group can cover ${formatAmountSync(fallbackAmount, officerCurrencyKey, ratesMap)} of the shortfall.`);
              }
              if (signedInAccountPw !== agPWd) {
                showAlert(t.passwordIncorrect);
                return;
              }
              await CrtFltRed();
            } catch (error) {
              console.log(error);
              if (error) {
                showAlert(t.internetIssue);
                return;
              }
            }
            setIsLoading(false);
          };
          await gtCompDtls();
        } catch (e) {
          console.log(e);
          if (e) {
            showAlert(t.agentNotFound);
            return;
          }
        }
        setIsLoading(false);
      };
      await fetchAgtBal();
    } catch (e) {
      console.log(e);
      if (e) {
        showAlert(t.retry);
        return;
      }
    }
    setIsLoading(false);
    setProgressMessage('');
    setNationalid("");
    setAmount("");
    setAgPWd("");
    setAgentPhn("");
    setUsrId("");
  };
  useEffect(() => {
    const UsrIds = UsrId;
    if (!UsrIds && UsrIds !== "") {
      setUsrId("");
      return;
    }
    setUsrId(UsrIds);
  }, [UsrId]);
  useEffect(() => {
    const usId = nationalId;
    if (!usId && usId !== "") {
      setNationalid("");
      return;
    }
    setNationalid(usId);
  }, [nationalId]);
  useEffect(() => {
    const amt = amount;
    if (!amt && amt !== "") {
      setAmount("");
      return;
    }
    setAmount(amt);
  }, [amount]);
  useEffect(() => {
    const pws = agPWd;
    if (!pws && pws !== "") {
      setAgPWd("");
      return;
    }
    setAgPWd(pws);
  }, [agPWd]);
  useEffect(() => {
    const agphn = AgentPhn;
    if (!agphn && agphn !== "") {
      setAgentPhn("");
      return;
    }
    setAgentPhn(agphn);
  }, [AgentPhn]);
  return <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <Text style={styles.title}>{t.title}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.depositorEmail}</Text>
            <TextInput placeholder={t.depositorEmailPlaceholder} value={nationalId} onChangeText={setNationalid} style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.depositorId}</Text>
            <TextInput placeholder={t.depositorIdPlaceholder} value={UsrId} onChangeText={setUsrId} style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.nsndogoPhone}</Text>
            <TextInput placeholder={t.nsndogoPhonePlaceholder} value={AgentPhn} onChangeText={setAgentPhn} style={styles.input} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.amount}</Text>
            <View style={styles.amountInputContainer}>
              {currencySymbol ? <Text style={styles.amountPrefix}>{currencySymbol}</Text> : null}
              <TextInput
                placeholder={t.amountPlaceholder}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                style={styles.amountInput}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t.officerPassword}</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                placeholder={t.officerPasswordPlaceholder}
                value={agPWd}
                onChangeText={setAgPWd}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.passwordToggle}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={fetchAcDtls}>
            <Text style={styles.buttonText}>{t.submit}</Text>
            {isLoading && <ActivityIndicator size="small" color="#fff" style={{
            marginTop: 8
          }} />}
          </TouchableOpacity>
          {progressMessage ? <Text style={styles.progressText}>{progressMessage}</Text> : null}
        </ScrollView>
      </TouchableWithoutFeedback>
      <CustomAlert
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      <CustomAlert
        visible={fundingPromptVisible}
        message={fundingPromptMessage}
        onClose={() => resolveFundingPrompt(false)}
        actions={[
          { label: t.proceed, onPress: () => resolveFundingPrompt(true) },
          { label: t.decline, onPress: () => resolveFundingPrompt(false), secondary: true }
        ]}
      />
    </KeyboardAvoidingView>;
};
export default SMADepositForm;
const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f2f4f7'
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f2f4f7'
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: '#f2f4f7',
    padding: 16,
    paddingBottom: 40
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e58d29',
    textAlign: 'center',
    marginBottom: 24
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    marginBottom: 6,
    color: '#00bfff',
    fontSize: 15,
    fontWeight: '500'
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 14,
    fontSize: 16
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 14
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 14
  },
  passwordInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    paddingVertical: 0
  },
  passwordToggle: {
    marginLeft: 8,
    padding: 4
  },
  amountPrefix: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#e58d29'
  },
  amountInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    paddingVertical: 0
  },
  button: {
    marginTop: 10,
    backgroundColor: '#e58d29',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.15,
    shadowRadius: 3
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  progressText: {
    marginTop: 12,
    color: '#374151',
    fontSize: 13,
    textAlign: 'center'
  }
});