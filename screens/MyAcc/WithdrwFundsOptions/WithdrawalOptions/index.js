import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, FlatList, SafeAreaView, Dimensions } from 'react-native';
import styles from '../WithdrawalOptions/styles';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';

const MyAccount = props => {
  const navigation = useNavigation();
  const SMDpsitsss = () => {
    safeNavigateFrom(navigation, 'ElimDpstss');
  };
  const ViewNonLnsRecs = () => {
    safeNavigateFrom(navigation, 'ViewNonLnsRecs');
  };
  const ViewNonLnsSents = () => {
    safeNavigateFrom(navigation, 'ViewNonLnsSents');
  };
  const Vw2DelLnReqs = () => {
    safeNavigateFrom(navigation, 'Vw2DelLnReqs');
  };
  const SearchUser = () => {
    safeNavigateFrom(navigation, 'VwMakeLnReq');
  };
  const goToCreateSMAc = () => {
    safeNavigateFrom(navigation, 'CreateSMAc');
  };
  const SMWthdrwlsss = () => {
    safeNavigateFrom(navigation, 'WithdrwFundsOptions');
  };
  const goWithdrwMny = () => {
    safeNavigateFrom(navigation, 'SMWthdFm');
  };
  const goToSMASndnonln = () => {
    safeNavigateFrom(navigation, 'Vw2SelectChmBeneficiary');
  };
  const UpdateSMPWss = () => {
    safeNavigateFrom(navigation, 'UpdateSMPWs');
  };
  const ViewSmAcss = () => {
    safeNavigateFrom(navigation, 'ElimAcs');
  };
  const LoanAds = () => {
    navigation.navigate('LoanAds');
  };
  const UpdateMainAc = () => {
    safeNavigateFrom(navigation, 'UpdateMainAc');
  };
  const PayPalDposit = () => {
    safeNavigateFrom(navigation, 'VwAcBfDpst');
  };
  const VwPlLn2Remove = () => {
    safeNavigateFrom(navigation, 'VwPlLn2Remove');
  };
  return <SafeAreaView>
      <View style={styles.image}>



        
          <View style={styles.viewForSalesPressables}>
            
            

            
            <View>
            <Text style={styles.acPressableText}>Withdrawal Options</Text>
            </View>
            <View style={{
          flexDirection: "row"
        }}>
            <Pressable onPress={goWithdrwMny} style={styles.acNonLnsPressables}>
              <Text style={styles.acPressableText}>NSNdogo</Text>
            </Pressable>
            <Pressable onPress={SMWthdrwlsss} style={styles.acNonLnsPressables}>
              <Text style={styles.acPressableText}>Equity</Text>
            </Pressable>
            </View>
            

           
          
        </View>


      </View>
    </SafeAreaView>;
};
export default MyAccount;