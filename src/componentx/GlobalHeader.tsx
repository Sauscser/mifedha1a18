import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { uploadData, getUrl } from '@aws-amplify/storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { DrawerActions } from '@react-navigation/native';
import { useSessionTimeout } from '../contexts/SessionTimeoutProvider';
import { useMainAccountGuard } from '../contexts/MainAccountGuardContext';
import { useChatBot } from '../contexts/ChatBotContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
  const { openChat } = useChatBot();

  const greetingText = showCountdown
    ? `${t('appShell.globalHeader.welcome', { username: user?.username || '' })} (${Math.ceil(remainingTime / 1000)})`
    : t('appShell.globalHeader.welcome', { username: user?.username || '' });

  const chatMessages = useMemo(
    () => [
      t('appShell.globalHeader.chatHi'),
      t('appShell.globalHeader.chatHelp'),
    ],
    [t]
  );
  const [chatMessageIndex, setChatMessageIndex] = useState(0);
  const chatOpacity = useRef(new Animated.Value(0)).current;
  const chatWidth = useRef(new Animated.Value(52)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const currentIndexRef = useRef(0);
  const animationStopped = useRef(false);

  useEffect(() => {
    animationStopped.current = false;
    const safeMessages = chatMessages.filter(Boolean);
    if (safeMessages.length === 0) {
      return undefined;
    }

    const animateChatHint = () => {
      const currentIndex = currentIndexRef.current % safeMessages.length;
      const text = safeMessages[currentIndex] || safeMessages[0] || 'Hi!';
      const targetWidth = Math.min(220, Math.max(52, 52 + (text?.length ?? 0) * 6));
      setChatMessageIndex(currentIndex);
      chatOpacity.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(chatOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(chatWidth, {
            toValue: targetWidth,
            friction: 12,
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(iconScale, {
              toValue: 1.1,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.timing(iconScale, {
              toValue: 1,
              duration: 180,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.delay(2200),
        Animated.parallel([
          Animated.timing(chatOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(chatWidth, {
            toValue: 52,
            duration: 250,
            useNativeDriver: false,
          }),
        ]),
      ]).start(({ finished }) => {
        if (!finished || animationStopped.current) {
          return;
        }
        currentIndexRef.current = (currentIndex + 1) % chatMessages.length;
        animateChatHint();
      });
    };

    animateChatHint();
    return () => {
      animationStopped.current = true;
      chatOpacity.stopAnimation();
      chatWidth.stopAnimation();
      iconScale.stopAnimation();
    };
  }, [chatMessages, chatOpacity, chatWidth, iconScale]);

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

  const handleChatPress = () => {
    if (restrictNavigation) {
      Alert.alert(
        t('appShell.guard.completeMainAccountTitle'),
        t('appShell.guard.completeMainAccountSetup')
      );
      return;
    }
    openChat();
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
        
        <View style={styles.chatContainer}>
          <Animated.View
            style={[
              styles.chatBubble,
              {
                width: chatWidth,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleChatPress}
              activeOpacity={0.7}
              style={[styles.chatButton, restrictNavigation && styles.disabledButton]}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <MaterialCommunityIcons name="chat-outline" size={32} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
            <Animated.Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={[
                styles.chatHint,
                {
                  opacity: chatOpacity,
                  transform: [
                    {
                      translateY: chatOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {chatMessages[chatMessageIndex]}
            </Animated.Text>
          </Animated.View>
        </View>

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
  chatButton: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatContainer: {
    alignItems: 'flex-end',
  },
  chatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 52,
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'visible',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  chatHint: {
    marginLeft: 8,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    maxWidth: '100%',
    flexWrap: 'wrap',
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
