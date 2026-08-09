'use client';
import { useBudget } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#8b5cf6','#3b82f6','#ef4444','#10b981','#f59e0b','#06b6d4'];

export default function DashboardPage() {
  const { totalIncome, totalExpense, balance, savingsRate, transactions, budgets, categories, currentMonth, setCurrentMonth } = useBudget();
  const { userProfile } = useAuth();

  const expenseByCategory = categories
    .filter(c => c.type === 'expense')
    .map(cat => ({ name: cat.name, value: transactions.filter(t => t.categoryId === cat.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0) }))
    .filter(d => d.value > 0);

  const budgetData = budgets.map(b => ({ name: b.categoryName, budget: b.amount, spent: b.spent }));
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {userProfile?.displayName}</p>
        </div>
        <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:'Income', val:totalIncome, cls:'text-green-600'},{label:'Expenses', val:totalExpense, cls:'text-red-500'},{label:'Balance', val:balance, cls:balance>=0?'text-violet-600':'text-red-500'},{label:'Savings Rate', val:savingsRate, cls:'text-blue-500', pct:true}].map(item=>(
          <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.cls}`}>{item.pct ? `${item.val.toFixed(1)}%` : fmt(item.val)}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {expenseByCategory.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Expenses by Category</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart><Pie data={expenseByCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                {expenseByCategory.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie><Tooltip formatter={(v:number)=>fmt(v)}/></PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {budgetData.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Budget vs Spent</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={budgetData}><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis/><Tooltip formatter={(v:number)=>fmt(v)}/><Legend/>
                <Bar dataKey="budget" fill="#8b5cf6" name="Budget"/><Bar dataKey="spent" fill="#ef4444" name="Spent"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="font-semibold mb-4">Recent Transactions</h2>
        {transactions.length===0 ? (
          <p className="text-gray-400 text-center py-8">No transactions yet.</p>
        ) : (
          <div className="space-y-2">{transactions.slice(0,10).map(t=>(
            <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div><p className="font-medium">{t.description}</p><p className="text-sm text-gray-500">{t.categoryName}</p></div>
              <span className={t.type==='income'?'text-green-600 font-semibold':'text-red-500 font-semibold'}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</span>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
