import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import styles from './styles';
import { safeNavigateFrom } from '../../src/utils/navigationHelper';

const RegKFKubwa = props => {
  const navigation = useNavigation();
  const goToBuyFloat = () => {
    safeNavigateFrom(navigation, 'BuyFltFm');
  };
  const RegPwnBrkrss = () => {
    safeNavigateFrom(navigation, 'RegPwnBrkrs');
  };
  const AdjustUsrLimitsss = () => {
    safeNavigateFrom(navigation, 'AdjustUsrLimitss');
  };
  const DActvteMFAds = () => {
    safeNavigateFrom(navigation, 'DActvteMFAd');
  };
  const AddCOMBAuditor = () => {
    safeNavigateFrom(navigation, 'AddCOMBAuditor');
  };
  const ChamaRegss = () => {
    safeNavigateFrom(navigation, 'ChamaRegss');
  };
  const DActivateMFN = () => {
    safeNavigateFrom(navigation, 'DActvteMFN');
  };
  const DActivateMFK = () => {
    safeNavigateFrom(navigation, 'DActvteMFK');
  };
  const DActivateMFUsr = () => {
    safeNavigateFrom(navigation, 'DActvteMFUsr');
  };
  const UpdateMFAdminPWss = () => {
    safeNavigateFrom(navigation, 'UpdateMFAdminPWs');
  };
  const UpdateExRatesBtn = () => {
    navigation.navigate('UpdateExRates2');
  };
  const BLUsrsss = () => {
    safeNavigateFrom(navigation, 'BLUsrss');
  };
  const SendNonLonsRevSgnIns = () => {
    safeNavigateFrom(navigation, 'SendNonLonsRevSgnIn');
  };
  const AddMFndogoss = () => {
    safeNavigateFrom(navigation, 'AddMFNdogos');
  };
  const AddMFKubwass = () => {
    safeNavigateFrom(navigation, 'AddMFKubwas');
  };
  const SyncGrpLnRpyment = () => {
    safeNavigateFrom(navigation, 'SyncGrpLnRpyment');
  };
  const SyncGrpSubscription = () => {
    safeNavigateFrom(navigation, 'SyncGrpSubscription');
  };
  const SyncGrpDeposits = () => {
    safeNavigateFrom(navigation, 'SyncGrpDeposits');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f6fa' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Clients Section - Redesigned */}
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            {/* MFNdogo Card */}
            <View style={{ flex: 1, backgroundColor: '#f1f2f6', borderRadius: 14, alignItems: 'center', padding: 14, marginHorizontal: 4, minWidth: 100 }}>
              <FontAwesome5 name="user-friends" size={32} color="#00b894" style={{ marginBottom: 8 }} />
              <Text style={{ fontWeight: 'bold', color: '#636e72', marginBottom: 10, fontSize: 16 }}>NSNdogo</Text>
              <Pressable onPress={DActivateMFN} style={[styles.modernButton as import('react-native').ViewStyle, { backgroundColor: '#d63031', width: '100%' }]}><MaterialIcons name="person-remove" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>DeReg</Text></Pressable>
              <Pressable onPress={goToBuyFloat} style={[styles.modernButton as import('react-native').ViewStyle, { backgroundColor: '#0984e3', width: '100%' }]}><FontAwesome5 name="money-bill-wave" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>Buy Flt</Text></Pressable>
              <Pressable onPress={AddMFndogoss} style={[styles.modernButton as import('react-native').ViewStyle, { backgroundColor: '#00b894', width: '100%' }]}><Ionicons name="person-add" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>AddMFN</Text></Pressable>
            </View>
         
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          
            {/* MFKubwa Card */}
            <View style={{ flex: 1, backgroundColor: '#f1f2f6', borderRadius: 14, alignItems: 'center', padding: 14, marginHorizontal: 4, minWidth: 100 }}>
              <FontAwesome5 name="users" size={32} color="#6c5ce7" style={{ marginBottom: 8 }} />
              <Text style={{ fontWeight: 'bold', color: '#636e72', marginBottom: 10, fontSize: 16 }}>NSKubwa</Text>
              <Pressable onPress={DActivateMFK} style={[styles.modernButton as import('react-native').ViewStyle, { backgroundColor: '#d63031', width: '100%' }]}><MaterialIcons name="person-remove" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>DeRegMFK</Text></Pressable>
              <Pressable onPress={AddMFKubwass} style={[styles.modernButton as import('react-native').ViewStyle, { backgroundColor: '#00b894', width: '100%' }]}><Ionicons name="person-add" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>Add</Text></Pressable>
            </View>
           
           
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
         
            {/* Advocate Card */}
            <View style={{ flex: 1, backgroundColor: '#f1f2f6', borderRadius: 14, alignItems: 'center', padding: 14, marginHorizontal: 4, minWidth: 100 }}>
              <FontAwesome5 name="user-tie" size={32} color="#fdcb6e" style={{ marginBottom: 8 }} />
              <Text style={{ fontWeight: 'bold', color: '#636e72', marginBottom: 10, fontSize: 16 }}>Advocate</Text>
              <Pressable onPress={DActvteMFAds} style={[styles.modernButton as import('react-native').ViewStyle, { backgroundColor: '#d63031', width: '100%' }]}><MaterialIcons name="person-remove" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>DeRegMFAdv</Text></Pressable>
            </View>
          </View>
        </View>

        {/* Admin Actions Section - Redesigned */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
          {/* Card 1: Admin Tools */}
          <View style={{ flex: 1, minWidth: 180, backgroundColor: '#fff', borderRadius: 20, padding: 18, margin: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2d3436', marginBottom: 10 }}>Admin Tools</Text>
            <Pressable onPress={AddCOMBAuditor} style={styles.modernButtonWide as import('react-native').ViewStyle}><FontAwesome5 name="user-shield" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>Add COMB Auditor</Text></Pressable>
            <Pressable onPress={UpdateMFAdminPWss} style={styles.modernButtonWide as import('react-native').ViewStyle}><MaterialIcons name="lock-reset" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>UpdatePW</Text></Pressable>
            <Pressable onPress={UpdateExRatesBtn} style={styles.modernButtonWide as import('react-native').ViewStyle}><FontAwesome5 name="exchange-alt" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>UpdateExRates</Text></Pressable>
          </View>
          {/* Card 2: User Management */}
          <View style={{ flex: 1, minWidth: 180, backgroundColor: '#fff', borderRadius: 20, padding: 18, margin: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2d3436', marginBottom: 10 }}>User Management</Text>
            <Pressable onPress={DActivateMFUsr} style={styles.modernButtonWide as import('react-native').ViewStyle}><MaterialIcons name="person-remove" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>DActivtUsr</Text></Pressable>
            <Pressable onPress={BLUsrsss} style={styles.modernButtonWide as import('react-native').ViewStyle}><FontAwesome5 name="ban" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>BLUsr</Text></Pressable>
            <Pressable onPress={AdjustUsrLimitsss} style={styles.modernButtonWide as import('react-native').ViewStyle}><MaterialIcons name="tune" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>AdjUsrLim</Text></Pressable>
            <Pressable onPress={RegPwnBrkrss} style={styles.modernButtonWide as import('react-native').ViewStyle}><FontAwesome5 name="user-plus" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>RegLner</Text></Pressable>
          </View>
          {/* Card 3: Group Sync */}
          <View style={{ flex: 1, minWidth: 180, backgroundColor: '#fff', borderRadius: 20, padding: 18, margin: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2d3436', marginBottom: 10 }}>Group Sync</Text>
            <Pressable onPress={SyncGrpLnRpyment} style={styles.modernButtonWide as import('react-native').ViewStyle}><FontAwesome5 name="sync" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>Sync Loan Repayments</Text></Pressable>
            <Pressable onPress={SyncGrpSubscription} style={styles.modernButtonWide as import('react-native').ViewStyle}><FontAwesome5 name="sync" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>Sync Subscriptions</Text></Pressable>
            <Pressable onPress={SyncGrpDeposits} style={styles.modernButtonWide as import('react-native').ViewStyle}><FontAwesome5 name="sync" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>Sync Deposits</Text></Pressable>
            <Pressable onPress={SendNonLonsRevSgnIns} style={styles.modernButtonWide as import('react-native').ViewStyle}><MaterialIcons name="undo" size={18} color="#fff" /><Text style={styles.modernButtonText as import('react-native').TextStyle}>Reverse</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default RegKFKubwa;