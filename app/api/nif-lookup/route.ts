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

    // If not in cache, use the nif.pt API
    console.log(`NIF ${nif} not found in cache. Using nif.pt API...`);
    
    const companyName = await lookupNifWithApi(nif);
    const source = 'nif.pt API';

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

async function lookupNifWithApi(nif: string): Promise<string | null> {
  const apiKey = process.env.NIF_PT_API_KEY;

  if (!apiKey) {
    console.warn("NIF.pt API key not found in environment variables (NIF_PT_API_KEY).");
    // We are failing fast to encourage the use of the API key for reliability.
    throw new Error("API key for NIF.pt is not configured.");
  }

  const url = `https://www.nif.pt/?json=1&q=${nif}&key=${apiKey}`;
  
  try {
    console.log(`Querying nif.pt API for NIF ${nif}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Despesify/1.0'
      }
    });

    if (!response.ok) {
      console.error(`nif.pt API request failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.result === 'error') {
      console.error(`nif.pt API returned an error: ${data.message}`);
      // If the error is about an invalid key, we should probably throw
      if (data.message && data.message.includes('key')) {
          throw new Error(data.message);
      }
      return null;
    }
    
    // The company name is in the 'title' field of the record
    if (data.records && data.records[nif] && data.records[nif].title) {
      const companyName = cleanCompanyName(data.records[nif].title);
      console.log(`✓ Company name found via nif.pt API: ${companyName}`);
      return companyName;
    }

    console.log(`NIF ${nif} not found in nif.pt API response.`);
    return null;
  } catch (error: any) {
    console.error(`Failed to fetch from nif.pt API: ${error.message}`);
    // Re-throwing the error to be caught by the handler, which can then return a 500
    throw error;
  }
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
