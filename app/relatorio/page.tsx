'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Expense {
  id: number
  description: string
  amount: number | string
  expense_date: string
  category_name: string
  vat_percentage?: number | string
}

interface Attachment {
  file_path: string
}

interface ExpenseWithAttachments extends Expense {
  attachments: Attachment[]
}

export default function Relatorio() {
  const [expenses, setExpenses] = useState<ExpenseWithAttachments[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseWithAttachments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchExpenses(token)
    initializeMonthYear()
  }, [])

  const initializeMonthYear = () => {
    const now = new Date()
    setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'))
    setSelectedYear(String(now.getFullYear()))
  }

  const fetchExpenses = async (token: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/despesas', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        let message = `Erro na API de despesas: ${res.status}`
        try {
          const dataErr = await res.json()
          if (dataErr?.message) message += ` - ${dataErr.message}`
        } catch {
          const text = await res.text()
          if (text) message += ` - ${text}`
        }
        setError(message)
        return
      }

      const data = await res.json()

      // Fetch attachments for each expense
      const expensesWithAttachments = await Promise.all(
        (data.expenses || []).map(async (expense: Expense) => {
          try {
            const attachRes = await fetch(`/api/despesas/${expense.id}/attachments`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!attachRes.ok) {
              console.warn(`Falha ao obter anexos para despesa ${expense.id}: ${attachRes.status}`)
              return { ...expense, amount: Number(expense.amount), attachments: [] }
            }

            const attachData = await attachRes.json()
            return {
              ...expense,
              amount: Number(expense.amount),
              attachments: attachData.attachments || []
            }
          } catch (err) {
            console.error('Erro ao carregar anexos:', err)
            return {
              ...expense,
              amount: Number(expense.amount),
              attachments: []
            }
          }
        })
      )

      setExpenses(expensesWithAttachments)
      filterByMonthYear(expensesWithAttachments, String(new Date().getMonth() + 1).padStart(2, '0'), String(new Date().getFullYear()))
    } catch (err) {
      console.error('Erro ao carregar despesas:', err)
      setError('Erro ao carregar despesas. Veja o console do navegador para mais detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchExpenses(token)
  }

  const filterByMonthYear = (allExpenses: ExpenseWithAttachments[], month: string, year: string) => {
    const filtered = allExpenses.filter(exp => {
      const date = new Date(exp.expense_date)
      const expMonth = String(date.getMonth() + 1).padStart(2, '0')
      const expYear = String(date.getFullYear())
      return expMonth === month && expYear === year
    })
    setFilteredExpenses(filtered)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value
    setSelectedMonth(month)
    filterByMonthYear(expenses, month, selectedYear)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value
    setSelectedYear(year)
    filterByMonthYear(expenses, selectedMonth, year)
  }

  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 20

    const monthName = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1).toLocaleDateString('pt-PT', {
      month: 'long',
      year: 'numeric'
    })

    // Cabeçalho
    pdf.setFontSize(18)
    pdf.text('Relatório de Despesas', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(12)
    pdf.text(`Período: ${monthName}`, 20, yPosition)
    yPosition += 15

    // Resumo
    const total = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    pdf.setFontSize(11)
    pdf.text(`Total de despesas: €${total.toFixed(2)}`, 20, yPosition)
    yPosition += 10
    pdf.text(`Número de transações: ${filteredExpenses.length}`, 20, yPosition)
    yPosition += 15

    // Tabela de despesas
    pdf.setFontSize(10)
    const columns = ['Data', 'Descrição', 'Categoria', 'Valor']
    const rows = filteredExpenses.map(exp => [
      new Date(exp.expense_date).toLocaleDateString('pt-PT'),
      exp.description.substring(0, 20),
      exp.category_name || 'N/A',
      `€${Number(exp.amount).toFixed(2)}`
    ])

    pdf.setTextColor(255, 255, 255)
    pdf.setFillColor(59, 130, 246)

    // Cabeçalhos da tabela
    let xPos = 20
    columns.forEach((col, idx) => {
      const width = idx === 1 ? 80 : 35
      pdf.rect(xPos, yPosition - 5, width, 8, 'F')
      pdf.text(col, xPos + 2, yPosition)
      xPos += width
    })

    pdf.setTextColor(0, 0, 0)
    yPosition += 12

    // Linhas da tabela
    rows.forEach(row => {
      if (yPosition > pageHeight - 50) {
        pdf.addPage()
        yPosition = 20
      }

      xPos = 20
      let colIdx = 0
      row.forEach(cell => {
        const width = colIdx === 1 ? 80 : 35
        pdf.text(cell, xPos + 2, yPosition)
        xPos += width
        colIdx++
      })
      yPosition += 8
    })

    // Miniaturas de faturas
    if (filteredExpenses.some(exp => exp.attachments.length > 0)) {
      pdf.addPage()
      yPosition = 20
      pdf.setFontSize(14)
      pdf.text('Anexos - Miniaturas de Faturas', 20, yPosition)
      yPosition += 15

      for (const expense of filteredExpenses) {
        if (expense.attachments.length === 0) continue

        if (yPosition > pageHeight - 60) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(10)
        pdf.text(`${expense.description} - €${Number(expense.amount).toFixed(2)}`, 20, yPosition)
        yPosition += 10

        for (const attachment of expense.attachments) {
          if (yPosition > pageHeight - 60) {
            pdf.addPage()
            yPosition = 20
          }

          try {
            const img = attachment.file_path
            pdf.addImage(img, 'JPEG', 20, yPosition, 170, 60)
            yPosition += 70
          } catch (err) {
            console.error('Erro ao adicionar imagem:', err)
          }
        }

        yPosition += 5
      }
    }

    pdf.save(`relatorio_despesas_${selectedMonth}_${selectedYear}.pdf`)
  }

  const generateCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'IVA %']
    const rows = filteredExpenses.map(exp => [
      new Date(exp.expense_date).toLocaleDateString('pt-PT'),
      exp.description,
      exp.category_name || 'N/A',
      Number(exp.amount).toFixed(2),
      Number(exp.vat_percentage || 0)
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_despesas_${selectedMonth}_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const monthNames = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Relatórios</h1>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Mês
              </label>
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {monthNames.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={generatePDF}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                📄 Gerar PDF
              </button>
              <button
                onClick={generateCSV}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                📊 Gerar CSV
              </button>
            </div>
          </div>

          {/* Tabela de despesas */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Descrição</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Categoria</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">IVA</th>
                  <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-600">
                      Nenhuma despesa registada neste período
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(expense.expense_date).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{expense.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expense.category_name || 'Sem categoria'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {expense.vat_percentage ? `${Number(expense.vat_percentage)}%` : 'Isento'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                        €{Number(expense.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-900">
                    Total:
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-lg text-green-600">
                    €{filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
