'use client';

import { Card, Metric, Text } from '@tremor/react';

interface SummaryProps {
  total: number;
  numberOfExpenses: number;
}

export function Summary({ total, numberOfExpenses }: SummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">💰</span>
          <p className="text-blue-100 text-sm font-medium">Total Geral</p>
        </div>
        <p className="text-4xl font-black">€{total.toFixed(2)}</p>
      </div>
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📊</span>
          <p className="text-purple-100 text-sm font-medium">Nº de Despesas</p>
        </div>
        <p className="text-4xl font-black">{numberOfExpenses}</p>
      </div>
    </div>
  );
}
