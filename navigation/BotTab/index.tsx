import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome, Fontisto, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Linking, TouchableOpacity } from 'react-native';

import HomeTabNav from "../HomeTabNav";
import FindKFNdogoLoc from '../../screens/MFNdogo/SignInMFN';
import MyAccount from '../../screens/MyAcc';
import HowTo2 from "../../screens/HowTos";
import SearchPal from '../../screens/MyAcc/LoanRequest/VwMakeLnReq';
import Transport from '../../screens/Transport'
import GoShopping from '../../screens/Ads/Search/SrchItemAd'
import { useTranslation } from 'react-i18next';


const BottomTab = createBottomTabNavigator();


const HomeTabNavigator = () => {
  const { t, i18n } = useTranslation();

  // Helper for MiFedha brand translation (character-by-character)
  const mifedhaBrand = () => {
    const chars = ['m','i','f','e','d','h','a'];
    const map = t('labels.mifedha', { returnObjects: true }) as Record<string, string>;
    return chars.map(c => map[c] || c).join('');
  };

  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <BottomTab.Screen
        name='Home'
        component={HomeTabNav}
        options={{
          title: t('appShell.tabs.home'),
          tabBarLabel: t('appShell.tabs.home'),
          tabBarIcon: ({color: string}) => (
            <Fontisto name="home" size={25} color={'skyblue'} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            try {
              navigation.navigate('Home', { screen: 'Homeie' });
            } catch (err) {
              try {
                navigation.jumpTo && navigation.jumpTo('Home');
              } catch (e) {}
            }
          },
        })}
      />

      {/* MFNdogo (Location) */}
      <BottomTab.Screen
        name="MFNdogo"
        component={FindKFNdogoLoc}
        options={{
          title: t('labels.ndogo'),
          tabBarLabel: t('labels.ndogo'),
          tabBarIcon: ({ color }) => <FontAwesome name="map-marker" size={25} color={color} />,
        }}
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
      />
    </BottomTab.Navigator>
  );
};

export default HomeTabNavigator;
