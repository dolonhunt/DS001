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
import { Transaction, Category, Budget, RecurringTransaction, Household, Notification } from '@/types';
import { format } from 'date-fns';

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

export async function joinHousehold(inviteCode: string, partnerUid: string, partnerEmail: string) {
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

export function subscribeToHousehold(householdId: string, callback: (h: Household | null) => void) {
  return onSnapshot(doc(db, 'households', householdId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } as Household : null);
  });
}

// ===== TRANSACTIONS =====
export async function addTransaction(householdId: string, data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(db, 'households', householdId, 'transactions'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTransaction(householdId: string, id: string, data: Partial<Transaction>) {
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

// ===== CATEGORIES =====
export async function addCategory(householdId: string, data: Omit<Category, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'households', householdId, 'categories'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function seedDefaultCategories(householdId: string) {
  const defaults = [
    { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#ef4444', type: 'expense' },
    { name: 'Housing', icon: 'Home', color: '#3b82f6', type: 'expense' },
    { name: 'Transport', icon: 'Car', color: '#f59e0b', type: 'expense' },
    { name: 'Entertainment', icon: 'Tv', color: '#8b5cf6', type: 'expense' },
    { name: 'Health', icon: 'Heart', color: '#10b981', type: 'expense' },
    { name: 'Shopping', icon: 'ShoppingBag', color: '#f97316', type: 'expense' },
    { name: 'Utilities', icon: 'Zap', color: '#06b6d4', type: 'expense' },
    { name: 'Salary', icon: 'Briefcase', color: '#22c55e', type: 'income' },
    { name: 'Freelance', icon: 'Laptop', color: '#6366f1', type: 'income' },
    { name: 'Investment', icon: 'TrendingUp', color: '#14b8a6', type: 'income' },
  ];
  const batch = writeBatch(db);
  defaults.forEach((cat) => {
    const ref = doc(collection(db, 'households', householdId, 'categories'));
    batch.set(ref, { ...cat, householdId, isDefault: true, createdAt: serverTimestamp() });
  });
  await batch.commit();
}

export function subscribeToCategories(householdId: string, callback: (cats: Category[]) => void) {
  return onSnapshot(
    query(collection(db, 'households', householdId, 'categories'), orderBy('name')),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)))
  );
}

// ===== BUDGETS =====
export async function setBudget(householdId: string, data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) {
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

export function subscribeToBudgets(householdId: string, month: string, callback: (budgets: Budget[]) => void) {
  return onSnapshot(
    query(collection(db, 'households', householdId, 'budgets'), where('month', '==', month)),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget)))
  );
}

// ===== NOTIFICATIONS =====
export async function createNotification(householdId: string, userId: string, type: Notification['type'], message: string) {
  await addDoc(collection(db, 'households', householdId, 'notifications'), {
    householdId, userId, type, message, isRead: false, createdAt: serverTimestamp(),
  });
}

export function subscribeToNotifications(householdId: string, userId: string, callback: (notifs: Notification[]) => void) {
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
  await updateDoc(doc(db, 'households', householdId, 'notifications', notifId), { isRead: true });
}

// ===== HELPERS =====
export function getCurrentMonth() {
  return format(new Date(), 'yyyy-MM');
}
