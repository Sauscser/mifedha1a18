import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatBotContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  openChat: () => void;
  closeChat: () => void;
  clearMessages: () => void;
  addMessage: (text: string, sender: 'user' | 'bot') => void;
  setLoading: (loading: boolean) => void;
}

const ChatBotContext = createContext<ChatBotContextType | undefined>(undefined);

export const ChatBotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const clearMessages = useCallback(() => setMessages([]), []);
  
  const addMessage = useCallback((text: string, sender: 'user' | 'bot') => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    }]);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const value: ChatBotContextType = {
    isOpen,
    messages,
    isLoading,
    openChat,
    closeChat,
    clearMessages,
    addMessage,
    setLoading
  };

  return (
    <ChatBotContext.Provider value={value}>
      {children}
    </ChatBotContext.Provider>
  );
};

export const useChatBot = (): ChatBotContextType => {
  const context = useContext(ChatBotContext);
  if (!context) {
    throw new Error('useChatBot must be used within ChatBotProvider');
  }
  return context;
};
