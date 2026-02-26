import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BotTab from '../BotTab';
import { HomeStackScreenNames } from '../HomeTabNav';
import KFNdogoScreen from '../../screens/MFNdogo';
import MFKw from '../../screens/MFKubwa';
import AdvSgnIn from '../../screens/Advocate/AdvocateHm';
import MFAdmSgnIn from "../../screens/MFAdmin/SignInAdm";
import SignInBankAdm from "../../screens/MFBankAdmin/SignInAdm";
import MFSetting from '../../screens/Settings/SignIn';
import Ref from "../../screens/Settings/Reference";
import MFBankAdmin from "../../screens/MFBankAdmin";
import { useTranslation } from 'react-i18next';

import GlobalHeader from '../../src/componentx/GlobalHeader';

const Drawer = createDrawerNavigator();

export type RootNavProps = {
  colorScheme: 'light' | 'dark';
  user: { username?: string } | null;
  signOut: () => void;
};

const Stack = createNativeStackNavigator();

const RedirectToHome = ({ navigation, route }: any) => {
  useEffect(() => {
    // forward to nested Home stack: Stack 'DrawerRoot' -> Drawer 'Homes' -> BottomTab 'Home' -> target screen
    // use replace so the redirect placeholder is not left on the stack
    navigation.replace('DrawerRoot', { screen: 'Homes', params: { screen: 'Home', params: { screen: route.name, params: route.params } } });
  }, [navigation, route]);
  return null;
};

const DrawerScreens = ({ user, signOut }: any) => {
  const { t } = useTranslation();
  // Helper for MiFedha brand translation (character-by-character)
  // Helper for MiFedha brand translation (character-by-character)
  const mifedhaBrand = () => {
    const chars = ['m','i','f','e','d','h','a'];
    const map = t('labels.mifedha', { returnObjects: true }) as Record<string, string>;
    return chars.map(c => map[c] || c).join('');
  };
  // Helper for MF only
  const mfShort = () => {
    const map = t('labels.mifedha', { returnObjects: true }) as Record<string, string>;
    return (map['m'] || 'M') + (map['f'] || 'F');
  };
  // Helper for numerals
  const numeral = (n: number) => {
    const nums = t('numerals', { returnObjects: true }) as Record<string, string>;
    return nums[String(n)] || String(n);
  };

  return <Drawer.Navigator
    screenOptions={{
      headerShown: true,
      header: () => <GlobalHeader user={user} signOut={signOut} />,
      drawerType: 'back',
      edgeWidth: 40, // allow swipe to open
      drawerStyle: {
        width: 260, // restore normal drawer width
        shadowColor: 'transparent',
        elevation: 0,
        borderRightWidth: 0,
        backgroundColor: '#fff',
      },
    }}
  >
    <Drawer.Screen name="Homes" component={BotTab} options={{ drawerLabel: t('appShell.drawer.homes'), title: t('appShell.drawer.homes') }} />
    <Drawer.Screen name="MiFedha Ndogos" component={KFNdogoScreen} options={{ drawerLabel: mfShort() + ' ' + t('labels.ndogo'), title: mfShort() + ' ' + t('labels.ndogo') }} />
    <Drawer.Screen name="MiFedha Kubwa" component={MFKw} options={{ drawerLabel: mfShort() + ' ' + t('labels.kubwa'), title: mfShort() + ' ' + t('labels.kubwa') }} />
    <Drawer.Screen name="MiFedha Advocate" component={AdvSgnIn} options={{ drawerLabel: mfShort() + ' ' + t('labels.advocate'), title: mfShort() + ' ' + t('labels.advocate') }} />
    <Drawer.Screen name="MiFedha Admin 2" component={MFAdmSgnIn} options={{ drawerLabel: mfShort() + ' ' + t('labels.admin', 'Admin') + ' ' + numeral(2), title: mfShort() + ' ' + t('labels.admin', 'Admin') + ' ' + numeral(2) }} />
    <Drawer.Screen name="Bank Admin" component={SignInBankAdm} options={{ drawerLabel: t('labels.bank', 'Bank') + t('labels.admin', 'Admin'), title: t('labels.bank', 'Bank') + t('labels.admin', 'Admin') }} />
    <Drawer.Screen name="MFBankAdmin" component={MFBankAdmin} options={{ drawerLabel: mfShort() + t('labels.bank', 'Bank') + t('labels.admin', 'Admin'), title: mfShort() + t('labels.bank', 'Bank') + t('labels.admin', 'Admin') }} />
    <Drawer.Screen name="MiFedha Admin 1" component={MFSetting} options={{ drawerLabel: mfShort() + ' ' + t('labels.admin', 'Admin') + ' ' + numeral(1), title: mfShort() + ' ' + t('labels.admin', 'Admin') + ' ' + numeral(1) }} />
    <Drawer.Screen name="Reference" component={Ref} options={{ drawerLabel: t('appShell.drawer.reference'), title: t('appShell.drawer.reference') }} />
  </Drawer.Navigator>;
};

const RootNavigator: React.FC<RootNavProps> = ({ colorScheme, user, signOut }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {HomeStackScreenNames.map((name) => (
          <Stack.Screen key={name} name={name} component={RedirectToHome} />
        ))}

        {/* Drawer is kept as one screen so user still sees Drawer UI */}
        <Stack.Screen name="DrawerRoot" options={{ headerShown: false }}>
          {() => <DrawerScreens user={user} signOut={signOut} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
