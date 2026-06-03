import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import { useAuthenticator } from './AuthContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 2 minutes in ms
const TICK_MS = 1000; // poll interval

// Context for countdown
interface SessionTimeoutContextType {
  countdown: number;
  remainingTime: number;
  showCountdown: boolean;
  resetTimer: () => void;
}
export const SessionTimeoutContext = createContext<SessionTimeoutContextType>({
  countdown: 0,
  remainingTime: INACTIVITY_TIMEOUT,
  showCountdown: false,
  resetTimer: () => {},
});

export const useSessionTimeout = () => useContext(SessionTimeoutContext);

export const SessionTimeoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut, isSignedIn, loading } = useAuthenticator();

  // Refs: these update without causing re-renders.
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const signOutRef = useRef(signOut);
  const isSignedInRef = useRef(isSignedIn);
  const appStateRef = useRef(AppState.currentState);

  // Keep refs in sync with the latest prop values.
  useEffect(() => { signOutRef.current = signOut; }, [signOut]);
  useEffect(() => { isSignedInRef.current = isSignedIn; }, [isSignedIn]);

  // Display state drives the UI only.
  const [remainingTime, setRemainingTime] = useState(INACTIVITY_TIMEOUT);
  const [showCountdown, setShowCountdown] = useState(false);

  // resetTimer only stamps the current time; it does not create timers.
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Single interval: started when signed in, stopped when signed out.
  // It computes remaining time from wall-clock delta so it never drifts.
  useEffect(() => {
    if (loading) return;

    if (isSignedIn) {
      // Fresh login: reset the activity stamp.
      lastActivityRef.current = Date.now();

      // Guard: never run two intervals simultaneously
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, INACTIVITY_TIMEOUT - elapsed);

        setRemainingTime(remaining);
        setShowCountdown(remaining > 0 && remaining <= 60_000);

        if (remaining === 0) {
          // Stop polling before signing out.
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          signOutRef.current();
        }
      }, TICK_MS);
    } else {
      // Signed out: stop the interval and reset display state.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRemainingTime(INACTIVITY_TIMEOUT);
      setShowCountdown(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isSignedIn, loading]); // intentionally excludes resetTimer / signOut; use refs instead

  // App-state changes: bring to foreground resets the activity stamp.
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isSignedInRef.current
      ) {
        resetTimer();
      }
      appStateRef.current = nextAppState;
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [resetTimer]);

  // countdown: elapsed seconds since last activity (kept for back-compat with GlobalHeader)
  const countdown = Math.floor((INACTIVITY_TIMEOUT - remainingTime) / 1000);

  return (
    <SessionTimeoutContext.Provider value={{ countdown, remainingTime, showCountdown, resetTimer }}>
      <View
        style={{ flex: 1 }}
        onStartShouldSetResponderCapture={() => {
          resetTimer();
          return false;
        }}
        onTouchStart={resetTimer}
      >
        {children}
      </View>
    </SessionTimeoutContext.Provider>
  );
};
