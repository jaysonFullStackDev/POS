// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/store/AuthContext';
import { CartProvider }  from '@/store/CartContext';

export const metadata: Metadata = {
  title: 'BrewPOS — Coffee Shop Management',
  description: 'Point of Sale, Inventory & Accounting for small coffee shops',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
