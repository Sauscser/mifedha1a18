import React, { useEffect, useState } from 'react';
import { createFloatAdd, updateAgent, updateCompany, updateGroup, updateSAgent, updateSMAccount } from '../../../src/graphql/mutations';
import styles from './styles';
import { getAgent, getCompany, getGroup, getSAgent, getSMAccount } from '../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();
const SMADepositForm = props => {
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
        setUserNationality(userData.data.getSMAccount.nationality);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);
  const fetchChmDtls = async () => {
    if (isLoading) return;
    
    // Convert amount to KES
    const amountForeign = parseAmountInput(amount);
    const amountInKES = convertForeignToKsh(amountForeign, userCurrencyKey, ratesMap);

    // Confirmation prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Withdrawal',
        `You are about to withdraw ${formatAmountSync(amountInKES, userCurrencyKey, ratesMap)} from the chama account. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Withdraw', onPress: () => resolve(true) }
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
      const AgentCommission = parseFloat(MFNWithdrwlFees) * amountInKES * parseFloat(UsrWthdrwlFeess);
      const saCommission = parseFloat(MFKWithdrwlFees) * amountInKES * parseFloat(UsrWthdrwlFeess);
      const compCommission = parseFloat(companyComs) * amountInKES * parseFloat(UsrWthdrwlFeess);
      const UsrWithdrawalFee = AgentCommission + saCommission;
      const TTlAmtTrnsctd = amountInKES + UsrWithdrawalFee;
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
        Alert.alert("Let signatory 2 confirm withdrawal first");
      } else if (parseFloat(WithdrawCnfrmtnAmt) !== amountInKES) {
        Alert.alert(`Enter amount agreed with signatory 2. Expected: ${formatAmountSync(parseFloat(WithdrawCnfrmtnAmt), userCurrencyKey, ratesMap)}`);
      } else if (WithdrawCnfrmtn2 === "NO") {
        Alert.alert("Let signatory 3 confirm withdrawal first");
      } else if (parseFloat(WithdrawCnfrmtnAmt2) !== amountInKES) {
        Alert.alert(`Enter amount agreed with signatory 3. Expected: ${formatAmountSync(parseFloat(WithdrawCnfrmtnAmt2), userCurrencyKey, ratesMap)}`);
      } else if (TTlAmtTrnsctd > parseFloat(grpBals)) {
        Alert.alert(`Insufficient Chama Balance. Available: ${formatAmountSync(parseFloat(grpBals), userCurrencyKey, ratesMap)}`);
      } else if (usrStts === "AccountInactive") {
        Alert.alert("Chama Account has been deactivated");
      } else if (user.userId !== owners) {
        Alert.alert("You are not the main chama signitory");
      } else if (AgAcAct === "AccountInactive") {
        Alert.alert("MFNdogo Account has been deactivated");
      } else if (UsrPWd !== pws) {
        Alert.alert("User credentials are wrong; access denied");
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
              amount: amountInKES.toFixed(0),
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
              WithdrawalSync: (parseFloat(WithdrawalSync) + TTlAmtTrnsctd).toFixed(0),
              grpBal: (parseFloat(grpBals) - TTlAmtTrnsctd).toFixed(0),
              ttlWthdrwn: (parseFloat(ttlWthdrwns) + amountInKES).toFixed(0),
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
              ttlEarnings: (parseFloat(ttlEarningssss) + AgentCommission).toFixed(0),
              agentEarningBal: (parseFloat(agentEarningBalsss) + AgentCommission).toFixed(0),
              floatBal: (parseFloat(floatBals) + amountInKES).toFixed(0),
              TtlFltIn: (parseFloat(TtlFltInsss) + amountInKES).toFixed(0)
            }
          }
        });

        // Update SAgent
        await client.graphql({
          query: updateSAgent,
          variables: {
            input: {
              saPhoneContact: sagentregnos,
              TtlEarnings: (parseFloat(TtlEarningss) + saCommission).toFixed(0),
              saBalance: (parseFloat(saBalances) + saCommission).toFixed(0)
            }
          }
        });

        // Update Company
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "BaruchHabaB'ShemAdonai2",
              agentEarningBal: parseFloat(agentEarningBals) + AgentCommission,
              agentEarning: parseFloat(agentEarnings) + AgentCommission,
              saEarningBal: parseFloat(saEarningBals) + saCommission,
              saEarning: parseFloat(saEarnings) + saCommission,
              ttlUserWthdrwl: parseFloat(ttlUserWthdrwls) + amountInKES,
              agentFloatIn: parseFloat(agentFloatIns) + amountInKES
            }
          }
        });

        // Update MFChamp account
        await client.graphql({
          query: updateSMAccount,
          variables: {
            input: {
              awsemail: acChamp,
              balance: (ChampCommission + balancesx).toFixed(0)
            }
          }
        });
        
        Alert.alert(`${names} has withdrawn ${formatAmountSync(amountInKES, userCurrencyKey, ratesMap)} from ${namess} MFNdogo`);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Check your internet connection");
    } finally {
      setIsLoading(false);
      setAmount("");
      setUsrPWd("");
      setAgentPhn("");
      setChmKntct("");
    }
  };
  return <ScrollView>
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>Fill Details Below</Text>
          </View>
      

          <View style={styles.sendAmtView}>
            <TextInput placeholder="+2547xxxxxxxx" value={AgentPhn} onChangeText={setAgentPhn} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>MFNdogo Number</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput value={ChmKntct} onChangeText={setChmKntct} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Chama Account</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} value={amount} onChangeText={handleMoneyInput(setAmount)} onBlur={() => formatMoneyOnBlur(amount, setAmount)} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Amount</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput value={UsrPWd} onChangeText={setUsrPWd} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Chama PassWord</Text>
          </View>

          <TouchableOpacity onPress={fetchChmDtls} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>Click to Withdraw</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>
        </ScrollView>;
};
export default SMADepositForm;