import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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
import { useMainAccountGuard } from '../../src/contexts/MainAccountGuardContext';
import { drawerTranslations } from '../../src/i18n/drawerTranslations';
import { ChatBotModal } from '../../src/components/ChatBotModal';

export const navigationRef = createNavigationContainerRef<any>();
const Drawer = createDrawerNavigator<any>();

export type RootNavProps = {
  colorScheme: 'light' | 'dark';
  user: { username?: string } | null;
  signOut: () => void;
};
const Stack = createNativeStackNavigator<any>();

const DrawerScreens = ({ user, signOut, route }: any) => {
  const { restrictNavigation } = useMainAccountGuard();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.split('-')[0];
  const drawer = drawerTranslations[lang] || drawerTranslations.en;
  const deepParams = route?.params;
  const drawerScreenNames = ['Homes', 'NiSenti Ndogos', 'NiSenti Kubwa', 'NiSenti Advocate', 'NiSenti Admin 2', 'Bank Admin', 'NiSenti Admin 1', 'Reference'];
  const initialDrawerScreen = drawerScreenNames.includes(deepParams?.screen) ? deepParams?.screen : 'Homes';
  const homesInitialParams = initialDrawerScreen === 'Homes' ? deepParams?.params : undefined;
  
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
    id="RootDrawer"
    initialRouteName={initialDrawerScreen}
    screenOptions={{
      headerShown: true,
      header: ({ navigation }) => <GlobalHeader navigation={navigation} user={user} signOut={signOut} />,
      drawerType: 'back',
      swipeEnabled: !restrictNavigation,
      swipeEdgeWidth: restrictNavigation ? 0 : 40,
      drawerStyle: {
        width: 260, // restore normal drawer width
        shadowColor: 'transparent',
        elevation: 0,
        borderRightWidth: 0,
        backgroundColor: '#fff',
      },
    }}
  >
    <Drawer.Screen
      name="Homes"
      component={BotTab}
      initialParams={homesInitialParams}
      options={{ drawerLabel: drawer.homes, title: drawer.homes }}
    />
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
  const handleNavigateToProduct = (screenName: string) => {
    if (!navigationRef.isReady()) {
      console.warn('Navigation not ready yet for bot navigation');
      return;
    }

    const isHomeStackScreen = HomeStackScreenNames.includes(screenName);
    const bottomTabScreens = ['Home', 'NSNdogo', 'HowTo', 'Transport', 'GoShopping', 'Search Pal'];
    const isBottomTabScreen = bottomTabScreens.includes(screenName);
    const targetParams = isHomeStackScreen
      ? { screen: 'Homes', params: { screen: 'Home', params: { screen: screenName } } }
      : isBottomTabScreen
      ? { screen: 'Homes', params: { screen: screenName } }
      : { screen: 'Homes', params: { screen: screenName } };

    navigationRef.navigate('DrawerRoot', targetParams);
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
        {/* Drawer is kept as one screen so users still see the drawer UI */}
        <Stack.Screen name="DrawerRoot" options={{ headerShown: false }}>
          {({ route }) => <DrawerScreens user={user} signOut={signOut} route={route} />}
        </Stack.Screen>
      </Stack.Navigator>
      
      {/* Chat Bot Modal - Persists across all screens */}
      <ChatBotModal onNavigate={handleNavigateToProduct} />
    </NavigationContainer>
  );
};

export default RootNavigator;
