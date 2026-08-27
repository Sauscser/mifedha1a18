import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, FlatList, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import styles from './styles';
import { LinearGradient } from 'expo-linear-gradient';
import translations from './translation';
import { useTranslation } from 'react-i18next';
import { safeNavigateFrom } from '../../src/utils/navigationHelper';
const MyAccount = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
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
  const SMDpsitsss = () => {
    safeNavigateFrom(navigation, 'ElimDpstss');
  };
  const ViewNonLnsRecs = () => {
    safeNavigateFrom(navigation, 'ViewNonLnsRecs');
  };
  const ViewNonLnsSents = () => {
    safeNavigateFrom(navigation, 'ViewNonLnsSents');
  };
  const SearchUser = () => {
    safeNavigateFrom(navigation, 'VwMakeLnReq');
  };
  const goToSMASndnonln = () => {
    safeNavigateFrom(navigation, 'Vw2SelectChmBeneficiary');
  };

  const AcceptRideRequest = () => {
    safeNavigateFrom(navigation, 'AcceptRideRequest');
  };
  const Auditor = () => {
    safeNavigateFrom(navigation, 'Auditor');
  };
  const FunderClearBill = () => {
    safeNavigateFrom(navigation, 'FunderClearBill');
  };
  const consumerApproveVoucher = () => {
    safeNavigateFrom(navigation, 'consumerApproveVoucher');
  };
  const Vw2GenerateVoucher = () => {
    safeNavigateFrom(navigation, 'Vw2GenerateVoucher');
  };
  const Vw2LinkSeller = () => {
    safeNavigateFrom(navigation, 'Vw2LinkSeller');
  };
  const CreateCOMBContract = () => {
    safeNavigateFrom(navigation, 'CreateCOMBContract');
  };
  const AddCOMBPersonel = () => {
    safeNavigateFrom(navigation, 'AddCOMBPersonel');
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
            
        <Section title={t.account} options={[
        {
          label: t.registerAuditor,
          onPress: AddCOMBPersonel,
          style: styles.viewForClientsPressables
        }, {
          label: t.createContract,
          onPress: CreateCOMBContract,
          style: styles.viewForClientsPressables
        }, {
          label: t.linkSeller,
          onPress: Vw2LinkSeller,
          style: styles.viewForClientsPressables
        }, {
          label: t.generateVoucher,
          onPress: Vw2GenerateVoucher,
          style: styles.viewForClientsPressables
        }, {
          label: t.approveVoucher,
          onPress: consumerApproveVoucher,
          style: styles.viewForClientsPressables
        }, {
          label: t.clearBills,
          onPress: FunderClearBill,
          style: styles.viewForClientsPressables
        }, {
          label: t.auditContracts,
          onPress: Auditor,
          style: styles.viewForClientsPressables
        }]} />

      </LinearGradient>
      </ScrollView>
      
    </SafeAreaView>;
};
export default MyAccount;