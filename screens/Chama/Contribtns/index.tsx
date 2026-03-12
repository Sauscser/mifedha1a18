import React, { useEffect, useState } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { updateCompany, updateSMAccount, updateGroup, createGrpMembersContribution, updateChamaMembers } from '../../../src/graphql/mutations';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { getChamaMembers, getCompany, getGroup, getSMAccount } from '../../../src/graphql/queries';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { Ionicons } from '@expo/vector-icons';

import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, convertForeignToKsh } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

import styles from './styles';
const client = generateClient();
// Use any for route.params to avoid TS error, fallback to empty string if missing
const SMASendChmNonLns = props => {
  const [MmbrId, setMmbrId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState('');
  const [amounts, setAmount] = useState('');
  const [Desc, setDesc] = useState('');
  const [ownr, setownr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userNationality, setUserNationality] = useState<string | null>(null);
  const route = useRoute();
  const MembaId = (route as any)?.params?.ChamaNMember || '';
  
  const { ratesMap, nationality } = useExchange();
  // Use nationalityToCode to get userCode
  const userCode = nationalityToCode(userNationality || nationality);
  const userCurrencyKey = userCode || userNationality || nationality || undefined;
  const currencySymbol =
    (userCurrencyKey && ratesMap?.[userCurrencyKey]?.symbol) ||
    (userCode && ratesMap?.[userCode]?.symbol) ||
    (userNationality && ratesMap?.[userNationality]?.symbol) ||
    'KSh';

  // Parse and sanitize input
  const parseAmountInput = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleAmountChange = (value: string) => {
    const sanitized = value.replace(/,/g, '');
    if (sanitized === '') {
      setAmount('');
      return;
    }
    if (/^\d*(\.\d{0,2})?$/.test(sanitized)) {
      setAmount(sanitized);
    }
  };

  const formatAmountOnBlur = () => {
    if (!amounts.trim()) return;
    const parsed = parseAmountInput(amounts);
    if (parsed === null) return;
    setAmount(parsed.toFixed(2));
  };

  const fetchUser = async () => {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    setownr(attributes.sub);
    try {
      const userData = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: attributes.email },
      });
      const data = (userData as any)?.data || (userData as any)?.payload;
      setUserNationality(data?.getSMAccount?.nationality);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);

  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  // Confirmation prompt (BenefitChm pattern)
  const confirmContribution = async (): Promise<boolean> => {
    const amountForeign = parseAmountInput(amounts);
    if (amountForeign === null || amountForeign <= 0) {
      Alert.alert(t.amountSent, t.confirmContributionMsg.replace('{amount}', '0'));
      return false;
    }
    const amountInKES = await convertForeignToKsh(amountForeign, userCurrencyKey);
    // Fetch transaction fee
    let userTransferFees = 0;
    try {
      const CompDtls: any = await client.graphql({
        query: getCompany,
        variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
      });
      userTransferFees = CompDtls.data.getCompany.chmMmbrTransferFee || 0;
    } catch {}
    const feeInKES = userTransferFees * amountInKES;
    // Format the original entered amount and fee for display (user currency)
    const formattedEnteredAmount = `${currencySymbol} ${amountForeign}`;
    const formattedFee = `${currencySymbol} ${(userTransferFees * amountForeign).toFixed(2)}`;
    return new Promise((resolve) => {
      Alert.alert(
        t.confirmContribution,
        `${t.confirmContributionMsg.replace('{amount}', formattedEnteredAmount)}\n${t.transactionFee || 'Transaction fee'}: ${formattedFee}`,
        [
          { text: t.cancel, style: 'cancel', onPress: () => resolve(false) },
          { text: t.confirm, onPress: () => resolve(true) }
        ]
      );
    });
  };

  const fetchChmMbrDtls = async () => {
    // Confirm before proceeding
    const confirmed = await confirmContribution();
    if (!confirmed) {
      return;
    }
    // Convert amount to KES once
    const amountForeign = parseAmountInput(amounts);
    const amountInKES = await convertForeignToKsh(amountForeign, userCurrencyKey);
    if (!Number.isFinite(amountInKES) || amountInKES <= 0) {
      Alert.alert(t.amountSent, t.confirmContributionMsg.replace('{amount}', '0'));
      return;
    }
    // Fetch transaction fee
    let userTransferFees = 0;
    try {
      const CompDtls: any = await client.graphql({
        query: getCompany,
        variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
      });
      userTransferFees = CompDtls.data.getCompany.chmMmbrTransferFee || 0;
    } catch {}
    const feeInKES = userTransferFees * amountInKES;
    const totalToDeduct = amountInKES + feeInKES;
    if (isLoading) return;
    setIsLoading(true);
    try {
      const ChmMbrtDtl: any = await client.graphql({
        query: getChamaMembers,
        variables: {
          ChamaNMember: MembaId
        }
      });
      const groupContacts = ChmMbrtDtl.data.getChamaMembers.groupContact;
      const memberContacts = ChmMbrtDtl.data.getChamaMembers.memberContact;
      const NonLoanAcBals = ChmMbrtDtl.data.getChamaMembers.NonLoanAcBal;
      const subscribedAmt = ChmMbrtDtl.data.getChamaMembers.subscribedAmt;
      const fetchSenderUsrDtls = async () => {
        if (isLoading) return;
        setIsLoading(false);
        try {
          const accountDtl: any = await client.graphql({
            query: getSMAccount,
            variables: {
              awsemail: memberContacts
            }
          });
          const SenderUsrBal = accountDtl.data.getSMAccount.balance;
          const usrPW = accountDtl.data.getSMAccount.pw;
          const usrAcActvStts = accountDtl.data.getSMAccount.acStatus;
          const SenderSub = accountDtl.data.getSMAccount.owner;
          const loanLimits = accountDtl.data.getSMAccount.loanLimit;
          const names = accountDtl.data.getSMAccount.name;
          const fetchCompDtls = async () => {
            if (isLoading) return;
            setIsLoading(true);
            try {
              const CompDtls: any = await client.graphql({
                query: getCompany,
                variables: {
                  AdminId: "BaruchHabaB'ShemAdonai2"
                }
              });
              const userTransferFees = CompDtls.data.getCompany.chmMmbrTransferFee;
              const UsrTransferFeeAmt = userTransferFees * amountInKES;
              const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
              const companyEarnings = CompDtls.data.getCompany.companyEarning;
              const CompPhoneContact = CompDtls.data.getCompany.phoneContact;
              const TotalTransacted = amountInKES + UsrTransferFeeAmt; // Deduct this from sender
              const ttlNonLonssRecChmss = CompDtls.data.getCompany.ttlNonLonssRecChm;
              const fetchRecUsrDtls = async () => {
                if (isLoading) return;
                setIsLoading(true);
                try {
                  const RecAccountDtl: any = await client.graphql({
                    query: getGroup,
                    variables: {
                      grpContact: groupContacts
                    }
                  });
                  const grpBals = RecAccountDtl.data.getGroup.grpBal;
                  const statuss = RecAccountDtl.data.getGroup.status;
                  const ttlNonLonsRecChmsssssss = RecAccountDtl.data.getGroup.ttlNonLonsRecChm;
                  const grpNames = RecAccountDtl.data.getGroup.grpName;
                  const MemberSubscrptnSync = RecAccountDtl.data.getGroup.MemberSubscrptnSync;
                  const CrtChmMbrContri = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: createGrpMembersContribution,
                        variables: {
                          input: {
                            memberPhn: memberContacts,
                            mmberNme: names,
                            GrpName: grpNames,
                            grpContact: groupContacts,
                            contriAmount: amountInKES.toFixed(0),
                            memberId: MembaId,
                            status: "AccountActive",
                            owner: ownr
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert(t.contributionUnsuccessful);
                      return;
                    }
                    setIsLoading(false);
                    await updtSendrAc();
                  };
                  const updtSendrAc = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateSMAccount,
                        variables: {
                          input: {
                            awsemail: memberContacts,
                            balance: (parseFloat(SenderUsrBal) - TotalTransacted).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert(t.checkInternetConnection);
                      return;
                    }
                    setIsLoading(false);
                    await updtRecAc();
                  };
                  const updtRecAc = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateGroup,
                        variables: {
                          input: {
                            grpContact: groupContacts,
                            MemberSubscrptnSync: (parseFloat(MemberSubscrptnSync) + amountInKES).toFixed(0),
                            grpBal: (parseFloat(grpBals) + amountInKES).toFixed(0),
                            ttlNonLonsRecChm: (amountInKES + parseFloat(ttlNonLonsRecChmsssssss)).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert(t.checkInternetConnection);
                      return;
                    }
                    setIsLoading(false);
                    await updtComp();
                  };
                  const updtComp = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateCompany,
                        variables: {
                          input: {
                            AdminId: "BaruchHabaB'ShemAdonai2",
                            companyEarningBal: parseFloat(companyEarningBals) + UsrTransferFeeAmt,
                            companyEarning: parseFloat(companyEarnings) + UsrTransferFeeAmt,
                            ttlNonLonssRecChm: (amountInKES + parseFloat(ttlNonLonssRecChmss)).toFixed(2)
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert("Check your internet connection");
                      return;
                    }
                    await updtChmMbr();
                    setIsLoading(false);
                  };
                  const updtChmMbr = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateChamaMembers,
                        variables: {
                          input: {
                            ChamaNMember: MembaId,
                            NonLoanAcBal: (parseFloat(NonLoanAcBals) + amountInKES).toFixed(0),
                            subscribedAmt: (parseFloat(subscribedAmt) + amountInKES).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert(t.checkInternetConnection);
                      return;
                    }
                    Alert.alert(
                      `${amountForeign} sent to ${grpNames}\nTransaction fee: ${formatAmountSync(UsrTransferFeeAmt, userCurrencyKey, ratesMap)}`
                    );
                    setIsLoading(false);
                  };

                  // Alternative path if insufficient fees
                  const CrtChmMbrContri2 = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: createGrpMembersContribution,
                        variables: {
                          input: {
                            memberPhn: memberContacts,
                            mmberNme: names,
                            GrpName: grpNames,
                            grpContact: groupContacts,
                            contriAmount: amountInKES.toFixed(0),
                            memberId: MembaId,
                            status: "AccountActive",
                            owner: ownr
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert(t.contributionUnsuccessful);
                      return;
                    }
                    setIsLoading(false);
                    await updtSendrAc2();
                  };
                  const updtSendrAc2 = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      // Fallback: if insufficient fees, just deduct sender's balance by amountInKES (no fee)
                      await client.graphql({
                        query: updateSMAccount,
                        variables: {
                          input: {
                            awsemail: memberContacts,
                            balance: (parseFloat(SenderUsrBal) - amountInKES).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert(t.checkInternetConnection);
                      return;
                    }
                    setIsLoading(false);
                    await updtRecAc2();
                  };
                  const updtRecAc2 = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateGroup,
                        variables: {
                          input: {
                            grpContact: groupContacts,
                            MemberSubscrptnSync: (parseFloat(MemberSubscrptnSync) + amountInKES).toFixed(0),
                            grpBal: (parseFloat(grpBals) + amountInKES).toFixed(0),
                            ttlNonLonsRecChm: (amountInKES + parseFloat(ttlNonLonsRecChmsssssss)).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert(t.checkInternetConnection);
                      return;
                    }
                    setIsLoading(false);
                    await updtComp2();
                  };
                  const updtComp2 = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      // Fallback: if insufficient fees, do not add fee to company earning
                      await client.graphql({
                        query: updateCompany,
                        variables: {
                          input: {
                            AdminId: "BaruchHabaB'ShemAdonai2",
                            companyEarningBal: parseFloat(companyEarningBals),
                            companyEarning: parseFloat(companyEarnings),
                            ttlNonLonssRecChm: (amountInKES + parseFloat(ttlNonLonssRecChmss)).toFixed(2)
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert("Check your internet connection");
                      return;
                    }
                    await updtChmMbr2();
                    setIsLoading(false);
                  };
                  const updtChmMbr2 = async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await client.graphql({
                        query: updateChamaMembers,
                        variables: {
                          input: {
                            ChamaNMember: MembaId,
                            NonLoanAcBal: (parseFloat(NonLoanAcBals) + amountInKES).toFixed(0)
                          }
                        }
                      });
                    } catch (error) {
                      Alert.alert(t.checkInternetConnection);
                      return;
                    }
                    Alert.alert(t.insufficientTransactionFees + " " + formatAmountSync(amountInKES, userCurrencyKey, ratesMap) + " " + t.sent);
                    setIsLoading(false);
                  };

                  // Validation checks before deciding which path to take
                  if (usrAcActvStts !== "AccountActive") {
                    Alert.alert(t.senderAccountInactive);
                  } else if (statuss !== "AccountActive") {
                    Alert.alert(t.chamaAccountInactive);
                  } else if ((parseFloat(SenderUsrBal) - amountInKES) < 0) {
                    Alert.alert(t.requestedAmountExceedsBalance);
                  } else if (usrPW !== SnderPW) {
                    Alert.alert(t.wrongPassword);
                  } else if (ownr !== SenderSub) {
                    Alert.alert(t.sendFromOwnAccount);
                  } else if (parseFloat(loanLimits) < amountInKES) {
                    Alert.alert(t.callToAdjustSendAmountLimit + " " + CompPhoneContact);
                  } else if (UsrTransferFeeAmt > (parseFloat(SenderUsrBal) - amountInKES)) {
                    await CrtChmMbrContri2();
                  } else {
                    await CrtChmMbrContri();
                  }
                } catch (e) {
                  console.log(e);
                  Alert.alert(t.receiverDoesNotExist);
                  return;
                }
                setIsLoading(false);
              };
              await fetchRecUsrDtls();
            } catch (e) {
              console.log(e);
              Alert.alert(t.checkInternetConnection);
              return;
            }
            setIsLoading(false);
          };
          await fetchCompDtls();
        } catch (e) {
          Alert.alert(t.senderDoesNotExist);
          return;
        }
        setIsLoading(false);
      };
      await fetchSenderUsrDtls();
    } catch (e) {
      console.log(e);
      Alert.alert(t.checkInternetConnection);
      return;
    }
    setMmbrId('');
    setAmount('');
    setRecNatId('');
    setDesc('');
    setSnderPW('');
    setIsLoading(false);
  };
  useEffect(() => {
    const SnderNatIds = MmbrId;
    if (!SnderNatIds && SnderNatIds !== "") {
      setMmbrId("");
      return;
    }
    setMmbrId(SnderNatIds);
  }, [MmbrId]);
  useEffect(() => {
    const amt = amounts;
    if (!amt && amt !== "") {
      setAmount("");
      return;
    }
    setAmount(amt);
  }, [amounts]);
  useEffect(() => {
    const RecNatIds = RecNatId;
    if (!RecNatIds && RecNatIds !== "") {
      setRecNatId("");
      return;
    }
    setRecNatId(RecNatIds);
  }, [RecNatId]);
  useEffect(() => {
    const descr = Desc;
    if (!descr && descr !== "") {
      setDesc("");
      return;
    }
    setDesc(descr);
  }, [Desc]);
  useEffect(() => {
    const SnderPWss = SnderPW;
    if (!SnderPWss && SnderPWss !== "") {
      setSnderPW("");
      return;
    }
    setSnderPW(SnderPWss);
  }, [SnderPW]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.fillAccountDetails}</Text>
        <Text>{t.amountSent + ' (' + currencySymbol + ')'}</Text>
        <TextInput 
          keyboardType="decimal-pad" 
          value={amounts} 
          onChangeText={handleAmountChange} 
          onBlur={formatAmountOnBlur} 
          style={styles.input} 
          placeholder={t.amountSent + ' (' + currencySymbol + ')'}
          editable={!isLoading}
        />
        <View style={{ width: '100%', position: 'relative', marginBottom: 18 }}>
          <Text>{t.senderPassword}</Text>
          <TextInput
            value={SnderPW}
            onChangeText={setSnderPW}
            secureTextEntry={!isPasswordVisible}
            style={styles.input}
            placeholder={t.senderPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(v => !v)}
            style={{ position: 'absolute', right: 16, top: 12 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={22} color="#888" />
          </TouchableOpacity>
        </View>
        <Text>{t.description}</Text>
        <TextInput
          multiline={true}
          value={Desc}
          onChangeText={setDesc}
          style={[styles.input, styles.inputDesc]}
          placeholder={t.description}
          editable={!isLoading}
        />
        <TouchableOpacity onPress={fetchChmMbrDtls} style={styles.button} disabled={isLoading}>
          <Text style={styles.buttonText}>{t.send}</Text>
          {isLoading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
export default SMASendChmNonLns;