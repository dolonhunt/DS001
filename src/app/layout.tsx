import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { BudgetProvider } from '@/contexts/BudgetContext';

export const metadata: Metadata = {
  title: 'Couple Budget App',
  description: 'Monthly shared budget app for couples',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <BudgetProvider>
            {children}
          </BudgetProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
