import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if user exists
    const results = await query('SELECT * FROM users WHERE email = ?', [email]) as any[]
    if (results.length > 0) {
      return NextResponse.json(
        { message: 'Email já registado' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const createResult = await query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    ) as any

    const userId = createResult.insertId

    // Generate token
    const token = generateToken(userId, email)

    return NextResponse.json(
      {
        message: 'Utilizador registado com sucesso',
        token,
        user: { id: userId, name, email }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao registar:', error)
    return NextResponse.json(
      { message: 'Erro ao registar utilizador' },
      { status: 500 }
    )
  }
}
