import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/auth'

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
    const userId = (req as any).userId
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      )
    }

    // Obter utilizador
    const results = await query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    ) as any[]

    if (results.length === 0) {
      return NextResponse.json(
        { message: 'Utilizador não encontrado' },
        { status: 404 }
      )
    }

    const user = results[0]

    // Verificar senha atual
    const isValidPassword = await verifyPassword(currentPassword, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Senha atual incorreta' },
        { status: 401 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword)

    // Atualizar senha
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    )

    return NextResponse.json(
      { message: 'Senha alterada com sucesso' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json(
      { message: 'Erro ao alterar senha' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
