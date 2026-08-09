'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBudget } from '@/contexts/BudgetContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'H' },
  { href: '/dashboard/transactions', label: 'Transactions', icon: 'T' },
  { href: '/dashboard/budgets', label: 'Budgets', icon: 'B' },
  { href: '/dashboard/categories', label: 'Categories', icon: 'C' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'S' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useBudget();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-violet-600">CouplesBudget</h1>
        <p className="text-sm text-gray-500 mt-1">{currentUser?.email}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === item.href ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <span className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-200 rounded">{item.icon}</span>
            {item.label}
            {item.label === 'Dashboard' && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button onClick={logout} className="w-full text-left text-sm text-gray-500 hover:text-red-500 transition px-3 py-2">
          Sign Out
        </button>
      </div>
    </div>
  );
}
