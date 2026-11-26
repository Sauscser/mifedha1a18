import React, { useEffect, useState } from 'react';
import { createMFKOfferz, updateSMAccount } from '../../../src/graphql/mutations';
import { getAgent, getGroup, getSMAccount } from '../../../src/graphql/queries';
import Communications from 'react-native-communications';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styles from './styles';
import { updateBankAdmin } from '../../../src/graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { convertForeignToChf, countryToCurrency, getExRatesForNationality } from '../../../src/utils/exchange';
import { generateClient } from "aws-amplify/api";
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
const client = generateClient();
const UpdtMFNPW = props => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split(/[-_]/)[0] : 'en';
  const t = translations[lang] || translations.en;
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
  const [SigntryPW, setSigntryPW] = useState("");
  const [AdminID, setAdminId] = useState("");
  const [LnAcCod, setLnAcCod] = useState("");
  const [MFNS, setMFNS] = useState("");
  const [NewAdmnPW, setNewAdmnPW] = useState("");
  const [OldAdmnPW, setOldAdmnPW] = useState("");
  const [OfferStatus, setOfferStatus] = useState("");
  const [MFChamp, setMFChamp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ownr, setownr] = useState(null);
  const [names, setName] = useState(null);
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
  const fetchMFNDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    try {
      if (!nationality) {
        Alert.alert(t.currencyUnavailable);
        setIsLoading(false);
        return;
      }
      const MFNDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: AdminID
        }
      });
      const TtlClrdLonsAmtSllrCovs = MFNDtls.data.getSMAccount.TtlClrdLonsAmtSllrCov;
      const MFKubwaCosts = MFNDtls.data.getSMAccount.MFKubwaCost;
      const MFKubwaNetCosts = MFNDtls.data.getSMAccount.MFKubwaNetCost;
      const namezs = MFNDtls.data.getSMAccount.name;
      const phonecontact = MFNDtls.data.getSMAccount.phonecontact;
      const costInput = Number(NewAdmnPW);
      const paidInput = Number(SigntryPW);
      const mfnOfferedInput = Number(MFNS);
      if (!Number.isFinite(costInput) || costInput < 0) {
        Alert.alert("Invalid cost", "Enter a valid account cost");
        setIsLoading(false);
        return;
      }
      if (!Number.isFinite(paidInput) || paidInput < 0) {
        Alert.alert("Invalid payment", "Enter a valid amount paid");
        setIsLoading(false);
        return;
      }
      if (!Number.isFinite(mfnOfferedInput) || mfnOfferedInput < 0) {
        Alert.alert("Invalid MFNs", "Enter a valid number of MFNs");
        setIsLoading(false);
        return;
      }
      let costChf = 0;
      let paidChf = 0;
      try {
        costChf = costInput === 0 || currencyIso === 'CHF'
          ? costInput
          : await convertForeignToChf(costInput, nationality);
        paidChf = paidInput === 0 || currencyIso === 'CHF'
          ? paidInput
          : await convertForeignToChf(paidInput, nationality);
      } catch (error) {
        console.log(error);
        Alert.alert(t.currencyUnavailable);
        setIsLoading(false);
        return;
      }
      const fetchBankAdminDtls = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          const MFNDtlsxz: any = await client.graphql({
            query: getGroup,
            variables: {
              grpContact: MFChamp
            }
          });
          const BankAdminEmail = MFNDtlsxz.data.getGroup.BankAdminEmail;
          const updtMFNDtls = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            try {
              await client.graphql({
                query: updateSMAccount,
                variables: {
                  input: {
                    awsemail: AdminID,
                    MFKubwaCost: costChf + parseFloat(MFKubwaCosts),
                    MFKubwaNetCost: paidChf + parseFloat(MFKubwaNetCosts),
                    TtlClrdLonsAmtSllrCov: parseFloat(TtlClrdLonsAmtSllrCovs) + 1
                  }
                }
              });
            } catch (error) {
              if (error) {
                console.log(error);
                Alert.alert("Update failed", "Addition unsuccessful; retry");
                return;
              }
            }
            setIsLoading(false);
            await CreateNewSAOffer();
          };
          const CreateNewSAOffer = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            try {
              await client.graphql({
                query: createMFKOfferz,
                variables: {
                  input: {
                    offerStatus: "OnOffer",
                    acCost: costChf,
                    amtPaid: paidChf,
                    mfnOffered: mfnOfferedInput,
                    /* group account number */
                    acChamp: MFChamp,
                    mfnReg: 0,
                    status: "AccountActive",
                    mfkAc: AdminID,
                    acMainAc: LnAcCod
                  }
                }
              });
            } catch (error) {
              console.log(error);
              if (error) {
                Alert.alert("Registration failed", "Registration unsuccessful; retry");
                return;
              }
            }
            setIsLoading(false);
            Alert.alert("NSKubwa creation successfully authorised");
            Communications.textWithoutEncoding(phonecontact, 'Hi ' + namezs + '. Your application to create NSKubwa account ' + LnAcCod + ' has been approved. Please proceed to create your NSKubwa account on NiSenti App');
          };
          if (BankAdminEmail !== attributes.email) {
            Alert.alert("Your are not the Bank Supervisor of the group");
            return;
          } else {
            await updtMFNDtls();
          }
        } catch (error) {
          if (error) {
            console.log(error);
            Alert.alert("Retry1! or update app or call customer care");
            return;
          }
        }
        setIsLoading(false);
      };
      await fetchBankAdminDtls();
    } catch (error) {
      console.log(error);
      if (error) {
        Alert.alert("Error2! Retry or update app or call customer care");
        setIsLoading(false);
        return;
      }
    }
    setIsLoading(false);
    setNewAdmnPW("");
    setSigntryPW("");
    setOldAdmnPW("");
    setAdminId("");
    setLnAcCod("");
    setMFNS("");
    setMFChamp("");
    setOfferStatus("");
  };
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={48}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.accent} />
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.description}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t.phoneLabel}</Text>
            <TextInput
              placeholder={t.phonePlaceholder}
              placeholderTextColor="#829DA8"
              value={LnAcCod}
              onChangeText={setLnAcCod}
              style={styles.input}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.groupAccountLabel}</Text>
            <TextInput
              placeholder={t.groupAccountPlaceholder}
              placeholderTextColor="#829DA8"
              value={MFChamp}
              onChangeText={setMFChamp}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.adminEmailLabel}</Text>
            <TextInput
              placeholder={t.adminEmailPlaceholder}
              placeholderTextColor="#829DA8"
              value={AdminID}
              onChangeText={setAdminId}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{`${t.accountCostLabel} (${currencySymbol || '...'})`}</Text>
            <TextInput
              placeholder={`${t.accountCostPlaceholder} (${currencySymbol || '...'})`}
              placeholderTextColor="#829DA8"
              value={NewAdmnPW}
              keyboardType="decimal-pad"
              onChangeText={setNewAdmnPW}
              style={styles.input}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{`${t.amountPaidLabel} (${currencySymbol || '...'})`}</Text>
            <TextInput
              placeholder={`${t.amountPaidPlaceholder} (${currencySymbol || '...'})`}
              placeholderTextColor="#829DA8"
              value={SigntryPW}
              onChangeText={setSigntryPW}
              keyboardType="decimal-pad"
              style={styles.input}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t.ndogoCountLabel}</Text>
            <TextInput
              placeholder={t.ndogoCountPlaceholder}
              placeholderTextColor="#829DA8"
              value={MFNS}
              onChangeText={setMFNS}
              style={styles.input}
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            onPress={fetchMFNDtls}
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading && <ActivityIndicator size="small" color="#143D4D" style={styles.buttonIndicator} />}
            <Text style={styles.buttonText}>{isLoading ? t.approvingButton : t.approveButton}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};
export default UpdtMFNPW;