import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
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
    navigation.navigate('ElimDpstss');
  };
  const ViewNonLnsRecs = () => {
    navigation.navigate('ViewNonLnsRecs');
  };
  const ViewNonLnsSents = () => {
    navigation.navigate('ViewNonLnsSents');
  };
  const SearchUser = () => {
    navigation.navigate('VwMakeLnReq');
  };
  const goToSMASndnonln = () => {
    navigation.navigate('Vw2SelectChmBeneficiary');
  };
  const AcceptRideRequest = () => {
    navigation.navigate('AcceptRideRequest');
  };
  const PassengerRequestRide = () => {
    navigation.navigate('PassengerRequestRide');
  };
  const VwTransportAccount = () => {
    navigation.navigate('VwTransportAccount');
  };
  const VwBiz2DispatchDelivery = () => {
    navigation.navigate('VwBiz2DispatchDelivery');
  };
  const ReceiveDelivery = () => {
    navigation.navigate('ReceiveDelivery2');
  };
  const AcceptTransportRequest = () => {
    navigation.navigate('AcceptTransportRequest');
  };
  const VwSalesDtls4Transport = () => {
    navigation.navigate('VwSalesDtls4Transport');
  };
  const RegisterTransport = () => {
    navigation.navigate('RegisterTransport');
  };
  const RegisterTransportBizna = () => {
    navigation.navigate('RegisterTransportBizna');
  };
  const ViewTransportBiznaAccount = () => {
    navigation.navigate('ViewTransportBiznaAccount');
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