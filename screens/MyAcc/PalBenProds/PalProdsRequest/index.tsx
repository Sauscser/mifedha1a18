import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, View, Text, Pressable } from 'react-native';
import styles from './styles';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';

const MyAccount = () => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  const goTo = (screen) => navigation.navigate(screen);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.image}>
        <View style={styles.accountView}>
          <Text style={styles.accountText}>{t.myAccount}</Text>

          {/* Company Section */}
          <View style={styles.acPressables}>
            <Text style={styles.acPressableText}>{t.company}</Text>
            <View style={styles.row}>
              <Pressable onPress={() => goTo('PlaceLnReqB2P')} style={styles.acNonLnsPressables}>
                <Text style={styles.acNonLnsPressablesText}>{t.request}</Text>
              </Pressable>
              <Pressable onPress={() => goTo('Vw2DelLnReqsBiz')} style={styles.acNonLnsPressables}>
                <Text style={styles.acNonLnsPressablesText}>{t.view}</Text>
              </Pressable>
            </View>
          </View>

          {/* Pal Section */}
          <View style={styles.acPressables}>
            <Text style={styles.acPressableText}>{t.pal}</Text>
            <View style={styles.row}>
              <Pressable onPress={() => goTo('PlaceLnReqP2P')} style={styles.acNonLnsPressables}>
                <Text style={styles.acNonLnsPressablesText}>{t.request}</Text>
              </Pressable>
              <Pressable onPress={() => goTo('Vw2DelLnReqs')} style={styles.acNonLnsPressables}>
                <Text style={styles.acNonLnsPressablesText}>{t.view}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MyAccount;
