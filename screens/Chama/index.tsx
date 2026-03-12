import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import styles from './styles';

// Reusable Gradient Button
const GradientButton = ({
  onPress,
  text
}) => <LinearGradient colors={['#FF8C00', '#00BFFF']} start={{
  x: 0,
  y: 0
}} end={{
  x: 1,
  y: 1
}} style={styles.gradientPressable}>
    <Pressable onPress={onPress} style={styles.clientsPressable}>
      <Text style={styles.clientsPressableText}>{text}</Text>
    </Pressable>
  </LinearGradient>;
const MyLoanAccount = () => {
  const navigation = useNavigation();
  const [id, setID] = useState('');
  const [ChamaNMember, setChamaNMember] = useState('');
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  // Navigation functions
  const navigateTo = (screen, params) => () => navigation.navigate(screen, params);
  return <SafeAreaView style={{
    flex: 1
  }}>
      <ScrollView>
        <View style={styles.adminImage}>

          {/* ------------------- Group Advance ------------------- */}
          <View style={styles.clientsView}>
            <Text style={styles.salesText}>{t.groupAdvance}</Text>
            <GradientButton onPress={navigateTo('Vw2SelectChm2Req', {})} text={t.requestLoan} />
            <GradientButton onPress={navigateTo('ChamaVw2DelLnReqs', {})} text={t.deleteLoanRequest} />
            <GradientButton onPress={navigateTo('VwGrp2LnCov', {})} text={t.giveMemberAdvance} />
            <GradientButton onPress={navigateTo('Vw2FloatGrpLoans', {})} text={t.floatGroupLoans} />
            <GradientButton onPress={navigateTo('Vw2SignLoanRequests', {})} text={t.approveMemberLoan} />
            <GradientButton onPress={navigateTo('CreateChamaMinutes', {})} text={t.groupMinutes} />
          </View>

          {/* ------------------- Group Status ------------------- */}
          <View style={styles.clientsView}>
            <Text style={styles.salesPressableText}>{t.viewGroupStatus}</Text>
            <GradientButton onPress={navigateTo('ChmSignInss', {})} text={t.viewGroupDebtsStatus} />
          </View>

          {/* ------------------- Member Status ------------------- */}
          <View style={styles.clientsView}>
            <Text style={styles.salesPressableText}>{t.viewMemberStatus}</Text>
            <GradientButton onPress={navigateTo('ChmLnsRec', {})} text={t.viewMemberDebtsStatus} />
          </View>

          {/* ------------------- Registration ------------------- */}
          <View style={styles.clientsView}>
            <Text style={styles.salesText}>{t.registration}</Text>
            <GradientButton onPress={navigateTo('AddChmMembrsss', {})} text={t.registerMember} />
            <GradientButton onPress={navigateTo('SgnIn2RemoveMmbrs', {
            id
          })} text={t.deregisterMember} />
          </View>

          {/* ------------------- Group Remittance ------------------- */}
          <View style={styles.clientsView}>
            <Text style={styles.salesText}>{t.groupRemittance}</Text>
            <GradientButton onPress={navigateTo('ViewGrp2ConfirmDividends', {})} text={t.viewGroupRemittances} />
            <GradientButton onPress={navigateTo('ChamaMmbrRemts', {})} text={t.viewMyRemittances} />
          </View>

          {/* ------------------- Membership ------------------- */}
          <View style={styles.clientsView}>
            <Text style={styles.salesText}>{t.membership}</Text>
            <GradientButton onPress={navigateTo('ViewGrp2ShareDividends', {})} text={t.viewMembers} />
            <GradientButton onPress={navigateTo('ChmMmbrMmbrss', {})} text={t.viewMyGroups} />
          </View>

          {/* ------------------- Group Account ------------------- */}
          <View style={styles.clientsView2}>
            <Text style={styles.salesText}>{t.groupAccount}</Text>
            <GradientButton onPress={navigateTo('ViewGrpApplications', {})} text={t.create} />
            <GradientButton onPress={navigateTo('DissolveChms', {})} text={t.dissolve} />
            <GradientButton onPress={navigateTo('UpdateChmAc', {})} text={t.update} />
            <GradientButton onPress={navigateTo('ChamSignIn3s', {})} text={t.viewGroupAccount} />
          </View>

          {/* ------------------- Signatory Works ------------------- */}
          <View style={styles.clientsView2}>
            <Text style={styles.salesText}>{t.signatoryWorks}</Text>
            <GradientButton onPress={navigateTo('Sgn2CnfrmWthdrwlsss', {})} text={t.signatory2ConfirmWithdrawals} />
            <GradientButton onPress={navigateTo('SignitoryWthdrwFndss3', {})} text={t.signatory3ConfirmWithdrawals} />
            <GradientButton onPress={navigateTo('SignitoryWthdrwFndsss', {})} text={t.signatory3ConfirmWithdrawals} />
            <GradientButton onPress={navigateTo('SgnIn2VwChmDpstss', {})} text={t.viewGroupDeposits} />
            <GradientButton onPress={navigateTo('SgnIn2VwChmWthdrwlss', {})} text={t.viewGroupWithdrawals} />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>;
};
export default MyLoanAccount;