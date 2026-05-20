import React, { createContext, useContext, useState } from 'react';


const ShoppingModeContext = createContext({
  mode: null,
  setMode: (mode) => {},
  resetMode: () => {},
  selectedBizna: null,
  setSelectedBizna: (bizna) => {},
});


export const ShoppingModeProvider = ({ children }) => {
  const [mode, setModeState] = useState(null);
  const [selectedBizna, setSelectedBizna] = useState(null);
  // Session-persistent (in-memory for now)
  const setMode = (newMode) => {
    setModeState(newMode);
    if (newMode !== 'B2B') setSelectedBizna(null); // Clear bizna if not B2B
  };
  const resetMode = () => {
    setModeState(null);
    setSelectedBizna(null);
  };
  return (
    <ShoppingModeContext.Provider value={{ mode, setMode, resetMode, selectedBizna, setSelectedBizna }}>
      {children}
    </ShoppingModeContext.Provider>
  );
};

export const useShoppingMode = () => useContext(ShoppingModeContext);
