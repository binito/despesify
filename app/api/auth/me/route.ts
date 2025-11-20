import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    // Get token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token não fornecido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      )
    }

    // Get user from database
    const results = await query('SELECT id, name, email, created_at FROM users WHERE id = ?', [decoded.userId]) as any[]

    if (results.length === 0) {
      return NextResponse.json(
        { message: 'Utilizador não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { user: results[0] },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro ao verificar utilizador:', error)
    return NextResponse.json(
      { message: 'Erro ao verificar utilizador' },
      { status: 500 }
    )
  }
}
