import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function withAuth(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context: any) => {
    try {
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

      // Add user to request for use in handler
      ;(req as any).userId = decoded.userId
      ;(req as any).userEmail = decoded.email

      return handler(req, context)
    } catch (error) {
      return NextResponse.json(
        { message: 'Erro ao verificar autenticação' },
        { status: 500 }
      )
    }
  }
}
