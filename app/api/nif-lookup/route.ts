import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { query } from '@/lib/db'

// Helper function to clean company names
function cleanCompanyName(name: string): string {
  if (!name) return name
  // Remove prefixes comuns que vêm da meta description
  let cleaned = name.trim()
  cleaned = cleaned.replace(/^(da|do|de|dos|das)\s+/i, '')
  return cleaned.trim()
}

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
    const { nif } = await req.json()

    if (!nif || nif.length !== 9) {
      return NextResponse.json(
        { message: 'NIF inválido' },
        { status: 400 }
      )
    }

    // Procurar na cache primeiro
    const cachedResult = await query(
      'SELECT company_name, category_id FROM nif_cache WHERE nif = ?',
      [nif]
    ) as any[]

    if (cachedResult.length > 0) {
      const cleanedName = cleanCompanyName(cachedResult[0].company_name)
      console.log(`NIF ${nif} encontrado na cache:`, cleanedName)
      return NextResponse.json({
        nif,
        company_name: cleanedName,
        category_id: cachedResult[0].category_id,
        source: 'cache'
      })
    }

    // Se não encontrar na cache, fazer scraping
    console.log(`NIF ${nif} não encontrado na cache. A fazer scraping...`)

    // Tentar primeiro contribuinte.pt (mais fiável)
    let companyName = await scrapNifFromContribuintePt(nif)
    let source = 'contribuinte.pt'

    // Se falhar, tentar nif.pt como fallback
    if (!companyName) {
      console.log(`Falha em contribuinte.pt, a tentar nif.pt...`)
      companyName = await scrapNifFromNifPt(nif)
      source = 'nif.pt'
    }

    if (companyName) {
      // Guardar na cache (sem categoria na primeira vez)
      try {
        await query(
          'INSERT INTO nif_cache (nif, company_name, category_id) VALUES (?, ?, NULL)',
          [nif, companyName]
        )
        console.log(`NIF ${nif} guardado na cache (fonte: ${source}):`, companyName)
      } catch (err) {
        console.warn('Erro ao guardar na cache:', err)
      }

      return NextResponse.json({
        nif,
        company_name: companyName,
        category_id: null,
        source: 'scraped'
      })
    } else {
      return NextResponse.json(
        { message: 'NIF não encontrado' },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao consultar NIF:', error)
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }
}

async function scrapNifFromContribuintePt(nif: string): Promise<string | null> {
  try {
    const response = await fetch(`https://contribuinte.pt/nif/${nif}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.log(`Erro ao aceder contribuinte.pt: ${response.status}`)
      return null
    }

    const html = await response.text()

    // Procurar pelo nome da empresa no HTML
    // O site tem geralmente o formato: <title>NIF XXXXXXXXX - Nome da Empresa</title>
    const titleMatch = html.match(/<title>NIF\s*\d{9}\s*-\s*([^<]+)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      const name = cleanCompanyName(titleMatch[1])
      if (name.length > 3 && /[A-Za-z]/.test(name)) {
        console.log(`Nome extraído para NIF ${nif} de contribuinte.pt:`, name)
        return name
      }
    }

    // Fallback: procurar em meta description
    const metaMatch = html.match(/<meta\s+name="description"\s+content="[^"]*(?:NIF|nif)\s+(?:de\s+|do\s+)?([^"\.]+)/i)
    if (metaMatch && metaMatch[1]) {
      const name = cleanCompanyName(metaMatch[1])
      if (name.length > 3 && /[A-Za-z]/.test(name)) {
        console.log(`Nome extraído para NIF ${nif} de contribuinte.pt (meta):`, name)
        return name
      }
    }

    console.log(`Não foi possível extrair nome de contribuinte.pt para NIF ${nif}`)
    return null
  } catch (error: any) {
    console.error(`Erro ao fazer scraping de contribuinte.pt para NIF ${nif}:`, error.message)
    return null
  }
}

async function scrapNifFromNifPt(nif: string): Promise<string | null> {
  try {
    // Usar a API de scraping do nif.pt através de fetch
    const response = await fetch(`https://www.nif.pt/?q=${nif}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.log(`Erro ao aceder nif.pt: ${response.status}`)
      return null
    }

    const html = await response.text()

    // Remover scripts e tags HTML para limpeza
    const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

    // Estratégia 1: Procurar o padrão com o NIF específico
    // Procura "NIF: 506334562" e extrai tudo para trás até encontrar uma tag de abertura
    // Exemplo: <p>Município de Pombal<br>NIF: 506334562
    const nifSpecificPattern = new RegExp(`<p>([^<]*)<br>\\s*NIF:\\s*${nif}`, 'i')
    const specificMatch = cleanHtml.match(nifSpecificPattern)
    if (specificMatch && specificMatch[1]) {
      let name = specificMatch[1].trim()
      if (name.length > 3 && !name.includes('<') && /[A-Za-z]/.test(name)) {
        console.log(`Nome extraído para NIF ${nif} (específico):`, name)
        return name
      }
    }

    // Estratégia 1b: Procurar padrão alternativo onde pode haver espaços
    const pTagMatch = cleanHtml.match(/<p>([^<]*)<br>\s*NIF:\s*\d{9}/i)
    if (pTagMatch && pTagMatch[1]) {
      let name = pTagMatch[1].trim()
      if (name.length > 3 && !name.includes('<') && /[A-Za-z]/.test(name)) {
        console.log(`Nome extraído para NIF ${nif} (via p tag):`, name)
        return name
      }
    }

    // Estratégia 2: Procurar padrão exato de nome da empresa + NIF
    // Procurar: NomeEmpresa<br>NIF: XXXXXXXXX
    const companyNifMatch = cleanHtml.match(/([A-Z][^<\n]*(?:Lda|SA|Unipessoal|Limitada|Sociedade|Portugal|Comunicações)[^<\n]*)<br>\s*NIF:\s*\d{9}/i)
    if (companyNifMatch && companyNifMatch[1]) {
      let name = companyNifMatch[1].trim()
      if (name.length > 3 && !name.includes('<') && /[A-Za-z]/.test(name)) {
        console.log(`Nome extraído para NIF ${nif} (via br):`, name)
        return name
      }
    }

    // Estratégia 3: Procurar em divs ou spans que contenham o nome
    const divMatch = cleanHtml.match(/<(?:div|span|h[1-6])[^>]*>\s*([A-Z][^<]{3,}?(?:Lda|SA|Unipessoal|Limitada|Sociedade|Portugal)[^<]*)\s*<\/(?:div|span|h[1-6])>/i)
    if (divMatch && divMatch[1]) {
      const name = divMatch[1].trim()
      if (name.length > 3 && /[A-Za-z]/.test(name)) {
        console.log(`Nome extraído para NIF ${nif} (via div):`, name)
        return name
      }
    }

    // Estratégia 4: Procurar qualquer sequência com características de nome de empresa
    // Procurar linhas que contenham ao mesmo tempo: maiúscula inicial + características de empresa
    const lines = cleanHtml.split(/[\n<]/)
    for (const line of lines) {
      const cleaned = line.replace(/<[^>]*>/g, '').trim()
      if (cleaned.length > 5 &&
          cleaned.length < 150 &&
          /^[A-Z]/.test(cleaned) &&
          /(Lda|SA|Unipessoal|Limitada|Sociedade|Portugal|Comunicações|Transportes|Energia|Banco|Seguros)/i.test(cleaned) &&
          !cleaned.includes('&') &&
          !cleaned.includes('[') &&
          !cleaned.includes('NIF:')) {
        console.log(`Nome extraído para NIF ${nif} (via linha):`, cleaned)
        return cleaned
      }
    }

    console.log(`Não foi possível extrair nome do HTML para NIF ${nif}`)
    return null
  } catch (error: any) {
    console.error(`Erro ao fazer scraping de NIF ${nif}:`, error.message)
    return null
  }
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
