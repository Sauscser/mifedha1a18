import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
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
  const ChmCancelObjection = () => {
    safeNavigateFrom(navigation, 'ChmCancelObjection');
  };
  const ChmUpdate = () => {
    safeNavigateFrom(navigation, 'ChmUpdate');
  };
  const ChmObject = () => {
    safeNavigateFrom(navigation, 'ChmObject');
  };
  const ChmAddAdmin = () => {
    safeNavigateFrom(navigation, 'ChmAddAdmin');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'skyblue' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 28,
            width: '92%',
            maxWidth: 480,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 5,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: 'bold',
              color: '#e29d58',
              textAlign: 'center',
              marginBottom: 28,
              letterSpacing: 0.5,
            }}
          >
            {t.updateGroupAccount}
          </Text>
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Pressable
              onPress={ChmAddAdmin}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#e29d58' : 'skyblue',
                borderRadius: 14,
                paddingVertical: 22,
                paddingHorizontal: 10,
                flex: 1,
                marginHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#e29d58',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 2,
              })}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.2 }}>{t.addAdmin}</Text>
            </Pressable>
            <Pressable
              onPress={ChmObject}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#e29d58' : 'skyblue',
                borderRadius: 14,
                paddingVertical: 22,
                paddingHorizontal: 10,
                flex: 1,
                marginHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#e29d58',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 2,
              })}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.2 }}>{t.stopOperations}</Text>
            </Pressable>
          </View>
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 18 }}>
            <Pressable
              onPress={ChmCancelObjection}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#e29d58' : 'skyblue',
                borderRadius: 14,
                paddingVertical: 22,
                paddingHorizontal: 10,
                flex: 1,
                marginHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#e29d58',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 2,
              })}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.2 }}>{t.allowOperations}</Text>
            </Pressable>
            <Pressable
              onPress={ChmUpdate}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#e29d58' : 'skyblue',
                borderRadius: 14,
                paddingVertical: 22,
                paddingHorizontal: 10,
                flex: 1,
                marginHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#e29d58',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 2,
              })}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.2 }}>{t.changePassword}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default MyLoanAccount;