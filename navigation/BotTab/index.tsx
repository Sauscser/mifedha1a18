import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome, Fontisto, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Alert, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMainAccountGuard } from '../../src/contexts/MainAccountGuardContext';

import HomeTabNav from "../HomeTabNav";
import FindKFNdogoLoc from '../../screens/MFNdogo/SearchMFN';
import MyAccount from '../../screens/MyAcc';
import HowTo2 from "../../screens/HowTos";
import SearchPal from '../../screens/MyAcc/LoanRequest/VwMakeLnReq';
import Transport from '../../screens/Transport';
import GoShopping from '../../screens/Ads/Search/SrchItemAd';

type HomeBottomTabParamList = {
  Home: undefined;
  NSNdogo: undefined;
  HowTo: undefined;
  Transport: undefined;
  GoShopping: undefined;
  'Search Pal': undefined;
};

const BottomTab = createBottomTabNavigator<HomeBottomTabParamList>();


const HomeTabNavigator = ({ route, navigation }: any) => {
  const { t, i18n } = useTranslation();
  const { restrictNavigation } = useMainAccountGuard();

  const homeInitialParams = route?.params;

  const resolveTarget = (params: any) => {
    let target = params;
    while (target?.screen === 'Homes' || target?.screen === 'Home') {
      target = target?.params;
    }
    return target;
  };

  const homeScreenInitialParams = React.useMemo(() => {
    const target = resolveTarget(homeInitialParams);
    return target?.screen ? target : undefined;
  }, [homeInitialParams]);

  const handleBlockedNavigation = (e: any) => {
    if (restrictNavigation) {
      e.preventDefault();
      Alert.alert(
        t('appShell.guard.completeMainAccountTitle'),
        t('appShell.guard.completeMainAccountSetup')
      );
    }
  };

  // Helper for MiFedha brand translation (character-by-character)
  const mifedhaBrand = () => {
    const chars = ['m','i','f','e','d','h','a'];
    const map = t('labels.mifedha', { returnObjects: true }) as Record<string, string>;
    return chars.map(c => map[c] || c).join('');
  };

  return (
    <BottomTab.Navigator
      id="HomeBottomTab"
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <BottomTab.Screen
        name='Home'
        component={HomeTabNav}
        initialParams={homeScreenInitialParams}
        options={{
          title: t('appShell.tabs.home'),
          tabBarLabel: t('appShell.tabs.home'),
          tabBarIcon: ({color: string}) => (
            <Fontisto name="home" size={25} color={'skyblue'} />
          ),
        }}
        listeners={() => ({
          tabPress: e => {
            handleBlockedNavigation(e);
          },
        })}
      />

      {/* NSNdogo (Location) */}
      <BottomTab.Screen
        name="NSNdogo"
        component={FindKFNdogoLoc}
        options={{
          title: t('labels.ndogo'),
          tabBarLabel: t('labels.ndogo'),
          tabBarIcon: ({ color }) => <FontAwesome name="map-marker" size={25} color={color} />,
        }}
        listeners={{ tabPress: handleBlockedNavigation }}
      />

      {/* My Account */}
      <BottomTab.Screen
        name="HowTo"
        component={HowTo2}
        options={{
          title: t('appShell.tabs.howTo'),
          tabBarLabel: t('appShell.tabs.howTo'),
          tabBarIcon: ({ color }) => <FontAwesome name="youtube-play" size={25} color={color} />,
        }}
        listeners={{ tabPress: handleBlockedNavigation }}
      />

      {/* Transport */}
      <BottomTab.Screen
        name="Transport"
        component={Transport}
        options={{
          title: t('appShell.tabs.transport'),
          tabBarLabel: t('appShell.tabs.transport'),
          tabBarIcon: ({ color }) => <MaterialIcons name="emoji-transportation" size={25} color={color} />,
        }}
        listeners={{ tabPress: handleBlockedNavigation }}
      />

      {/* How To (Opens YouTube Channel) */}
      <BottomTab.Screen
        name="GoShopping"
        component={GoShopping}
        options={{
          title: t('appShell.tabs.goShopping'),
          tabBarLabel: t('appShell.tabs.goShopping'),
          tabBarIcon: ({ color }) => <FontAwesome name="map-marker" size={25} color={color} />,
        }}
        listeners={{ tabPress: handleBlockedNavigation }}
      />

      {/* Search Pal */}
      <BottomTab.Screen
        name="Search Pal"
        component={SearchPal}
        options={{
          title: t('labels.pal'),
          tabBarLabel: t('labels.pal'),
          tabBarIcon: ({ color }) => <FontAwesome name="search" size={25} color={color} />,
        }}
        listeners={{ tabPress: handleBlockedNavigation }}
      />
    </BottomTab.Navigator>
  );
};

export default HomeTabNavigator;
