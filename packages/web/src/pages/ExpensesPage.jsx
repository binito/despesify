import { useEffect, useState } from 'react'
import { useExpenseStore } from '../store/expenseStore'
import { expenseAPI } from '../services/api'

const CATEGORIES = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Entretenimento', 'Moradia', 'Utilidades', 'Outro']
const PAYMENT_METHODS = ['Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Outro']

export default function ExpensesPage() {
  const { expenses, setExpenses, addExpense, updateExpense, removeExpense } = useExpenseStore()
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Outro',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Outro',
    notes: '',
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const res = await expenseAPI.list({ limit: 100 })
      setExpenses(res.data.expenses)
    } catch (err) {
      console.error('Erro ao carregar despesas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingId) {
        const res = await expenseAPI.update(editingId, {
          ...formData,
          amount: parseFloat(formData.amount)
        })
        updateExpense(editingId, res.data.expense)
        setEditingId(null)
      } else {
        const res = await expenseAPI.create({
          ...formData,
          amount: parseFloat(formData.amount)
        })
        addExpense(res.data.expense)
      }

      setFormData({
        description: '',
        amount: '',
        category: 'Outro',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Outro',
        notes: '',
      })
      setShowForm(false)
    } catch (err) {
      console.error('Erro ao salvar despesa:', err)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar esta despesa?')) {
      try {
        await expenseAPI.delete(id)
        removeExpense(id)
      } catch (err) {
        console.error('Erro ao deletar despesa:', err)
      }
    }
  }

  const handleEdit = (expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
    })
    setEditingId(expense._id)
    setShowForm(true)
  }

  if (loading) return <div className="p-8">Carregando...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Despesas</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              description: '',
              amount: '',
              category: 'Outro',
              date: new Date().toISOString().split('T')[0],
              paymentMethod: 'Outro',
              notes: '',
            })
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          {showForm ? 'Cancelar' : '+ Nova Despesa'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primary-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Método de Pagamento</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primary-500"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notas</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700"
          >
            {editingId ? 'Atualizar' : 'Adicionar'} Despesa
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma despesa registrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4">Descrição</th>
                  <th className="text-left py-3 px-4">Categoria</th>
                  <th className="text-left py-3 px-4">Valor</th>
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-left py-3 px-4">Método</th>
                  <th className="text-left py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{expense.description}</td>
                    <td className="py-3 px-4">{expense.category}</td>
                    <td className="py-3 px-4 font-semibold">R$ {expense.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4">{expense.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Deletar
                      </button>
                    </td>
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
