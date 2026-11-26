// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { createFloatReduction, updateAgent, updateCompany, updateGroup } from '../../../src/graphql/mutations';
import { getAgent, getCompany, getGroup, getSMAccount } from '../../../src/graphql/queries';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

import { convertForeignToChf, countryToCurrency, getExRatesForNationality } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

const client = generateClient();
const SMADepositForm = props => {
  const [nationalId, setNationalid] = useState("");
  const [agPWd, setAgPWd] = useState("");
  const [AgentPhn, setAgentPhn] = useState("");
  const [amount, setAmount] = useState("");
  const [UsrId, setUsrId] = useState("");
  const [showSignatoryId, setShowSignatoryId] = useState(false);
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ownr, setownr] = useState(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [foreignPerChf, setForeignPerChf] = useState<number | null>(null);
  
  const userCountryCode = nationalityToCode(userNationality)
    || (userNationality?.trim().length === 2 ? userNationality.trim().toUpperCase() : undefined);
  const currencyIso = userCountryCode ? countryToCurrency[userCountryCode] : undefined;
  const defaultCurrencySymbol = currencyIso === 'KES' ? 'KSh'
    : currencyIso === 'USD' ? '$'
      : currencyIso === 'GBP' ? '£'
        : currencyIso === 'EUR' ? '€'
          : currencyIso === 'CHF' ? 'CHF'
            : currencyIso || '';

  const formatChfInUserCurrency = (amountChf: number) => {
    if (currencyIso === 'CHF') return `CHF ${amountChf.toFixed(2)}`;
    if (!Number.isFinite(foreignPerChf) || foreignPerChf === null) {
      return `${currencySymbol || currencyIso || ''} ${amountChf.toFixed(2)}`.trim();
    }
    return `${currencySymbol || currencyIso} ${(amountChf * foreignPerChf).toFixed(2)}`;
  };

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
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setownr(user.userId);
      
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
    fetchUser();
  }, []);
  useEffect(() => {
    let isCurrent = true;
    setCurrencySymbol(defaultCurrencySymbol);
    setForeignPerChf(currencyIso === 'CHF' ? 1 : null);
    if (userNationality && currencyIso && currencyIso !== 'CHF') {
      getExRatesForNationality(userNationality).then(rates => {
        if (!isCurrent || !rates) return;
        const rate = Number(rates.buyingPrice);
        if (Number.isFinite(rate) && rate > 0) setForeignPerChf(rate);
        if (rates.symbol && !(rates.symbol === 'Ksh' && currencyIso !== 'KES')) {
          setCurrencySymbol(rates.symbol);
        }
      }).catch(error => {
        console.warn('Unable to load currency display rate for Chama deposit:', error);
      });
    }
    return () => {
      isCurrent = false;
    };
  }, [userNationality, currencyIso, defaultCurrencySymbol]);
  const fetchAcDtls = async () => {
    if (isLoading) return;
    
    const amountForeign = parseAmountInput(amount);
    if (!Number.isFinite(amountForeign) || amountForeign <= 0) {
      Alert.alert('Invalid amount', 'Enter a deposit amount greater than zero.');
      return;
    }
    if (!userNationality) {
      Alert.alert('Currency unavailable', 'Your account currency is not available yet. Please try again.');
      return;
    }

    if (!currencyIso) {
      Alert.alert('Currency unavailable', 'Your account currency could not be identified. Please try again.');
      return;
    }

    let amountChf: number;
    try {
      amountChf = currencyIso === 'CHF'
        ? amountForeign
        : await convertForeignToChf(amountForeign, userNationality);
      if (!Number.isFinite(amountChf) || amountChf <= 0) throw new Error('The converted deposit amount is invalid.');
    } catch (error) {
      console.error('Failed to convert Chama deposit amount:', error);
      Alert.alert('Currency conversion failed', 'Please check your exchange rate and try again.');
      return;
    }
    if (currencyIso !== 'CHF' && (!Number.isFinite(foreignPerChf) || foreignPerChf === null)) {
      Alert.alert('Currency unavailable', 'A display exchange rate is not available yet. Please try again.');
      return;
    }

    // Confirmation prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Confirm Deposit',
        `You are about to deposit ${currencySymbol || currencyIso} ${amountForeign.toFixed(2)} to the Chama account. Continue?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Deposit', onPress: () => resolve(true) }
        ]
      );
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const ChamaDtl: any = await client.graphql({
        query: getGroup,
        variables: {
          grpContact: nationalId
        }
      });
      const {
        grpBal,
        ttlDpst,
        status,
        grpName,
        SignitoryNatid
      } = ChamaDtl.data.getGroup;
      const AgentBal: any = await client.graphql({
        query: getAgent,
        variables: {
          phonecontact: AgentPhn
        }
      });
      const {
        TtlFltOut,
        floatBal,
        pw,
        name,
        status: AgStatus
      } = AgentBal.data.getAgent;
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: ""
        }
      });
      const {
        ttlUsrDep,
        agentFloatOut
      } = compDtls.data.getCompany;

      // Validation checks
      if (status === "AccountInactive") {
        Alert.alert("User Account is inactive");
      } else if (SignitoryNatid !== UsrId) {
        Alert.alert("Depositer ID is wrong");
      } else if (AgStatus === "AccountInactive") {
        Alert.alert("NSNdogo Account is Inactive");
      } else if (parseFloat(floatBal) < amountChf) {
        Alert.alert(`Insufficient NSNdogo Balance: ${formatChfInUserCurrency(parseFloat(floatBal))}`);
      } else if (pw !== agPWd) {
        Alert.alert("NSNdogo access denied");
      } else {
        // Create Float Reduction
        await client.graphql({
          query: createFloatReduction,
          variables: {
            input: {
              depositerid: nationalId,
              agContact: AgentPhn,
              agentName: name,
              userName: grpName,
              amount: amountChf.toFixed(2),
              status: 'AccountActive'
            }
          }
        });

        // Update Group
        await client.graphql({
          query: updateGroup,
          variables: {
            input: {
              grpContact: nationalId,
              grpBal: (parseFloat(grpBal) + amountChf).toFixed(2),
              ttlDpst: (parseFloat(ttlDpst) + amountChf).toFixed(2)
            }
          }
        });

        // Update Agent
        await client.graphql({
          query: updateAgent,
          variables: {
            input: {
              phonecontact: AgentPhn,
              TtlFltOut: (parseFloat(TtlFltOut) + amountChf).toFixed(2),
              floatBal: (parseFloat(floatBal) - amountChf).toFixed(2)
            }
          }
        });

        // Update Company
        await client.graphql({
          query: updateCompany,
          variables: {
            input: {
              AdminId: "",
              ttlUsrDep: parseFloat(ttlUsrDep) + amountChf,
              agentFloatOut: parseFloat(agentFloatOut) + amountChf
            }
          }
        });
        
        Alert.alert(`${currencySymbol || currencyIso} ${amountForeign.toFixed(2)} deposited in ${grpName}'s account`);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error! Please check your internet connection or retry.");
    } finally {
      setIsLoading(false);
      setNationalid("");
      setAmount("");
      setAgPWd("");
      setAgentPhn("");
      setUsrId("");
    }
  };
  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={48}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.accent} />
        <Text style={styles.title}>Chama Deposit</Text>
        <Text style={styles.subtitle}>Enter the account and deposit details below.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Chama Phone Number</Text>
          <TextInput
            placeholder="+2547xxxxxxxx"
            placeholderTextColor="#829DA8"
            value={nationalId}
            onChangeText={setNationalid}
            style={styles.input}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Signatory ID</Text>
          <View style={styles.secretInputContainer}>
            <TextInput
              value={UsrId}
              onChangeText={setUsrId}
              secureTextEntry={!showSignatoryId}
              style={[styles.input, styles.secretInput]}
              placeholder="Enter signatory ID"
              placeholderTextColor="#829DA8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowSignatoryId(visible => !visible)}
              style={styles.visibilityToggle}
              accessibilityRole="button"
              accessibilityLabel={showSignatoryId ? 'Hide signatory ID' : 'Show signatory ID'}
            >
              <Text style={styles.visibilityToggleText}>{showSignatoryId ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>NSNdogo Phone</Text>
          <TextInput
            placeholder="+2547xxxxxxxx"
            placeholderTextColor="#829DA8"
            value={AgentPhn}
            onChangeText={setAgentPhn}
            style={styles.input}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Amount ({currencySymbol || currencyIso || '...'})</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={handleMoneyInput(setAmount)}
            onBlur={() => formatMoneyOnBlur(amount, setAmount)}
            style={styles.input}
            placeholder={`Enter deposit amount (${currencySymbol || currencyIso || '...'})`}
            placeholderTextColor="#829DA8"
            editable={!isLoading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>NSNdogo Password</Text>
          <View style={styles.secretInputContainer}>
            <TextInput
              value={agPWd}
              onChangeText={setAgPWd}
              secureTextEntry={!showAgentPassword}
              style={[styles.input, styles.secretInput]}
              placeholder="Enter NSNdogo password"
              placeholderTextColor="#829DA8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowAgentPassword(visible => !visible)}
              style={styles.visibilityToggle}
              accessibilityRole="button"
              accessibilityLabel={showAgentPassword ? 'Hide NSNdogo password' : 'Show NSNdogo password'}
            >
              <Text style={styles.visibilityToggleText}>{showAgentPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={fetchAcDtls}
          style={[styles.button, isLoading && styles.buttonDisabled]}
          disabled={isLoading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ busy: isLoading, disabled: isLoading }}
        >
          {isLoading && <ActivityIndicator size="small" color="#143D4D" style={styles.buttonIndicator} />}
          <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Deposit to Chama'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};
export default SMADepositForm;