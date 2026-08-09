import { Timestamp } from 'firebase/firestore';

export type UserRole = 'owner' | 'partner';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  householdId?: string;
  role?: UserRole;
  createdAt: Timestamp;
}

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  partnerUid?: string;
  partnerEmail?: string;
  inviteCode?: string;
  inviteStatus?: 'pending' | 'accepted';
  createdAt: Timestamp;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  householdId: string;
  userId: string;
  userDisplayName: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  date: Timestamp;
  isRecurring: boolean;
  recurringId?: string;
  isSplit: boolean;
  splitAmount?: number;
  month: string; // YYYY-MM format
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  id: string;
  householdId: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface Budget {
  id: string;
  householdId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  month: string; // YYYY-MM format
  spent: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecurringTransaction {
  id: string;
  householdId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface MonthlyBudgetCycle {
  id: string;
  householdId: string;
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  balance: number;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  householdId: string;
  userId: string;
  type: 'budget_alert' | 'partner_invite' | 'transaction_added';
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  budgetAlerts: Budget[];
  recentTransactions: Transaction[];
}
