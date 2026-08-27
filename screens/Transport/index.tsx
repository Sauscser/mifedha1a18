import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { safeNavigateFrom } from '../../src/utils/navigationHelper';
import { View, Text, ImageBackground, Pressable, FlatList, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import styles from './styles';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
const MyAccount = (props: any) => {
  const navigation = useNavigation<any>();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const Section = ({
    title,
    options
  }: { title: string; options: any[] }) => <View style={styles.clientsView}>
      <Text style={styles.salesText}>{title}</Text>
      <View style={styles.viewForClientsAndTitle}>
        {options.map(({
        label,
        onPress,
        style
      }, index: number) => <Pressable key={index} onPress={onPress} style={style || styles.viewForClientsPressables}>
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
  const PassengerRequestRide = () => {
    safeNavigateFrom(navigation, 'PassengerRequestRide');
  };
  const VwTransportAccount = () => {
    safeNavigateFrom(navigation, 'VwTransportAccount');
  };
  const VwBiz2DispatchDelivery = () => {
    safeNavigateFrom(navigation, 'VwBiz2DispatchDelivery');
  };
  const ReceiveDelivery = () => {
    safeNavigateFrom(navigation, 'ReceiveDelivery2');
  };
  const AcceptTransportRequest = () => {
    safeNavigateFrom(navigation, 'AcceptTransportRequest');
  };
  const VwSalesDtls4Transport = () => {
    safeNavigateFrom(navigation, 'VwSalesDtls4Transport');
  };
  const RegisterTransport = () => {
    safeNavigateFrom(navigation, 'RegisterTransport');
  };
  const RegisterTransportBizna = () => {
    safeNavigateFrom(navigation, 'RegisterTransportBizna');
  };
  const ViewTransportBiznaAccount = () => {
    safeNavigateFrom(navigation, 'ViewTransportBiznaAccount');
  };

  const nav: any = navigation;
  useEffect(() => {
    // defer navigation to effect so it doesn't run during render
    try {
      navigation.navigate('Homes', { screen: 'RegisterTransport' });
    } catch (err) {
      // ignore if navigation not ready
    }
  }, []);

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
            label: t.registerTransport,
            onPress: RegisterTransport,
            style: (styles as any).ClientsPressables
          }, {
            label: 'Register Transport - Company',
            onPress: RegisterTransportBizna,
            style: styles.ClientsPressables
          }, {
            label: 'View Transport Company Account',
            onPress: ViewTransportBiznaAccount,
            style: styles.ClientsPressables
          }, {
            label: t.viewAccount,
            onPress: VwTransportAccount,
            style: styles.ClientsPressables
          }, {
            label: t.askForTransport,
            onPress: VwSalesDtls4Transport,
            style: styles.ClientsPressables
          }, {
            label: t.viewTransportRequestsAccept,
            onPress: AcceptTransportRequest,
            style: styles.ClientsPressables
          }, {
            label: t.viewTransportRequestsReceive,
            onPress: ReceiveDelivery,
            style: styles.ClientsPressables
          }, {
            label: t.viewTransportRequestsDispatch,
            onPress: VwBiz2DispatchDelivery,
            style: styles.ClientsPressables
          }, {
            label: t.customerPassenger,
            onPress: PassengerRequestRide,
            style: styles.ClientsPressables
          }, {
            label: t.rider,
            onPress: AcceptRideRequest,
            style: styles.ClientsPressables
          }
        ]} />
      </LinearGradient>
      </ScrollView>
    </SafeAreaView>;
};
export default MyAccount;