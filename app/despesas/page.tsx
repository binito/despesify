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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 sm:py-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block">
              ← Voltar ao início
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Minhas Despesas
            </h1>
          </div>
          <Link
            href="/despesas/nova"
            className="w-full sm:w-auto text-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            ✨ Nova Despesa
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <p className="text-blue-100 text-sm font-medium mb-2">Total de Despesas</p>
            <p className="text-3xl sm:text-4xl font-black mb-1">€{totalAmount.toFixed(2)}</p>
            <p className="text-blue-100 text-xs">{expenses.length} transações</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <p className="text-emerald-100 text-sm font-medium mb-2">Este Mês</p>
            <p className="text-3xl sm:text-4xl font-black mb-1">€{thisMonthTotal.toFixed(2)}</p>
            <p className="text-emerald-100 text-xs">{thisMonth.length} transações</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white sm:col-span-2 lg:col-span-1">
            <p className="text-purple-100 text-sm font-medium mb-2">Média por Transação</p>
            <p className="text-3xl sm:text-4xl font-black">
              €{(expenses.length > 0 ? totalAmount / expenses.length : 0).toFixed(2)}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-md">
            <p className="font-bold">Erro</p>
            <p>{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
            }`}
          >
            📋 Todas
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              filter === 'month'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
            }`}
          >
            📅 Este Mês
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Carregando despesas...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 mb-6 text-lg">Nenhuma despesa registada</p>
            <Link
              href="/despesas/nova"
              className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Criar primeira despesa
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Mobile: Card View */}
            <div className="block sm:hidden divide-y divide-gray-100">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">{expense.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(expense.expense_date).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <p className="text-xl font-black text-green-600 ml-3">
                      €{parseFloat(String(expense.amount)).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                      {expense.category_name || 'Sem categoria'}
                    </span>
                    <span className="text-gray-600 font-medium">{expense.payment_method}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/despesas/editar/${expense.id}`}
                      className="flex-1 text-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      ✏️ Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      🗑️ Apagar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-black text-gray-800 uppercase tracking-wide">Data</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-black text-gray-800 uppercase tracking-wide">Descrição</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-black text-gray-800 uppercase tracking-wide">Categoria</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs lg:text-sm font-black text-gray-800 uppercase tracking-wide">Método</th>
                    <th className="px-4 lg:px-6 py-4 text-right text-xs lg:text-sm font-black text-gray-800 uppercase tracking-wide">Valor</th>
                    <th className="px-4 lg:px-6 py-4 text-center text-xs lg:text-sm font-black text-gray-800 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200">
                      <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm whitespace-nowrap text-gray-600 font-medium">
                        {new Date(expense.expense_date).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm font-bold text-gray-900">{expense.description}</td>
                      <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                          {expense.category_name || 'Sem categoria'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm text-gray-600 font-medium">{expense.payment_method}</td>
                      <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm text-right font-black text-green-600 whitespace-nowrap">
                        €{parseFloat(String(expense.amount)).toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-center whitespace-nowrap">
                        <Link
                          href={`/despesas/editar/${expense.id}`}
                          className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg mr-2 font-bold text-xs transition-all"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="inline-block bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all"
                        >
                          Apagar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
