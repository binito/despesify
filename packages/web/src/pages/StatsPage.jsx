import { useEffect, useState } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { expenseAPI } from '../services/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await expenseAPI.stats()
      setStats(res.data)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>

  if (!stats || !stats.byCategory || Object.keys(stats.byCategory).length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Estatísticas</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Nenhuma despesa registrada ainda
        </div>
      </div>
    )
  }

  const categoryLabels = Object.keys(stats.byCategory)
  const categoryData = Object.values(stats.byCategory)

  const categoryChartData = {
    labels: categoryLabels,
    datasets: [{
      label: 'Gasto por Categoria (R$)',
      data: categoryData,
      backgroundColor: [
        '#3b82f6',
        '#ef4444',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ec4899',
        '#14b8a6',
        '#f97316',
      ],
    }],
  }

  const categoryChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Distribuição por Categoria',
      },
    },
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Estatísticas</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Gasto</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            R$ {stats.totalSpent.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Número de Despesas</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            {stats.count}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Ticket Médio</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            R$ {stats.count ? (stats.totalSpent / stats.count).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <Pie data={categoryChartData} options={categoryChartOptions} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Resumo por Categoria</h2>
          <div className="space-y-3">
            {categoryLabels.map((category, idx) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-700">{category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{
                    backgroundColor: categoryChartData.datasets[0].backgroundColor[idx]
                  }}></div>
                  <span className="font-semibold">R$ {categoryData[idx].toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
