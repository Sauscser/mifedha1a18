import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
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
    navigation.navigate('VwPal2BizLners');
  };
  const SI2VwBiz2PalLoanees = () => {
    navigation.navigate('SI2VwBiz2PalLoanees');
  };
  const SI2VwBiz2BizLoaners = () => {
    navigation.navigate('SI2VwBiz2BizLoaners');
  };
  const SI2VwBiz2BizLoanees = () => {
    navigation.navigate('SI2VwBiz2BizLoanees');
  };
  const SI2VwBiz2PalLoaners = () => {
    navigation.navigate('SI2VwBiz2PalLoaners');
  };
  const CrtBusinessss = () => {
    navigation.navigate('CrtBusinesss');
  };
  const DissolveBizsss = () => {
    navigation.navigate('DissolveBizss');
  };
  const SgnIn2VwBiznasss = () => {
    navigation.navigate('SgnIn2VwBiznass');
  };
  const ShareCredSlsRevsss = () => {
    navigation.navigate('ShareCredSlsRevss');
  };
  const AddPersonelss = () => {
    navigation.navigate('AddPersonels');
  };
  const RmvPersonnelsss = () => {
    navigation.navigate('RmvPersonnelss');
  };
  const SgnIn2RemoveSlAd = () => {
    navigation.navigate('SgnIn2RemoveSlAd');
  };
  const ViewBiznaShareRec = () => {
    navigation.navigate('ViewBiznaShareRec');
  };
  const SgnIn2VwRevenueShare = () => {
    navigation.navigate('SgnIn2VwRevenueShare');
  };
  const PayCash = () => {
    navigation.navigate('P2BPayCash');
  };
  const VwPalLners = () => {
    navigation.navigate('VwPalLners');
  };
  const VwCashPaySent = () => {
    navigation.navigate('VwCashPaySent');
  };
  const SgnIn2VwCashSales = () => {
    navigation.navigate('SgnIn2VwCashSales');
  };
  const VwPal2BizLnees = () => {
    navigation.navigate('VwPal2BizLnees');
  };
  const VwPalLnees = () => {
    navigation.navigate('VwPalLnees');
  };
  const Vw2GrntPal2Biz = () => {
    navigation.navigate("Vw2GrntPal2Biz");
  };
  const BizUpdatePW = () => {
    navigation.navigate('BizUpdatePW');
  };
  const PersonelVw2GrntB2P = () => {
    navigation.navigate('PersonelVw2GrntB2P');
  };
  const ChmCancelObjection = () => {
    navigation.navigate('ChmCancelObjection');
  };
  const ChmUpdate = () => {
    navigation.navigate('ChmUpdate');
  };
  const ChmObject = () => {
    navigation.navigate('ChmObject');
  };
  const ChmAddAdmin = () => {
    navigation.navigate('ChmAddAdmin');
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