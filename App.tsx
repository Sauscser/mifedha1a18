import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import useColorScheme from './hooks/useColorScheme';
import RootNav from './navigation/RootNav';
import { ExchangeProvider } from './src/contexts/ExchangeContext';
import { getCurrentLanguage, setAppLanguage } from './src/i18n';
import { SUPPORTED_LANGUAGES } from './src/i18n/resources';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { SessionTimeoutProvider } from './src/contexts/SessionTimeoutProvider';
import { AuthProvider } from './src/contexts/AuthContext';
import { MainAccountGuardProvider } from './src/contexts/MainAccountGuardContext';
import { ChatBotProvider } from './src/contexts/ChatBotContext';
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const getDynamicBottomMargin = () => {
  // 2cm in pixels: 2 * 10mm = 20mm; 1 inch = 25.4mm
  // 2cm = 0.7874 inch
  // pixels = dpi * inches
  // PixelRatio.get() returns the device pixel density
  // But for margin, we want dp units, so use 2cm in dp: 2cm = 20mm = 20/25.4 * 160 = ~126dp
  // We'll use 120dp for a round value
  return Platform.select({
    ios: 120,
    android: 120,
    default: 120
  });
};

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  ar: 'العربية',
  zh: '中文',
  ru: 'Русский',
  sw: 'Kiswahili',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  he: 'עברית',
  hi: 'हिन्दी',
  am: 'አማርኛ',
};

// Ensure language order in SUPPORTED_LANGUAGES for selector
const ORDERED_LANGUAGES: SupportedLanguage[] = [
  'en', 'ar', 'zh', 'ru', 'sw', 'fr', 'es', 'de', 'pt', 'it', 'he', 'hi', 'am'
];

const styles = StyleSheet.create({
  verticalRoot: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  topPane: {
    flex: 1,
    minHeight: 0,
    paddingVertical: 20, // Set to about half the original (was 32)
    paddingHorizontal: 12,
  },
  languageContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    minHeight: 52, // Set to about half between original (64) and previous (40)
    marginBottom: -12, // Move up by about half the previous negative margin
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 10,
    width: 'auto',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  languageButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 6,
    minWidth: 100,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  languageButtonActive: {
    backgroundColor: '#e58d29',
    borderColor: '#e58d29',
  },
  languageButtonText: {
    fontSize: 15,
    color: '#333',
  },
  languageButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

function LaunchLanguageSelector({ setLanguage }: { setLanguage?: (lang: SupportedLanguage) => void }) {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(getCurrentLanguage());
  const [showArrow, setShowArrow] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const normalized = (i18n.language || 'en').split('-')[0] as SupportedLanguage;
    if (normalized !== selectedLanguage && (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)) {
      setSelectedLanguage(normalized);
    }
  }, [i18n.language, selectedLanguage]);

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    await setAppLanguage(lang);
    if (setLanguage) setLanguage(lang);
  };

  const handleContentSizeChange = (w: number, _h: number) => {
    setContentWidth(w);
    setShowArrow(w > containerWidth + 8);
  };
  const handleLayout = (e: any) => {
    setContainerWidth(e.nativeEvent.layout.width);
    setShowArrow(contentWidth > e.nativeEvent.layout.width + 8);
  };
  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    if (contentOffset.x + layoutMeasurement.width >= contentSize.width - 24) {
      setShowArrow(false);
    } else if (contentSize.width > layoutMeasurement.width + 8) {
      setShowArrow(true);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{backgroundColor: '#fff'}}>
      <View style={styles.languageContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center', width: '100%'}} onLayout={handleLayout}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageGrid}
            onContentSizeChange={handleContentSizeChange}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {ORDERED_LANGUAGES.map(lang => {
              const isActive = selectedLanguage === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[styles.languageButton, isActive ? styles.languageButtonActive : null]}
                  onPress={() => handleLanguageChange(lang)}
                >
                  <Text style={[styles.languageButtonText, isActive ? styles.languageButtonTextActive : null]}>{languageLabels[lang]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {showArrow && (
            <Ionicons name="chevron-forward" size={28} color="#bbb" style={{marginLeft: 2, marginBottom: 6}} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function AuthenticatedApp() {
  const { user, signOut } = useAuthenticator();
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <RootNav
        colorScheme={colorScheme}
        user={user}
        signOut={signOut}
      />
      <StatusBar />
    </SafeAreaProvider>
  );
}

function LanguageSelectorConditional({ setLanguage }: { setLanguage?: (lang: SupportedLanguage) => void }) {
  const { route } = useAuthenticator((context) => [context.route]);
  // Show only on signIn, signUp, forgotPassword, confirmSignUp, setupTotp, confirmResetPassword
  const show = [
    'signIn', 'signUp', 'forgotPassword', 'confirmSignUp', 'setupTotp', 'confirmResetPassword'
  ].includes(route);
  if (!show) return null;
  return <LaunchLanguageSelector setLanguage={setLanguage} />;
}

function AppLayout({ language, setLanguage }: { language: SupportedLanguage, setLanguage: (lang: SupportedLanguage) => void }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  return (
    <View style={styles.verticalRoot}>
      {/* Language selector at the top, always visible */}
      <LaunchLanguageSelector setLanguage={setLanguage} />
      <View style={styles.topPane}>
        {authStatus === 'authenticated' ? (
          <ExchangeProvider>
            <AuthenticatedApp />
          </ExchangeProvider>
        ) : (
          <Authenticator key={language}>
            <ExchangeProvider>
              <AuthenticatedApp />
            </ExchangeProvider>
          </Authenticator>
        )}
      </View>
    </View>
  );
}

export default function App() {
  const [language, setLanguage] = useState<SupportedLanguage>(getCurrentLanguage());

  return (
    <AuthProvider>
      <SessionTimeoutProvider>
        <I18nextProvider i18n={i18n}>
          <Authenticator.Provider>
            <MainAccountGuardProvider>
              <ChatBotProvider>
                <AppLayout language={language} setLanguage={setLanguage} />
              </ChatBotProvider>
            </MainAccountGuardProvider>
          </Authenticator.Provider>
        </I18nextProvider>
      </SessionTimeoutProvider>
    </AuthProvider>
  );
}