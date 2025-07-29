// src/context/AppContext.jsx
import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState({
    text: '',
    resume: null,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState({
    opportunity: [],
    network: [],
    plan: [],
  });

  const saveProfile = (profileData) => {
    setUserProfile(profileData);
  };

  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
  };

  const addMessage = (tab, message) => {
    setMessages(prev => ({
      ...prev,
      [tab]: [...prev[tab], message]
    }));
  };

  return (
    <AppContext.Provider
      value={{
        userProfile,
        isAdmin,
        messages,
        saveProfile,
        toggleAdminMode,
        addMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
