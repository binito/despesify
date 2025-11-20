import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Find user
    const results = await query('SELECT * FROM users WHERE email = ?', [email]) as any[]

    if (results.length === 0) {
      return NextResponse.json(
        { message: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    const user = results[0]

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken(user.id, user.email)

    return NextResponse.json(
      {
        message: 'Login realizado com sucesso',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json(
      { message: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
