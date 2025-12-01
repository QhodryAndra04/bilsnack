"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { ProductProvider } from "../contexts/ProductContext";
import { CartProvider } from "../contexts/CartContext";

export default function ResellerLayout({ children }) {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}