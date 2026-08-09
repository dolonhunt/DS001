'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToHousehold,
  subscribeToTransactions,
  subscribeToCategories,
  subscribeToBudgets,
  subscribeToNotifications,
  getCurrentMonth,
  createHousehold,
  seedDefaultCategories,
} from '@/lib/firestore';
import { Household, Transaction, Category, Budget, Notification } from '@/types';

interface BudgetContextType {
  household: Household | null;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  notifications: Notification[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  unreadCount: number;
  loading: boolean;
  setupHousehold: (name: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) throw new Error('useBudget must be used within BudgetProvider');
  return context;
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  const setupHousehold = useCallback(async (name: string) => {
    if (!currentUser) return;
    const id = await createHousehold(currentUser.uid, name);
    await seedDefaultCategories(id);
  }, [currentUser]);

  useEffect(() => {
    if (!userProfile?.householdId) {
      setLoading(false);
      return;
    }
    const hid = userProfile.householdId;
    setLoading(true);
    const unsubs: (() => void)[] = [];
    unsubs.push(subscribeToHousehold(hid, setHousehold));
    unsubs.push(subscribeToCategories(hid, setCategories));
    if (currentUser) {
      unsubs.push(subscribeToNotifications(hid, currentUser.uid, setNotifications));
    }
    setLoading(false);
    return () => unsubs.forEach((u) => u());
  }, [userProfile?.householdId, currentUser]);

  useEffect(() => {
    if (!userProfile?.householdId) return;
    const unsub = subscribeToTransactions(userProfile.householdId, currentMonth, setTransactions);
    const unsubBudgets = subscribeToBudgets(userProfile.householdId, currentMonth, setBudgets);
    return () => { unsub(); unsubBudgets(); };
  }, [userProfile?.householdId, currentMonth]);

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <BudgetContext.Provider value={{
      household, transactions, categories, budgets, notifications,
      currentMonth, setCurrentMonth, totalIncome, totalExpense,
      balance, savingsRate, unreadCount, loading, setupHousehold,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}
