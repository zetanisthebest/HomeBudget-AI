import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionStatus, TransactionType, ConfidenceLevel } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { Filter, ChevronDown, AlertTriangle } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onCategoryChange: (id: string, newCategory: string) => void;
  onAmountChange: (id: string, newAmount: number) => void;
}

const AmountInput = ({ value, onCommit }: { value: number, onCommit: (val: number) => void }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    const val = parseFloat(localValue);
    if (!isNaN(val)) {
      onCommit(Math.abs(val));
    } else {
      setLocalValue(value.toString());
    }
  };

  return (
    <input
      type="number"
      step="0.01"
      min="0"
      className="w-24 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors font-mono font-semibold"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
};

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onCategoryChange, onAmountChange }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const categories = useMemo(() => {
    // Filter out empty categories for the dropdown filter to keep it clean
    const unique = new Set(transactions.map(t => t.category).filter(c => c !== ""));
    // Also include standard categories from constants to ensure dropdowns are populated well
    Object.keys(CATEGORY_COLORS).forEach(c => unique.add(c));
    return ['All', ...Array.from(unique).sort()];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
      const matchesType = typeFilter === 'All' || t.type === typeFilter;
      return matchesCategory && matchesType;
    });
  }, [transactions, categoryFilter, typeFilter]);

  // Helper for generating pastel background colors with opacity
  const getCategoryStyle = (category: string) => {
    const color = CATEGORY_COLORS[category] || '#64748B'; // Default slate
    // Convert hex to rgba with opacity for background, or use hex + alpha if supported
    // Using hex alpha for simplicity: 20 hex is approx 12% opacity, 33 is 20%
    return {
      backgroundColor: `${color}25`, 
      color: color,
      borderColor: `${color}50`
    };
  };

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case ConfidenceLevel.HIGH:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            High
          </span>
        );
      case ConfidenceLevel.MEDIUM:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            Medium
          </span>
        );
      case ConfidenceLevel.LOW:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white pb-20 md:pb-0">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>Category</span>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 text-slate-700 py-1 pl-2 pr-7 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <Filter className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="flex items-center justify-center gap-2">
                <span>Type</span>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 text-slate-700 py-1 pl-2 pr-6 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-sm"
                  >
                    <option value="All">All</option>
                    <option value={TransactionType.EXPENSE}>Expense</option>
                    <option value={TransactionType.INCOME}>Income</option>
                    <option value={TransactionType.TRANSFER}>Transfer</option>
                    <option value={TransactionType.REFUND}>Refund</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400">
                    <Filter className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">AI Confidence</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {filteredTransactions.map((tx) => (
            <tr key={tx.id} className={`hover:bg-slate-50 ${tx.status === TransactionStatus.EXCLUDE ? 'opacity-60 bg-slate-50/50' : ''}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-mono">{tx.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{tx.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {(tx.type === TransactionType.INCOME || tx.type === TransactionType.TRANSFER) ? (
                  <span className="inline-block w-8 text-center text-slate-300 font-mono">--</span>
                ) : (
                  <div className="relative inline-block">
                    <select
                      value={tx.category}
                      onChange={(e) => onCategoryChange(tx.id, e.target.value)}
                      style={getCategoryStyle(tx.category)}
                      className="appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all hover:opacity-80"
                    >
                      {Object.keys(CATEGORY_COLORS).map((cat) => (
                        <option key={cat} value={cat} className="text-slate-900 bg-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: getCategoryStyle(tx.category).color }} />
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-slate-400">$</span>
                  <AmountInput 
                    value={tx.amount} 
                    onCommit={(newVal) => onAmountChange(tx.id, newVal)} 
                  />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  tx.type === TransactionType.INCOME ? 'bg-green-100 text-green-800' :
                  tx.type === TransactionType.EXPENSE ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tx.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {getConfidenceBadge(tx.confidence)}
              </td>
            </tr>
          ))}
          {filteredTransactions.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                No transactions found for the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;