import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, Plus, ChevronRight, ArrowUpCircle, ArrowDownCircle, ArrowRight, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar, ChevronLeft, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import type { TrackFinance, BudgetItem, BudgetCategory, TransactionType, IncomeStatus, ExpenseStatus, Budget, BudgetType } from '../types';
import { mockFinances } from '../data/mockData';
import Modal from '../components/Modal';
import BudgetChart from '../components/BudgetChart';
import BudgetTypeSelector from '../components/budget/BudgetTypeSelector';
import BudgetForm from '../components/budget/BudgetForm';
import InvoiceGenerator from '../components/InvoiceGenerator';
import { getAllBudgets, getAllBudgetItems, createBudget, createBudgetItem } from '../lib/budgetService';
import { supabase } from '../lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';

const BUDGET_CATEGORIES: BudgetCategory[] = ['Art', 'Digital', 'Marketing', 'Music', 'Press', 'Other'];
const TRANSACTION_TYPES: TransactionType[] = ['Expense', 'Income'];
const INCOME_STATUSES: IncomeStatus[] = ['received', 'pending'];
const EXPENSE_STATUSES: ExpenseStatus[] = ['paid', 'unpaid'];

export default function Finance() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isOverviewFilterOpen, setIsOverviewFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'Income' | 'Expense',
    category: 'all' as 'all' | BudgetCategory,
    status: 'all' as 'all' | IncomeStatus | ExpenseStatus,
    amountMin: '',
    amountMax: '',
    searchQuery: '',
  });
  const [overviewFilters, setOverviewFilters] = useState({
    type: 'all' as 'all' | 'Income' | 'Expense',
    category: 'all' as 'all' | BudgetCategory,
    status: 'all' as 'all' | IncomeStatus | ExpenseStatus,
  });
  const [showAllBudgets, setShowAllBudgets] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedBudgetType, setSelectedBudgetType] = useState<BudgetType | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [finances, setFinances] = useState(mockFinances);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTransaction, setNewTransaction] = useState<Omit<BudgetItem, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'Income',
    amount: 0,
    category: 'Other',
    status: 'received',
    attachments: [],
  });
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | number | 'new' | 'none'>('none');
  const [newBudgetTitle, setNewBudgetTitle] = useState('');
  const [cashflowData, setCashflowData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('budgetCategories');
    return saved ? JSON.parse(saved) : [...BUDGET_CATEGORIES];
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{index: number; name: string} | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Calculate financial metrics based on time filter
  const getFilteredTransactions = () => {
    const now = new Date();
    const transactions = budgets.flatMap(budget => budget.budgetItems || []);

    return transactions.filter(item => {
      const itemDate = new Date(item.date);
      
      switch (timeFilter) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return itemDate >= monthAgo;
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          return itemDate >= quarterAgo;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return itemDate >= yearAgo;
        case 'custom':
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          return itemDate >= startDate && itemDate <= endDate;
        default:
          return true;
      }
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Apply overview filters for financial metrics
  const overviewFilteredTransactions = filteredTransactions.filter(item => {
    if (overviewFilters.type !== 'all' && item.type !== overviewFilters.type) return false;
    if (overviewFilters.category !== 'all' && item.category !== overviewFilters.category) return false;
    if (overviewFilters.status !== 'all' && item.status !== overviewFilters.status) return false;
    return true;
  });

  // Apply table filters for recent movements
  const fullyFilteredTransactions = filteredTransactions.filter(item => {
    // Type filter
    if (filters.type !== 'all' && item.type !== filters.type) return false;

    // Category filter
    if (filters.category !== 'all' && item.category !== filters.category) return false;

    // Status filter
    if (filters.status !== 'all' && item.status !== filters.status) return false;

    // Amount range filter
    if (filters.amountMin && item.amount < parseFloat(filters.amountMin)) return false;
    if (filters.amountMax && item.amount > parseFloat(filters.amountMax)) return false;

    // Search query filter
    if (filters.searchQuery && !item.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;

    return true;
  });

  const totalIncome = overviewFilteredTransactions
    .filter(item => item.type === 'Income')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = overviewFilteredTransactions
    .filter(item => item.type === 'Expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileNames = files.map(file => file.name);
    setNewTransaction(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...fileNames],
    }));
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: artists } = await supabase.from('artists').select('id').limit(1).maybeSingle();
      if (!artists) {
        alert('Please create an artist first');
        return;
      }

      let targetBudgetId: string;

      if (selectedBudgetId === 'new') {
        const newBudgetData = await createBudget({
          type: 'other',
          title: newBudgetTitle || 'Untitled Budget',
          status: 'in_progress',
        }, artists.id);
        targetBudgetId = String(newBudgetData.id);
      } else if (selectedBudgetId !== 'none') {
        const selectedBudget = budgets.find(b => String(b.id) === String(selectedBudgetId));
        if (selectedBudget) {
          targetBudgetId = String(selectedBudget.id);
        } else {
          alert('Selected budget not found');
          return;
        }
      } else {
        let generalBudget = budgets.find(b => b.title === 'General Transactions' && b.type === 'other');
        if (!generalBudget) {
          const newGeneralBudget = await createBudget({
            type: 'other',
            title: 'General Transactions',
            status: 'in_progress',
          }, artists.id);
          targetBudgetId = String(newGeneralBudget.id);
        } else {
          targetBudgetId = String(generalBudget.id);
        }
      }

      await createBudgetItem(targetBudgetId, newTransaction);
      const refreshedBudgets = await getAllBudgets();
      setBudgets(refreshedBudgets);

      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'Income',
        amount: 0,
        category: 'Other',
        status: 'received',
        attachments: [],
      });
      setSelectedBudgetId('none');
      setNewBudgetTitle('');
      setIsIncomeModalOpen(false);
      setIsExpenseModalOpen(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction. Please try again.');
    }
  };

  const handleCreateBudget = async (budgetData: Partial<Budget>) => {
    try {
      const { data: artists } = await supabase.from('artists').select('id').limit(1).maybeSingle();
      if (!artists) {
        alert('Please create an artist first');
        return;
      }

      await createBudget(budgetData, artists.id);
      const refreshedBudgets = await getAllBudgets();
      setBudgets(refreshedBudgets);

      setIsNewBudgetModalOpen(false);
      setSelectedBudgetType(null);
      setSelectedShowId(null);
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget. Please try again.');
    }
  };

  const recentMovements = fullyFilteredTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const totalBudget = budgets.reduce((sum, budget) =>
    sum + (budget.categoryBudgets || []).reduce((acc, cat) => acc + cat.budgetAmount, 0), 0
  );

  const totalSpent = budgets.reduce((sum, budget) =>
    sum + (budget.budgetItems || []).filter(item => item.type === 'Expense').reduce((acc, item) => acc + item.amount, 0), 0
  );

  const remainingBudget = totalBudget - totalSpent;

  // Group budgets by type
  const groupedBudgets = budgets.reduce((groups, budget) => {
    if (!groups[budget.type]) {
      groups[budget.type] = [];
    }
    groups[budget.type].push(budget);
    return groups;
  }, {} as Record<BudgetType, Budget[]>);

  const prepareCashflowData = () => {
    const allTransactions = overviewFilteredTransactions;
    const cashflowByPeriod: Record<string, { income: number, expenses: number, net: number }> = {};

    const getGroupKey = (date: Date): { key: string, displayLabel: string } => {
      switch (timeFilter) {
        case 'week': {
          const dayKey = date.toISOString().split('T')[0];
          const displayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return { key: dayKey, displayLabel };
        }
        case 'month': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const displayLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          return { key: weekKey, displayLabel };
        }
        case 'quarter': {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const displayLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          return { key: monthKey, displayLabel };
        }
        case 'year': {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          const quarterKey = `${date.getFullYear()}-Q${quarter}`;
          const displayLabel = `Q${quarter} ${date.getFullYear()}`;
          return { key: quarterKey, displayLabel };
        }
        case 'custom': {
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 14) {
            const dayKey = date.toISOString().split('T')[0];
            const displayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return { key: dayKey, displayLabel };
          } else if (daysDiff <= 60) {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            const displayLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            return { key: weekKey, displayLabel };
          } else if (daysDiff <= 365) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const displayLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            return { key: monthKey, displayLabel };
          } else {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            const quarterKey = `${date.getFullYear()}-Q${quarter}`;
            const displayLabel = `Q${quarter} ${date.getFullYear()}`;
            return { key: quarterKey, displayLabel };
          }
        }
        default: {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const displayLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          return { key: monthKey, displayLabel };
        }
      }
    };

    const displayLabels: Record<string, string> = {};

    allTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const { key, displayLabel } = getGroupKey(date);

      displayLabels[key] = displayLabel;

      if (!cashflowByPeriod[key]) {
        cashflowByPeriod[key] = { income: 0, expenses: 0, net: 0 };
      }

      if (transaction.type === 'Income') {
        cashflowByPeriod[key].income += transaction.amount;
      } else {
        cashflowByPeriod[key].expenses += transaction.amount;
      }

      cashflowByPeriod[key].net = cashflowByPeriod[key].income - cashflowByPeriod[key].expenses;
    });

    return Object.entries(cashflowByPeriod)
      .map(([period, data]) => ({
        month: period,
        income: data.income,
        expenses: data.expenses,
        net: data.net,
        displayMonth: displayLabels[period]
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  // Load budgets from Supabase
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        setIsLoading(true);
        const data = await getAllBudgets();
        setBudgets(data);
      } catch (error) {
        console.error('Error loading budgets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBudgets();
  }, []);

  useEffect(() => {
    setCashflowData(prepareCashflowData());
  }, [timeFilter, customDateRange, budgets, overviewFilters]);

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !customCategories.includes(newCategoryName.trim())) {
      const updated = [...customCategories, newCategoryName.trim()];
      setCustomCategories(updated);
      localStorage.setItem('budgetCategories', JSON.stringify(updated));
      setNewCategoryName('');
    }
  };

  const handleUpdateCategory = () => {
    if (editingCategory && editingCategory.name.trim()) {
      const updated = [...customCategories];
      updated[editingCategory.index] = editingCategory.name.trim();
      setCustomCategories(updated);
      localStorage.setItem('budgetCategories', JSON.stringify(updated));
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (index: number) => {
    const updated = customCategories.filter((_, i) => i !== index);
    setCustomCategories(updated);
    localStorage.setItem('budgetCategories', JSON.stringify(updated));
  };

  return (
    <div>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general" >
            General
          </TabsTrigger>
          <TabsTrigger value="budgets" >
            Budgets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          {/* Quick Actions */}
      <div className="scroll-row mb-8">
        <div className="grid grid-cols-3 gap-4 min-w-[500px]">
          <button
            onClick={() => {
              setNewTransaction(prev => ({ ...prev, type: 'Income', status: 'received' }));
              setIsIncomeModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green text-white border border-black hover:bg-green/90 active:bg-green/80 transition-colors"
          >
            <ArrowUpCircle className="w-5 h-5" />
            <span className="font-medium whitespace-nowrap">Add New Income</span>
          </button>
          <button
            onClick={() => {
              setNewTransaction(prev => ({ ...prev, type: 'Expense', status: 'paid' }));
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#90928f] text-white border border-black hover:bg-[#90928f]/90 active:bg-[#90928f]/80 transition-colors"
          >
            <ArrowDownCircle className="w-5 h-5" />
            <span className="font-medium whitespace-nowrap">Add New Expense</span>
          </button>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--surface)] text-[var(--t1)] border border-black hover:bg-[var(--surface-2)] active:bg-[var(--surface-3)] transition-colors"
          >
            <img src="/TM-File-negro.svg" className="pxi-lg icon-white" alt="" />
            <span className="font-medium whitespace-nowrap">New Invoice</span>
          </button>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-[var(--surface)] shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-[var(--t1)] uppercase">Recent Movements</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border)]  transition-colors ${
                  isFilterOpen ? 'bg-[var(--surface-2)] text-[var(--t1)]' : 'bg-[var(--surface)] text-[var(--t2)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <img src="/TM-Filter-negro.svg" className="pxi-md icon-muted" alt="" />
                Filters
                {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <Link
                to="/finance/movements"
                className="text-primary hover:text-[var(--t1)] inline-flex items-center gap-1 text-sm font-medium"
              >
                See All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {isFilterOpen && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-[var(--border)]">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Description..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Categories</option>
                  {BUDGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="received">Received</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {/* Amount Range */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                    Min Amount
                  </label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={filters.amountMin}
                    onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                    Max Amount
                  </label>
                  <input
                    type="number"
                    placeholder="$∞"
                    value={filters.amountMax}
                    onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="lg:col-span-6 flex justify-between items-center">
                <span className="text-sm text-[var(--t3)]">
                  Showing <span className="font-semibold text-[var(--t1)]">{fullyFilteredTransactions.length}</span> of {filteredTransactions.length} transactions
                </span>
                <button
                  onClick={() => setFilters({
                    type: 'all',
                    category: 'all',
                    status: 'all',
                    amountMin: '',
                    amountMax: '',
                    searchQuery: '',
                  })}
                  className="text-sm text-[var(--t3)] hover:text-[var(--t1)] font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {recentMovements.length === 0 ? (
          <div className="p-12 text-center">
            <img src="/TM-Filter-negro.svg" className="pxi-xl icon-muted mx-auto mb-3" alt="" />
            <p className="text-[var(--t3)] font-medium">No transactions match your filters</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filter criteria</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[var(--surface-2)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--t3)] uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--t3)] uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--t3)] uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--t3)] uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[var(--t3)] uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-[var(--t3)] uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--surface)] divide-y divide-gray-200">
            {recentMovements.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--surface-2)]">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--t3)]">
                  {formatDate(item.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--t1)]">
                  {item.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.type === 'Income'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--t3)]">
                  {item.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={item.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(item.amount)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'received' || item.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-beige text-black'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Financial Dashboard */}
      <div className="bg-[var(--surface)] shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-[var(--t1)] uppercase">Financial Overview</h2>
            <button
              onClick={() => setIsOverviewFilterOpen(!isOverviewFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border)]  transition-colors ${
                isOverviewFilterOpen ? 'bg-[var(--surface-2)] text-[var(--t1)]' : 'bg-[var(--surface)] text-[var(--t2)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <img src="/TM-Filter-negro.svg" className="pxi-md icon-muted" alt="" />
              Filters
              {isOverviewFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isOverviewFilterOpen && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-4 bg-[var(--surface-2)] border border-[var(--border)]">
              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  Transaction Type
                </label>
                <select
                  value={overviewFilters.type}
                  onChange={(e) => setOverviewFilters({ ...overviewFilters, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary bg-[var(--surface)]"
                >
                  <option value="all">All Types</option>
                  <option value="Income">Income Only</option>
                  <option value="Expense">Expenses Only</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  Category
                </label>
                <select
                  value={overviewFilters.category}
                  onChange={(e) => setOverviewFilters({ ...overviewFilters, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary bg-[var(--surface)]"
                >
                  <option value="all">All Categories</option>
                  {BUDGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  Status
                </label>
                <select
                  value={overviewFilters.status}
                  onChange={(e) => setOverviewFilters({ ...overviewFilters, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary bg-[var(--surface)]"
                >
                  <option value="all">All Statuses</option>
                  <option value="received">Received</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => {
                    setCustomDateRange({ ...customDateRange, start: e.target.value });
                    setTimeFilter('custom');
                  }}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary bg-[var(--surface)]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-medium text-[var(--t2)] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => {
                    setCustomDateRange({ ...customDateRange, end: e.target.value });
                    setTimeFilter('custom');
                  }}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] focus:ring-primary focus:border-primary bg-[var(--surface)]"
                />
              </div>

              {/* Date Range Presets */}
              <div className="col-span-2 md:col-span-5">
                <label className="block text-xs font-medium text-[var(--t2)] mb-2">
                  Quick Date Ranges
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
                      setCustomDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                      setTimeFilter('custom');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium  border transition-colors ${
                      timeFilter === 'week' || (timeFilter === 'custom' &&
                        Math.abs(new Date(customDateRange.end).getTime() - new Date(customDateRange.start).getTime()) === 7 * 24 * 60 * 60 * 1000)
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'bg-[var(--surface)] text-[var(--t2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
                      setCustomDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                      setTimeFilter('custom');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium  border transition-colors ${
                      timeFilter === 'month'
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'bg-[var(--surface)] text-[var(--t2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
                      setCustomDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                      setTimeFilter('custom');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium  border transition-colors ${
                      timeFilter === 'quarter'
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'bg-[var(--surface)] text-[var(--t2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    Last 90 Days
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(end.getFullYear(), 0, 1);
                      setCustomDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                      setTimeFilter('custom');
                    }}
                    className="px-3 py-1.5 text-xs font-medium border bg-[var(--surface)] text-[var(--t2)] border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    Year to Date
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
                      setCustomDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0]
                      });
                      setTimeFilter('custom');
                    }}
                    className={`px-3 py-1.5 text-xs font-medium  border transition-colors ${
                      timeFilter === 'year'
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'bg-[var(--surface)] text-[var(--t2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    Last 365 Days
                  </button>
                </div>
              </div>

              {/* Clear Button */}
              <div className="col-span-2 md:col-span-5 flex justify-between items-center pt-2 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--t3)] font-medium">
                  {timeFilter === 'custom'
                    ? `Showing: ${formatDate(customDateRange.start)} - ${formatDate(customDateRange.end)}`
                    : `Showing: ${timeFilter === 'week' ? 'Last 7 days' : timeFilter === 'month' ? 'Last 30 days' : timeFilter === 'quarter' ? 'Last 90 days' : 'Last 365 days'}`
                  }
                </span>
                <button
                  onClick={() => {
                    setOverviewFilters({
                      type: 'all',
                      category: 'all',
                      status: 'all',
                    });
                    setTimeFilter('month');
                    setCustomDateRange({
                      start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                      end: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="text-sm text-[var(--t3)] hover:text-[var(--t1)] font-medium"
                >
                  Reset All
                </button>
              </div>
            </div>
          )}

          <div className="inline-flex gap-1 bg-[var(--surface-2)] p-1">
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-5 py-2.5 text-sm font-semibold  transition-all ${
                timeFilter === 'week'
                  ? 'bg-[var(--surface)] text-[var(--t1)] shadow-sm'
                  : 'text-[var(--t3)] hover:text-[var(--t1)]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-5 py-2.5 text-sm font-semibold  transition-all ${
                timeFilter === 'month'
                  ? 'bg-[var(--surface)] text-[var(--t1)] shadow-sm'
                  : 'text-[var(--t3)] hover:text-[var(--t1)]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeFilter('quarter')}
              className={`px-5 py-2.5 text-sm font-semibold  transition-all ${
                timeFilter === 'quarter'
                  ? 'bg-[var(--surface)] text-[var(--t1)] shadow-sm'
                  : 'text-[var(--t3)] hover:text-[var(--t1)]'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setTimeFilter('year')}
              className={`px-5 py-2.5 text-sm font-semibold  transition-all ${
                timeFilter === 'year'
                  ? 'bg-[var(--surface)] text-[var(--t1)] shadow-sm'
                  : 'text-[var(--t3)] hover:text-[var(--t1)]'
              }`}
            >
              Year
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 scroll-row">
          <div className="grid grid-cols-3 gap-4 md:gap-6 min-w-[400px]">
            <div>
              <dt className="text-sm font-medium text-[var(--t3)] whitespace-nowrap">Total Income</dt>
              <dd className="mt-1 text-2xl md:text-3xl font-semibold text-[var(--t1)] whitespace-nowrap">
                {formatCurrency(totalIncome)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--t3)] whitespace-nowrap">Total Expenses</dt>
              <dd className="mt-1 text-2xl md:text-3xl font-semibold text-[var(--t1)] whitespace-nowrap">
                {formatCurrency(totalExpenses)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--t3)] whitespace-nowrap">
                Net {netProfit >= 0 ? 'Profit' : 'Loss'}
              </dt>
              <dd className="mt-1 text-2xl md:text-3xl font-semibold text-[var(--t1)] whitespace-nowrap">
                {formatCurrency(Math.abs(netProfit))}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Cashflow Chart */}
      <div className="bg-[var(--surface)] shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-[var(--t1)] uppercase">Cashflow Over Time</h2>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[var(--t3)]" />
            <span className="text-sm text-[var(--t3)]">
              {timeFilter === 'week' ? 'Last 7 days' : 
               timeFilter === 'month' ? 'This month' : 
               timeFilter === 'quarter' ? 'Last 3 months' :
               timeFilter === 'custom' ? 'Custom range' : 'This year'}
            </span>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cashflowData}
              margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="displayMonth" />
              <YAxis 
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(1)}M`;
                  } else if (value >= 1000) {
                    return `$${(value / 1000).toFixed(0)}K`;
                  } else {
                    return `$${value}`;
                  }
                }}
                width={60}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => `${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stackId="1" 
                stroke="var(--status-green)" 
                fill="var(--status-green)" 
                name="Income"
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stackId="2" 
                stroke="var(--status-red)" 
                fill="var(--status-red)" 
                name="Expenses"
              />
              <Area 
                type="monotone" 
                dataKey="net" 
                stroke="var(--brand-1)" 
                fill="var(--brand-1)" 
                name="Net Cashflow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-[var(--t3)]">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-[var(--t3)]">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-[var(--t3)]">Net Cashflow</span>
          </div>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="budgets">
          <div className="grid grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => {
                setSelectedBudgetType('release');
                setIsNewBudgetModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-3 bg-[#ccdbe2] text-[var(--t1)] border border-black hover:bg-[#b8ccd4] transition-colors"
            >
              <span className="font-medium uppercase">New Release Budget</span>
            </button>
            <button
              onClick={() => {
                setSelectedBudgetType('show');
                setIsNewBudgetModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-3 bg-[#90928f] text-white border border-black hover:bg-[#90928f]/90 transition-colors"
            >
              <span className="font-medium uppercase">New Show Budget</span>
            </button>
            <button
              onClick={() => {
                setSelectedBudgetType('tour');
                setIsNewBudgetModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-3 bg-green text-white border border-black hover:bg-green/90 transition-colors"
            >
              <span className="font-medium uppercase">New Tour Budget</span>
            </button>
            <button
              onClick={() => {
                setSelectedBudgetType('custom');
                setIsNewBudgetModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-3 bg-[var(--surface)] text-[var(--t1)] border border-black hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="font-medium uppercase">New Custom Budget</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-[var(--surface)] shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-[var(--t1)] uppercase">Budget vs Spent</h2>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Total Budget', value: totalBudget, fill: '#E5E7EB' },
                      { name: 'Total Spent', value: totalSpent, fill: '#EF4444' },
                      { name: 'Remaining', value: remainingBudget, fill: '#10B981' },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                        return `$${value}`;
                      }}
                    />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {[
                        { name: 'Total Budget', value: totalBudget, fill: '#D1D5DB' },
                        { name: 'Total Spent', value: totalSpent, fill: '#EF4444' },
                        { name: 'Remaining', value: remainingBudget, fill: '#10B981' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--t3)]">Budget Usage</span>
                  <span className="text-sm font-semibold text-[var(--t1)]">
                    {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-2 h-3 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }}
                    className={`h-full rounded-full transition-all ${
                      totalSpent > totalBudget ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] shadow-md p-6">
              <h2 className="text-lg font-medium text-[var(--t1)] uppercase mb-6">Summary</h2>
              <div className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-[var(--t3)]">Total Budget</dt>
                  <dd className="mt-1 text-3xl font-semibold text-[var(--t1)]">
                    {formatCurrency(totalBudget)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--t3)]">Total Spent</dt>
                  <dd className="mt-1 text-3xl font-semibold text-red-600">
                    {formatCurrency(totalSpent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[var(--t3)]">Remaining</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-600">
                    {formatCurrency(remainingBudget)}
                  </dd>
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <dt className="text-sm font-medium text-[var(--t3)]">Active Budgets</dt>
                  <dd className="mt-1 text-3xl font-semibold text-[var(--t1)]">
                    {budgets.filter(b => b.status === 'in_progress').length}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface)] shadow-md overflow-hidden">
            <div className="p-6 border-b border-[var(--border)]">
              <h2 className="text-lg font-medium text-[var(--t1)] uppercase">All Budgets</h2>
            </div>

            {budgets.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-[var(--t3)] font-medium">No budgets yet</p>
                <p className="text-sm text-gray-400 mt-1">Create one by clicking "New Budget" above</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {Object.keys(groupedBudgets).map(type => {
                  const typeBudgets = groupedBudgets[type as BudgetType];
                  if (!typeBudgets || typeBudgets.length === 0) return null;

                  return (
                    <div key={type} className="p-6">
                      <h3 className="text-sm font-semibold text-[var(--t3)] uppercase tracking-wider mb-4">
                        {type} Budgets ({typeBudgets.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {typeBudgets.map((budget) => {
                          const budgetSpent = budget.items?.reduce((sum, item) =>
                            item.type === 'Expense' ? sum + item.amount : sum, 0) || 0;
                          const budgetTotal = budget.items?.reduce((sum, item) =>
                            item.type === 'Income' ? sum + item.amount : sum, 0) || budget.total_amount || 0;
                          const spentPercentage = budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0;

                          return (
                            <Link
                              key={budget.id}
                              to={`/finance/${budget.id}`}
                              className="block p-4 border border-[var(--border)] hover:border-charcoal hover:shadow-md transition-all group"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-[var(--t1)] truncate group-hover:text-[var(--t1)]">
                                    {budget.title}
                                  </h4>
                                  <p className="text-xs text-[var(--t3)] mt-0.5">{budget.artist}</p>
                                </div>
                                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                                  budget.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : budget.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-[var(--surface-2)] text-gray-800'
                                }`}>
                                  {budget.status === 'in_progress' ? 'Active' : budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-[var(--t3)]">Spent</span>
                                  <span className="font-medium text-[var(--t1)]">
                                    {formatCurrency(budgetSpent)} / {formatCurrency(budgetTotal)}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                                    className={`h-full rounded-full ${
                                      spentPercentage > 100 ? 'bg-red-500' :
                                      spentPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>{Math.round(spentPercentage)}% used</span>
                                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[var(--t1)] transition-colors" />
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Income Modal */}
      <Modal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setNewTransaction({
            date: new Date().toISOString().split('T')[0],
            description: '',
            type: 'Income',
            amount: 0,
            category: 'Other',
            status: 'received',
            attachments: [],
          });
          setSelectedBudgetId('none');
          setNewBudgetTitle('');
        }}
        title="Add New Income"
      >
        <form onSubmit={handleSubmitTransaction} className="space-y-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-[var(--t2)]">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--t2)]">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[var(--t2)]">
              Category
            </label>
            <select
              id="category"
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value as BudgetCategory })}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {BUDGET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-[var(--t2)]">
              Amount
            </label>
            <div className="mt-1 relative shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-[var(--t3)] sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                className="pl-7 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-[var(--t2)]">
              Status
            </label>
            <select
              id="status"
              value={newTransaction.status}
              onChange={(e) => setNewTransaction({ ...newTransaction, status: e.target.value as IncomeStatus })}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {INCOME_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-[var(--t2)]">
              Add to Budget
            </label>
            <select
              id="budget"
              value={String(selectedBudgetId)}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBudgetId(value === 'new' || value === 'none' ? value : value);
                if (value === 'new') setNewBudgetTitle('');
              }}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="none">Don't add to budget</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={String(budget.id)}>
                  {budget.title} ({budget.type})
                </option>
              ))}
              <option value="new">+ Create New Budget</option>
            </select>
            {selectedBudgetId === 'new' && (
              <input
                type="text"
                placeholder="New budget name"
                value={newBudgetTitle}
                onChange={(e) => setNewBudgetTitle(e.target.value)}
                className="mt-2 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[var(--t2)]">
              Notes
            </label>
            <textarea
              id="notes"
              value={newTransaction.notes || ''}
              onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--t2)]">
              Attachments
            </label>
            <div className="mt-1 space-y-2">
              {newTransaction.attachments && newTransaction.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newTransaction.attachments.map((file, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {file}
                      <button
                        type="button"
                        onClick={() => setNewTransaction(prev => ({
                          ...prev,
                          attachments: prev.attachments?.filter((_, i) => i !== index) || [],
                        }))}
                        className="ml-1 hover:text-blue-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="block w-full text-sm text-[var(--t3)]
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-none file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsIncomeModalOpen(false);
                setNewTransaction({
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  type: 'Income',
                  amount: 0,
                  category: 'Other',
                  status: 'received',
                  attachments: [],
                });
                setSelectedBudgetId('none');
                setNewBudgetTitle('');
              }}
              className="px-4 py-2 text-sm font-medium text-[var(--t2)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary"
            >
              Add Income
            </button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setNewTransaction({
            date: new Date().toISOString().split('T')[0],
            description: '',
            type: 'Expense',
            amount: 0,
            category: 'Other',
            status: 'paid',
            attachments: [],
          });
          setSelectedBudgetId('none');
          setNewBudgetTitle('');
        }}
        title="Add New Expense"
      >
        <form onSubmit={handleSubmitTransaction} className="space-y-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-[var(--t2)]">
              Date
            </label>
            
            <input
              type="date"
              id="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--t2)]">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[var(--t2)]">
              Category
            </label>
            <select
              id="category"
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value as BudgetCategory })}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {BUDGET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-[var(--t2)]">
              Amount
            </label>
            <div className="mt-1 relative shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-[var(--t3)] sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                className="pl-7 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-[var(--t2)]">
              Status
            </label>
            <select
              id="status"
              value={newTransaction.status}
              onChange={(e) => setNewTransaction({ ...newTransaction, status: e.target.value as ExpenseStatus })}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {EXPENSE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="budget-expense" className="block text-sm font-medium text-[var(--t2)]">
              Add to Budget
            </label>
            <select
              id="budget-expense"
              value={String(selectedBudgetId)}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBudgetId(value === 'new' || value === 'none' ? value : value);
                if (value === 'new') setNewBudgetTitle('');
              }}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="none">Don't add to budget</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={String(budget.id)}>
                  {budget.title} ({budget.type})
                </option>
              ))}
              <option value="new">+ Create New Budget</option>
            </select>
            {selectedBudgetId === 'new' && (
              <input
                type="text"
                placeholder="New budget name"
                value={newBudgetTitle}
                onChange={(e) => setNewBudgetTitle(e.target.value)}
                className="mt-2 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[var(--t2)]">
              Notes
            </label>
            <textarea
              id="notes"
              value={newTransaction.notes || ''}
              onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full border-[var(--border)] shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--t2)]">
              Attachments
            </label>
            <div className="mt-1 space-y-2">
              {newTransaction.attachments && newTransaction.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newTransaction.attachments.map((file, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {file}
                      <button
                        type="button"
                        onClick={() => setNewTransaction(prev => ({
                          ...prev,
                          attachments: prev.attachments?.filter((_, i) => i !== index) || [],
                        }))}
                        className="ml-1 hover:text-blue-600"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="block w-full text-sm text-[var(--t3)]
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-none file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsExpenseModalOpen(false);
                setNewTransaction({
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  type: 'Expense',
                  amount: 0,
                  category: 'Other',
                  status: 'paid',
                  attachments: [],
                });
                setSelectedBudgetId('none');
                setNewBudgetTitle('');
              }}
              className="px-4 py-2 text-sm font-medium text-[var(--t2)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary"
            >
              Add Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* New Budget Modal */}
      <Modal
        isOpen={isNewBudgetModalOpen}
        onClose={() => {
          setIsNewBudgetModalOpen(false);
          setSelectedBudgetType(null);
          setSelectedShowId(null);
        }}
        title="Create New Budget"
      >
        {!selectedBudgetType ? (
          <BudgetTypeSelector
            onSelect={setSelectedBudgetType}
          />
        ) : (
          <BudgetForm
            type={selectedBudgetType}
            onSubmit={handleCreateBudget}
            onCancel={() => {
              setSelectedBudgetType(null);
              setSelectedShowId(null);
            }}
            tracks={[]}
            shows={[]}
            budgets={budgets}
            showId={selectedShowId}
          />
        )}
      </Modal>

      {/* Invoice Generator Modal */}
      <InvoiceGenerator
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      {/* Category Management Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setNewCategoryName('');
        }}
        title="Manage Categories"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--t2)] mb-2">
              Add New Category
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="Enter category name"
                className="flex-1 border-[var(--border)] shadow-sm focus:border-charcoal focus:ring-charcoal sm:text-sm"
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-charcoal text-white hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--t2)] mb-2">
              Existing Categories ({customCategories.length})
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customCategories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[var(--surface-2)] group"
                >
                  {editingCategory?.index === index ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCategory();
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                        className="flex-1 border-[var(--border)] shadow-sm focus:border-charcoal focus:ring-charcoal sm:text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateCategory}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-green" alt="" />
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="p-1.5 text-[var(--t3)] hover:bg-[var(--surface-3)] rounded transition-colors"
                      >
                        <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-[var(--t1)]">{category}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingCategory({ index, name: category })}
                          className="p-1.5 text-[var(--t3)] hover:text-[var(--t1)] hover:bg-[var(--surface-3)] rounded transition-colors"
                        >
                          <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(index)}
                          className="p-1.5 text-[var(--t3)] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {customCategories.length === 0 && (
                <p className="text-sm text-[var(--t3)] text-center py-4">No categories yet</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              onClick={() => {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
                setNewCategoryName('');
              }}
              className="w-full px-4 py-2 bg-[var(--surface-2)] text-[var(--t1)] hover:bg-[var(--surface-3)] transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}