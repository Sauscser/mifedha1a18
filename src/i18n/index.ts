import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18n as AmplifyI18n } from 'aws-amplify/utils';
import * as Updates from 'expo-updates';
import { I18nManager } from 'react-native';
import { resources, SUPPORTED_LANGUAGES, SupportedLanguage } from './resources';
import { amplifyCustomVocabularies } from './amplifyVocabularies';

const STORAGE_KEY = 'app_language';
const RTL_LANGUAGES = new Set<SupportedLanguage>(['ar', 'he']);

const isSupported = (lang: string): lang is SupportedLanguage =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);

export const normalizeLanguage = (lang?: string | null): SupportedLanguage => {
  if (!lang) return 'en';
  const base = lang.toLowerCase().split(/[-_]/)[0];
  return isSupported(base) ? base : 'en';
};

export const isRtlLanguage = (lang: string) => RTL_LANGUAGES.has(normalizeLanguage(lang));

const syncLayoutDirection = (lang: SupportedLanguage) => {
  const shouldBeRtl = RTL_LANGUAGES.has(lang);
  const hasDirectionChanged = I18nManager.isRTL !== shouldBeRtl;

  if (hasDirectionChanged) {
    I18nManager.allowRTL(shouldBeRtl);
    I18nManager.forceRTL(shouldBeRtl);
  }

  return hasDirectionChanged;
};

const deviceLanguage = normalizeLanguage(
  (Localization.getLocales?.()[0]?.languageCode as string | undefined) ||
    (Localization.getLocales?.()[0]?.languageTag as string | undefined) ||
    'en'
);

syncLayoutDirection(deviceLanguage);

const syncAmplifyLanguage = (lang: SupportedLanguage) => {
  AmplifyI18n.putVocabularies(amplifyCustomVocabularies);
  AmplifyI18n.setLanguage(lang);
};

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

syncAmplifyLanguage(deviceLanguage);

void (async () => {
  try {
    const persisted = await AsyncStorage.getItem(STORAGE_KEY);
    const resolved = normalizeLanguage(persisted);

    const directionChanged = syncLayoutDirection(resolved);

    if (resolved !== i18n.language) {
      await i18n.changeLanguage(resolved);
      syncAmplifyLanguage(resolved);
    }

    if (directionChanged) {
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.log('i18n init warning', error);
  }
})();

export const setAppLanguage = async (lang: string) => {
  const resolved = normalizeLanguage(lang);
  const directionChanged = syncLayoutDirection(resolved);
  await i18n.changeLanguage(resolved);
  syncAmplifyLanguage(resolved);
  await AsyncStorage.setItem(STORAGE_KEY, resolved);

  if (directionChanged) {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.log('RTL reload warning', error);
    }
  }
};

export const getCurrentLanguage = (): SupportedLanguage =>
  normalizeLanguage(i18n.language);

export default i18n;
