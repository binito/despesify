import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
    const userId = (req as any).userId
    const { name, email } = await req.json()

    if (!name || !email) {
      return NextResponse.json(
        { message: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se email já existe (exceto o do utilizador atual)
    const results = await query(
      'SELECT * FROM users WHERE email = ? AND id != ?',
      [email, userId]
    ) as any[]

    if (results.length > 0) {
      return NextResponse.json(
        { message: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Atualizar utilizador
    await query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, userId]
    )

    // Retornar utilizador atualizado
    const updatedUser = await query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId]
    ) as any[]

    return NextResponse.json(
      {
        message: 'Perfil atualizado com sucesso',
        user: updatedUser[0]
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
