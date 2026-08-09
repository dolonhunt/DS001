'use client';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { markNotificationRead } from '@/lib/firestore';

export default function TopBar() {
  const { unreadCount, notifications, household } = useBudget();
  const { userProfile } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  async function handleReadAll() {
    if (!userProfile?.householdId) return;
    for (const n of notifications.filter(n => !n.isRead)) {
      await markNotificationRead(userProfile.householdId, n.id);
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-medium text-gray-500">
          {household?.name || 'My Household'}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-full hover:bg-gray-100 transition">
            <span className="text-gray-600 text-sm">N</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-50">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && <button onClick={handleReadAll} className="text-xs text-violet-600">Mark all read</button>}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400">No notifications</p>
                ) : notifications.slice(0, 10).map(n => (
                  <div key={n.id} className={`p-3 border-b last:border-0 ${!n.isRead ? 'bg-violet-50' : ''}`}>
                    <p className="text-sm">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-semibold">
            {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium hidden sm:block">{userProfile?.displayName}</span>
        </div>
      </div>
    </header>
  );
}
