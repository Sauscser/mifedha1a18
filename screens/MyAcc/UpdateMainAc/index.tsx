import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import styles from './styles';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';

const MyLoanAccount = props => {
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
    safeNavigateFrom(navigation, 'UpdateSMPWs');
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
  const AddPalBizBeneficiary = () => {
    safeNavigateFrom(navigation, 'AddPalBizBeneficiary');
  };
  const AddPalPalBeneficiary = () => {
    safeNavigateFrom(navigation, 'AddPalPalBeneficiary');
  };
  return <SafeAreaView>
      <ScrollView>
 
            <Pressable onPress={BizUpdatePW} style={styles.clientsView}>
              <Text style={styles.salesText}>Change Password</Text>

              <View style={styles.viewForClientsAndTitle}>
              

               

                <View style={styles.viewForClientsCategories7}>
                
                </View>

              </View>
            </Pressable>

       

    </ScrollView>
    </SafeAreaView>;
};
export default MyLoanAccount;