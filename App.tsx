import React, { useState, useCallback, useMemo } from 'react';
import { Wand2, Loader2, FileText, Upload, X, File as FileIcon, AlertCircle, Plus, Calendar, ChevronDown, Download, Table } from 'lucide-react';
import { Transaction, TransactionType } from './types';
import { parseTransactions, FileInput } from './services/geminiService';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import AddTransactionModal from './components/AddTransactionModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DEMO_DATA = `12/06/2025, WHOLEFOODS MARKET, -85.20
12/05/2025, AMAZON.COM*H83, -24.99
12/04/2025, PAYMENT TO CREDIT CARD, -1500.00
12/04/2025, SALARY DEPOSIT, 3200.00
12/03/2025, STARBUCKS 402, -6.50
12/02/2025, DOORDASH*BURGERKING, -34.12
12/01/2025, PAMPERS DIAPERS, -45.00
12/01/2025, TRANSFER TO SAVINGS, -500.00
11/29/2025, WALGREENS, -12.45
11/28/2025, SHELL OIL 12345, -45.00`;

interface UploadedFile {
  id: string; // Unique ID for keying
  name: string;
  type: string;
  content: string; // Base64 for PDF, Text for CSV
}

const App: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // File Processing
  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    
    // Check file sizes
    const oversizedFiles = fileArray.filter(f => f.size > 4 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files are too large (>4MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const newUploadedFiles: UploadedFile[] = [];

    const readFile = (file: File): Promise<UploadedFile> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        const isPdf = file.type === 'application/pdf';

        if (isPdf) {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            const base64 = result.split(',')[1];
            resolve({
              id: Math.random().toString(36).substring(7),
              name: file.name,
              type: 'application/pdf',
              content: base64
            });
          };
          reader.readAsDataURL(file);
        } else {
          reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve({
              id: Math.random().toString(36).substring(7),
              name: file.name,
              type: 'text/csv',
              content: text
            });
          };
          reader.readAsText(file);
        }
      });
    };

    try {
      const processed = await Promise.all(fileArray.map(readFile));
      setUploadedFiles(prev => [...prev, ...processed]);
    } catch (err) {
      setError("Error reading files. Please try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input so same files can be selected again if needed
      e.target.value = '';
    }
  };

  const loadDemoData = () => {
    const demoFile: UploadedFile = {
      id: 'demo-data',
      name: "demo_transactions.csv",
      type: "text/csv",
      content: DEMO_DATA
    };
    // Avoid adding demo data twice
    if (!uploadedFiles.some(f => f.id === 'demo-data')) {
      setUploadedFiles(prev => [...prev, demoFile]);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    if (uploadedFiles.length <= 1) {
      setTransactions(null); // Clear results if all files removed
    }
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;
    
    setLoading(true);
    setError(null);
    setTransactions(null);
    setSelectedMonth('All'); // Reset filter

    try {
      const inputs: FileInput[] = uploadedFiles.map(f => ({
        data: f.content,
        mimeType: f.type
      }));
      
      const result = await parseTransactions(inputs);
      setTransactions(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (id: string, newCategory: string) => {
    if (!transactions) return;
    setTransactions(prev => {
        if (!prev) return null;
        return prev.map(t => t.id === id ? { ...t, category: newCategory } : t);
    });
  };

  const handleAmountChange = (id: string, newAmount: number) => {
    if (!transactions) return;
    setTransactions(prev => {
        if (!prev) return null;
        return prev.map(t => t.id === id ? { ...t, amount: Math.abs(newAmount) } : t);
    });
  };

  const handleAddTransaction = (newTransaction: Transaction) => {
    if (!transactions) {
      setTransactions([newTransaction]);
    } else {
      setTransactions([newTransaction, ...transactions]);
    }
  };

  // Derive months from transactions
  const months = useMemo(() => {
    if (!transactions) return [];
    const uniqueMonths = new Set<string>();
    transactions.forEach(t => {
      try {
        const date = new Date(t.date);
        if (!isNaN(date.getTime())) {
           uniqueMonths.add(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
        }
      } catch (e) {}
    });
    return ['All', ...Array.from(uniqueMonths).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())];
  }, [transactions]);

  // Filter transactions based on selection
  const filteredTransactions = useMemo(() => {
    if (!transactions) return null;
    if (selectedMonth === 'All') return transactions;
    return transactions.filter(t => {
       try {
         const date = new Date(t.date);
         const m = date.toLocaleString('default', { month: 'long', year: 'numeric' });
         return m === selectedMonth;
       } catch (e) { return false; }
    });
  }, [transactions, selectedMonth]);

  const downloadCSV = () => {
    if (!filteredTransactions) return;
    
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Confidence'];
    const rows = filteredTransactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.category,
      t.amount.toFixed(2),
      t.type,
      t.confidence
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${selectedMonth.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (!filteredTransactions) return;

    const doc = new jsPDF();
    const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text('HomeBudget Analysis', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Period: ${selectedMonth}`, 14, 30);

    // Summary Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 36, 180, 24, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Total Income', 20, 45);
    doc.text('Total Expenses', 80, 45);
    doc.text('Net Savings', 140, 45);

    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`$${totalIncome.toFixed(2)}`, 20, 54);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`$${totalExpense.toFixed(2)}`, 80, 54);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(`$${(totalIncome - totalExpense).toFixed(2)}`, 140, 54);

    // Table
    const tableRows = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.type,
      `$${t.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: tableRows,
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    doc.save(`budget_report_${selectedMonth.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleAddTransaction} 
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">HomeBudget AI</h1>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Powered by Gemini 3 Flash
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro */}
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Turn chaos into clarity.</h2>
          <p className="text-slate-600 text-lg">
            Drag and drop multiple bank statement PDFs or CSVs. Our AI will clean, categorize, and combine them into one budget.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Upload Bank Statements
          </label>
          
          <div 
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-3 bg-slate-100 rounded-full">
                <Upload className={`w-6 h-6 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  <span className="text-indigo-600 hover:text-indigo-700">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  PDF, CSV or Text files (max 4MB each)
                </p>
              </div>
              
              <input
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileInput}
                accept=".csv,.pdf,.txt"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col space-y-3">
             {uploadedFiles.length === 0 && (
                <div className="text-center">
                   <button 
                    onClick={loadDemoData}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                   >
                     Or try with demo data
                   </button>
                </div>
             )}

             {uploadedFiles.map((file) => (
               <div key={file.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono uppercase leading-none">
                        {file.type === 'application/pdf' ? 'PDF' : 'CSV/Text'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
               </div>
             ))}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start space-x-3 border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={loading || uploadedFiles.length === 0}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                loading || uploadedFiles.length === 0
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Analyzing {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Wand2 className="-ml-1 mr-2 h-5 w-5" />
                  Analyze Files
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {filteredTransactions && (
          <div className="space-y-8 animate-fade-in">
            {/* Results Header with Global Month Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-slate-400 uppercase tracking-widest text-xs font-bold">
                <span>Analysis Results</span>
                <div className="h-px bg-slate-200 w-12"></div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {months.length > 1 && (
                  <div className="flex items-center space-x-2 bg-white p-1 pr-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 mr-2">Period:</span>
                    <div className="relative">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="appearance-none bg-transparent font-semibold text-slate-700 text-sm focus:outline-none pr-6 cursor-pointer"
                      >
                        {months.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
                
                <button
                  onClick={downloadCSV}
                  className="flex items-center px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                  title="Download CSV"
                >
                  <FileIcon className="w-4 h-4 mr-2" />
                  CSV
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </button>
              </div>
            </div>

            <Dashboard transactions={filteredTransactions} />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Detailed Transactions</h3>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Transaction
                </button>
              </div>
              
              <TransactionTable 
                transactions={filteredTransactions} 
                onCategoryChange={handleCategoryChange}
                onAmountChange={handleAmountChange}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;