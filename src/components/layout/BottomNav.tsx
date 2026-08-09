'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: 'H' },
  { href: '/dashboard/transactions', label: 'Transactions', icon: 'T' },
  { href: '/dashboard/budgets', label: 'Budgets', icon: 'B' },
  { href: '/dashboard/categories', label: 'Categories', icon: 'C' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'S' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-t border-gray-200 flex items-center justify-around py-2 px-4">
      {navItems.map(item => (
        <Link key={item.href} href={item.href}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs transition ${
            pathname === item.href ? 'text-violet-600 font-semibold' : 'text-gray-500'
          }`}>
          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
            pathname === item.href ? 'bg-violet-100 text-violet-700' : 'bg-gray-100'
          }`}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
