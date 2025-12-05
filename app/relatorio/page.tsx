'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Title, Grid, Col, Select, SelectItem, Button } from '@tremor/react'
import { Summary } from '../components/relatorio/Summary'
import { ExpenseChart } from '../components/relatorio/ExpenseChart'
import { CategoryTable } from '../components/relatorio/CategoryTable'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ... (interfaces remain the same)

interface Expense {
  id: number
  description: string
  amount: number | string
  expense_date: string
  category_name: string
  vat_percentage?: number | string
  vat_amount?: number | string
  nif_emitente?: string
  nif_adquirente?: string
  numero_documento?: string
  atcud?: string
  base_tributavel?: number | string
}

interface Attachment {
  file_path: string
  file_name?: string
  file_type?: string
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
  const [userName, setUserName] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token) {
      router.push('/login')
      return
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserName(user.name || '')
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }

    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());

    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);

    fetchExpenses(token, currentMonth, currentYear)
  }, [router])

  const fetchExpenses = async (token: string, month: string, year: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/despesas', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Erro ao carregar despesas');
      
      const data = await res.json()
      const allExpenses = (data.expenses || []).map((exp: Expense) => ({
        ...exp,
        amount: Number(exp.amount)
      }));

      setExpenses(allExpenses)
      filterByMonthYear(allExpenses, month, year)
    } catch (err: any) {
      console.error('Erro ao carregar despesas:', err)
      setError(err.message || 'Erro ao carregar despesas.')
    } finally {
      setLoading(false)
    }
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

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    filterByMonthYear(expenses, month, selectedYear);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    filterByMonthYear(expenses, selectedMonth, year);
  };
  
  // ... (grouping logic remains the same)
  const groupByCategory = (expenses: ExpenseWithAttachments[]) => {
    const grouped: { [key: string]: ExpenseWithAttachments[] } = {}

    expenses.forEach(expense => {
      const category = expense.category_name || 'Sem categoria'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(expense)
    })

    return grouped
  }

  const categoryGroups = groupByCategory(filteredExpenses)
  const categoryTotals = Object.entries(categoryGroups).map(([category, expenses]) => ({
    category,
    expenses,
    total: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  })).sort((a, b) => b.total - a.total)

  const generateCSV = () => {
    try {
      const headers = [
        'Data',
        'Descrição',
        'Categoria',
        'Valor IVA',
        'Base Tributável',
        'Valor Total',
        'NIF Emitente',
        'NIF Adquirente',
        'Nº Documento',
        'ATCUD'
      ]
      const rows = filteredExpenses.map(exp => [
        new Date(exp.expense_date).toLocaleDateString('pt-PT'),
        exp.description,
        exp.category_name || 'Sem categoria',
        exp.vat_amount !== undefined && exp.vat_amount !== null ? `€${Number(exp.vat_amount).toFixed(2)}` : '',
        exp.base_tributavel !== undefined && exp.base_tributavel !== null ? `€${Number(exp.base_tributavel).toFixed(2)}` : '',
        `€${Number(exp.amount).toFixed(2)}`,
        exp.nif_emitente || '',
        exp.nif_adquirente || '',
        exp.numero_documento || '',
        exp.atcud || ''
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `relatório-${selectedMonth}-${selectedYear}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Erro ao gerar CSV:', err)
      alert('Erro ao gerar CSV')
    }
  }

  const generatePDF = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margins = { top: 20, left: 15, right: 15, bottom: 15 }
      const contentWidth = pageWidth - margins.left - margins.right

      // Get user name from localStorage
      let userNameFromStorage = ''
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          userNameFromStorage = user.name || ''
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }

      // Color scheme
      const primaryColor = [52, 152, 219] // Blue
      const secondaryColor = [236, 240, 241] // Light gray
      const darkText = [44, 62, 80] // Dark gray
      const lightText = [127, 140, 141] // Medium gray

      let yPosition = margins.top

      // ===== HEADER =====
      // Logo/Title section
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(margins.left, yPosition, contentWidth, 25, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(24)
      pdf.text(`Despesas de ${userNameFromStorage}`, margins.left + 10, yPosition + 16)

      yPosition += 30

      // ===== PERIOD INFO =====
      const monthName = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(selectedMonth) - 1]
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1)
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0)
      const formattedStart = startDate.toLocaleDateString('pt-PT')
      const formattedEnd = endDate.toLocaleDateString('pt-PT')

      pdf.setTextColor(darkText[0], darkText[1], darkText[2])
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.text(`${monthName} de ${selectedYear}`, margins.left, yPosition)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(lightText[0], lightText[1], lightText[2])
      pdf.text(`${formattedStart} a ${formattedEnd}`, margins.left, yPosition + 6)

      yPosition += 15

      // ===== SUMMARY CARDS =====
      const totalAmount = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
      const totalVat = filteredExpenses.reduce((sum, exp) => {
        if (exp.vat_percentage && exp.vat_percentage !== null) {
          return sum + (Number(exp.amount) - (Number(exp.amount) / (1 + Number(exp.vat_percentage) / 100)))
        }
        return sum
      }, 0)

      // Card 1: Total
      pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
      pdf.rect(margins.left, yPosition, (contentWidth / 3) - 2, 22, 'F')
      pdf.setTextColor(lightText[0], lightText[1], lightText[2])
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text('Total Geral', margins.left + 5, yPosition + 6)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.text(`€${totalAmount.toFixed(2)}`, margins.left + 5, yPosition + 16)

      // Card 2: Despesas
      pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
      pdf.rect(margins.left + (contentWidth / 3) + 1, yPosition, (contentWidth / 3) - 2, 22, 'F')
      pdf.setTextColor(lightText[0], lightText[1], lightText[2])
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text('Nº de Despesas', margins.left + (contentWidth / 3) + 6, yPosition + 6)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.text(filteredExpenses.length.toString(), margins.left + (contentWidth / 3) + 6, yPosition + 16)

      // Card 3: IVA
      pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
      pdf.rect(margins.left + (contentWidth * 2 / 3) + 2, yPosition, (contentWidth / 3) - 2, 22, 'F')
      pdf.setTextColor(lightText[0], lightText[1], lightText[2])
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text('IVA Total', margins.left + (contentWidth * 2 / 3) + 7, yPosition + 6)
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.text(`€${totalVat.toFixed(2)}`, margins.left + (contentWidth * 2 / 3) + 7, yPosition + 16)

      yPosition += 28

      // ===== TABLE =====
      // Table headers
      const colWidths = { date: 20, description: 80, vat: 25, amount: 30 }
      const headerHeight = 8
      const rowHeight = 7

      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      pdf.rect(margins.left, yPosition, contentWidth, headerHeight, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.text('Data', margins.left + 2, yPosition + 5.5)
      pdf.text('Descrição', margins.left + colWidths.date + 2, yPosition + 5.5)
      pdf.text('IVA', margins.left + colWidths.date + colWidths.description + 2, yPosition + 5.5)
      pdf.text('Valor', margins.left + colWidths.date + colWidths.description + colWidths.vat + 2, yPosition + 5.5, { align: 'right' })

      yPosition += headerHeight + 2

      // Table rows
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.5)
      pdf.setTextColor(darkText[0], darkText[1], darkText[2])

      let alternateRow = false
      filteredExpenses.forEach((exp, index) => {
        if (yPosition > pageHeight - margins.bottom - rowHeight - 10) {
          // New page
          pdf.addPage()
          yPosition = margins.top

          // Repeat header on new page
          pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
          pdf.rect(margins.left, yPosition, contentWidth, headerHeight, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9)
          pdf.text('Data', margins.left + 2, yPosition + 5.5)
          pdf.text('Descrição', margins.left + colWidths.date + 2, yPosition + 5.5)
          pdf.text('IVA', margins.left + colWidths.date + colWidths.description + 2, yPosition + 5.5)
          pdf.text('Valor', margins.left + colWidths.date + colWidths.description + colWidths.vat + 2, yPosition + 5.5, { align: 'right' })
          yPosition += headerHeight + 2
          alternateRow = false
        }

        // Alternate row colors
        if (alternateRow) {
          pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
          pdf.rect(margins.left, yPosition - rowHeight + 0.5, contentWidth, rowHeight, 'F')
        }

        pdf.setTextColor(darkText[0], darkText[1], darkText[2])
        pdf.setFont('helvetica', 'normal')

        const date = new Date(exp.expense_date).toLocaleDateString('pt-PT')
        const description = String(exp.description).substring(0, 35)
        const vat = exp.vat_percentage !== undefined && exp.vat_percentage !== null ? `${Number(exp.vat_percentage).toFixed(0)}%` : 'Isento'
        const amount = `€${Number(exp.amount).toFixed(2)}`

        pdf.text(date, margins.left + 2, yPosition + 4.5)
        pdf.text(description, margins.left + colWidths.date + 2, yPosition + 4.5)
        pdf.text(vat, margins.left + colWidths.date + colWidths.description + 2, yPosition + 4.5)
        pdf.text(amount, margins.left + colWidths.date + colWidths.description + colWidths.vat + colWidths.amount - 2, yPosition + 4.5, { align: 'right' })

        yPosition += rowHeight
        alternateRow = !alternateRow
      })

      // ===== FOOTER =====
      yPosition = pageHeight - 15
      pdf.setTextColor(lightText[0], lightText[1], lightText[2])
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}`, pageWidth / 2, yPosition, { align: 'center' })
      pdf.text(`Página ${pdf.getNumberOfPages()} de ${pdf.getNumberOfPages()}`, pageWidth / 2, yPosition + 5, { align: 'center' })

      // Save
      pdf.save(`relatório-despesas-${selectedMonth}-${selectedYear}.pdf`)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
      alert('Erro ao gerar PDF')
    }
  }


  const monthNames = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
  
  if (loading) {
      return (
        <div className="container mx-auto px-4 py-8">
            {/* Loading Skeleton */}
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-1/2 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 h-72 bg-gray-200 rounded-lg"></div>
                    <div className="h-72 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
      )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block">
            ← Voltar ao início
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mt-2">
            Relatórios e Análises
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Mês</label>
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                {monthNames.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Ano</label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                {years.map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={generatePDF}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
              >
                📄 PDF
              </button>
              <button
                onClick={generateCSV}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
              >
                📊 CSV
              </button>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg font-medium">Nenhuma despesa registada neste período</p>
              <p className="text-gray-500 text-sm mt-2">Tente selecionar outro mês ou ano</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Summary
                  total={filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)}
                  numberOfExpenses={filteredExpenses.length}
                />
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
                <ExpenseChart data={categoryTotals} />
              </div>

              <div className="space-y-6">
                {categoryTotals.map(({ category, expenses, total }) => (
                  <CategoryTable key={category} category={category} expenses={expenses} total={total} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}