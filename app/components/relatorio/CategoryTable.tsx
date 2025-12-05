'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Card,
  Title,
  Text
} from '@tremor/react';

interface Expense {
  id: number;
  description: string;
  amount: number | string;
  expense_date: string;
  vat_percentage?: number | string;
}

interface CategoryTableProps {
  category: string;
  expenses: Expense[];
  total: number;
}

export function CategoryTable({ category, expenses, total }: CategoryTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b-2 border-gray-100">
        <div>
          <h3 className="text-2xl font-black text-gray-800">{category}</h3>
          <p className="text-sm text-gray-600 mt-1">{expenses.length} despesa(s)</p>
        </div>
        <div className="mt-3 sm:mt-0 bg-gradient-to-br from-emerald-500 to-green-600 px-5 py-3 rounded-xl shadow-md">
          <p className="text-emerald-100 text-xs font-medium">Total</p>
          <p className="text-white text-2xl font-black">€{total.toFixed(2)}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Data</TableHeaderCell>
              <TableHeaderCell>Descrição</TableHeaderCell>
              <TableHeaderCell>IVA</TableHeaderCell>
              <TableHeaderCell className="text-right">Valor</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.expense_date).toLocaleDateString('pt-PT')}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  {expense.vat_percentage !== undefined && expense.vat_percentage !== null
                    ? `${Number(expense.vat_percentage)}%`
                    : 'Isento'}
                </TableCell>
                <TableCell className="text-right">€{Number(expense.amount).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
