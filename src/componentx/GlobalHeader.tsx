import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { uploadData, getUrl } from '@aws-amplify/storage';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSessionTimeout } from '../contexts/SessionTimeoutProvider';

export default function GlobalHeader({ user, signOut }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { countdown, showCountdown, remainingTime, resetTimer } = useSessionTimeout();

  // Helper to render greeting with countdown
  const greetingText = showCountdown
    ? `${t('appShell.globalHeader.welcome', { username: user?.username || '' })} (${Math.ceil(remainingTime / 1000)})`
    : t('appShell.globalHeader.welcome', { username: user?.username || '' });

  return (
    <LinearGradient
      colors={['#e29d58', 'skyblue']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, { paddingTop: insets.top + 24 }]}
    >
      <TouchableOpacity onPress={resetTimer} activeOpacity={0.7}>
        <Text style={styles.greeting}>{greetingText}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={signOut}>
        <Text style={styles.signOut}>{t('appShell.globalHeader.signOut')}</Text>
      </TouchableOpacity>
      {/* {showCountdown && (
        <View style={styles.countdownBox}>
          <Text style={styles.countdownText}>
            {Math.ceil(remainingTime / 1000)}
          </Text>
        </View>
      )} */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signOut: {
    fontSize: 16,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  countdown: {
    fontSize: 16,
    color: '#fff',
  },
  remainingTime: {
    fontSize: 16,
    color: '#fff',
  },
  countdownBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    backgroundColor: '#fffbe6',
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e29d58',
    zIndex: 10,
  },
  countdownText: {
    color: '#e29d58',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
