import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MainAccountGuardContextType {
  restrictNavigation: boolean;
  setRestrictNavigation: React.Dispatch<React.SetStateAction<boolean>>;
}

const MainAccountGuardContext = createContext<MainAccountGuardContextType | undefined>(undefined);

export const MainAccountGuardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [restrictNavigation, setRestrictNavigation] = useState(false);

  return (
    <MainAccountGuardContext.Provider value={{ restrictNavigation, setRestrictNavigation }}>
      {children}
    </MainAccountGuardContext.Provider>
  );
};

export const useMainAccountGuard = () => {
  const context = useContext(MainAccountGuardContext);
  if (!context) {
    throw new Error('useMainAccountGuard must be used within MainAccountGuardProvider');
  }
  return context;
};
