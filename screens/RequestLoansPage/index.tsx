import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, FlatList, SafeAreaView, Dimensions } from 'react-native';
import styles from './styles';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { safeNavigateFrom } from '../../src/utils/navigationHelper';

const MyAccount = (props: any) => {
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
  const SearchUser = () => {
    safeNavigateFrom(navigation, 'VwMakeLnReq');
  };
  const goToCreateSMAc = () => {
    safeNavigateFrom(navigation, 'CreateSMAc');
  };
  const SMWthdrwlsss = () => {
    safeNavigateFrom(navigation, 'ElimWthdrwlss');
  };
  const goWithdrwMny = () => {
    safeNavigateFrom(navigation, 'SMWthdFm');
  };
  const goToSMASndnonln = () => {
    safeNavigateFrom(navigation, 'SendNonLnss');
  };
  const UpdateSMPWss = () => {
    safeNavigateFrom(navigation, 'UpdateSMPWs');
  };
  const CrdSlVw2DelLnReqs = () => {
    safeNavigateFrom(navigation, 'CrdSlVw2DelLnReqs');
  };
  const BiznaReqstPage1 = () => {
    safeNavigateFrom(navigation, 'BiznaReqstPage1');
  };
  const BiznaReqstPage2 = () => {
    safeNavigateFrom(navigation, 'BiznaReqstPage2');
  };
  const PalProdsRequest = () => {
    safeNavigateFrom(navigation, 'PalProdsRequest');
  };
  const CrdSlPlaceLnReq = () => {
    safeNavigateFrom(navigation, 'BiznaReqstPage1');
  };
  const ChamaVw2DelLnReqs = () => {
    safeNavigateFrom(navigation, 'ChamaVw2DelLnReqs');
  };
  const ChamaPlaceLnReq = () => {
    safeNavigateFrom(navigation, 'Vw2SelectChm2Req');
  };
  const Vw2DelLnReqs = () => {
    safeNavigateFrom(navigation, 'Vw2DelLnReqs');
  };
  const VwMakeLnReq = () => {
    safeNavigateFrom(navigation, 'PlaceLnReq');
  };
  return <SafeAreaView>
      <View style={styles.image}>


        <View style={styles.accountView}>
          <Text style={styles.accountText}>Requests</Text>

          <View style={styles.viewForSalesPressables}>
            
            

          <Pressable onPress={PalProdsRequest} style={styles.acPressables}>
            <View>
            <Text style={styles.acPressableText}>Pal Requests</Text>
            </View>
            <View style={{
              flexDirection: "row"
            }}>
            
            </View>
            </Pressable>

            <View style={styles.acPressables}>
            <View>
            <Text style={styles.acPressableText}>Group(Chama)</Text>
            </View>
            <View style={{
              flexDirection: "row"
            }}>
            <Pressable onPress={ChamaPlaceLnReq} style={styles.acNonLnsPressables}>
              <Text style={styles.acPressableText}>Request</Text>
            </Pressable>

            <Pressable onPress={ChamaVw2DelLnReqs} style={styles.acNonLnsPressables}>
              <Text style={styles.acPressableText}>View</Text>
            </Pressable>
            
            </View>
            </View>



            <Pressable onPress={BiznaReqstPage1} style={styles.acPressables}>
            <View>
            <Text style={styles.acPressableText}>CredSale</Text>
            </View>
            <View style={{
              flexDirection: "row"
            }}>
            
            </View>
            </Pressable>

            
           
          </View>
        </View>


      </View>
    </SafeAreaView>;
};
export default MyAccount;