import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable } from 'react-native';
import styles from './styles';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../../../src/utils/navigationHelper';

const Section = ({
  title,
  options
}) => <View style={styles.clientsView}>
    <Text style={styles.salesText}>{title}</Text>
    <View style={styles.viewForClientsAndTitle}>
      {options.map(({
      label,
      onPress,
      style
    }, index) => <Pressable key={index} onPress={onPress} style={style || styles.viewForClientsPressables}>
          <LinearGradient colors={['#FF8C00', '#00BFFF']} // Orange to Sky Blue gradient
      start={{
        x: 0,
        y: 0
      }} // Gradient starts from the top left (vertical direction)
      end={{
        x: 1,
        y: 1
      }} // Gradient ends at the bottom right (vertical and horizontal)
      style={styles.clientsPressableGradient}>
            <Text style={styles.salesPressableText}>{label}</Text>
          </LinearGradient>
        </Pressable>)}
    </View>
  </View>;
const MyLoanAccount = () => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
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
    safeNavigateFrom(navigation, 'VwBiz2PalLners');
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
    safeNavigateFrom(navigation, 'PayCash');
  };
  const VwPalLners = () => {
    safeNavigateFrom(navigation, 'VwPalLners');
  };
  const VwCashPaySent = () => {
    safeNavigateFrom(navigation, 'VwCashPaySent');
  };
  const MakeNVwPayPalDpsits = () => {
    safeNavigateFrom(navigation, 'MakeNVwPayPalDpsits');
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
  const ItemAds = () => {
    navigation.navigate('ItemAds');
  };
  const Vw2GrntPal2Pal = () => {
    safeNavigateFrom(navigation, 'Vw2GrntPal2Pal');
  };
  const PersonelVw2GrntB2P = () => {
    safeNavigateFrom(navigation, 'PersonelVw2GrntB2P');
  };
  const PersonelVw2GrntB2B = () => {
    safeNavigateFrom(navigation, 'PersonelVw2GrntB2B');
  };
  const giveBizna = () => {
    safeNavigateFrom(navigation, 'giveBizna');
  };
  const TakeOverBizna = () => {
    safeNavigateFrom(navigation, 'TakeOverBizna');
  };
  const VwBizDpsts = () => {
    safeNavigateFrom(navigation, 'VwBizDpsts');
  };
  const AddBeneficiaryProduct = () => {
    safeNavigateFrom(navigation, 'AddBeneficiaryProduct');
  };
  const UpdateBizAc = () => {
    safeNavigateFrom(navigation, 'UpdateBizAc');
  };
  const VwPalBeneficiaryShares = () => {
    safeNavigateFrom(navigation, 'VwPalBeneficiaryShares');
  };
  const VwBizBeneficiaryShares = () => {
    safeNavigateFrom(navigation, 'VwBizBeneficiaryShares');
  };
  return <SafeAreaView>
      <ScrollView>
      <LinearGradient colors={['#FF8C00', 'skyblue', 'white']} // Linear gradient for orange hues
      start={{
        x: 0,
        y: 0
      }} // Gradient starts from the top left (vertical direction)
      end={{
        x: 1,
        y: 1
      }} style={styles.clientsPressableGradient}>
            
            <Section title={t.beneficiaryView} options={[{
          label: t.biz,
          onPress: VwBizBeneficiaryShares,
          style: styles.ClientsPressables
        }, {
          label: t.pal,
          onPress: VwPalBeneficiaryShares,
          style: styles.ClientsPressables
        }]} />
        
        

      </LinearGradient>
      </ScrollView>
      
    </SafeAreaView>;
};
export default MyLoanAccount;