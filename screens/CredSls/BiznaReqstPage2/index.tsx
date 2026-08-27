import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {
  View,
  Text,
  ImageBackground,
  Pressable,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import styles from './styles';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';


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

  const CrdSlPlaceLnReq = () => {
    navigation.navigate('CrdSlPlaceLnReq');
  };

  const ChamaVw2DelLnReqs = () => {
    safeNavigateFrom(navigation, 'ChamaVw2DelLnReqs');
  };

  const ChamaPlaceLnReq = () => {
    safeNavigateFrom(navigation, 'ChamaPlaceLnReq');
  };

  const Vw2DelLnReqs = () => {
    safeNavigateFrom(navigation, 'Vw2DelLnReqs');
  };

  const VwMakeLnReq = () => {
    safeNavigateFrom(navigation, 'PlaceLnReq');
  };

  

  return (
    <SafeAreaView>
      <View
        
        style={styles.image}>


        <View style={styles.accountView}>
          <Text style={styles.accountText}>Request Loans</Text>

          <View style={styles.viewForSalesPressables}>
            
            


            <View style={styles.acPressables}>
            <View >
            <Text style={styles.acPressableText}>Pal2Pal</Text>
            </View>
            <View style = {{flexDirection:"row"}}>
            <Pressable onPress={CrdSlPlaceLnReq} style={styles.acNonLnsPressables}>
              <Text style={styles.acPressableText}>Request</Text>
            </Pressable>
            <Pressable onPress={CrdSlVw2DelLnReqs} style={styles.acNonLnsPressables}>
              <Text style={styles.acPressableText}>View</Text>
            </Pressable>
            </View>
            </View>

            <View style={styles.acPressables}>
            <View >
            <Text style={styles.acPressableText}>Pal2Company</Text>
            </View>
            <View style = {{flexDirection:"row"}}>
            <Pressable onPress={CrdSlPlaceLnReq} style={styles.acNonLnsPressables}>
              <Text style={styles.acPressableText}>Request</Text>
            </Pressable>
            <Pressable onPress={CrdSlVw2DelLnReqs} style={styles.acNonLnsPressables}>
              <Text style={styles.acPressableText}>View</Text>
            </Pressable>
            </View>
            </View>
           
          </View>
        </View>


      </View>
    </SafeAreaView>
  );
};

export default MyAccount;