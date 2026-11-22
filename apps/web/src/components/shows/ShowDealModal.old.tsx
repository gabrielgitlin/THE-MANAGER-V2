import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Modal from '../Modal';
import type { ShowDeal } from '../../types';

interface ShowDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: ShowDeal) => void;
  deal?: ShowDeal;
}

export default function ShowDealModal({ isOpen, onClose, onSave, deal }: ShowDealModalProps) {
  const [formData, setFormData] = useState<ShowDeal>(deal || {
    type: 'guarantee',
    guarantee: 0,
    percentage: 0,
    expenses: {
      production: 0,
      marketing: 0,
      staffing: 0,
    },
    settlement: {
      gross: 0,
      expenses: 0,
      net: 0,
    },
  });

  const [newExpenseKey, setNewExpenseKey] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleAddExpense = () => {
    if (!newExpenseKey.trim() || !newExpenseAmount) return;

    setFormData({
      ...formData,
      expenses: {
        ...formData.expenses,
        [newExpenseKey.toLowerCase().replace(/\s+/g, '_')]: Number(newExpenseAmount),
      },
    });

    setNewExpenseKey('');
    setNewExpenseAmount('');
    setShowAddExpense(false);
  };

  const handleRemoveExpense = (key: string) => {
    const { [key]: _, ...remainingExpenses } = formData.expenses;
    setFormData({
      ...formData,
      expenses: remainingExpenses,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Deal Information"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deal Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Deal Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({
              ...formData,
              type: e.target.value as ShowDeal['type'],
            })}
            className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="guarantee">Guarantee</option>
            <option value="percentage">Percentage</option>
            <option value="guarantee_vs_percentage">Guarantee vs Percentage</option>
          </select>
        </div>

        {/* Guarantee */}
        {(formData.type === 'guarantee' || formData.type === 'guarantee_vs_percentage') && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guarantee Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={formData.guarantee}
                onChange={(e) => setFormData({
                  ...formData,
                  guarantee: Number(e.target.value),
                })}
                className="pl-7 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                min="0"
                step="100"
              />
            </div>
          </div>
        )}

        {/* Percentage */}
        {(formData.type === 'percentage' || formData.type === 'guarantee_vs_percentage') && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Percentage
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                value={formData.percentage}
                onChange={(e) => setFormData({
                  ...formData,
                  percentage: Number(e.target.value),
                })}
                className="block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                min="0"
                max="100"
                step="0.1"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
        )}

        {/* Expenses */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Expenses
            </label>
            <button
              type="button"
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {showAddExpense && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expense Name
                  </label>
                  <input
                    type="text"
                    value={newExpenseKey}
                    onChange={(e) => setNewExpenseKey(e.target.value)}
                    className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="e.g., Equipment Rental"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(e.target.value)}
                      className="pl-7 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExpense(false);
                    setNewExpenseKey('');
                    setNewExpenseAmount('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="px-3 py-1 text-sm text-white bg-primary rounded hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {Object.entries(formData.expenses).map(([key, amount]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-900 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-900">{formatCurrency(amount)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(key)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settlement */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Settlement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gross
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.settlement.gross}
                  onChange={(e) => setFormData({
                    ...formData,
                    settlement: {
                      ...formData.settlement,
                      gross: Number(e.target.value),
                    },
                  })}
                  className="pl-7 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expenses
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.settlement.expenses}
                  onChange={(e) => setFormData({
                    ...formData,
                    settlement: {
                      ...formData.settlement,
                      expenses: Number(e.target.value),
                    },
                  })}
                  className="pl-7 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Net
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={formData.settlement.net}
                  onChange={(e) => setFormData({
                    ...formData,
                    settlement: {
                      ...formData.settlement,
                      net: Number(e.target.value),
                    },
                  })}
                  className="pl-7 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}