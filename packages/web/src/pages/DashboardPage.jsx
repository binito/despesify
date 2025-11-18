import { useEffect, useState } from 'react'
import { useExpenseStore } from '../store/expenseStore'
import { expenseAPI } from '../services/api'

export default function DashboardPage() {
  const { expenses, stats, setExpenses, setStats } = useExpenseStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [expensesRes, statsRes] = await Promise.all([
        expenseAPI.list({ limit: 10 }),
        expenseAPI.stats()
      ])
      setExpenses(expensesRes.data.expenses)
      setStats(statsRes.data)
    } catch (err) {
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Gasto</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            R$ {stats?.totalSpent?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Número de Despesas</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            {stats?.count || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Ticket Médio</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            R$ {stats?.count ? (stats.totalSpent / stats.count).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Despesas Recentes</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500">Nenhuma despesa registrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Descrição</th>
                  <th className="text-left py-2 px-4">Categoria</th>
                  <th className="text-left py-2 px-4">Valor</th>
                  <th className="text-left py-2 px-4">Data</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{expense.description}</td>
                    <td className="py-2 px-4">{expense.category}</td>
                    <td className="py-2 px-4 font-semibold">R$ {expense.amount.toFixed(2)}</td>
                    <td className="py-2 px-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
