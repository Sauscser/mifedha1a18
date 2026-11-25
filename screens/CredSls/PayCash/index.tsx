import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';

const MyLoanAccount = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
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
  const DissolveBizsss = () => {
    safeNavigateFrom(navigation, 'DissolveBizss');
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
  const ViewBiznaShareRecP2B = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRecP2B');
  };
  const ViewBiznaShareSentP2B = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareSentP2B');
  };
  const ViewBiznaShareRecB2P = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRecB2P');
  };
  const ViewBiznaShareSentB2P = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareSentB2P');
  };
  const ViewBiznaShareRecB2B = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRecB2B');
  };
  const ViewBiznaShareSentB2B = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareSentB2B');
  };
  const P2BPayCash = () => {
    safeNavigateFrom(navigation, 'PayCash3');
  };
  const PersonelVw2GrntB2P = () => {
    safeNavigateFrom(navigation, 'PersonelVw2GrntB2P');
  };
  const B2PPayCashVw2Grant = () => {
    safeNavigateFrom(navigation, 'B2PPayCashVw2Grant');
  };
  const B2BPayCashVw2Grant = () => {
    safeNavigateFrom(navigation, 'B2BPayCashVw2Grant');
  };
  const B2PPayCashReq = () => {
    safeNavigateFrom(navigation, 'B2PPayCashReq');
  };
  const B2BPayCashReq = () => {
    safeNavigateFrom(navigation, 'B2BPayCashReq');
  };
  const transferActions = [
    { label: t.biz2biz, onPress: B2BPayCashReq },
    { label: t.biz2pal, onPress: B2PPayCashReq },
  ];
  const approvalActions = [
    { label: t.biz2biz, onPress: B2BPayCashVw2Grant },
    { label: t.biz2pal, onPress: B2PPayCashVw2Grant },
    { label: t.pal2biz, onPress: P2BPayCash },
  ];
  const historyActions = [
    { label: t.biz2biz, onSent: ViewBiznaShareSentB2B, onReceived: ViewBiznaShareRecB2B },
    { label: t.biz2pal, onSent: ViewBiznaShareSentB2P, onReceived: ViewBiznaShareRecB2P },
    { label: t.pal2biz, onSent: ViewBiznaShareSentP2B, onReceived: ViewBiznaShareRecP2B },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>{t.cashSalesTitle}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.requestCashTransfer}</Text>
          {transferActions.map(action => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [styles.actionButton, styles.primaryButton, pressed && styles.pressedButton]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.grantingCashTransfers}</Text>
          {approvalActions.map(action => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [styles.actionButton, styles.secondaryButton, pressed && styles.pressedButton]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.viewCashSent}</Text>
          {historyActions.map(action => (
            <View key={action.label} style={styles.historyRow}>
              <Text style={styles.historyLabel}>{action.label}</Text>
              <View style={styles.historyButtons}>
                <Pressable
                  onPress={action.onSent}
                  style={({ pressed }) => [styles.historyButton, styles.secondaryButton, pressed && styles.pressedButton]}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>{t.sent}</Text>
                </Pressable>
                <Pressable
                  onPress={action.onReceived}
                  style={({ pressed }) => [styles.historyButton, styles.primaryButton, pressed && styles.pressedButton]}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>{t.received}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default MyLoanAccount;