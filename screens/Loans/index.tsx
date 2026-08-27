import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './styles';
import { ScrollView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { safeNavigateFrom } from '../../src/utils/navigationHelper';


const MyLoanAccount = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  // Navigation functions for each button
  const SignIn2GrntLnReq = () => safeNavigateFrom(navigation, 'SignIn2GrntLnReq');
  const UpdateExRates = () => navigation.navigate('UpdateExRates2');

  const PalVw2GrantLnReq2 = () => safeNavigateFrom(navigation, 'PalVw2GrantLnReq2');
  const VwP2PMyLoaners = () => safeNavigateFrom(navigation, 'VwP2PMyLoaners');
  const VwP2PMyLoanees = () => safeNavigateFrom(navigation, 'VwP2PMyLoanees');
  const VwB2PMyLoaners = () => safeNavigateFrom(navigation, 'VwB2PMyLoaners');
  const SI2VwB2PLoanees = () => safeNavigateFrom(navigation, 'SI2VwB2PLoanees');
  const PalProdsRequest = () => safeNavigateFrom(navigation, 'PalProdsRequest');
  const SMDpsitsss = () => safeNavigateFrom(navigation, 'ElimDpstss');
  const ViewNonLnsRecs = () => safeNavigateFrom(navigation, 'ViewNonLnsRecs');
  const ViewNonLnsSents = () => safeNavigateFrom(navigation, 'ViewNonLnsSents');
  const SMWthdrwlsss = () => safeNavigateFrom(navigation, 'ElimWthdrwlss');
  const goWithdrwMny = () => safeNavigateFrom(navigation, 'WithdrawalOptions');
  const goToSMASndnonln = () => safeNavigateFrom(navigation, 'Vw2SelectChmBeneficiary');
  const LoanAds = () => navigation.navigate('LoanAds');
  const UpdateMainAc = () => safeNavigateFrom(navigation, 'UpdateMainAc');
  const SrchLoanAdz = () => safeNavigateFrom(navigation, 'SrchLoanAdz');
  const VwPlLn2Remove = () => safeNavigateFrom(navigation, 'VwPlLn2Remove');
  const BoostPalBenefits = () => safeNavigateFrom(navigation, 'BoostPalBenefits');
  const ViewBiznaShareRec = () => safeNavigateFrom(navigation, 'ViewBiznaShareRec');
  
  return <SafeAreaView style={{
    flex: 1
  }}>
      <ScrollView>
      <View style={styles.adminImage}>
        {/* Main Container */}
        <View style={styles.clientsView}>

          <View style={styles.viewForClientsPressables}>
            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={UpdateExRates}>
                <Text style={styles.clientsPressableText}>{t.viewExchangeRates}</Text>
              </Pressable>
            </LinearGradient>

           
          </View>
          
          {/* Loan Requests Section */}
          <Text style={styles.salesPressableText}>{t.loanRequests}</Text>
          <View style={styles.viewForClientsPressables}>
            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={PalProdsRequest}>
                <Text style={styles.clientsPressableText}>{t.makeLoanRequests}</Text>
              </Pressable>
            </LinearGradient>

           
          </View>
          
            {/* Grant Loan Requests Section */}
          <Text style={styles.salesPressableText}>{t.grantLoanRequests}</Text>
          <View style={styles.viewForClientsPressables}>
            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={SignIn2GrntLnReq}>
                <Text style={styles.clientsPressableText}>{t.biz2Pal}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={PalVw2GrantLnReq2}>
                <Text style={styles.clientsPressableText}>{t.pal2Pal}</Text>
              </Pressable>
            </LinearGradient>
          </View>



          {/* BizLoanStatus Section */}
          <Text style={styles.salesPressableText}>{t.bizLoanStatus}</Text>
          <View style={styles.viewForClientsPressables}>
            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={SI2VwB2PLoanees}>
                <Text style={styles.clientsPressableText}>{t.companyLoanees}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={VwB2PMyLoaners}>
                <Text style={styles.clientsPressableText}>{t.loaningCompanies}</Text>
              </Pressable>
            </LinearGradient>
          </View>

          {/* PalLoanStatus Section */}
          <Text style={styles.salesPressableText}>{t.palLoanStatus}</Text>
          <View style={styles.viewForClientsPressables}>
            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={VwP2PMyLoanees}>
                <Text style={styles.clientsPressableText}>{t.myLoanees}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={VwP2PMyLoaners}>
                <Text style={styles.clientsPressableText}>{t.myLoaners}</Text>
              </Pressable>
            </LinearGradient>
          </View>

           {/* Account */}
          <Text style={styles.salesPressableText}>{t.account}</Text>
          <View style={styles.viewForClientsPressables}>
            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={SMDpsitsss}>
                <Text style={styles.clientsPressableText}>{t.viewDeposits}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={UpdateMainAc}>
                <Text style={styles.clientsPressableText}>{t.updateMainAccount}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={goToSMASndnonln}>
                <Text style={styles.clientsPressableText}>{t.sendCash}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={ViewNonLnsSents}>
                <Text style={styles.clientsPressableText}>{t.viewCashSent}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={ViewBiznaShareRec}>
                <Text style={styles.clientsPressableText}>{t.viewCashReceivedBiz}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={ViewNonLnsRecs}>
                <Text style={styles.clientsPressableText}>{t.viewCashReceivedPals}</Text>
              </Pressable>
            </LinearGradient>
          </View>

           {/* Withdrawals */}
          <Text style={styles.salesPressableText}>{t.withdrawals}</Text>
          <View style={styles.viewForClientsPressables}>
            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={goWithdrwMny}>
                <Text style={styles.clientsPressableText}>{t.withdrawMoney}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={SMWthdrwlsss}>
                <Text style={styles.clientsPressableText}>{t.viewWithdrawnMoney}</Text>
              </Pressable>
            </LinearGradient>

            
          </View>

          {/* Other Operations */}
          <Text style={styles.salesPressableText}>{t.otherOperations}</Text>
          <View style={styles.viewForClientsPressables}>
             <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={BoostPalBenefits}>
                <Text style={styles.clientsPressableText}>{t.boostPooledBenefits}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={SrchLoanAdz}>
                <Text style={styles.clientsPressableText}>{t.searchLoanAds}</Text>
              </Pressable>
            </LinearGradient>
            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={LoanAds}>
                <Text style={styles.clientsPressableText}>{t.advertise}</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
              x: 0,
              y: 0
            }} end={{
              x: 1,
              y: 1
            }} style={styles.gradientPressable}>
              <Pressable onPress={VwPlLn2Remove}>
                <Text style={styles.clientsPressableText}>{t.deleteLoanAds}</Text>
              </Pressable>
            </LinearGradient>

            
          </View>

 

        </View>
      </View>
      </ScrollView>
    </SafeAreaView>;
};
export default MyLoanAccount;