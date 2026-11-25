import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';

const MyLoanAccount = props => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const navigation = useNavigation();
  const [id, setID] = useState("");
  const [ChamaNMember, setChamaNMember] = useState("");
  const ItemAds = () => {
    navigation.navigate('ItemAds');
  };
  const VwPal2BizLners = () => {
    safeNavigateFrom(navigation, 'VwPal2BizLners');
  };
  const SI2VwBiz2PalLoanees = () => {
    safeNavigateFrom(navigation, 'SI2VwBiz2PalLoanees');
  };
  const SI2VwBiz2BizLoaners = () => {
    safeNavigateFrom(navigation, 'SI2VwBiz2BizLoaners');
  };
  const SI2VwBiz2BizLoanees = () => {
    safeNavigateFrom(navigation, 'SI2VwBiz2BizLoanees');
  };
  const SI2VwBiz2PalLoaners = () => {
    safeNavigateFrom(navigation, 'SI2VwBiz2PalLoaners');
  };
  const CrtBusinessss = () => {
    safeNavigateFrom(navigation, 'CrtBusinesss');
  };
  const SgnIn2VwBiznasss = () => {
    safeNavigateFrom(navigation, 'SgnIn2VwBiznass');
  };
  const ShareCredSlsRevsss = () => {
    safeNavigateFrom(navigation, 'ShareCredSlsRevss');
  };
  const AddPersonelss = () => {
    safeNavigateFrom(navigation, 'AddPersonels');
  };
  const RmvPersonnelsss = () => {
    safeNavigateFrom(navigation, 'RmvPersonnelss');
  };
  const SgnIn2RemoveSlAd = () => {
    safeNavigateFrom(navigation, 'SgnIn2RemoveSlAd');
  };
  const ViewBiznaShareRec = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRec');
  };
  const SgnIn2VwRevenueShare = () => {
    safeNavigateFrom(navigation, 'SgnIn2VwRevenueShare');
  };
  const PayCash = () => {
    safeNavigateFrom(navigation, 'P2BPayCash');
  };
  const VwPalLners = () => {
    safeNavigateFrom(navigation, 'VwPalLners');
  };
  const VwCashPaySent = () => {
    safeNavigateFrom(navigation, 'VwCashPaySent');
  };
  const SgnIn2VwCashSales = () => {
    safeNavigateFrom(navigation, 'SgnIn2VwCashSales');
  };
  const VwPal2BizLnees = () => {
    safeNavigateFrom(navigation, 'VwPal2BizLnees');
  };
  const VwPalLnees = () => {
    safeNavigateFrom(navigation, 'VwPalLnees');
  };
  const Vw2GrntPal2Biz = () => {
    safeNavigateFrom(navigation, 'Vw2GrntPal2Biz');
  };
  const BizUpdatePW = () => {
    safeNavigateFrom(navigation, 'BizUpdatePW');
  };
  const PersonelVw2GrntB2P = () => {
    safeNavigateFrom(navigation, 'PersonelVw2GrntB2P');
  };
  const BizCancelObjection = () => {
    safeNavigateFrom(navigation, 'BizCancelObjection');
  };
  const BizObject = () => {
    safeNavigateFrom(navigation, 'BizObject');
  };
  const AddBizBeneficiary = () => {
    safeNavigateFrom(navigation, 'AddBizBeneficiary');
  };
  const BizAddAdmin = () => {
    safeNavigateFrom(navigation, 'BizAddAdmin');
  };
  const DissolveBizsss = () => {
    safeNavigateFrom(navigation, 'DissolveBizss');
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>{t.updateBizAccount}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.accountAccess}</Text>
          <Pressable
            onPress={BizAddAdmin}
            style={({ pressed }) => [styles.actionButton, styles.primaryButton, pressed && styles.pressedButton]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{t.addAdmin}</Text>
          </Pressable>
          <Pressable
            onPress={BizUpdatePW}
            style={({ pressed }) => [styles.actionButton, styles.secondaryButton, pressed && styles.pressedButton]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>{t.changePassword}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.businessOperations}</Text>
          <Pressable
            onPress={BizObject}
            style={({ pressed }) => [styles.actionButton, styles.secondaryButton, pressed && styles.pressedButton]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>{t.stopOperations}</Text>
          </Pressable>
          <Pressable
            onPress={BizCancelObjection}
            style={({ pressed }) => [styles.actionButton, styles.primaryButton, pressed && styles.pressedButton]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>{t.allowOperations}</Text>
          </Pressable>
          <Pressable
            onPress={DissolveBizsss}
            style={({ pressed }) => [styles.actionButton, styles.destructiveButton, pressed && styles.pressedButton]}
            accessibilityRole="button"
          >
            <Text style={styles.destructiveButtonText}>{t.dissolveBusiness}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default MyLoanAccount;