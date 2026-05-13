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
import { drawerTranslations } from '../../src/i18n/drawerTranslations';

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
  const { i18n } = useTranslation();
  const lang = i18n.language.split('-')[0];
  const drawer = drawerTranslations[lang] || drawerTranslations.en;
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
    <Drawer.Screen name="Homes" component={BotTab} options={{ drawerLabel: drawer.homes, title: drawer.homes }} />
    <Drawer.Screen name="NiSenti Ndogos" component={KFNdogoScreen} options={{ drawerLabel: drawer.ndogo, title: drawer.ndogo }} />
    <Drawer.Screen name="NiSenti Kubwa" component={MFKw} options={{ drawerLabel: drawer.kubwa, title: drawer.kubwa }} />
    <Drawer.Screen name="NiSenti Advocate" component={AdvSgnIn} options={{ drawerLabel: drawer.advocate, title: drawer.advocate }} />
    <Drawer.Screen name="NiSenti Admin 2" component={MFAdmSgnIn} options={{ drawerLabel: drawer.admin2, title: drawer.admin2 }} />
    <Drawer.Screen name="Bank Admin" component={SignInBankAdm} options={{ drawerLabel: drawer.bankAdmin, title: drawer.bankAdmin }} />
    <Drawer.Screen name="NiSenti Admin 1" component={MFSetting} options={{ drawerLabel: drawer.admin1, title: drawer.admin1 }} />
    <Drawer.Screen name="Reference" component={Ref} options={{ drawerLabel: drawer.reference, title: drawer.reference }} />
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
