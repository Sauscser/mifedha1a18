import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hub } from 'aws-amplify/utils';
import { 
  getCurrentUser, 
  signOut as amplifySignOut,
  AuthUser
} from 'aws-amplify/auth';

const AUTH_REFRESH_EVENTS = new Set([
  'signIn',
  'autoSignIn',
  'signOut',
  'signedIn',
  'signedOut',
]);

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    console.log('[AuthContext] useEffect: running checkUser');
    void checkUser();

    // Listen for Amplify Auth events
    const listener = (data: any) => {
      const { payload } = data;
      console.log('[AuthContext] Hub event:', payload.event);
      if (AUTH_REFRESH_EVENTS.has(payload.event)) {
        void checkUser();
      }
    };
    const unsubscribe = Hub.listen('auth', listener);
    return () => {
      unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      console.log('[AuthContext] checkUser: got currentUser', currentUser);
      setUser(currentUser);
      setIsSignedIn(true);
    } catch (error) {
      // User not signed in
      console.log('[AuthContext] checkUser: no user found', error);
      setUser(null);
      setIsSignedIn(false);
    } finally {
      setLoading(false);
      console.log('[AuthContext] checkUser: loading set to false');
    }
  };

  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
      setIsSignedIn(false);
      console.log('[AuthContext] signOut: user signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('[AuthContext] State change:', { user, isSignedIn, loading });
  }, [user, isSignedIn, loading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        isSignedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthenticator = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthenticator must be used within AuthProvider');
  }
  return {
    user: context.user,
    signOut: context.signOut,
    isSignedIn: context.isSignedIn,
    loading: context.loading,
  };
};
