import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { BudgetSummary } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BudgetChartProps {
  budgetSummary: BudgetSummary[];
}

export default function BudgetChart({ budgetSummary }: BudgetChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
  };

  const data = {
    labels: budgetSummary.map(item => item.category),
    datasets: [
      {
        label: 'Budget',
        data: budgetSummary.map(item => item.budgetAmount),
        backgroundColor: 'rgba(165, 138, 103, 0.5)',
        borderColor: 'rgb(165, 138, 103)',
        borderWidth: 1,
      },
      {
        label: 'Actual',
        data: budgetSummary.map(item => item.actualAmount),
        backgroundColor: 'rgba(134, 129, 125, 0.5)',
        borderColor: 'rgb(134, 129, 125)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="h-80">
      <Bar options={options} data={data} />
    </div>
  );
}