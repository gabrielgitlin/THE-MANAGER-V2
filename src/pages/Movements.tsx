import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, FileSpreadsheet, FileText, Download, Filter, X, ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { BudgetItem, BudgetCategory, TransactionType, IncomeStatus, ExpenseStatus, PaymentStatus } from '../types';
import { mockFinances } from '../data/mockData';
import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';

const BUDGET_CATEGORIES: BudgetCategory[] = ['Art', 'Digital', 'Marketing', 'Music', 'Press', 'Other'];
const TRANSACTION_TYPES: TransactionType[] = ['Expense', 'Income'];
const INCOME_STATUSES: IncomeStatus[] = ['received', 'pending'];
const EXPENSE_STATUSES: ExpenseStatus[] = ['paid', 'unpaid'];
const PAYMENT_STATUSES: PaymentStatus[] = [...INCOME_STATUSES, ...EXPENSE_STATUSES];

export default function Movements() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<'date' | 'description' | 'type' | 'category' | 'amount' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const movements = mockFinances.flatMap(finance => finance.budgetItems);

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || movement.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || movement.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || movement.status === selectedStatus;

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Sort the filtered movements
  const sortedMovements = [...filteredMovements].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'description':
        comparison = a.description.localeCompare(b.description);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending when changing fields
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (field !== sortField) {
      return null;
    }
    
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const data = filteredMovements.map(item => ({
        Date: formatDate(item.date),
        Description: item.description,
        Type: item.type,
        Category: item.category,
        Amount: formatCurrency(item.amount),
        Status: item.status,
        Notes: item.notes || '',
        Attachments: item.attachments?.length || 0,
      }));

      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Movements');
      writeFile(wb, 'movements.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
    setIsExporting(false);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Movements', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      // Add generation date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${formatDate(new Date())}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });

      // Add movements table
      const tableData = filteredMovements.map(item => [
        formatDate(item.date),
        item.description,
        item.type,
        item.category,
        formatCurrency(item.amount),
        item.status,
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Date', 'Description', 'Type', 'Category', 'Amount', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 253, 1], textColor: [0, 0, 0] },
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(128, 128, 128);
        doc.text(
          'Generated by THE MANAGER',
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

      doc.save('movements.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
    setIsExporting(false);
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
        <h1 className="text-2xl font-bold text-gray-900 font-title">Financial Movements</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all financial transactions
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search movements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TransactionType | 'all')}
                className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Types</option>
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as BudgetCategory | 'all')}
                className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Categories</option>
                {BUDGET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as PaymentStatus | 'all')}
                className="block rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="all">All Statuses</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date
                  {renderSortIcon('date')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('description')}
              >
                <div className="flex items-center">
                  Description
                  {renderSortIcon('description')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {renderSortIcon('type')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  {renderSortIcon('category')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end">
                  Amount
                  {renderSortIcon('amount')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center">
                  Status
                  {renderSortIcon('status')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attachments
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMovements.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {item.notes}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.attachments?.length || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}