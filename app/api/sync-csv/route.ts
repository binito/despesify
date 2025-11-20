import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
    const userId = (req as any).userId

    // Get all expenses for this user
    const expenses = await query(
      `SELECT e.*, c.name as category_name FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ?
       ORDER BY e.expense_date DESC`,
      [userId]
    ) as any[]

    // Create CSV content
    const csvHeader = 'ID,Data,Descrição,Valor,Categoria,IVA%,Método Pagamento,Notas'
    const csvRows = expenses.map(e =>
      `${e.id},"${e.expense_date}","${e.description}",${e.amount},"${e.category_name || ''}",${e.vat_percentage || 0},"${e.payment_method}","${(e.notes || '').replace(/"/g, '""')}"`
    )

    const csvContent = [csvHeader, ...csvRows].join('\n')

    // Save to data directory
    const csvDir = path.join(process.cwd(), 'data')
    mkdirSync(csvDir, { recursive: true })

    const csvPath = path.join(csvDir, `expenses_${userId}.csv`)
    writeFileSync(csvPath, csvContent)

    // Also save a combined file for Streamlit
    const allUsersPath = path.join(csvDir, 'expenses.csv')

    // Get all users' expenses
    const allExpenses = await query(
      `SELECT e.*, c.name as category_name, u.name as user_name FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN users u ON e.user_id = u.id
       ORDER BY e.expense_date DESC`
    ) as any[]

    const allCsvHeader = 'ID,Utilizador,Data,Descrição,Valor,Categoria,IVA%,Método Pagamento,Notas'
    const allCsvRows = allExpenses.map(e =>
      `${e.id},"${e.user_name}","${e.expense_date}","${e.description}",${e.amount},"${e.category_name || ''}",${e.vat_percentage || 0},"${e.payment_method}","${(e.notes || '').replace(/"/g, '""')}"`
    )

    const allCsvContent = [allCsvHeader, ...allCsvRows].join('\n')
    writeFileSync(allUsersPath, allCsvContent)

    return NextResponse.json(
      {
        message: 'CSV sincronizado com sucesso',
        csv_path: `/data/expenses_${userId}.csv`,
        total_expenses: expenses.length
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro ao sincronizar CSV:', error)
    return NextResponse.json(
      { message: 'Erro ao sincronizar CSV' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
