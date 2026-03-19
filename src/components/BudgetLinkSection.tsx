import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, ExternalLink, Plus } from 'lucide-react';
import type { Budget } from '../types';

interface BudgetLinkSectionProps {
  budget: Budget | null;
  entityType: 'album' | 'show';
  entityName: string;
}

export default function BudgetLinkSection({ budget, entityType, entityName }: BudgetLinkSectionProps) {
  const totalBudget = budget?.categoryBudgets.reduce((sum, cat) => sum + cat.budgetAmount, 0) || 0;
  const totalSpent = budget?.budgetItems.reduce((sum, item) => sum + (item.type === 'Expense' ? item.amount : 0), 0) || 0;
  const remaining = totalBudget - totalSpent;

  return (
    <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-charcoal uppercase">Budget</h2>
          {budget ? (
            <Link
              to={`/finance/${budget.id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:text-black transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Budget
            </Link>
          ) : (
            <Link
              to="/finance"
              state={{ createFor: entityType, entityId: entityName }}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-black transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Budget
            </Link>
          )}
        </div>
      </div>
      <div className="p-6">
        {budget ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-beige rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-medium text-gray-500">Total Budget</h3>
                </div>
                <p className="text-2xl font-semibold text-charcoal">
                  ${totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="bg-light-blue rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
                </div>
                <p className="text-2xl font-semibold text-charcoal">
                  ${totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-medium text-gray-500">Remaining</h3>
                </div>
                <p className="text-2xl font-semibold text-charcoal">
                  ${remaining.toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Transactions</h3>
              <div className="space-y-2">
                {budget.budgetItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.category} • {item.date}</p>
                    </div>
                    <span className={`text-sm font-semibold ${item.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'Income' ? '+' : '-'}${item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {budget.budgetItems.length === 0 && (
                  <p className="text-sm text-gray-500 py-4 text-center">No transactions yet</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No budget linked to this {entityType}</p>
            <p className="text-sm text-gray-400 mb-4">
              Create a budget to track expenses and income for this {entityType}
            </p>
            <Link
              to="/finance"
              state={{ createFor: entityType, entityId: entityName }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-black transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Budget for This {entityType === 'album' ? 'Album' : 'Show'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
