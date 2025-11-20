'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Expense {
  id: number
  description: string
  amount: number
  expense_date: string
  category_name: string
  payment_method: string
  vat_percentage?: number
  created_at: string
}

export default function Despesas() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchExpenses(token)
  }, [])

  const fetchExpenses = async (token: string) => {
    try {
      setLoading(true)
      const res = await fetch('/api/despesas', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        setError('Erro ao carregar despesas')
        return
      }

      const data = await res.json()
      setExpenses(data.expenses || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar despesas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (expenseId: number) => {
    if (!confirm('Tem certeza que quer apagar esta despesa?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/despesas/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        setError('Erro ao apagar despesa')
        return
      }

      setExpenses(expenses.filter(e => e.id !== expenseId))
    } catch (err: any) {
      setError(err.message || 'Erro ao apagar despesa')
    }
  }

  const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(String(e.amount)), 0)
  const thisMonth = expenses.filter(e => {
    const date = new Date(e.expense_date)
    const today = new Date()
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  })
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + parseFloat(String(e.amount)), 0)

  const filteredExpenses = filter === 'month'
    ? thisMonth
    : expenses

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Despesas</h1>
        <Link
          href="/despesas/nova"
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
        >
          + Nova Despesa
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total de Despesas</p>
          <p className="text-3xl font-bold text-gray-900">€{totalAmount.toFixed(2)}</p>
          <p className="text-gray-500 text-xs mt-1">{expenses.length} transações</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Este Mês</p>
          <p className="text-3xl font-bold text-green-600">€{thisMonthTotal.toFixed(2)}</p>
          <p className="text-gray-500 text-xs mt-1">{thisMonth.length} transações</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Média por Transação</p>
          <p className="text-3xl font-bold text-blue-600">
            €{(expenses.length > 0 ? totalAmount / expenses.length : 0).toFixed(2)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded mr-2 ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-4 py-2 rounded ${
            filter === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Este Mês
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Carregando despesas...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">Nenhuma despesa registada</p>
          <Link
            href="/despesas/nova"
            className="text-blue-500 hover:text-blue-600 font-bold"
          >
            Criar primeira despesa
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Data</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Descrição</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Categoria</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Método</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Valor</th>
                <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(expense.expense_date).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{expense.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {expense.category_name || 'Sem categoria'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{expense.payment_method}</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                    €{parseFloat(String(expense.amount)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/despesas/editar/${expense.id}`}
                      className="text-blue-500 hover:text-blue-600 mr-3 font-bold"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-500 hover:text-red-600 font-bold"
                    >
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          ← Voltar ao início
        </Link>
      </div>
    </div>
  )
}
