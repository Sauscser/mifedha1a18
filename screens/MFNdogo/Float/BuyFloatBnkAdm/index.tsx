import React, { useEffect, useState } from 'react';
import { createFloatPurchase, updateAgent, updateCompany } from '../../../../src/graphql/mutations';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
import { getAgent, getBankAdmin, getCompany, getMiFedhaBankAdmin } from '../../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { convertForeignToChf, countryToCurrency, getExRatesForNationality } from '../../../../src/utils/exchange';
import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
const client = generateClient();
export type buyAgntFlts = {
  amt: number;
  fltBal1: number;
  ttlFltBal1: number;
};
const BuyFlt = (props: buyAgntFlts) => {
  const { nationality } = useExchange();
  const countryCode = nationalityToCode(nationality)
    || (nationality?.trim().length === 2 ? nationality.trim().toUpperCase() : undefined);
  const currencyIso = countryCode ? countryToCurrency[countryCode] : undefined;
  const defaultCurrencySymbol = currencyIso === 'KES' ? 'KSh'
    : currencyIso === 'USD' ? '$'
      : currencyIso === 'GBP' ? '£'
        : currencyIso === 'EUR' ? '€'
          : currencyIso === 'CHF' ? 'CHF'
            : currencyIso || '';
  const [currencySymbol, setCurrencySymbol] = useState(defaultCurrencySymbol);
  const [amt, setAmt] = useState("");
  const [phoneContact, setPhoneContact] = useState("");
  const [bankAdminId, setBankAdminId] = useState("");
  const [transId, setTransId] = useState("");
  const [pwss, setpwss] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    let isCurrent = true;
    setCurrencySymbol(defaultCurrencySymbol);
    if (nationality) {
      getExRatesForNationality(nationality).then(rates => {
        if (!isCurrent || !rates?.symbol) return;
        const symbol = rates.symbol === 'Ksh' && currencyIso !== 'KES'
          ? defaultCurrencySymbol
          : rates.symbol;
        setCurrencySymbol(symbol || defaultCurrencySymbol);
      });
    }
    return () => {
      isCurrent = false;
    };
  }, [defaultCurrencySymbol, currencyIso, nationality]);
  const ftchAgInfo = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const amountEntered = Number(amt);
    if (!Number.isFinite(amountEntered) || amountEntered <= 0) {
      Alert.alert("Invalid amount", "Enter a valid float amount");
      setIsLoading(false);
      return;
    }
    if (!nationality) {
      Alert.alert("Currency unavailable", "Your account currency is not available yet. Please try again.");
      setIsLoading(false);
      return;
    }
    let amountChf: number;
    try {
      const convertedAmount = currencyIso === 'CHF'
        ? amountEntered
        : await convertForeignToChf(amountEntered, nationality);
      amountChf = Number(convertedAmount.toFixed(2));
    } catch (error) {
      console.log(error);
      Alert.alert("Currency unavailable", "A valid CHF exchange rate could not be found. Please try again.");
      setIsLoading(false);
      return;
    }
    if (!transId) {
      Alert.alert("Missing transaction ID", "Please enter a transaction ID");
      setIsLoading(false);
      return;
    }
    try {
      const agntBal: any = await client.graphql({
        query: getAgent,
        variables: {
          phonecontact: phoneContact
        }
      });
      const fltBal = agntBal.data.getAgent.floatBal;
      const ttlFltIn = agntBal.data.getAgent.TtlFltIn;
      const Stts = agntBal.data.getAgent.status;
      const names = agntBal.data.getAgent.name;
      const ftchCompInfo = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          const CompFltBal: any = await client.graphql({
            query: getCompany,
            variables: {
              AdminId: ""
            }
          });
          const CompFtBal = CompFltBal.data.getCompany.agentFloatIn;
          const ftchAdmiInfo = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            try {
              const CompFltBal: any = await client.graphql({
                query: getMiFedhaBankAdmin,
                variables: {
                  nationalid: bankAdminId
                }
              });
              const nationalids = CompFltBal.data.getMiFedhaBankAdmin.nationalid;
              const pws = CompFltBal.data.getMiFedhaBankAdmin.pw;
              const buyAgntFlt = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  await client.graphql({
                    query: createFloatPurchase,
                    variables: {
                      input: {
                        agentphone: phoneContact,
                        amount: String(amountChf),
                        transactId: transId,
                        bankAdminID: bankAdminId,
                        status: "AccountActive",
                        owner: userInfo.userId
                      }
                    }
                  });
                } catch (error) {
                  if (error) {
                    Alert.alert("Purchase failed", "Retry or check your connection");
                    return;
                  }
                }
                await updtAgntFlt();
                setIsLoading(false);
              };
              if (Stts !== "AccountActive") {
                Alert.alert("Your NSNdogo account has been deactivated");
              } else if (bankAdminId === nationalids && pws !== pwss) {
                Alert.alert("Admin password is wrong");
              } else if (bankAdminId !== nationalids) {
                Alert.alert("Admin does not exist");
              } else {
                buyAgntFlt();
              }
              const updtAgntFlt = async () => {
                if (isLoading) {
                  return;
                }
                try {
                  await client.graphql({
                    query: updateAgent,
                    variables: {
                      input: {
                        phonecontact: phoneContact,
                        floatBal: amountChf + parseFloat(fltBal),
                        TtlFltIn: amountChf + parseFloat(ttlFltIn)
                      }
                    }
                  });
                } catch (error) {
                  console.log('Error creating account', error);
                }
                await updtCompFlt();
                setIsLoading(false);
              };
              const updtCompFlt = async () => {
                if (isLoading) {
                  return;
                }
                try {
                  await client.graphql({
                    query: updateCompany,
                    variables: {
                      input: {
                        AdminId: "",
                        agentFloatIn: amountChf + parseFloat(CompFtBal)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    Alert.alert("Please check your internet connection");
                  }
                  ;
                }
                Alert.alert("Float purchase successful", names + " has loaded " + (currencySymbol || currencyIso || '') + " " + amountEntered.toFixed(2));
                setIsLoading(false);
              };
            } catch (error) {
              console.log(error);
              if (error) {
                Alert.alert("Admin Account doesnt exist or is inactive");
                return;
              }
            }
            setIsLoading(false);
          };
          await ftchAdmiInfo();
        } catch (e) {
          if (e) {
            Alert.alert("Retry or update app or call customer care");
            return;
          }
        }
        setIsLoading(false);
      };
      await ftchCompInfo();
    } catch (e) {
      if (e) {
        Alert.alert("NSNdogo does not exist");
        return;
      }
    }
    setAmt("");
    setBankAdminId("");
    setPhoneContact('');
    setTransId("");
    setpwss("");
    setIsLoading(false);
  };
  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={90}
      keyboardShouldPersistTaps="handled"
    >
        <View style={styles.card}>
          <View style={styles.accent} />
          <Text style={styles.title}>Top Up Float</Text>

          <View style={styles.field}>
            <Text style={styles.label}>NiSenti Ndogo phone</Text>
            <TextInput
              placeholder="+2547xxxxxxxx"
              placeholderTextColor="#829DA8"
              value={phoneContact}
              onChangeText={setPhoneContact}
              style={styles.input}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Amount ({currencySymbol || '...'})</Text>
            <TextInput
              placeholder={`Enter float amount (${currencySymbol || '...'})`}
              placeholderTextColor="#829DA8"
              keyboardType="decimal-pad"
              value={amt}
              onChangeText={setAmt}
              style={styles.input}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bank Admin ID</Text>
            <TextInput
              placeholder="Enter admin ID"
              placeholderTextColor="#829DA8"
              value={bankAdminId}
              onChangeText={setBankAdminId}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Admin password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Enter admin password"
                placeholderTextColor="#829DA8"
                value={pwss}
                onChangeText={setpwss}
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(visible => !visible)}
                style={styles.passwordToggle}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide admin password' : 'Show admin password'}
              >
                <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Transaction ID</Text>
            <TextInput
              placeholder="Enter transaction ID"
              placeholderTextColor="#829DA8"
              value={transId}
              onChangeText={setTransId}
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            onPress={ftchAgInfo}
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading && <ActivityIndicator color="#143D4D" size="small" style={{ marginRight: 10 }} />}
            <Text style={styles.buttonText}>{isLoading ? 'Processing...' : 'Buy Float'}</Text>
          </TouchableOpacity>
        </View>
    </KeyboardAwareScrollView>
  );
};
export default BuyFlt;