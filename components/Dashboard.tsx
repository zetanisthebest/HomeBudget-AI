import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { DollarSign, TrendingDown, TrendingUp, Wallet, HelpCircle, FileText, Home } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const stats = useMemo(() => {
    const included = transactions.filter(t => t.status === TransactionStatus.INCLUDE);
    
    const income = included
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expenses = included
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate Housing Expenses specifically (for the Housing Card)
    const housingExpenses = included
      .filter(t => t.type === TransactionType.EXPENSE && t.category === 'Housing')
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Chart Data - Exclude 'Housing' to focus on Flexible Spending
    const categoryTotals: Record<string, number> = {};
    included
      .filter(t => t.type === TransactionType.EXPENSE && t.category !== 'Housing')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const flexibleTotal = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    const chartData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { 
      income, 
      expenses, 
      housingExpenses,
      flexibleTotal, 
      chartData, 
      count: transactions.length 
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Transactions</p>
            <p className="text-2xl font-bold text-slate-900">{stats.count}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Income</p>
            <p className="text-2xl font-bold text-slate-900">${stats.income.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Expenses</p>
            <p className="text-2xl font-bold text-slate-900">${stats.expenses.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Home size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Housing (Fixed)</p>
            <p className="text-2xl font-bold text-slate-900">${stats.housingExpenses.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Spending Breakdown Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Flexible Spending (Excl. Housing)</h3>
        
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Chart Area */}
          <div className="w-full lg:w-5/12 h-64 lg:h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-sm text-slate-400 font-medium">Flexible</p>
              <p className="text-xl font-bold text-slate-900">${stats.flexibleTotal.toFixed(0)}</p>
            </div>
          </div>

          {/* Detailed List Area */}
          <div className="w-full lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {stats.chartData.map((item) => {
              // Calculate percentage based on Flexible Total, not Total Expenses
              const percentage = stats.flexibleTotal > 0 ? (item.value / stats.flexibleTotal) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 sm:border-0 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" 
                      style={{ backgroundColor: CATEGORY_COLORS[item.name] || '#94a3b8' }}
                    />
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">${item.value.toFixed(2)}</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 min-w-[60px]">
                       <div 
                          className="h-1.5 rounded-full" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: CATEGORY_COLORS[item.name] || '#94a3b8'
                          }}
                       ></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {stats.chartData.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500">
                No flexible spending transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;