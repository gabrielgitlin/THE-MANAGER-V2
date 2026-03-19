import React from 'react';
import { DollarSign, Calendar, TrendingUp, FileText, AlertCircle, CheckCircle, Pencil } from 'lucide-react';
import type { DealSummary } from '../../types/deals';
import { formatCurrency, formatFeeStructure, formatDealStatus } from '../../lib/dealService';

interface DealSummaryCardProps {
  dealSummary: DealSummary | null;
  onEdit: () => void;
}

export default function DealSummaryCard({ dealSummary, onEdit }: DealSummaryCardProps) {
  if (!dealSummary) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Deal Information
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">No deal information available</p>
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            Add Deal Information
          </button>
        </div>
      </div>
    );
  }

  const { deal, expected_gross, projected_payout, deposit_amount } = dealSummary;
  const statusInfo = formatDealStatus(deal.status);
  const nextPayment = dealSummary.payments.find(p => !p.paid);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Deal Information
          </h2>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
            statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
            statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusInfo.label}
          </span>
        </div>
        <button
          onClick={onEdit}
          className="text-primary hover:text-primary/80"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Fee Structure</p>
          <p className="text-sm font-medium text-gray-900">
            {formatFeeStructure(deal.fee_structure)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Guarantee</p>
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(deal.guarantee_amount || 0, deal.currency)}
          </p>
        </div>

        {deal.percentage_rate && (
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Percentage</p>
            <p className="text-sm font-medium text-gray-900">
              {deal.percentage_rate}% of {deal.percentage_base || 'net'}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Expected Gross</p>
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(expected_gross || 0, deal.currency)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Projected Payout</p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(projected_payout || 0, deal.currency)}
          </p>
        </div>

        {deposit_amount > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Deposit</p>
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(deposit_amount, deal.currency)}
            </p>
          </div>
        )}
      </div>

      {nextPayment && (
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <Calendar className="w-4 h-4 text-yellow-600" />
          <div className="flex-1">
            <p className="text-xs font-medium text-yellow-800">Next Payment Due</p>
            <p className="text-sm text-yellow-900">
              {formatCurrency(nextPayment.amount || 0, deal.currency)} - {nextPayment.due_timing?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      )}

      {dealSummary.bonuses.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-800">Bonuses Available</p>
          </div>
          <div className="space-y-1">
            {dealSummary.bonuses.map((bonus, idx) => (
              <p key={idx} className="text-xs text-green-900">
                {bonus.description || `${bonus.bonus_type} bonus`}
              </p>
            ))}
          </div>
        </div>
      )}

      {deal.contract_status !== 'signed' && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <p className="text-xs text-orange-900">
            Contract status: <span className="font-medium">{deal.contract_status}</span>
          </p>
        </div>
      )}
    </div>
  );
}
