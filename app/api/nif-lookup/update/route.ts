import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'PUT') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
    const { nif, company_name, category_id } = await req.json()

    if (!nif || !company_name) {
      return NextResponse.json(
        { message: 'NIF e nome da empresa são obrigatórios' },
        { status: 400 }
      )
    }

    if (nif.length !== 9) {
      return NextResponse.json(
        { message: 'NIF inválido' },
        { status: 400 }
      )
    }

    // Atualizar ou inserir na cache
    const existingResult = await query(
      'SELECT id FROM nif_cache WHERE nif = ?',
      [nif]
    ) as any[]

    if (existingResult.length > 0) {
      // Atualizar
      await query(
        'UPDATE nif_cache SET company_name = ?, category_id = ? WHERE nif = ?',
        [company_name, category_id || null, nif]
      )
      console.log(`NIF ${nif} atualizado na cache: ${company_name}, categoria: ${category_id}`)
    } else {
      // Inserir
      await query(
        'INSERT INTO nif_cache (nif, company_name, category_id) VALUES (?, ?, ?)',
        [nif, company_name, category_id || null]
      )
      console.log(`NIF ${nif} inserido na cache: ${company_name}, categoria: ${category_id}`)
    }

    return NextResponse.json({
      message: 'Cache atualizada com sucesso',
      nif,
      company_name,
      category_id
    })
  } catch (error: any) {
    console.error('Erro ao atualizar cache:', error)
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
