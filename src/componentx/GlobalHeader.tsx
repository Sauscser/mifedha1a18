import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { uploadData, getUrl } from '@aws-amplify/storage';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { DrawerActions } from '@react-navigation/native';
import { useSessionTimeout } from '../contexts/SessionTimeoutProvider';
import { useMainAccountGuard } from '../contexts/MainAccountGuardContext';
import { Ionicons } from '@expo/vector-icons';

type GlobalHeaderProps = {
  user: { username?: string } | null;
  signOut: () => void;
  navigation?: any;
};

export default function GlobalHeader({ user, signOut, navigation }: GlobalHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { restrictNavigation } = useMainAccountGuard();
  const { countdown, showCountdown, remainingTime, resetTimer } = useSessionTimeout();

  const greetingText = showCountdown
    ? `${t('appShell.globalHeader.welcome', { username: user?.username || '' })} (${Math.ceil(remainingTime / 1000)})`
    : t('appShell.globalHeader.welcome', { username: user?.username || '' });

  const openDrawer = () => {
    if (restrictNavigation) {
      return;
    }
    if (navigation?.dispatch) {
      navigation.dispatch(DrawerActions.openDrawer());
      return;
    }
    if (navigation?.openDrawer) {
      navigation.openDrawer();
      return;
    }
    if (navigation?.toggleDrawer) {
      navigation.toggleDrawer();
      return;
    }
    const parentNav = navigation?.getParent?.();
    if (parentNav?.dispatch) {
      parentNav.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <LinearGradient
      colors={['#e29d58', 'skyblue']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, { paddingTop: insets.top + 24 }]}
    >
      <View style={styles.menuRow}>
        <TouchableOpacity
          onPress={openDrawer}
          activeOpacity={0.7}
          disabled={restrictNavigation}
          style={[styles.menuButton, restrictNavigation && styles.disabledButton]}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.actionRow}>
        <Text style={styles.greeting}>{greetingText}</Text>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOut}>{t('appShell.globalHeader.signOut')}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
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
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.45,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
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
