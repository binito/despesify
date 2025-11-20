import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const handler = async (req: NextRequest, context: any) => {
  if (req.method === 'GET') {
    try {
      const userId = (req as any).userId
      const expenses = await query(
        'SELECT e.*, c.name as category_name FROM expenses e LEFT JOIN categories c ON e.category_id = c.id WHERE e.user_id = ? ORDER BY e.expense_date DESC',
        [userId]
      )
      return NextResponse.json({ expenses })
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  if (req.method === 'POST') {
    try {
      const userId = (req as any).userId
      const formData = await req.formData()

      const description = formData.get('description')
      const amount = formData.get('amount')
      const date = formData.get('expense_date')
      const categoryId = formData.get('category_id')
      const vatPercentage = formData.get('vat_percentage')
      const paymentMethod = formData.get('payment_method')
      const notes = formData.get('notes')
      const files = formData.getAll('files') as File[]
      const ocrData = formData.get('ocr_data')
      const qrData = formData.get('qr_data')
      const nifEmitente = formData.get('nif_emitente')
      const nifAdquirente = formData.get('nif_adquirente')
      const numeroDocumento = formData.get('numero_documento')
      const atcud = formData.get('atcud')
      const baseTributavel = formData.get('base_tributavel')
      const valorIva = formData.get('valor_iva')

      // Create expense
      const result = await query(
        'INSERT INTO expenses (user_id, category_id, description, amount, expense_date, payment_method, notes, vat_percentage, vat_amount, nif_emitente, nif_adquirente, numero_documento, atcud, base_tributavel, qr_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, categoryId || null, description, amount, date, paymentMethod, notes, vatPercentage || null, valorIva || null, nifEmitente || null, nifAdquirente || null, numeroDocumento || null, atcud || null, baseTributavel || null, qrData || null]
      ) as any

      const expenseId = result.insertId

      // Save files if provided
      if (files && files.length > 0) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(expenseId))
        mkdirSync(uploadDir, { recursive: true })

        for (const file of files) {
          const buffer = Buffer.from(await file.arrayBuffer())
          const fileName = `${Date.now()}-${file.name}`
          const filePath = path.join(uploadDir, fileName)

          writeFileSync(filePath, buffer)

          // Save to database
          await query(
            'INSERT INTO invoice_attachments (expense_id, file_name, file_path, file_type, file_size, ocr_data) VALUES (?, ?, ?, ?, ?, ?)',
            [expenseId, fileName, `/uploads/${expenseId}/${fileName}`, file.type, file.size, ocrData]
          )
        }
      }

      // Trigger CSV export for Streamlit
      await exportToCSV(userId)

      return NextResponse.json(
        { message: 'Despesa criada com sucesso', expenseId },
        { status: 201 }
      )
    } catch (error: any) {
      console.error('Erro ao criar despesa:', error)
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
}

async function exportToCSV(userId: number) {
  try {
    const expenses = await query(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC',
      [userId]
    ) as any[]

    const csvDir = path.join(process.cwd(), 'data')
    mkdirSync(csvDir, { recursive: true })

    // Create CSV content
    const csvContent = [
      'ID,Data,Descrição,Valor,Categoria,IVA,Método Pagamento,Notas',
      ...expenses.map(e =>
        `${e.id},"${e.expense_date}","${e.description}",${e.amount},"",${e.vat_percentage || 0},"${e.payment_method}","${e.notes || ''}"`
      )
    ].join('\n')

    writeFileSync(path.join(csvDir, 'expenses.csv'), csvContent)
  } catch (error) {
    console.error('Erro ao exportar CSV:', error)
  }
}

export async function GET(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
