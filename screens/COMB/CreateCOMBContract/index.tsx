import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { createCombContract, createMessages, sendNotification } from "../../../src/graphql/mutations";
import { getBizna, getSMAccount, listCombPersonels } from "../../../src/graphql/queries";
import { useExchange } from "../../../src/contexts/ExchangeContext";
import { formatAmountSync, convertKshToUserCurrency } from "../../../src/utils/exchange";
import { nationalityToCode } from "../../../src/utils/nationalityToCode";
import { useTranslation } from 'react-i18next';
import translations from './translation';

/* ---------------- TYPES ---------------- */
type PartyType = "funderTypePal" | "funderTypeBiz";
type PartyType2 = "consumerTypePal" | "consumerTypeBiz";
type PrePostPay = "PREPAID" | "POSTPAID";
type PriceFlag = "NORMAL" | "ABOVE_REFERENCE" | "SUSPICIOUS" | "FRAUD_RISK" | "NO_MARKET_DATA";
type FormState = {
  consumerType: PartyType2;
  consumerEmail?: string;
  consumerOfficerEmail?: string;
  consumerAccount?: string;
  funderType: PartyType;
  funderEmail?: string;
  funderOfficerEmail?: string;
  funderAccount?: string;
  capConsumption: boolean;
  consumptionCapping?: string;
  consumptionMargin?: string;
  updateFrequency?: string;
  repaymentPeriod?: string;
  MiFedhaMarketDev?: string;
  allMarketDev?: string;
  pword?: string;
};

/* ---------------- COMPONENT ---------------- */
const client = generateClient();
const CreateCombContractScreen: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    consumerType: "consumerTypePal",
    funderType: "funderTypePal",
    capConsumption: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sellerNationality, setSellerNationality] = useState<string | null>(null);
  const { nationality, ratesMap } = useExchange();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const update = <K extends keyof FormState,>(k: K, v: FormState[K]) => setForm(p => ({
    ...p,
    [k]: v
  }));

  /* ---------------- FETCH SELLER NATIONALITY (when consumer changes) ---------------- */
  useEffect(() => {
    const fetchSellerNat = async () => {
      try {
        if (form.consumerType === "consumerTypePal" && form.consumerEmail) {
          const res: any = await client.graphql({
            query: getSMAccount,
            variables: { awsemail: form.consumerEmail }
          });
          setSellerNationality(res?.data?.getSMAccount?.nationality || null);
        } else if (form.consumerType === "consumerTypeBiz" && form.consumerAccount && form.consumerOfficerEmail) {
          const bizRes: any = await client.graphql({
            query: getBizna,
            variables: { BusKntct: form.consumerAccount }
          });
          const email = bizRes?.data?.getBizna?.email;
          if (email) {
            const smRes: any = await client.graphql({
              query: getSMAccount,
              variables: { awsemail: email }
            });
            setSellerNationality(smRes?.data?.getSMAccount?.nationality || null);
          } else {
            setSellerNationality(null);
          }
        } else {
          setSellerNationality(null);
        }
      } catch (err) {
        console.warn('Could not fetch seller nationality', err);
        setSellerNationality(null);
      }
    };
    fetchSellerNat();
  }, [form.consumerType, form.consumerEmail, form.consumerAccount, form.consumerOfficerEmail]);
  const getRequiredFields = (form: FormState) => {
    const required: {
      field: keyof FormState;
      label: string;
    }[] = [];
    if (form.consumerType === "consumerTypePal") {
      required.push({
        field: "consumerEmail",
        label: "Consumer Email"
      });
    } else {
      required.push({
        field: "consumerAccount",
        label: "Consumer Business Account"
      }, {
        field: "consumerOfficerEmail",
        label: "Consumer Officer Email"
      });
    }
    return required;
  };
  // ---------------- STYLES ----------------
  const styles = StyleSheet.create({
    container: {
      padding: 18
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      textAlign: "center",
      marginBottom: 12
    },
    label: {
      color: "#fff",
      marginBottom: 6
    },
    input: {
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12
    },
    row: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12
    },
    passwordRow: {
      flexDirection: "row",
      marginTop: 10,
      alignItems: "center"
    },
    eyeButton: {
      marginLeft: 8,
      backgroundColor: "#e58d29",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8
    },
    chip: {
      backgroundColor: "#fff",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8
    },
    chipActive: {
      backgroundColor: "#1b6cff"
    },
    chipText: {
      color: "#000"
    },
    button: {
      backgroundColor: "#1b6cff",
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 16
    },
    buttonText: {
      color: "#fff",
      fontWeight: "700"
    }
  });

  // ---------------- HANDLE CREATE CONTRACT ----------------
  const handleCreateContract = () => {
    // TODO: Implement contract creation logic
    Alert.alert('Create Contract', 'Contract creation logic goes here.');
  };

  return (
    <LinearGradient colors={["#e58d29", "skyblue"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View>
            {/* Consumer Type */}
            <Text style={styles.label}>{t.consumerTypeLabel}</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.chip, form.consumerType === "consumerTypePal" && styles.chipActive]}
                onPress={() => update("consumerType", "consumerTypePal")}
              >
                <Text style={styles.chipText}>{t.consumerTypeIndividual}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, form.consumerType === "consumerTypeBiz" && styles.chipActive]}
                onPress={() => update("consumerType", "consumerTypeBiz")}
              >
                <Text style={styles.chipText}>{t.consumerTypeBusiness}</Text>
              </TouchableOpacity>
            </View>
            {form.consumerType === "consumerTypePal" ? (
              <TextInput
                style={styles.input}
                placeholder={t.consumerEmailPlaceholder}
                value={form.consumerEmail}
                onChangeText={(v) => update("consumerEmail", v)}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder={t.consumerBusinessAccountPlaceholder}
                  value={form.consumerAccount}
                  onChangeText={(v) => update("consumerAccount", v)}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder={t.consumerOfficerEmailPlaceholder}
                  value={form.consumerOfficerEmail}
                  onChangeText={(v) => update("consumerOfficerEmail", v)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="off"
                />
              </View>
            )}
            {/* Funder Type */}
            <Text style={styles.label}>{t.funderTypeLabel}</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.chip, form.funderType === "funderTypePal" && styles.chipActive]}
                onPress={() => update("funderType", "funderTypePal")}
              >
                <Text style={styles.chipText}>{t.funderTypeIndividual}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, form.funderType === "funderTypeBiz" && styles.chipActive]}
                onPress={() => update("funderType", "funderTypeBiz")}
              >
                <Text style={styles.chipText}>{t.funderTypeBusiness}</Text>
              </TouchableOpacity>
            </View>
            {form.funderType === "funderTypePal" ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: "#fff", fontStyle: "italic" }}>{t.funderLoggedInInfo}</Text>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder={t.funderBusinessAccountPlaceholder}
                  value={form.funderAccount}
                  onChangeText={(v) => update("funderAccount", v)}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder={t.funderOfficerEmailPlaceholder}
                  value={form.funderOfficerEmail}
                  onChangeText={(v) => update("funderOfficerEmail", v)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="off"
                  textContentType="none"
                  importantForAutofill="no"
                  autoCorrect={false}
                />
              </View>
            )}
            {/* Consumption Mode */}
            <Text style={styles.label}>{t.consumptionModeLabel}</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.chip, !form.capConsumption && styles.chipActive]}
                onPress={() => update("capConsumption", false)}
              >
                <Text style={styles.chipText}>{t.noCapping}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, form.capConsumption && styles.chipActive]}
                onPress={() => update("capConsumption", true)}
              >
                <Text style={styles.chipText}>{t.setCapping}</Text>
              </TouchableOpacity>
            </View>
            {form.capConsumption && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder={t.consumptionCappingPlaceholder}
                  keyboardType="numeric"
                  value={form.consumptionCapping}
                  onChangeText={(v) => update("consumptionCapping", v)}
                />
                {form.consumptionCapping && sellerNationality && (
                  <View style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
                      💰 {t.sellerPriceDeviationMarginPlaceholder} ({sellerNationality}): {formatAmountSync(Number(form.consumptionCapping), nationalityToCode(sellerNationality), ratesMap || {})}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                      (Backend stored as: KES {form.consumptionCapping})
                    </Text>
                  </View>
                )}
                <TextInput
                  style={styles.input}
                  placeholder={t.sellerPriceDeviationMarginPlaceholder}
                  keyboardType="numeric"
                  value={form.consumptionMargin}
                  onChangeText={(v) => update("consumptionMargin", v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t.niSentiMarketDeviationMarginPlaceholder}
                  value={form.MiFedhaMarketDev}
                  onChangeText={(v) => update("MiFedhaMarketDev", v)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder={t.allMarketsPriceDeviationMarginPlaceholder}
                  keyboardType="numeric"
                  value={form.allMarketDev}
                  onChangeText={(v) => update("allMarketDev", v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t.voucherUpdateFrequencyPlaceholder}
                  value={form.updateFrequency}
                  onChangeText={(v) => update("updateFrequency", v)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder={t.paymentPeriodPlaceholder}
                  keyboardType="numeric"
                  value={form.repaymentPeriod}
                  onChangeText={(v) => update("repaymentPeriod", v)}
                />
              </View>
            )}
            <Text style={{marginTop:10}}>
              {t.mainAccountPasswordLabel}
            </Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={form.pword}
                placeholder={t.mainAccountPasswordPlaceholder}
                onChangeText={(v) => update("pword", v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((p) => !p)}
              >
                <Text style={{ color: "#fff", fontSize: 14 }}>
                  {showPassword ? t.hidePassword : t.showPassword}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleCreateContract}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t.createContractButton}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );

/* ---------------- STYLES ---------------- */
}
export default CreateCombContractScreen;