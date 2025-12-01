"use client";

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  // cart is stored per authenticated user only. If not logged in, cart is kept in memory and not persisted.
  const { user, isLoaded } = useAuth();

  // Build a cart key from available stable user identifiers. Prefer numeric id when present.
  const getCartKey = (u) => {
    if (!u) return 'billsnack_cart_guest'; // Guest cart key
    if (u.id) return `billsnack_cart_user_${u.id}`;
    if (u.user_id) return `billsnack_cart_user_${u.user_id}`;
    if (u.email) return `billsnack_cart_user_${u.email}`;
    if (u.username) return `billsnack_cart_user_${u.username}`;
    return 'billsnack_cart_guest'; // Fallback to guest cart
  };

  // Start with an empty cart and load the user's cart from storage once Auth is available.
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Load initial cart (guest cart) on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      // Always try to load guest cart first
      const guestKey = 'billsnack_cart_guest';
      const guestRaw = localStorage.getItem(guestKey);
      if (guestRaw) {
        const guestCart = JSON.parse(guestRaw);
        if (guestCart && guestCart.length > 0) {
          setCartItems(guestCart);
        }
      }

      setIsCartLoaded(true);
    } catch (error) {
      setIsCartLoaded(true);
    }
  }, []);

  // Handle user login/logout cart merging
  useEffect(() => {
    if (!isCartLoaded || !isLoaded) return;

    try {
      if (user) {
        // User logged in - load user cart and merge with current cart
        const userKey = getCartKey(user);
        const userRaw = localStorage.getItem(userKey);
        const userCart = userRaw ? JSON.parse(userRaw) : [];

        setCartItems((currentCart) => {
          if (userCart.length > 0) {
            // Merge current cart (guest cart) with user cart
            const map = new Map();
            userCart.forEach((it) => map.set(String(it.id), { ...it }));
            (currentCart || []).forEach((it) => {
              const k = String(it.id);
              if (map.has(k)) {
                map.get(k).quantity = (map.get(k).quantity || 0) + (it.quantity || 0);
              } else {
                map.set(k, { ...it });
              }
            });
            const merged = Array.from(map.values());
            // Save merged cart for user
            try { localStorage.setItem(userKey, JSON.stringify(merged)); } catch (e) { /* ignore */ }
            return merged;
          } else {
            // No user cart, keep current cart and save it for user
            try { localStorage.setItem(userKey, JSON.stringify(currentCart || [])); } catch (e) { /* ignore */ }
            return currentCart || [];
          }
        });
      } else {
        // User logged out - cart stays as is (guest cart)
        // Don't clear cart, just keep current state
      }
    } catch (error) {
      // ignore
    }
  }, [user, isLoaded, isCartLoaded]);

  // persist cart to localStorage whenever it changes - ALWAYS persist to guest cart first
  useEffect(() => {
    if (!isCartLoaded) return; // Wait for initial cart load

    try {
      if (typeof window === 'undefined') return;

      // Always save to guest cart as backup
      const guestKey = 'billsnack_cart_guest';
      localStorage.setItem(guestKey, JSON.stringify(cartItems));

      // If auth is loaded and user exists, also save to user cart
      if (isLoaded && user) {
        const userKey = getCartKey(user);
        localStorage.setItem(userKey, JSON.stringify(cartItems));
      }
    } catch (error) {
      // ignore
    }
  }, [cartItems, user, isLoaded, isCartLoaded]);

  const addToCart = (product, quantity) => {
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
      const key = getCartKey(user);
      localStorage.removeItem(key);
      // Also remove guest cart if no user
      if (!user) {
        localStorage.removeItem('billsnack_cart_guest');
      }
    } catch { /* ignore */ }
  };

  // Clear cart items from specific seller only
  const clearCartBySeller = (sellerId) => {
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
