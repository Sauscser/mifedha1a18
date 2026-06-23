import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const MyAccount = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const navigation = useNavigation();
  const goToScreen = (screen: string) => {
    navigation.navigate(screen);
  };
  return <SafeAreaView style={{
    flex: 1
  }}>
      <View style={styles.image}>
        <View style={styles.accountView}>
          <Text style={styles.accountText}>{t.requestLoans}</Text>

          <View style={styles.viewForSalesPressables}>
            <Pressable onPress={() => goToScreen('PlaceLnReq')} style={styles.acPressables}>
              <Text style={styles.acPressableText}>{t.biz2Pal}</Text>
            </Pressable>

            <Pressable onPress={() => goToScreen('PlaceLnReq2')} style={styles.acPressables}>
              <Text style={styles.acPressableText}>{t.biz2Biz}</Text>
            </Pressable>

            <Pressable onPress={() => goToScreen('PlaceLnReq3')} style={styles.acPressables}>
              <Text style={styles.acPressableText}>{t.pal2Biz}</Text>
            </Pressable>

            <Pressable onPress={() => goToScreen('PlaceLnReq4')} style={styles.acPressables}>
              <Text style={styles.acPressableText}>{t.pal2Pal}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>;
};
export default MyAccount;