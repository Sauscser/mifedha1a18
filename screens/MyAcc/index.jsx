import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, FlatList, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import styles from './styles';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { safeNavigateFrom } from '../../src/utils/navigationHelper';

const MyAccount = props => {
  const navigation = useNavigation();
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
  const SMWthdrwlsss = () => {
    safeNavigateFrom(navigation, 'ElimWthdrwlss');
  };
  const goWithdrwMny = () => {
    safeNavigateFrom(navigation, 'WithdrawalOptions');
  };
  const goToSMASndnonln = () => {
    safeNavigateFrom(navigation, 'Vw2SelectChmBeneficiary');
  };
  const LoanAds = () => {
    navigation.navigate('LoanAds');
  };
  const UpdateMainAc = () => {
    safeNavigateFrom(navigation, 'UpdateMainAc');
  };
  const SrchLoanAdz = () => {
    safeNavigateFrom(navigation, 'SrchLoanAdz');
  };
  const DepositOptions = () => {
    safeNavigateFrom(navigation, 'DepositOptions');
  };
  const VwPlLn2Remove = () => {
    safeNavigateFrom(navigation, 'VwPlLn2Remove');
  };
  const BoostPalBenefits = () => {
    safeNavigateFrom(navigation, 'BoostPalBenefits');
  };
  const UrLnks = () => {
    navigation.navigate('UrLnks');
  };
  const ViewBiznaShareRec = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRec');
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
            
        <Section title="Account" options={[
        /*  { label: 'Deposit Money', onPress: DepositOptions, style: styles.ClientsPressables },
        */
        {
          label: 'View Deposits',
          onPress: SMDpsitsss,
          style: styles.ClientsPressables
        }, {
          label: 'Update Main Account',
          onPress: UpdateMainAc,
          style: styles.ClientsPressables
        }, {
          label: 'Send Cash',
          onPress: goToSMASndnonln,
          style: styles.ClientsPressables
        }, {
          label: 'View Cash sent to Pals/Transpoter',
          onPress: ViewNonLnsSents,
          style: styles.ClientsPressables
        }, {
          label: 'View Cash received from Biz',
          onPress: ViewBiznaShareRec,
          style: styles.ClientsPressables
        }, {
          label: 'View Cash received from Pals',
          onPress: ViewNonLnsRecs,
          style: styles.ClientsPressables
        }]} />



        <Section title="Withdrawals" options={[{
          label: 'Withdraw Money',
          onPress: goWithdrwMny
        }, {
          label: 'View Withdrawn Money',
          onPress: SMWthdrwlsss
        }]} />

        <Section title="Other Operations" options={[{
          label: 'Boost pooled Benefits',
          onPress: BoostPalBenefits
        }, {
          label: 'Search Loan Ads',
          onPress: SrchLoanAdz
        }, {
          label: 'Advertise',
          onPress: LoanAds
        }, {
          label: 'Delete ',
          onPress: VwPlLn2Remove
        }]} />

        

      </LinearGradient>
      </ScrollView>
      
    </SafeAreaView>;
};
export default MyAccount;