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

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

const DEFAULT_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
];

export default function CategoriesPage() {
  const { currentUser, userProfile } = useAuth();
  const householdId = userProfile?.householdId;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    fetchCategories();
  }, [householdId]);

  const fetchCategories = async () => {
    if (!householdId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'categories'),
        where('householdId', '==', householdId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !householdId) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: name.trim(),
        type,
        color,
        householdId,
        createdBy: currentUser?.uid,
        createdAt: new Date(),
      });
      setName('');
      setType('expense');
      setColor(DEFAULT_COLORS[0]);
      setShowForm(false);
      await fetchCategories();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          + Add Category
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-xl p-5 shadow mb-6 border"
        >
          <h2 className="font-semibold mb-4">New Category</h2>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg font-medium border ${
                type === 'expense'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg font-medium border ${
                type === 'income'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              Income
            </button>
          </div>
          <input
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <div className="flex gap-2 mb-4">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? 'border-gray-800 scale-110' : 'border-transparent'
                } transition`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Category'}
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
        <p className="text-gray-500">Loading categories...</p>
      ) : (
        <div className="space-y-6">
          {[{ label: 'Income', items: incomeCategories }, { label: 'Expense', items: expenseCategories }].map(
            ({ label, items }) => (
              <div key={label}>
                <h2 className="font-semibold text-gray-600 mb-3">{label} Categories</h2>
                {items.length === 0 ? (
                  <p className="text-gray-400 text-sm">No {label.toLowerCase()} categories yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {items.map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-white rounded-xl p-4 shadow flex items-center justify-between border"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-400 hover:text-red-600 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
