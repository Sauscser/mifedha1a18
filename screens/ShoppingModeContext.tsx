import React, { createContext, useContext, useState } from 'react';

export type ShoppingMode = 'B2C' | 'B2B' | undefined;
export interface ShoppingModeContextType {
  mode: ShoppingMode;
  setMode: (mode: ShoppingMode) => void;
  selectedBizna: any;
  setSelectedBizna: (bizna: any) => void;
}

const ShoppingModeContext = createContext<ShoppingModeContextType | undefined>(undefined);

export const ShoppingModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ShoppingMode>(undefined);
  const [selectedBizna, setSelectedBizna] = useState<any>(null);
  return (
    <ShoppingModeContext.Provider value={{ mode, setMode, selectedBizna, setSelectedBizna }}>
      {children}
    </ShoppingModeContext.Provider>
  );
};

export const useShoppingMode = () => {
  const context = useContext(ShoppingModeContext);
  if (!context) {
    throw new Error('useShoppingMode must be used within a ShoppingModeProvider');
  }
  return context;
};
