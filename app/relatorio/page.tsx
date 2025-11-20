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

  // Agrupar despesas por categoria
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
  })).sort((a, b) => b.total - a.total) // Ordenar por valor total decrescente

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

    // Resumo total
    const total = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    pdf.setFontSize(14)
    pdf.setTextColor(0, 0, 255)
    pdf.text(`TOTAL GERAL: €${total.toFixed(2)}`, 20, yPosition)
    pdf.setTextColor(0, 0, 0)
    yPosition += 8
    pdf.setFontSize(11)
    pdf.text(`Número de transações: ${filteredExpenses.length}`, 20, yPosition)
    yPosition += 15

    // Agrupar por categoria
    const groups = groupByCategory(filteredExpenses)
    const totals = Object.entries(groups).map(([category, expenses]) => ({
      category,
      expenses,
      total: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    })).sort((a, b) => b.total - a.total)

    // Para cada categoria
    totals.forEach(({ category, expenses, total: categoryTotal }) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = 20
      }

      // Cabeçalho da categoria
      pdf.setFontSize(12)
      pdf.setFillColor(240, 240, 240)
      pdf.rect(20, yPosition - 5, pageWidth - 40, 10, 'F')
      pdf.setTextColor(0, 0, 0)
      pdf.text(category.toUpperCase(), 22, yPosition)
      pdf.text(`€${categoryTotal.toFixed(2)} (${expenses.length} despesa${expenses.length > 1 ? 's' : ''})`, pageWidth - 22, yPosition, { align: 'right' })
      yPosition += 12

      // Tabela de despesas da categoria
      pdf.setFontSize(9)
      const columns = ['Data', 'Descrição', 'IVA', 'Valor']

      // Cabeçalhos
      pdf.setTextColor(255, 255, 255)
      pdf.setFillColor(59, 130, 246)
      let xPos = 20
      const widths = [30, 85, 20, 30]
      columns.forEach((col, idx) => {
        pdf.rect(xPos, yPosition - 5, widths[idx], 7, 'F')
        pdf.text(col, xPos + 2, yPosition)
        xPos += widths[idx]
      })
      pdf.setTextColor(0, 0, 0)
      yPosition += 9

      // Linhas
      expenses.forEach(exp => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = 20
        }

        xPos = 20
        const cells = [
          new Date(exp.expense_date).toLocaleDateString('pt-PT'),
          exp.description.substring(0, 40),
          exp.vat_percentage ? `${Number(exp.vat_percentage)}%` : 'Isento',
          `€${Number(exp.amount).toFixed(2)}`
        ]

        cells.forEach((cell, idx) => {
          pdf.text(cell, xPos + 2, yPosition)
          xPos += widths[idx]
        })
        yPosition += 6
      })

      yPosition += 5
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
          if (yPosition > pageHeight - 80) {
            pdf.addPage()
            yPosition = 20
          }

          // Garantir que o caminho seja absoluto
          const imgPath = attachment.file_path.startsWith('/')
            ? attachment.file_path
            : `/${attachment.file_path}`

          console.log('Processando anexo para PDF:', imgPath)

          // Detectar formato da imagem pela extensão
          const ext = imgPath.toLowerCase()
          const isPDF = ext.endsWith('.pdf')

          try {
            let imageDataUrl: string | null = null

            // Verificar se a imagem já está em formato data URL (base64)
            if (imgPath.startsWith('data:')) {
              // Já é base64, usar diretamente
              console.log('Anexo em formato base64')
              imageDataUrl = imgPath
            } else if (isPDF) {
              // Converter PDF para imagem usando API do servidor
              console.log('Anexo é PDF, convertendo para imagem via API:', imgPath)

              try {
                const token = localStorage.getItem('token')
                const response = await fetch('/api/pdf-to-image', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ pdfPath: imgPath })
                })

                if (!response.ok) {
                  throw new Error(`Falha na conversão: ${response.status}`)
                }

                const data = await response.json()
                imageDataUrl = data.dataUrl
                console.log('PDF convertido para imagem com sucesso via API')
              } catch (pdfError) {
                console.error('Erro ao converter PDF:', pdfError)
                // Fallback: mostrar mensagem
                pdf.setFontSize(9)
                pdf.setTextColor(255, 0, 0)
                const fileName = attachment.file_name || imgPath.split('/').pop() || 'documento.pdf'
                pdf.text(`[Erro ao converter PDF: ${fileName}]`, 22, yPosition)
                pdf.setTextColor(0, 0, 0)
                yPosition += 8
                continue
              }
            } else {
              // Carregar imagem normal do servidor
              const imgUrl = `${window.location.origin}${imgPath}`
              console.log('Carregando imagem de:', imgUrl)

              // Tentar carregar a imagem
              const img = new Image()
              img.crossOrigin = 'anonymous'

              imageDataUrl = await new Promise<string>((resolve, reject) => {
                img.onload = () => {
                  try {
                    console.log('Imagem carregada com sucesso:', imgUrl)
                    // Converter para canvas e depois para data URL
                    const canvas = document.createElement('canvas')

                    // Calcular dimensões mantendo aspect ratio
                    const maxWidth = 1200
                    const maxHeight = 800
                    let width = img.width
                    let height = img.height

                    if (width > maxWidth) {
                      height = (height * maxWidth) / width
                      width = maxWidth
                    }
                    if (height > maxHeight) {
                      width = (width * maxHeight) / height
                      height = maxHeight
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    if (!ctx) {
                      reject(new Error('Falha ao obter contexto do canvas'))
                      return
                    }

                    ctx.drawImage(img, 0, 0, width, height)
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

                    console.log('Imagem processada com sucesso')
                    resolve(dataUrl)
                  } catch (err) {
                    console.error('Erro ao processar imagem:', err)
                    reject(err)
                  }
                }
                img.onerror = (err) => {
                  console.error('Erro ao carregar imagem:', imgUrl, err)
                  reject(new Error('Falha ao carregar imagem'))
                }
                img.src = imgUrl
              })
            }

            // Adicionar imagem ao PDF
            if (imageDataUrl) {
              pdf.addImage(imageDataUrl, 'JPEG', 20, yPosition, 170, 60)
              console.log('Imagem adicionada ao PDF com sucesso')
            }

            yPosition += 70
          } catch (err) {
            console.error('Erro ao adicionar anexo ao PDF:', err, attachment)
            // Adicionar texto indicando que houve erro
            pdf.setFontSize(8)
            pdf.setTextColor(255, 0, 0)
            pdf.text(`[Anexo não disponível: ${attachment.file_path}]`, 20, yPosition)
            pdf.setTextColor(0, 0, 0)
            yPosition += 10
          }
        }

        yPosition += 5
      }
    }

    pdf.save(`relatorio_despesas_${selectedMonth}_${selectedYear}.pdf`)
  }

  const generateCSV = () => {
    const headers = ['Categoria', 'Data', 'Descrição', 'IVA %', 'Valor']

    // Agrupar por categoria
    const groups = groupByCategory(filteredExpenses)
    const totals = Object.entries(groups).map(([category, expenses]) => ({
      category,
      expenses,
      total: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    })).sort((a, b) => b.total - a.total)

    // Construir CSV com agrupamento
    const csvLines: string[] = [headers.join(',')]

    totals.forEach(({ category, expenses, total: categoryTotal }) => {
      // Linha de cabeçalho da categoria
      csvLines.push(`"${category}","","","","€${categoryTotal.toFixed(2)}"`)

      // Linhas de despesas
      expenses.forEach(exp => {
        csvLines.push([
          `"${category}"`,
          `"${new Date(exp.expense_date).toLocaleDateString('pt-PT')}"`,
          `"${exp.description}"`,
          `"${exp.vat_percentage ? Number(exp.vat_percentage) + '%' : 'Isento'}"`,
          `"€${Number(exp.amount).toFixed(2)}"`
        ].join(','))
      })

      // Linha em branco após cada categoria
      csvLines.push('')
    })

    // Linha de total geral
    const totalGeral = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    csvLines.push(`"TOTAL GERAL","","","","€${totalGeral.toFixed(2)}"`)

    const csv = csvLines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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

          {/* Resumo por categoria */}
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              Nenhuma despesa registada neste período
            </div>
          ) : (
            <>
              {/* Card de resumo total */}
              <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">Total Geral</p>
                    <p className="text-3xl font-bold">
                      €{filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Nº de Despesas</p>
                    <p className="text-2xl font-bold">{filteredExpenses.length}</p>
                  </div>
                </div>
              </div>

              {/* Tabelas agrupadas por categoria */}
              <div className="space-y-6">
                {categoryTotals.map(({ category, expenses, total }) => (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Cabeçalho da categoria */}
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{expenses.length} despesa(s)</p>
                          <p className="text-xl font-bold text-blue-600">€{total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de despesas da categoria */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">IVA</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense) => (
                            <tr key={expense.id} className="border-b hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm">
                                {new Date(expense.expense_date).toLocaleDateString('pt-PT')}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium">{expense.description}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {expense.vat_percentage ? `${Number(expense.vat_percentage)}%` : 'Isento'}
                              </td>
                              <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                                €{Number(expense.amount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
