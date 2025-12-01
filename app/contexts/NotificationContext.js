"use client";

import React, { createContext, useContext, useState } from 'react';
import Modal from '../components/Modal';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (title, message, type = 'info') => {
    setNotification({ title, message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Modal
        isOpen={!!notification}
        onClose={hideNotification}
        title={notification?.title}
        message={notification?.message}
        type={notification?.type}
      />
    </NotificationContext.Provider>
  );
};