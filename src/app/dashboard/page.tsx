'use client';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = ['#8b5cf6','#3b82f6','#ef4444','#10b981','#f59e0b','#06b6d4'];

const fmt = (n: number) =>
  '\u09F3' + n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardPage() {
  const {
    totalIncome, totalExpense, balance, savingsRate,
    transactions, budgets, categories,
    currentMonth, setCurrentMonth,
  } = useBudget();
  const { userProfile } = useAuth();

  const expenseByCategory = categories
    .filter(c => c.type === 'expense')
    .map(cat => ({
      name: cat.name,
      value: transactions
        .filter(t => t.categoryId === cat.id && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter(d => d.value > 0);

  const budgetData = budgets.map(b => ({
    name: b.categoryName,
    budget: b.amount,
    spent: b.spent,
  }));

  const summaryCards = [
    {
      label: 'Total Income',
      value: fmt(totalIncome),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/20',
      trend: '+',
    },
    {
      label: 'Total Expenses',
      value: fmt(totalExpense),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/20',
      trend: '-',
    },
    {
      label: 'Balance',
      value: fmt(balance),
      icon: Wallet,
      color: balance >= 0 ? 'text-violet-400' : 'text-red-400',
      bg: balance >= 0 ? 'from-violet-500/10 to-purple-600/5' : 'from-red-500/10 to-red-600/5',
      border: balance >= 0 ? 'border-violet-500/20' : 'border-red-500/20',
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      color: 'text-blue-400',
      bg: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/20',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Welcome back, {userProfile?.displayName || 'there'} — here’s your financial overview
          </p>
        </div>
        <input
          type="month"
          value={currentMonth}
          onChange={e => setCurrentMonth(e.target.value)}
          className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${bg} border ${border} rounded-2xl p-4 backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-xs font-medium uppercase tracking-wide">{label}</p>
              <div className={`p-1.5 rounded-lg bg-white/5`}>
                <Icon size={14} className={color} />
              </div>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        {expenseByCategory.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Expenses by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%" cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [fmt(v), 'Amount']}
                  contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, color: '#fff' }}
                />
                <Legend
                  formatter={(val) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart */}
        {budgetData.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Budget vs Spent</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetData} barGap={4}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '\u09F3' + (v/1000).toFixed(0) + 'k'} />
                <Tooltip
                  formatter={(v: number) => [fmt(v)]}
                  contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 12, color: '#fff' }}
                />
                <Legend
                  formatter={(val) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{val}</span>}
                />
                <Bar dataKey="budget" fill="#8b5cf6" radius={[6,6,0,0]} name="Budget" />
                <Bar dataKey="spent" fill="#ef4444" radius={[6,6,0,0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No transactions yet. Start by adding one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'
                  }`}>
                    {t.type === 'income'
                      ? <ArrowUpRight size={14} className="text-emerald-400" />
                      : <ArrowDownRight size={14} className="text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.description}</p>
                    <p className="text-xs text-white/40">{t.categoryName}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
