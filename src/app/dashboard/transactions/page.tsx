'use client';
import { useState } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { addTransaction, deleteTransaction } from '@/lib/firestore';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export default function TransactionsPage() {
  const { transactions, categories, currentMonth } = useBudget();
  const { userProfile, currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'income'|'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all'|'income'|'expense'>('all');

  const filtered = transactions.filter(t => filter === 'all' ? true : t.type === filter);
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const filteredCategories = categories.filter(c => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile?.householdId || !currentUser) return;
    setLoading(true);
    try {
      const selectedCat = categories.find(c => c.id === categoryId);
      await addTransaction(userProfile.householdId, {
        householdId: userProfile.householdId,
        userId: currentUser.uid,
        userDisplayName: userProfile.displayName,
        type, amount: parseFloat(amount),
        categoryId, categoryName: selectedCat?.name || '',
        description, date: Timestamp.fromDate(new Date(date)),
        isRecurring: false, isSplit: false,
        month: currentMonth,
      });
      setAmount(''); setCategoryId(''); setDescription(''); setShowForm(false);
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!userProfile?.householdId || !confirm('Delete this transaction?')) return;
    await deleteTransaction(userProfile.householdId, id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-violet-700">
          + Add Transaction
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold mb-4">New Transaction</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex gap-2">
              {(['expense','income'] as const).map(t => (
                <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
                  className={`flex-1 py-2 rounded-lg font-medium capitalize ${
                    type === t ? (t==='expense'?'bg-red-500 text-white':'bg-green-500 text-white') : 'bg-gray-100 text-gray-600'
                  }`}>{t}</button>
              ))}
            </div>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} required placeholder="Amount"
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" step="0.01" min="0" />
            <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} required
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none">
              <option value="">Select Category</option>
              {filteredCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="text" value={description} onChange={e=>setDescription(e.target.value)} required placeholder="Description"
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:outline-none" />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={loading} className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Transaction'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-2">
        {(['all','income','expense'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
              filter===f ? 'bg-violet-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}>{f}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-400">No transactions found.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>{['Description','Category','Amount','Date','Who',''].map(h=>(
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.categoryName}</td>
                  <td className={`px-4 py-3 font-semibold ${t.type==='income'?'text-green-600':'text-red-500'}`}>
                    {t.type==='income'?'+':'-'}{fmt(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.date?.toDate ? format(t.date.toDate(),'MMM d, yyyy') : ''}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.userDisplayName}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
