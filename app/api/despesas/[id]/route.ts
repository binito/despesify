import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'

const handler = async (req: NextRequest, context: any) => {
  const expenseId = context.params.id

  if (req.method === 'GET') {
    try {
      const userId = (req as any).userId
      const results = await query(
        'SELECT e.*, c.name as category_name FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.id = ? AND e.user_id = ?',
        [expenseId, userId]
      ) as any[]

      if (results.length === 0) {
        return NextResponse.json(
          { message: 'Despesa não encontrada' },
          { status: 404 }
        )
      }

      // Obter anexos
      const attachments = await query(
        'SELECT * FROM invoice_attachments WHERE expense_id = ?',
        [expenseId]
      ) as any[]

      return NextResponse.json({
        expense: results[0],
        attachments: attachments
      })
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  if (req.method === 'PUT') {
    try {
      const userId = (req as any).userId
      const {
        description,
        amount,
        expense_date,
        category_id,
        vat_percentage,
        payment_method,
        notes
      } = await req.json()

      // Verificar se despesa pertence ao utilizador
      const results = await query(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
        [expenseId, userId]
      ) as any[]

      if (results.length === 0) {
        return NextResponse.json(
          { message: 'Despesa não encontrada' },
          { status: 404 }
        )
      }

      // Atualizar despesa
      await query(
        'UPDATE expenses SET description = ?, amount = ?, expense_date = ?, category_id = ?, vat_percentage = ?, payment_method = ?, notes = ? WHERE id = ?',
        [description, amount, expense_date, category_id || null, vat_percentage || null, payment_method, notes || '', expenseId]
      )

      return NextResponse.json(
        { message: 'Despesa atualizada com sucesso' },
        { status: 200 }
      )
    } catch (error: any) {
      console.error('Erro ao atualizar despesa:', error)
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      )
    }
  }

  if (req.method === 'DELETE') {
    try {
      const userId = (req as any).userId

      // Verificar se despesa pertence ao utilizador
      const results = await query(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
        [expenseId, userId]
      ) as any[]

      if (results.length === 0) {
        return NextResponse.json(
          { message: 'Despesa não encontrada' },
          { status: 404 }
        )
      }

      // Apagar despesa
      await query('DELETE FROM expenses WHERE id = ?', [expenseId])

      return NextResponse.json(
        { message: 'Despesa apagada com sucesso' },
        { status: 200 }
      )
    } catch (error: any) {
      console.error('Erro ao apagar despesa:', error)
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
}

export async function GET(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}

export async function PUT(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}

export async function DELETE(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
