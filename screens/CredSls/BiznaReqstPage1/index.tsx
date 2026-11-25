import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
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
  const requestTypes = [
    { label: t.biz2Pal, screen: 'PlaceLnReq' },
    { label: t.biz2Biz, screen: 'PlaceLnReq2' },
    { label: t.pal2Biz, screen: 'PlaceLnReq3' },
    { label: t.pal2Pal, screen: 'PlaceLnReq4' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.accountText}>{t.requestLoans}</Text>
          <Text style={styles.subtitle}>{t.chooseRequestType}</Text>
        </View>

        <View style={styles.options}>
          {requestTypes.map((option, index) => (
            <Pressable
              key={option.screen}
              onPress={() => goToScreen(option.screen)}
              style={({ pressed }) => [styles.optionButton, pressed && styles.pressedButton]}
              accessibilityRole="button"
            >
              <View style={[styles.numberBadge, index % 2 === 0 ? styles.greenBadge : styles.blueBadge]}>
                <Text style={styles.numberText}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={styles.optionText}>{option.label}</Text>
              <Text style={styles.chevron} accessibilityElementsHidden>
                {'>'}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default MyAccount;