"use client";

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import { API_ENDPOINTS, apiPost, apiPut } from '../config/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial state from localStorage on client side
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('billsnack_token');
      const storedUser = localStorage.getItem('billsnack_user');
      
      if (storedToken) {
        setToken(storedToken);
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('billsnack_token', token);
    } else {
      localStorage.removeItem('billsnack_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('billsnack_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('billsnack_user');
    }
  }, [user]);

  const register = async ({ email, password, firstName, lastName, username, phone, gender, profileImage, profileImageUrl }) => {
    const body = { email, password, firstName, lastName };
    if (username) body.username = username;
    if (phone) body.phone = phone;
    if (gender) body.gender = gender;
    if (profileImage) body.profileImage = profileImage;
    if (profileImageUrl) body.profileImageUrl = profileImageUrl;

    try {
      const data = await apiPost(API_ENDPOINTS.AUTH.REGISTER, body);
      setToken(data.token);
      const userObj = data.user || {};
      if (userObj.firstName || userObj.lastName) userObj.name = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
      setUser(userObj);
      return data;
    } catch (error) {
      throw new Error(error.message || 'Registration failed. Pastikan server backend berjalan.');
    }
  };

  const login = async ({ email, password }) => {
    try {
      const data = await apiPost(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      setToken(data.token);
      const userObj = data.user || {};
      if (userObj.firstName || userObj.lastName) userObj.name = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
      setUser(userObj);
      return data;
    } catch (error) {
      throw new Error(error.message || 'Login failed. Pastikan server backend berjalan.');
    }
  };

  const logout = () => {
    // Clear storage immediately so other tabs/components see logged-out state
    try {
      localStorage.removeItem('billsnack_user');
      localStorage.removeItem('billsnack_token');
    } catch {
      // ignore
    }
    setUser(null);
    setToken(null);
  };

  const updateProfile = (userData) => {
    // If we have a token, persist the profile to the backend
    if (token) {
      (async () => {
        try {
          const data = await apiPut(API_ENDPOINTS.AUTH.PROFILE, userData, token);
          const updated = data.user;
          // derive display name
          if (updated.firstName || updated.lastName) {
            updated.name = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
          }
          setUser(updated);
        } catch (e) {
          // fallback: update locally
          setUser(prev => {
            if (!prev) return null;
            const updatedLocal = { ...prev, ...userData };
            if (userData.firstName || userData.lastName) {
              updatedLocal.name = `${updatedLocal.firstName || ''} ${updatedLocal.lastName || ''}`.trim();
            }
            return updatedLocal;
          });
        }
      })();
    } else {
      setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, ...userData };
        if (userData.firstName || userData.lastName) {
          updatedUser.name = `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim();
        }
        return updatedUser;
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
