import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'GET') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
    const expenseId = context.params.id

    // Obter anexos
    const attachments = await query(
      'SELECT * FROM invoice_attachments WHERE expense_id = ?',
      [expenseId]
    ) as any[]

    return NextResponse.json({ attachments })
  } catch (error: any) {
    console.error('Erro ao obter anexos:', error)
    return NextResponse.json(
      { message: 'Erro ao obter anexos' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
