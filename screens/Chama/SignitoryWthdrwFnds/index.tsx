import React, { useEffect, useState } from 'react';
import { createFloatAdd, updateAgent, updateCompany, updateGroup, updateSAgent, updateSMAccount } from '../../../src/graphql/mutations';
import styles from './styles';
import { getAgent, getCompany, getGroup, getSAgent, getSMAccount } from '../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';

import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';

const client = generateClient();
const SMADepositForm = props => {
    const { i18n } = useTranslation();
    const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const t = translations[lang] || translations.en;
  const [WthDrwrPhn, setWthDrwrPhn] = useState(null);
  const [ChmKntct, setChmKntct] = useState("");
  const [UsrPWd, setUsrPWd] = useState("");
  const [AgentPhn, setAgentPhn] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userNationality, setUserNationality] = useState<string>(null);
  
  const { ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(userNationality);

  // Parse amount input
  const parseAmountInput = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Handle money input with 2-decimal enforcement
  const handleMoneyInput = (setter: (value: string) => void) => (value: string) => {
    if (/^\d*(\.\d{0,2})?$/.test(value) || value === '') {
      setter(value);
    }
  };

  // Format to exactly 2 decimals on blur
  const formatMoneyOnBlur = (value: string, setter: (value: string) => void) => {
    const num = parseAmountInput(value);
    if (num > 0) {
      setter(num.toFixed(2));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const userData = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: attributes.email },
        });
        if ('data' in userData && userData.data && userData.data.getSMAccount) {
          setUserNationality(userData.data.getSMAccount.nationality);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);
  const fetchChmDtls = async () => {
    if (isLoading) return;

    // Convert amount to KES (await if async)
    const amountForeign = parseAmountInput(amount);
    // convertForeignToKsh expects 1-2 args, not 3
    const amountInKES = typeof convertForeignToKsh === 'function' && convertForeignToKsh.length >= 2
      ? await convertForeignToKsh(amountForeign, userCurrencyKey)
      : await convertForeignToKsh(amountForeign);

    // Confirmation prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        t.confirmWithdrawal,
        t.confirmWithdrawalBody.replace('{{amount}}', formatAmountSync(amountInKES, userCurrencyKey)),
        [
          { text: t.cancel, style: 'cancel', onPress: () => resolve(false) },
          { text: t.withdraw, onPress: () => resolve(true) }
        ]
      );
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const ChmDtl: any = await client.graphql({
        query: getGroup,
        variables: {
          grpContact: ChmKntct
        }
      });
      const grpBals = ChmDtl.data.getGroup.grpBal;
      const ttlWthdrwns = ChmDtl.data.getGroup.ttlWthdrwn;
      const usrStts = ChmDtl.data.getGroup.status;
      const pws = ChmDtl.data.getGroup.signitoryPW;
      const owners = ChmDtl.data.getGroup.owner;
      const names = ChmDtl.data.getGroup.grpName;
      const WithdrawCnfrmtnAmt = ChmDtl.data.getGroup.WithdrawCnfrmtnAmt;
      const WithdrawCnfrmtns = ChmDtl.data.getGroup.WithdrawCnfrmtn;
      const WithdrawCnfrmtnAmt2 = ChmDtl.data.getGroup.WithdrawCnfrmtnAmt2;
      const WithdrawCnfrmtn2 = ChmDtl.data.getGroup.WithdrawCnfrmtn2;
      const WithdrawalSync = ChmDtl.data.getGroup.WithdrawalSync;
      const AgentBal: any = await client.graphql({
        query: getAgent,
        variables: {
          phonecontact: AgentPhn
        }
      });
      const TtlFltInsss = AgentBal.data.getAgent.TtlFltIn;
      const floatBals = AgentBal.data.getAgent.floatBal;
      const ttlEarningssss = AgentBal.data.getAgent.ttlEarnings;
      const agentEarningBalsss = AgentBal.data.getAgent.agentEarningBal;
      const AgAcAct = AgentBal.data.getAgent.status;
      const sagentregnos = AgentBal.data.getAgent.sagentregno;
      const namess = AgentBal.data.getAgent.name;
      const MFNWithdrwlFees = AgentBal.data.getAgent.MFNWithdrwlFee;
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const ttlUserWthdrwls = compDtls.data.getCompany.ttlUserWthdrwl;
      const companyComs = compDtls.data.getCompany.companyCom;
      const UsrWthdrwlFeess = compDtls.data.getCompany.UsrWthdrwlFees;
      const agentEarningBals = compDtls.data.getCompany.agentEarningBal;
      const agentEarnings = compDtls.data.getCompany.agentEarning;
      const saEarningBals = compDtls.data.getCompany.saEarningBal;
      const saEarnings = compDtls.data.getCompany.saEarning;
      const agentFloatIns = compDtls.data.getCompany.agentFloatIn;
      const ChampCom = compDtls.data.getCompany.ChampCom;
      const saDtls: any = await client.graphql({
        query: getSAgent,
        variables: {
          saPhoneContact: sagentregnos
        }
      });
      const TtlEarningss = saDtls.data.getSAgent.TtlEarnings;
      const saBalances = saDtls.data.getSAgent.saBalance;
      const namessssssss = saDtls.data.getSAgent.name;
      const MFKWithdrwlFees = saDtls.data.getSAgent.MFKWithdrwlFee;
      const numAmountInKES = typeof amountInKES === 'number' ? amountInKES : parseFloat(amountInKES);
      const AgentCommission = parseFloat(MFNWithdrwlFees) * numAmountInKES * parseFloat(UsrWthdrwlFeess);
      const saCommission = parseFloat(MFKWithdrwlFees) * numAmountInKES * parseFloat(UsrWthdrwlFeess);
      const compCommission = parseFloat(companyComs) * numAmountInKES * parseFloat(UsrWthdrwlFeess);
      const UsrWithdrawalFee = AgentCommission + saCommission;
      const TTlAmtTrnsctd = numAmountInKES + UsrWithdrawalFee;
      const acChamp = saDtls.data.getSAgent.acChamp;
      const ChampCommission = parseFloat(ChampCom) * amountInKES * parseFloat(UsrWthdrwlFeess);
      const compDtlsx: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: acChamp
        }
      });
      const balancesx = compDtlsx.data.getSMAccount.balance;

      // Validation checks
      if (WithdrawCnfrmtns === "NO") {
        Alert.alert(t.letSignatory2Confirm);
      } else if (parseFloat(WithdrawCnfrmtnAmt) !== numAmountInKES) {
        Alert.alert(t.enterAmountAgreed2.replace('{{expected}}', formatAmountSync(parseFloat(WithdrawCnfrmtnAmt), userCurrencyKey)));
      } else if (WithdrawCnfrmtn2 === "NO") {
        Alert.alert(t.letSignatory3Confirm);
      } else if (parseFloat(WithdrawCnfrmtnAmt2) !== numAmountInKES) {
        Alert.alert(t.enterAmountAgreed3.replace('{{expected}}', formatAmountSync(parseFloat(WithdrawCnfrmtnAmt2), userCurrencyKey)));
      } else if (TTlAmtTrnsctd > parseFloat(grpBals)) {
        Alert.alert(t.insufficientChamaBalance.replace('{{available}}', formatAmountSync(parseFloat(grpBals), userCurrencyKey)));
      } else if (usrStts === "AccountInactive") {
        Alert.alert(t.chamaDeactivated);
      } else if (user.userId !== owners) {
        Alert.alert(t.notMainSignatory);
      } else if (AgAcAct === "AccountInactive") {
        Alert.alert(t.nsndogoDeactivated);
      } else if (UsrPWd !== pws) {
        Alert.alert(t.credentialsWrong);
      } else {
        // Create Float Add
        await client.graphql({
          query: createFloatAdd,
          variables: {
            input: {
              withdrawerid: ChmKntct,
              agentPhonecontact: AgentPhn,
              sagentId: sagentregnos,
              owner: user.userId,
              amount: Math.floor(numAmountInKES),
              agentName: namess,
              userName: names,
              saName: namessssssss,
              saPhone: sagentregnos,
              status: 'AccountActive'
            }
          }
        });

        // Update Group
        await client.graphql({
          query: updateGroup,
          variables: {
            input: {
              grpContact: ChmKntct,
              WithdrawalSync: Math.floor(parseFloat(WithdrawalSync) + TTlAmtTrnsctd),
              grpBal: Math.floor(parseFloat(grpBals) - TTlAmtTrnsctd),
              ttlWthdrwn: Math.floor(parseFloat(ttlWthdrwns) + numAmountInKES),
              WithdrawCnfrmtn: "NO",
              WithdrawCnfrmtn2: "NO"
            }
          }
        });

        // Update Agent
        await client.graphql({
          query: updateAgent,
          variables: {
            input: {
              phonecontact: AgentPhn,
              ttlEarnings: Math.floor(parseFloat(ttlEarningssss) + AgentCommission),
              agentEarningBal: Math.floor(parseFloat(agentEarningBalsss) + AgentCommission),
              floatBal: Math.floor(parseFloat(floatBals) + numAmountInKES),
              TtlFltIn: Math.floor(parseFloat(TtlFltInsss) + numAmountInKES)
            }
          }
        });

        // Update SAgent
        await client.graphql({
          query: updateSAgent,
          variables: {
            input: {
              saPhoneContact: sagentregnos,
              TtlEarnings: Math.floor(parseFloat(TtlEarningss) + saCommission),
              saBalance: Math.floor(parseFloat(saBalances) + saCommission)
            }
          }
        });

        // Update Company
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "BaruchHabaB'ShemAdonai2",
              agentEarningBal: Math.floor(parseFloat(agentEarningBals) + AgentCommission),
              agentEarning: Math.floor(parseFloat(agentEarnings) + AgentCommission),
              saEarningBal: Math.floor(parseFloat(saEarningBals) + saCommission),
              saEarning: Math.floor(parseFloat(saEarnings) + saCommission),
              ttlUserWthdrwl: Math.floor(parseFloat(ttlUserWthdrwls) + numAmountInKES),
              agentFloatIn: Math.floor(parseFloat(agentFloatIns) + numAmountInKES)
            }
          }
        });

        // Update MFChamp account
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: acChamp,
              balance: Math.floor(ChampCommission + balancesx)
            }
          }
        });
        
        Alert.alert(t.withdrawnSuccess.replace('{{name}}', names).replace('{{amount}}', formatAmountSync(numAmountInKES, userCurrencyKey)).replace('{{nsndogo}}', namess));
      }
    } catch (error) {
      console.log(error);
      Alert.alert(t.checkYourInternet);
    } finally {
      setIsLoading(false);
      setAmount("");
      setUsrPWd("");
      setAgentPhn("");
      setChmKntct("");
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8ff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>{t.fillDetailsBelow}</Text>
          </View>

          <View style={styles.sendAmtView}>
            <Text style={styles.sendAmtText}>{t.nsndogoNumber}</Text>
            <TextInput
              placeholder={t.nsndogoNumberPlaceholder}
              value={AgentPhn}
              onChangeText={setAgentPhn}
              style={styles.sendAmtInput}
              editable={!isLoading}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.sendAmtView}>
            <Text style={styles.sendAmtText}>{t.chamaAccount}</Text>
            <TextInput
              placeholder={t.chamaAccountPlaceholder}
              value={ChmKntct}
              onChangeText={setChmKntct}
              style={styles.sendAmtInput}
              editable={!isLoading}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.sendAmtView}>
            <Text style={styles.sendAmtText}>{t.amount}</Text>
            <TextInput
              keyboardType={"decimal-pad"}
              placeholder={t.amountPlaceholder}
              value={amount}
              onChangeText={handleMoneyInput(setAmount)}
              onBlur={() => formatMoneyOnBlur(amount, setAmount)}
              style={styles.sendAmtInput}
              editable={!isLoading}
            />
          </View>

          <View style={styles.sendAmtView}>
            <Text style={styles.sendAmtText}>{t.chamaPassword}</Text>
            <TextInput
              placeholder={t.chamaPasswordPlaceholder}
              value={UsrPWd}
              onChangeText={setUsrPWd}
              secureTextEntry={true}
              style={styles.sendAmtInput}
              editable={!isLoading}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            onPress={fetchChmDtls}
            style={[styles.sendAmtButton, isLoading && { opacity: 0.6 }]}
            disabled={isLoading || !AgentPhn || !ChmKntct || !amount || !UsrPWd}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendAmtButtonText}>{t.clickToWithdraw}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default SMADepositForm;