import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, FileSpreadsheet, ChevronLeft } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/Modal';
import BudgetChart from '../components/BudgetChart';
import LoadingSpinner from '../components/LoadingSpinner';
import type { TrackFinance, BudgetCategory, BudgetItem, TransactionType, PaymentStatus, Budget } from '../types';
import { mockFinances } from '../data/mockData';
import { getBudgetById, updateBudgetItem, createBudgetItem, deleteBudgetItem as deleteBudgetItemService, updateBudgetCategory, calculateCommissions, updateBudgetCommissions } from '../lib/budgetService';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';

const BUDGET_CATEGORIES: BudgetCategory[] = ['Art', 'Digital', 'Marketing', 'Music', 'Press', 'Other'];
const TRANSACTION_TYPES: TransactionType[] = ['Expense', 'Income'];
const PAYMENT_STATUSES: PaymentStatus[] = ['Received', 'Pending', 'Paid', 'Unpaid'];

// Additional categories for live show budgets
const LIVE_BUDGET_CATEGORIES: BudgetCategory[] = [
  'Personnel', 'Production', 'Venue', 'Travel', 'Accommodation', 
  'Marketing', 'Catering', 'Insurance', 'Other'
];


export default function FinanceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editedBudgets, setEditedBudgets] = useState<Record<BudgetCategory, number>>({});
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingCommissions, setIsEditingCommissions] = useState(false);
  const [tempBookingRate, setTempBookingRate] = useState(10);
  const [tempManagementRate, setTempManagementRate] = useState(20);
  const [newItem, setNewItem] = useState<Omit<BudgetItem, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'Expense',
    amount: 0,
    category: 'Other',
    status: 'Unpaid',
    attachments: [],
  });

  // Load budget from database
  useEffect(() => {
    const loadBudget = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const budgetData = await getBudgetById(id);
        setBudget(budgetData || undefined);
      } catch (error) {
        console.error('Error loading budget:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBudget();
  }, [id]);

  // Get all available categories based on budget type
  const getAllCategories = (): BudgetCategory[] => {
    if (budget?.type === 'show') {
      return [...LIVE_BUDGET_CATEGORIES];
    }
    return [...BUDGET_CATEGORIES];
  };

  // Show loading spinner while fetching budget
  if (isLoading) {
    return <LoadingSpinner fullScreen={false} size="md" />;
  }

  // If budget is not found, show an error state and a button to go back
  if (!budget) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-charcoal mb-4">Budget Not Found</h2>
        <p className="text-gray-600 mb-8">The budget you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/finance')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
        >
          Return to Finance
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileNames = files.map(file => file.name);
    setNewItem(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...fileNames],
    }));
  };

  const budgetSummary = getAllCategories().map(category => {
    const items = budget.budgetItems.filter(item => item.category === category);
    const actualAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const budgetAmount = budget.categoryBudgets.find(b => b.category === category)?.budgetAmount || 0;
    const variance = budgetAmount - actualAmount;

    return {
      category,
      budgetAmount,
      actualAmount,
      variance,
    };
  }).filter(summary => summary.budgetAmount > 0 || summary.actualAmount > 0);

  const totalBudget = budgetSummary.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalActual = budgetSummary.reduce((sum, item) => sum + item.actualAmount, 0);
  const totalVariance = totalBudget - totalActual;

  const handleBudgetEdit = (category: BudgetCategory, amount: number) => {
    setEditedBudgets(prev => ({
      ...prev,
      [category]: amount,
    }));
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const category = newCategory.trim() as BudgetCategory;
    handleBudgetEdit(category, 0);
    setNewCategory('');
    setIsAddingCategory(false);
  };

  const handleSaveBudgets = async () => {
    if (!budget || !id) return;

    try {
      const categoriesToUpdate: { category: string; amount: number }[] = [];

      budget.categoryBudgets.forEach((cat) => {
        if (editedBudgets[cat.category] !== undefined) {
          categoriesToUpdate.push({
            category: cat.category,
            amount: editedBudgets[cat.category],
          });
        }
      });

      Object.entries(editedBudgets).forEach(([category, amount]) => {
        if (!budget.categoryBudgets.some((b) => b.category === category)) {
          categoriesToUpdate.push({ category, amount });
        }
      });

      await Promise.all(
        categoriesToUpdate.map((cat) =>
          updateBudgetCategory(id, cat.category, cat.amount)
        )
      );

      const refreshedBudget = await getBudgetById(id);
      setBudget(refreshedBudget || undefined);
      setIsEditingBudget(false);
      setEditedBudgets({});
    } catch (error) {
      console.error('Error saving budget categories:', error);
      alert('Failed to save budget categories. Please try again.');
    }
  };

  const prepareExportData = () => {
    return budget.budgetItems.map(item => ({
      Date: formatDate(item.date),
      Description: item.description,
      Type: item.type,
      Category: item.category,
      Amount: formatCurrency(item.amount),
      Status: item.status,
      Notes: item.notes || '',
      Attachments: item.attachments?.length || 0,
    }));
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const data = prepareExportData();
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Budget Items');
      writeFile(wb, `${budget.title}_budget.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
    setIsExporting(false);
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const data = prepareExportData();
      const ws = utils.json_to_sheet(data);
      const csv = utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${budget.title}_budget.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
    setIsExporting(false);
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title and artist info
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(budget.title, doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(budget.artist, doc.internal.pageSize.width / 2, 30, { align: 'center' });
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on ${formatDate(new Date())}`, doc.internal.pageSize.width / 2, 37, { align: 'center' });

      // Add budget summary
      let yPos = 50;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Budget Summary', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      autoTable(doc, {
        head: [['Category', 'Budget', 'Actual', 'Variance']],
        body: budgetSummary.map(summary => [
          summary.category,
          formatCurrency(summary.budgetAmount),
          formatCurrency(summary.actualAmount),
          formatCurrency(summary.variance),
        ]),
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;

      // Add line items
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Line Items', 14, yPos);
      yPos += 10;

      autoTable(doc, {
        head: [['Date', 'Description', 'Type', 'Category', 'Amount', 'Status']],
        body: budget.budgetItems.map(item => [
          formatDate(item.date),
          item.description,
          item.type,
          item.category,
          formatCurrency(item.amount),
          item.status,
        ]),
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [165, 138, 103], textColor: [255, 255, 255] },
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(128, 128, 128);
        doc.text(
          'Powered by THE MANAGER',
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }

      doc.save(`${budget.title}_budget.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
    setIsExporting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTotalIncome = () => {
    return budget?.budgetItems.filter(item => item.type === 'Income').reduce((sum, item) => sum + item.amount, 0) || 0;
  };

  const getTotalExpenses = () => {
    return budget?.budgetItems.filter(item => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0) || 0;
  };

  const getNetProfitLoss = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const getProfitMargin = () => {
    const income = getTotalIncome();
    if (income === 0) return 0;
    return ((getNetProfitLoss() / income) * 100).toFixed(1);
  };

  const getIncomeByStatus = (status: PaymentStatus) => {
    return budget?.budgetItems.filter(item => item.type === 'Income' && item.status === status).reduce((sum, item) => sum + item.amount, 0) || 0;
  };

  const getExpensesByStatus = (status: PaymentStatus) => {
    return budget?.budgetItems.filter(item => item.type === 'Expense' && item.status === status).reduce((sum, item) => sum + item.amount, 0) || 0;
  };

  const deleteItem = async (itemId: number) => {
    if (!budget || !id) return;

    try {
      await deleteBudgetItemService(String(itemId));
      const refreshedBudget = await getBudgetById(id);
      setBudget(refreshedBudget || undefined);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/finance')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Finance
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-charcoal font-title">{budget.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Budget tracking and financial overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={exportToCSV}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <img src="/TM-Download-negro.svg" className="pxi-md icon-muted" alt="" />
              CSV
            </button>
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <img src="/TM-File-negro.svg" className="pxi-md icon-muted" alt="" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Profit & Loss Overview */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-charcoal uppercase">Profit & Loss Statement</h2>
        </div>

        <div className="p-6">
          {/* Traditional P&L Format */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="space-y-6">
              {/* Income Section */}
              <div className="border-b border-gray-200 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-charcoal uppercase">Revenue (Income)</h3>
                  <span className="text-xs text-charcoal">
                    {budget.budgetItems.filter(item => item.type === 'Income').length} transaction{budget.budgetItems.filter(item => item.type === 'Income').length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-charcoal">Total Revenue</span>
                  <span className="text-2xl text-charcoal">
                    {formatCurrency(getTotalIncome())}
                  </span>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="border-b border-gray-200 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-charcoal uppercase">Expenses</h3>
                  <span className="text-xs text-charcoal">
                    {budget.budgetItems.filter(item => item.type === 'Expense').length} transaction{budget.budgetItems.filter(item => item.type === 'Expense').length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-charcoal">Total Expenses</span>
                  <span className="text-2xl text-charcoal">
                    {formatCurrency(getTotalExpenses())}
                  </span>
                </div>
              </div>

              {/* Net Profit/Loss */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-medium text-charcoal uppercase">
                      Net {getNetProfitLoss() >= 0 ? 'Profit' : 'Loss'} (Before Commissions)
                    </h3>
                    <p className="text-xs text-charcoal mt-1">
                      Profit Margin: {getProfitMargin()}%
                    </p>
                  </div>
                  <span className="text-3xl text-charcoal">
                    {formatCurrency(getNetProfitLoss())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-charcoal uppercase mb-4">Payment Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-charcoal uppercase mb-1 font-medium">Income Received</p>
                <p className="text-xl text-charcoal">
                  {formatCurrency(getIncomeByStatus('Received'))}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-charcoal uppercase mb-1 font-medium">Income Pending</p>
                <p className="text-xl text-charcoal">
                  {formatCurrency(getIncomeByStatus('Pending'))}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-charcoal uppercase mb-1 font-medium">Expenses Paid</p>
                <p className="text-xl text-charcoal">
                  {formatCurrency(getExpensesByStatus('Paid'))}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-charcoal uppercase mb-1 font-medium">Expenses Unpaid</p>
                <p className="text-xl text-charcoal">
                  {formatCurrency(getExpensesByStatus('Unpaid'))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-charcoal uppercase">Budget Summary</h2>
          {isEditingBudget ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditingBudget(false);
                  setEditedBudgets({});
                }}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBudgets}
                className="px-3 py-1 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingBudget(true)}
              className="px-3 py-1 text-sm font-medium text-primary hover:text-black"
            >
              Edit Budgets
            </button>
          )}
        </div>

        <div className="overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgetSummary.map((summary) => (
                <tr key={summary.category}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal">
                    {summary.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {isEditingBudget ? (
                      <input
                        type="number"
                        value={editedBudgets[summary.category] ?? summary.budgetAmount}
                        onChange={(e) => handleBudgetEdit(summary.category, Number(e.target.value))}
                        className="w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      formatCurrency(summary.budgetAmount)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {formatCurrency(summary.actualAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`font-medium ${
                      summary.variance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.variance)}
                    </span>
                  </td>
                </tr>
              ))}
              {isEditingBudget && (
                <tr>
                  <td colSpan={4} className="px-6 py-4">
                    {isAddingCategory ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Enter category name"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCategory();
                            }
                            if (e.key === 'Escape') {
                              setIsAddingCategory(false);
                              setNewCategory('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleAddCategory}
                          className="px-3 py-1 text-sm text-white bg-primary rounded-md hover:bg-primary"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategory('');
                          }}
                          className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingCategory(true)}
                        className="text-sm text-primary hover:text-black flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Category
                      </button>
                    )}
                  </td>
                </tr>
              )}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {formatCurrency(totalBudget)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {formatCurrency(totalActual)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={`font-medium ${
                    totalVariance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(totalVariance)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Budget Chart */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Budget vs Actual Comparison</h3>
          <BudgetChart budgetSummary={budgetSummary} />
        </div>
      </div>

      {/* Income Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-3">
              <h2 className="text-base font-medium text-charcoal uppercase">Income</h2>
              <p className="text-sm text-gray-600">
                Total: <span className="font-semibold text-green-600">
                  {formatCurrency(getTotalIncome())}
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                setEditingItemId(null);
                setNewItem({
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  type: 'Income',
                  amount: 0,
                  category: 'Other',
                  status: 'Pending',
                  attachments: [],
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Income
            </button>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attachments
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {budget.budgetItems.filter(item => item.type === 'Income').map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                  {item.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(item.amount)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'Received'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-beige text-black'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {item.notes}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.attachments?.length || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setEditingItemId(item.id);
                        setNewItem({
                          date: item.date,
                          description: item.description,
                          type: item.type,
                          amount: item.amount,
                          category: item.category,
                          status: item.status,
                          notes: item.notes,
                          attachments: item.attachments,
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-primary hover:text-black inline-flex items-center gap-1"
                    >
                      <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this item?')) {
                          deleteItem(item.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                    >
                      <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {budget.budgetItems.filter(item => item.type === 'Income').length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                  No income items yet. Click "Add Income" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Expense Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-3">
              <h2 className="text-base font-medium text-charcoal uppercase">Expenses</h2>
              <p className="text-sm text-gray-600">
                Total: <span className="font-semibold text-red-600">
                  {formatCurrency(getTotalExpenses())}
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                setEditingItemId(null);
                setNewItem({
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  type: 'Expense',
                  amount: 0,
                  category: 'Other',
                  status: 'Unpaid',
                  attachments: [],
                });
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attachments
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {budget.budgetItems.filter(item => item.type === 'Expense').map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                  {item.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className="text-red-600 font-semibold">
                    {formatCurrency(item.amount)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'Paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-beige text-black'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {item.notes}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.attachments?.length || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setEditingItemId(item.id);
                        setNewItem({
                          date: item.date,
                          description: item.description,
                          type: item.type,
                          amount: item.amount,
                          category: item.category,
                          status: item.status,
                          notes: item.notes,
                          attachments: item.attachments,
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-primary hover:text-black inline-flex items-center gap-1"
                    >
                      <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this item?')) {
                          deleteItem(item.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                    >
                      <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {budget.budgetItems.filter(item => item.type === 'Expense').length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                  No expense items yet. Click "Add Expense" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Commission Settings */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-charcoal uppercase">Commission Settings</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTempBookingRate(budget.bookingAgentCommissionRate || 10);
                  setTempManagementRate(budget.managementCommissionRate || 20);
                  setIsEditingCommissions(true);
                }}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted inline mr-1" alt="" />
                Edit Rates
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={budget.applyCommissions}
                  onChange={async (e) => {
                    if (!id) return;
                    try {
                      await updateBudgetCommissions(
                        id,
                        budget.bookingAgentCommissionRate || 10,
                        budget.managementCommissionRate || 20,
                        e.target.checked
                      );
                      const refreshedBudget = await getBudgetById(id);
                      setBudget(refreshedBudget || undefined);
                    } catch (error) {
                      console.error('Error updating commissions:', error);
                    }
                  }}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700 font-medium">Apply Commissions</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6">
          {(() => {
            const commissions = calculateCommissions(budget);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-700 uppercase font-medium">Booking Agent Commission</p>
                      <span className="text-xs text-gray-600">({commissions.bookingAgentRate}% of Gross Income)</span>
                    </div>
                    <p className="text-2xl font-semibold text-charcoal">
                      {budget.applyCommissions ? formatCurrency(commissions.bookingAgentCommission) : '$0'}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-700 uppercase font-medium">Management Commission</p>
                      <span className="text-xs text-gray-600">({commissions.managementRate}% of Net)</span>
                    </div>
                    <p className="text-2xl font-semibold text-charcoal">
                      {budget.applyCommissions ? formatCurrency(commissions.managementCommission) : '$0'}
                    </p>
                  </div>
                </div>

                {budget.applyCommissions && (
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-medium text-charcoal uppercase">
                          Net Profit (After Commissions)
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          After {commissions.bookingAgentRate}% booking agent & {commissions.managementRate}% management
                        </p>
                      </div>
                      <span className="text-3xl font-bold text-charcoal">
                        {formatCurrency(commissions.netProfit)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase">Commission Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Income:</span>
                      <span className="font-medium text-charcoal">{formatCurrency(commissions.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Expenses:</span>
                      <span className="font-medium text-charcoal">-{formatCurrency(commissions.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-gray-700 font-medium">Gross Profit:</span>
                      <span className="font-semibold text-charcoal">{formatCurrency(commissions.grossProfit)}</span>
                    </div>
                    {budget.applyCommissions && (
                      <>
                        <div className="flex justify-between text-blue-700">
                          <span>Booking Agent ({commissions.bookingAgentRate}% of gross income):</span>
                          <span className="font-medium">-{formatCurrency(commissions.bookingAgentCommission)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-300">
                          <span className="text-gray-700 font-medium">Net After Booking Agent:</span>
                          <span className="font-semibold text-charcoal">{formatCurrency(commissions.netAfterBookingAgent)}</span>
                        </div>
                        <div className="flex justify-between text-purple-700">
                          <span>Management ({commissions.managementRate}% of net):</span>
                          <span className="font-medium">-{formatCurrency(commissions.managementCommission)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-gray-400">
                          <span className="text-gray-900 font-bold">Final Net Profit:</span>
                          <span className="font-bold text-green-600 text-lg">{formatCurrency(commissions.netProfit)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItemId(null);
          setNewItem({
            date: new Date().toISOString().split('T')[0],
            description: '',
            type: 'Expense',
            amount: 0,
            category: 'Other',
            status: 'Unpaid',
            attachments: [],
          });
        }}
        title={editingItemId ? 'Edit Budget Item' : 'Add Budget Item'}
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!budget || !id) return;

          try {
            if (editingItemId) {
              await updateBudgetItem(String(editingItemId), newItem);
            } else {
              await createBudgetItem(id, newItem);
            }

            const refreshedBudget = await getBudgetById(id);
            setBudget(refreshedBudget || undefined);

            setIsModalOpen(false);
            setEditingItemId(null);
            setNewItem({
              date: new Date().toISOString().split('T')[0],
              description: '',
              type: 'Expense',
              amount: 0,
              category: 'Other',
              status: 'Unpaid',
              attachments: [],
            });
          } catch (error) {
            console.error('Error saving budget item:', error);
            alert('Failed to save item. Please try again.');
          }
        }} className="space-y-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={newItem.date}
              onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="type"
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value as TransactionType })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value as BudgetCategory })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {getAllCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                value={newItem.amount}
                onChange={(e) => setNewItem({ ...newItem, amount: Number(e.target.value) })}
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={newItem.status}
              onChange={(e) => setNewItem({ ...newItem, status: e.target.value as PaymentStatus })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              value={newItem.notes || ''}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Attachments
            </label>
            <div className="mt-1 space-y-2">
              {newItem.attachments && newItem.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newItem.attachments.map((file, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {file}
                      <button
                        type="button"
                        onClick={() => setNewItem(prev => ({
                          ...prev,
                          attachments: prev.attachments?.filter((_, i) => i !== index) || [],
                        }))}
                        className="ml-1 hover:text-blue-600"
                      >
                        <img src="/TM-Close-negro.svg" className="pxi-sm icon-muted" alt="" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="block w-full text-sm text-gray-500
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
                setIsModalOpen(false);
                setEditingItemId(null);
                setNewItem({
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  type: 'Expense',
                  amount: 0,
                  category: 'Other',
                  status: 'Unpaid',
                  attachments: [],
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
            >
              {editingItemId ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Commission Rates Editor Modal */}
      <Modal
        isOpen={isEditingCommissions}
        onClose={() => setIsEditingCommissions(false)}
        title="Edit Commission Rates"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!id) return;

          try {
            await updateBudgetCommissions(
              id,
              tempBookingRate,
              tempManagementRate,
              budget.applyCommissions || false
            );
            const refreshedBudget = await getBudgetById(id);
            setBudget(refreshedBudget || undefined);
            setIsEditingCommissions(false);
          } catch (error) {
            console.error('Error updating commission rates:', error);
            alert('Failed to update commission rates. Please try again.');
          }
        }} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">How Commissions Work</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Booking Agent:</strong> Calculated as a percentage of gross income</li>
              <li>• <strong>Management:</strong> Calculated as a percentage of net income after booking agent commission</li>
            </ul>
          </div>

          <div>
            <label htmlFor="booking-rate" className="block text-sm font-medium text-gray-700">
              Booking Agent Commission Rate (%)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="booking-rate"
                value={tempBookingRate}
                onChange={(e) => setTempBookingRate(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                min="0"
                max="100"
                step="0.1"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Calculated on gross income (default: 10%)</p>
          </div>

          <div>
            <label htmlFor="management-rate" className="block text-sm font-medium text-gray-700">
              Management Commission Rate (%)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                id="management-rate"
                value={tempManagementRate}
                onChange={(e) => setTempManagementRate(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                min="0"
                max="100"
                step="0.1"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Calculated on net after booking agent (default: 20%)</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Example Calculation</h4>
            <div className="text-sm space-y-1 text-gray-600">
              <div>Gross Income: $100,000</div>
              <div>Booking Agent ({tempBookingRate}%): -${(100000 * tempBookingRate / 100).toFixed(2)}</div>
              <div>Net After Booking: ${(100000 - (100000 * tempBookingRate / 100)).toFixed(2)}</div>
              <div>Management ({tempManagementRate}%): -${((100000 - (100000 * tempBookingRate / 100)) * tempManagementRate / 100).toFixed(2)}</div>
              <div className="font-semibold text-charcoal pt-2 border-t border-gray-300">
                Final Net: ${(100000 - (100000 * tempBookingRate / 100) - ((100000 - (100000 * tempBookingRate / 100)) * tempManagementRate / 100)).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditingCommissions(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
            >
              Save Rates
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}