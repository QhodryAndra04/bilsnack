import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ProductProvider } from "./contexts/ProductContext";
import { CartProvider } from "./contexts/CartContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Header from "./components/Header";
import SetHeaderHeight from "./components/SetHeaderHeight";
import FooterWrapper from "./components/FooterWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bilsnack - Cemilan Enak Mood Meningkat",
  description:
    "Temukan snack terbaik dari ratusan merek. Pengiriman cepat, harga bersahabat.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <NotificationProvider>
                <Header />
                <SetHeaderHeight />
                <main className="min-h-screen pt-variable">{children}</main>
                <FooterWrapper />
              </NotificationProvider>
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
