import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Transaction,
  Category,
  Budget,
  RecurringTransaction,
  Household,
  Notification,
  SavingsGoal,
} from '@/types';
import { format, subMonths } from 'date-fns';

// ===== HOUSEHOLD =====
export async function createHousehold(ownerUid: string, name: string) {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const householdRef = await addDoc(collection(db, 'households'), {
    name,
    ownerUid,
    inviteCode,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', ownerUid), {
    householdId: householdRef.id,
    role: 'owner',
  });
  return householdRef.id;
}

export async function joinHousehold(
  inviteCode: string,
  partnerUid: string,
  partnerEmail: string
) {
  const q = query(collection(db, 'households'), where('inviteCode', '==', inviteCode));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error('Invalid invite code');
  const householdDoc = snapshot.docs[0];
  await updateDoc(doc(db, 'households', householdDoc.id), {
    partnerUid,
    partnerEmail,
    inviteStatus: 'accepted',
  });
  await updateDoc(doc(db, 'users', partnerUid), {
    householdId: householdDoc.id,
    role: 'partner',
  });
  return householdDoc.id;
}

export function subscribeToHousehold(
  householdId: string,
  callback: (h: Household | null) => void
) {
  return onSnapshot(doc(db, 'households', householdId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Household) : null);
  });
}

// ===== TRANSACTIONS =====
export async function addTransaction(
  householdId: string,
  data: Omit<Transaction, 'id'>
) {
  const ref = await addDoc(collection(db, 'households', householdId, 'transactions'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTransaction(
  householdId: string,
  id: string,
  data: Partial<Transaction>
) {
  await updateDoc(doc(db, 'households', householdId, 'transactions', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTransaction(householdId: string, id: string) {
  await deleteDoc(doc(db, 'households', householdId, 'transactions', id));
}

export function subscribeToTransactions(
  householdId: string,
  month: string,
  callback: (transactions: Transaction[]) => void
) {
  const q = query(
    collection(db, 'households', householdId, 'transactions'),
    where('month', '==', month),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
  });
}

export async function getMonthlyTrends(householdId: string, months = 6) {
  const trends = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const month = format(date, 'yyyy-MM');
    const label = format(date, 'MMM');
    const q = query(
      collection(db, 'households', householdId, 'transactions'),
      where('month', '==', month)
    );
    const snap = await getDocs(q);
    let income = 0;
    let expense = 0;
    snap.forEach((d) => {
      const t = d.data() as Transaction;
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    trends.push({ month: label, income, expense, balance: income - expense });
  }
  return trends;
}

// ===== CATEGORIES =====
export async function addCategory(
  householdId: string,
  data: Omit<Category, 'id'>
) {
  const ref = await addDoc(collection(db, 'households', householdId, 'categories'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteCategory(householdId: string, id: string) {
  await deleteDoc(doc(db, 'households', householdId, 'categories', id));
}

export async function seedDefaultCategories(householdId: string) {
  const defaults = [
    { name: 'Food & Dining', icon: '🍽️', color: '#ef4444', type: 'expense' },
    { name: 'Housing', icon: '🏠', color: '#3b82f6', type: 'expense' },
    { name: 'Transport', icon: '🚗', color: '#f59e0b', type: 'expense' },
    { name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense' },
    { name: 'Health', icon: '💊', color: '#10b981', type: 'expense' },
    { name: 'Shopping', icon: '🛍️', color: '#f97316', type: 'expense' },
    { name: 'Utilities', icon: '⚡', color: '#06b6d4', type: 'expense' },
    { name: 'Education', icon: '📚', color: '#6366f1', type: 'expense' },
    { name: 'Salary', icon: '💼', color: '#22c55e', type: 'income' },
    { name: 'Freelance', icon: '💻', color: '#6366f1', type: 'income' },
    { name: 'Investment', icon: '📈', color: '#14b8a6', type: 'income' },
    { name: 'Other Income', icon: '💰', color: '#84cc16', type: 'income' },
  ];
  const batch = writeBatch(db);
  defaults.forEach((cat) => {
    const ref = doc(collection(db, 'households', householdId, 'categories'));
    batch.set(ref, { ...cat, householdId, isDefault: true, createdAt: serverTimestamp() });
  });
  await batch.commit();
}

export function subscribeToCategories(
  householdId: string,
  callback: (cats: Category[]) => void
) {
  return onSnapshot(
    query(collection(db, 'households', householdId, 'categories'), orderBy('name')),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)))
  );
}

// ===== BUDGETS =====
export async function setBudget(
  householdId: string,
  data: Omit<Budget, 'id'>
) {
  const existing = query(
    collection(db, 'households', householdId, 'budgets'),
    where('categoryId', '==', data.categoryId),
    where('month', '==', data.month)
  );
  const snap = await getDocs(existing);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { ...data, updatedAt: serverTimestamp() });
  } else {
    await addDoc(collection(db, 'households', householdId, 'budgets'), {
      ...data,
      spent: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export function subscribeToBudgets(
  householdId: string,
  month: string,
  callback: (budgets: Budget[]) => void
) {
  return onSnapshot(
    query(
      collection(db, 'households', householdId, 'budgets'),
      where('month', '==', month)
    ),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget)))
  );
}

// ===== SAVINGS GOALS =====
export async function addSavingsGoal(
  householdId: string,
  data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>
) {
  const ref = await addDoc(collection(db, 'households', householdId, 'savingsGoals'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSavingsGoal(
  householdId: string,
  id: string,
  data: Partial<SavingsGoal>
) {
  await updateDoc(doc(db, 'households', householdId, 'savingsGoals', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSavingsGoal(householdId: string, id: string) {
  await deleteDoc(doc(db, 'households', householdId, 'savingsGoals', id));
}

export function subscribeToSavingsGoals(
  householdId: string,
  callback: (goals: SavingsGoal[]) => void
) {
  return onSnapshot(
    query(
      collection(db, 'households', householdId, 'savingsGoals'),
      orderBy('createdAt', 'desc')
    ),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavingsGoal)))
  );
}

// ===== RECURRING TRANSACTIONS =====
export async function addRecurringTransaction(
  householdId: string,
  data: Omit<RecurringTransaction, 'id' | 'createdAt'>
) {
  const ref = await addDoc(
    collection(db, 'households', householdId, 'recurringTransactions'),
    { ...data, createdAt: serverTimestamp() }
  );
  return ref.id;
}

export async function updateRecurringTransaction(
  householdId: string,
  id: string,
  data: Partial<RecurringTransaction>
) {
  await updateDoc(doc(db, 'households', householdId, 'recurringTransactions', id), data);
}

export async function deleteRecurringTransaction(householdId: string, id: string) {
  await deleteDoc(doc(db, 'households', householdId, 'recurringTransactions', id));
}

export function subscribeToRecurringTransactions(
  householdId: string,
  callback: (items: RecurringTransaction[]) => void
) {
  return onSnapshot(
    query(
      collection(db, 'households', householdId, 'recurringTransactions'),
      orderBy('createdAt', 'desc')
    ),
    (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecurringTransaction)))
  );
}

// ===== NOTIFICATIONS =====
export async function createNotification(
  householdId: string,
  userId: string,
  type: Notification['type'],
  message: string
) {
  await addDoc(collection(db, 'households', householdId, 'notifications'), {
    householdId,
    userId,
    type,
    message,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToNotifications(
  householdId: string,
  userId: string,
  callback: (notifs: Notification[]) => void
) {
  return onSnapshot(
    query(
      collection(db, 'households', householdId, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)))
  );
}

export async function markNotificationRead(householdId: string, notifId: string) {
  await updateDoc(doc(db, 'households', householdId, 'notifications', notifId), {
    isRead: true,
  });
}

// ===== HELPERS =====
export function getCurrentMonth() {
  return format(new Date(), 'yyyy-MM');
}
