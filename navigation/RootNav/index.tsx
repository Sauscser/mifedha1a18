import React from 'react';
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BotTab from '../BotTab';
import { HomeStackScreenNames } from '../HomeTabNav';
import KFNdogoScreen from '../../screens/MFNdogo';
import MFKw from '../../screens/MFKubwa';
import AdvSgnIn from '../../screens/Advocate/AdvocateHm';
import MFAdmSgnIn from '../../screens/MFAdmin/SignInAdm';
import SignInBankAdm from '../../screens/MFBankAdmin/SignInAdm';
import MFSetting from '../../screens/Settings/SignIn';
import Ref from '../../screens/Settings/Reference';
import { useTranslation } from 'react-i18next';
import { navigationRef } from '../navigationRef';

import GlobalHeader from '../../src/componentx/GlobalHeader';
import { useMainAccountGuard } from '../../src/contexts/MainAccountGuardContext';
import { drawerTranslations } from '../../src/i18n/drawerTranslations';
import { ChatBotModal } from '../../src/components/ChatBotModal';

const Drawer = createDrawerNavigator<any>();

export type RootNavProps = {
  colorScheme: 'light' | 'dark';
  user: { username?: string } | null;
  signOut: () => void;
};
const drawerScreenNames = ['Homes', 'NiSenti Ndogos', 'NiSenti Kubwa', 'NiSenti Advocate', 'NiSenti Admin 2', 'Bank Admin', 'NiSenti Admin 1', 'Reference'];

const RootNavigator: React.FC<RootNavProps> = ({ colorScheme, user, signOut }) => {
  const { restrictNavigation } = useMainAccountGuard();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.split('-')[0];
  const drawer = drawerTranslations[lang] || drawerTranslations.en;

  const handleNavigateToProduct = (screenName: string, params?: any) => {
    if (!navigationRef.isReady()) {
      console.warn('Navigation not ready yet for bot navigation');
      return;
    }

    const isHomeStackScreen = HomeStackScreenNames.includes(screenName);
    const isDrawerScreen = drawerScreenNames.includes(screenName);

    if (isDrawerScreen) {
      navigationRef.dispatch(
        CommonActions.navigate({ name: screenName, params })
      );
      return;
    }

    if (isHomeStackScreen) {
      navigationRef.dispatch(
        CommonActions.navigate({
          name: 'Homes',
          params: {
            screen: 'Home',
            params: { screen: screenName, params },
          },
        })
      );
      return;
    }

    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'Homes',
        params: { screen: screenName, params },
      })
    );
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Drawer.Navigator
        id="RootDrawer"
        initialRouteName="Homes"
        screenOptions={{
          headerShown: true,
          header: ({ navigation }) => <GlobalHeader navigation={navigation} user={user} signOut={signOut} />,
          drawerType: 'back',
          swipeEnabled: !restrictNavigation,
          swipeEdgeWidth: restrictNavigation ? 0 : 40,
          drawerStyle: {
            width: 260,
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
          options={{ drawerLabel: drawer.homes, title: drawer.homes }}
        />
        <Drawer.Screen name="NiSenti Ndogos" component={KFNdogoScreen} options={{ drawerLabel: drawer.ndogo, title: drawer.ndogo }} />
        <Drawer.Screen name="NiSenti Kubwa" component={MFKw} options={{ drawerLabel: drawer.kubwa, title: drawer.kubwa }} />
        <Drawer.Screen name="NiSenti Advocate" component={AdvSgnIn} options={{ drawerLabel: drawer.advocate, title: drawer.advocate }} />
        <Drawer.Screen name="NiSenti Admin 2" component={MFAdmSgnIn} options={{ drawerLabel: drawer.admin2, title: drawer.admin2 }} />
        <Drawer.Screen name="Bank Admin" component={SignInBankAdm} options={{ drawerLabel: drawer.bankAdmin, title: drawer.bankAdmin }} />
        <Drawer.Screen name="NiSenti Admin 1" component={MFSetting} options={{ drawerLabel: drawer.admin1, title: drawer.admin1 }} />
        <Drawer.Screen name="Reference" component={Ref} options={{ drawerLabel: drawer.reference, title: drawer.reference }} />
      </Drawer.Navigator>
      <ChatBotModal onNavigate={handleNavigateToProduct} />
    </NavigationContainer>
  );
};

export default RootNavigator;
