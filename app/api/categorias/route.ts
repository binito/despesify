import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'

const handler = async (req: NextRequest, context: any) => {
  const userId = (req as any).userId

  if (req.method === 'GET') {
    try {
      const categories = await query(
        'SELECT * FROM categories WHERE user_id = ? ORDER BY name',
        [userId]
      )
      return NextResponse.json({ categories })
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, color } = await req.json()

      if (!name) {
        return NextResponse.json(
          { message: 'Nome é obrigatório' },
          { status: 400 }
        )
      }

      const result = await query(
        'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)',
        [userId, name, color || '#3B82F6']
      )

      return NextResponse.json(
        { message: 'Categoria criada', category: { id: (result as any).insertId, name, color } },
        { status: 201 }
      )
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
}

export async function GET(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
