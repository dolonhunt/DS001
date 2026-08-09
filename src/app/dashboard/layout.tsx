'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BudgetProvider } from '@/contexts/BudgetContext';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import TopBar from '@/components/layout/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) router.push('/login');
  }, [currentUser, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
    </div>
  );
  if (!currentUser) return null;

  return (
    <BudgetProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <div className="hidden md:flex md:flex-shrink-0"><Sidebar /></div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
            <div className="container mx-auto px-4 py-6 max-w-6xl">{children}</div>
          </main>
        </div>
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-50"><BottomNav /></div>
      </div>
    </BudgetProvider>
  );
}
