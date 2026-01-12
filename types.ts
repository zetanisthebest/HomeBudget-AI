export enum TransactionType {
  EXPENSE = 'Expense',
  INCOME = 'Income',
  TRANSFER = 'Transfer',
  REFUND = 'Refund'
}

export enum TransactionStatus {
  INCLUDE = 'Include',
  EXCLUDE = 'Exclude'
}

export enum ConfidenceLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  confidence: ConfidenceLevel;
}

export interface AnalysisResult {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}