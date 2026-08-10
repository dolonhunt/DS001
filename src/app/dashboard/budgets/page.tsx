'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  month: string;
}

export default function BudgetsPage() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const householdId = userProfile?.householdId;
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!householdId) {
      setLoading(false);
      return;
    }
    fetchBudgets();
  }, [householdId, authLoading]);

  const fetchBudgets = async () => {
    if (!householdId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'budgets'),
        where('householdId', '==', householdId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget));
      setBudgets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !amount || !householdId) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'budgets'), {
        category: category.trim(),
        amount: parseFloat(amount),
        spent: 0,
        month,
        householdId,
        createdBy: currentUser?.uid,
        createdAt: new Date(),
      });
      setCategory('');
      setAmount('');
      setShowForm(false);
      await fetchBudgets();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await deleteDoc(doc(db, 'budgets', id));
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          + Add Budget
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow border">
          <p className="text-sm text-gray-500">Total Budgeted</p>
          <p className="text-2xl font-bold text-purple-600">${totalBudgeted.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow border">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold text-red-500">${totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl p-5 shadow mb-6 border"
        >
          <h2 className="font-semibold mb-4">New Budget</h2>
          <input
            type="text"
            placeholder="Category name"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="number"
            placeholder="Budget amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            step="0.01"
            className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Budget'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading budgets...</p>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow border text-center text-gray-400">
          No budgets yet. Add your first budget to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((b) => {
            const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
            const over = b.spent > b.amount;
            return (
              <div key={b.id} className="bg-white rounded-xl p-5 shadow border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{b.category}</p>
                    <p className="text-sm text-gray-400">{b.month}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${over ? 'text-red-500' : 'text-green-600'}`}>
                      ${(b.spent || 0).toFixed(2)} / ${b.amount.toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-red-400 hover:text-red-600 text-sm mt-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${over ? 'bg-red-500' : 'bg-purple-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
