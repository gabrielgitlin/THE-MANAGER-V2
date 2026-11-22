import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { BudgetSummary } from '../types';

interface BudgetChartProps {
  budgetSummary: BudgetSummary[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function BudgetChart({ budgetSummary }: BudgetChartProps) {
  const data = budgetSummary.map((item) => ({
    category: item.category,
    Budget: item.budgetAmount,
    Actual: item.actualAmount,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Bar
            dataKey="Budget"
            fill="rgba(165, 138, 103, 0.5)"
            stroke="rgb(165, 138, 103)"
            strokeWidth={1}
          />
          <Bar
            dataKey="Actual"
            fill="rgba(134, 129, 125, 0.5)"
            stroke="rgb(134, 129, 125)"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
