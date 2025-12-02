"use client";

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  // cart is stored per authenticated user only. Guest users cannot use cart.
  const { user, isLoaded } = useAuth();
  const prevUserRef = useRef(null);

  // Build a cart key from available stable user identifiers. Prefer numeric id when present.
  const getCartKey = (u) => {
    if (!u) return null; // No cart for guest users
    if (u.id) return `billsnack_cart_user_${u.id}`;
    if (u.user_id) return `billsnack_cart_user_${u.user_id}`;
    if (u.email) return `billsnack_cart_user_${u.email}`;
    if (u.username) return `billsnack_cart_user_${u.username}`;
    return null; // Fallback - no cart for unidentified users
  };

  // Start with an empty cart and load the user's cart from storage once Auth is available.
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Handle user login/logout - load user cart or clear cart
  useEffect(() => {
    if (!isLoaded) return;

    try {
      const prevUser = prevUserRef.current;
      
      if (user) {
        // User logged in - load their cart from localStorage
        const userKey = getCartKey(user);
        if (userKey) {
          const userRaw = localStorage.getItem(userKey);
          const userCart = userRaw ? JSON.parse(userRaw) : [];
          setCartItems(userCart);
        } else {
          setCartItems([]);
        }
      } else if (prevUser && !user) {
        // User just logged out - clear cart immediately
        setCartItems([]);
        // Also clear guest cart from localStorage
        try {
          localStorage.removeItem('billsnack_cart_guest');
        } catch { /* ignore */ }
      } else {
        // No user and no previous user - just ensure empty cart
        setCartItems([]);
      }
      
      // Update previous user reference
      prevUserRef.current = user;
      setIsCartLoaded(true);
    } catch (error) {
      setCartItems([]);
      setIsCartLoaded(true);
    }
  }, [user, isLoaded]);

  // persist cart to localStorage whenever it changes - ONLY for logged in users
  useEffect(() => {
    if (!isCartLoaded || !isLoaded) return;

    try {
      if (typeof window === 'undefined') return;

      // Only save cart if user is logged in
      if (user) {
        const userKey = getCartKey(user);
        if (userKey) {
          localStorage.setItem(userKey, JSON.stringify(cartItems));
        }
      }
      // Don't save anything for guest users
    } catch (error) {
      // ignore
    }
  }, [cartItems, user, isLoaded, isCartLoaded]);

  const addToCart = (product, quantity) => {
    // Only allow adding to cart if user is logged in
    if (!user) {
      return false; // Return false to indicate failure
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // normalize image (product.images may contain strings or objects { original, thumb })
      const firstImg = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
      const imageUrl = firstImg
        ? (typeof firstImg === 'string' ? firstImg : (firstImg.thumb || firstImg.original || ''))
        : '';
      return [
        ...prevItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: imageUrl,
          quantity,
          // Store seller information
          resellerId: product.resellerId || product.reseller_id || null,
          sellerName: product.sellerName || product.seller || product.storeName || product.store_name || 'BillSnack Store',
          resellerEmail: product.resellerEmail || product.reseller_email || null,
        },
      ];
    });
    return true; // Return true to indicate success
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== Number(cartItemId))
    );
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === Number(cartItemId)
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      if (user) {
        const key = getCartKey(user);
        if (key) {
          localStorage.removeItem(key);
        }
      }
    } catch { /* ignore */ }
  };

  // Clear cart items from specific seller only
  const clearCartBySeller = (sellerId) => {
    if (!user) return; // Only for logged in users
    
    setCartItems((prevItems) => {
      // Convert 'admin' string to null for matching
      const targetSellerId = sellerId === 'admin' ? null : sellerId;
      const filteredItems = prevItems.filter(item => {
        // Item's resellerId is null for admin products, or a number for reseller products
        const itemSellerId = item.resellerId || null;
        // Keep items that DON'T match the target seller
        return itemSellerId !== targetSellerId;
      });

      // Update localStorage with filtered items
      try {
        const key = getCartKey(user);
        localStorage.setItem(key, JSON.stringify(filteredItems));
      } catch { /* ignore */ }

      return filteredItems;
    });
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Group cart items by seller
  const getCartItemsBySeller = () => {
    const grouped = {};
    cartItems.forEach(item => {
      const sellerId = item.resellerId || 'admin';
      if (!grouped[sellerId]) {
        grouped[sellerId] = {
          sellerId,
          sellerName: item.sellerName || 'BillSnack Store',
          resellerEmail: item.resellerEmail || null,
          items: [],
        };
      }
      grouped[sellerId].items.push(item);
    });
    return Object.values(grouped);
  };

  // Check if user can use cart
  const canUseCart = !!user;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearCartBySeller,
        itemCount,
        getCartItemsBySeller,
        canUseCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
