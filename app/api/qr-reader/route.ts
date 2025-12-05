import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { mkdirSync } from 'fs'
import path from 'path'
import os from 'os'

// Cache Buster: 20251127130000
interface QRData {
  nif_emitente: string | null
  nif_adquirente: string | null
  pais_adquirente: string | null
  tipo_documento: string | null
  estado_documento: string | null
  data_emissao: string | null
  numero_documento: string | null
  atcud: string | null
  linhas_iva: Array<{
    pais: string
    base_tributavel: number
    valor_iva: number
    taxa_iva_codigo: string
    taxa_iva_percentagem: number
  }>
  valor_total: number | null
  retencao_iva: number | null
  hash: string | null
  numero_certificado: string | null
}

async function processQRText(qrText: string) {
  try {
    // Use Python script to process QR text directly
    const pythonScript = path.join(process.cwd(), 'scripts', 'leitor_qr_faturas_at.py')
    const timestamp = Date.now()
    const tempDir = os.tmpdir()
    const jsonPath = path.join(tempDir, `qr-output-${timestamp}.json`)

    // Create temporary JSON file to store raw QR text for processing
    const tempInput = path.join(tempDir, `qr-text-${timestamp}.txt`)
    writeFileSync(tempInput, qrText)

    try {
      // Call Python script with --text parameter
      const output = execSync(
        `python3 "${pythonScript}" --text "${tempInput}" --json "${jsonPath}"`,
        {
          encoding: 'utf-8',
          timeout: 10000,
          maxBuffer: 10 * 1024 * 1024
        }
      )
      console.log('Python QR text processing output:', output)
    } catch (error: any) {
      console.error('Python execution error:', error.message)
    }

    // Check if JSON output exists
    if (!existsSync(jsonPath)) {
      // Cleanup
      if (existsSync(tempInput)) unlinkSync(tempInput)

      return NextResponse.json(
        { message: 'Não foi possível processar o código QR' },
        { status: 400 }
      )
    }

    // Read the processed QR data
    const qrDataJson = readFileSync(jsonPath, 'utf-8')
    const qrData = JSON.parse(qrDataJson)

    // Cleanup
    if (existsSync(tempInput)) unlinkSync(tempInput)
    if (existsSync(jsonPath)) unlinkSync(jsonPath)

    return NextResponse.json({
      success: true,
      qr_data: qrData
    })
  } catch (error: any) {
    console.error('Error processing QR text:', error)
    return NextResponse.json(
      { message: 'Erro ao processar QR: ' + error.message },
      { status: 500 }
    )
  }
}

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
    // Check if it's QR text directly from camera scanner
    const contentType = req.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = await req.json()
      if (body.qr_text) {
        // Process QR text directly
        return await processQRText(body.qr_text)
      }
      // If JSON but no qr_text, return error
      return NextResponse.json(
        { message: 'qr_text não fornecido no body JSON' },
        { status: 400 }
      )
    }

    // Otherwise, process as file upload
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'Ficheiro não fornecido' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Ficheiro deve ser uma imagem (JPG, PNG, etc)' },
        { status: 400 }
      )
    }

    // Save image to temporary file
    const buffer = await file.arrayBuffer()
    const bufferNode = Buffer.from(buffer)
    const tempDir = os.tmpdir()
    const timestamp = Date.now()
    const imagePath = path.join(tempDir, `qr-input-${timestamp}.png`)

    writeFileSync(imagePath, bufferNode)

    try {
      // Call Python script to read QR code
      const pythonScript = path.join(process.cwd(), 'scripts', 'leitor_qr_faturas_at.py')

      // Check if Python script exists
      if (!existsSync(pythonScript)) {
        throw new Error('Script de leitura QR não encontrado')
      }

      // Execute Python script
      let output = ''
      let pythonError: { stdout?: string; stderr?: string; message?: string } | null = null
      try {
        console.log(`Executing: python3 "${pythonScript}" "${imagePath}" --json /tmp/qr-output-${timestamp}.json`)
        output = execSync(`python3 "${pythonScript}" "${imagePath}" --json /tmp/qr-output-${timestamp}.json`, {
          encoding: 'utf-8',
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024
        })
        console.log('Python output:', output)
      } catch (error: any) {
        console.error('Python execution error:')
        console.error('stderr:', error.stderr)
        console.error('stdout:', error.stdout)
        console.error('message:', error.message)
        pythonError = error
      }

      // Check if JSON output file was created
      const jsonPath = `/tmp/qr-output-${timestamp}.json`
      if (!existsSync(jsonPath)) {
        console.error('JSON output file not created. Python likely failed to find QR code.')

        // Try to parse stdout as JSON error from Python script
        if (pythonError?.stdout) {
          try {
            const errorData = JSON.parse(pythonError.stdout)
            if (errorData.error) {
              console.error('Python script error:', errorData.error)
              return NextResponse.json(
                { message: errorData.error },
                { status: 400 }
              )
            }
          } catch (e) {
            // Not valid JSON, fall through to default error
          }
        }

        return NextResponse.json(
          { message: 'Nenhum código QR encontrado na imagem. Verifique se a imagem contém um QR code válido e está legível.' },
          { status: 400 }
        )
      }

      // Read and parse the JSON output
      const jsonContent = readFileSync(jsonPath, 'utf-8')
      const qrData: QRData = JSON.parse(jsonContent)

      // Clean up temp files
      try {
        unlinkSync(imagePath)
        unlinkSync(jsonPath)
      } catch (e) {
        console.warn('Erro ao limpar ficheiros temporários:', e)
      }

      // Transform QR data to match expense form fields
      // Extract base and IVA from first line (or sum if multiple lines)
      const baseTributavel = qrData.linhas_iva.reduce((sum, linha) => sum + (linha.base_tributavel || 0), 0)
      const valorIva = qrData.linhas_iva.reduce((sum, linha) => sum + (linha.valor_iva || 0), 0)
      const valorTotal = baseTributavel + valorIva

      // Tentar obter o nome da empresa e categoria através do NIF
      let companyName = 'Fatura'
      let categoryId = null
      if (qrData.nif_emitente) {
        console.log(`A procurar NIF emitente: ${qrData.nif_emitente}`)
        try {
          // Always use localhost for internal calls to avoid SSL issues
          // (even in production, since we're calling our own API internally)
          const apiUrl = 'http://localhost:8520/api/nif-lookup'

          console.log(`Calling NIF lookup API: ${apiUrl}`)
          const nifLookupRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || ''
            },
            body: JSON.stringify({ nif: qrData.nif_emitente })
          })

          console.log(`NIF lookup response status: ${nifLookupRes.status}`)

          if (nifLookupRes.ok) {
            const nifData = await nifLookupRes.json()
            console.log('NIF lookup response data:', nifData)
            if (nifData.company_name) {
              companyName = nifData.company_name
              console.log(`✓ Nome da empresa obtido: ${companyName}`)
            } else {
              console.warn('⚠ NIF lookup OK mas company_name vazio')
            }
            if (nifData.category_id) {
              categoryId = nifData.category_id
              console.log(`✓ Categoria obtida da cache: ${categoryId}`)
            }
          } else {
            const errorData = await nifLookupRes.json()
            console.error(`✗ NIF lookup falhou com status ${nifLookupRes.status}:`, errorData)
          }
        } catch (err) {
          console.error('✗ Erro ao fazer NIF lookup:', err)
        }
      } else {
        console.warn('⚠ NIF emitente não encontrado no QR code')
      }

      const expenseData = {
        description: companyName,
        // Use total amount (base + IVA)
        amount: valorTotal.toString(),
        date: qrData.data_emissao || new Date().toISOString().split('T')[0],
        vat_value: valorIva > 0 ? valorIva.toString() : '',
        category_id: categoryId,
        numero_documento: qrData.numero_documento,
        nif_emitente: qrData.nif_emitente,
        nif_adquirente: qrData.nif_adquirente,
        atcud: qrData.atcud,
        base_tributavel: baseTributavel,
        valor_iva: valorIva,
        valor_total: valorTotal,
        raw_qr_data: qrData
      }

      console.log('QR Data Extraction Result:')
      console.log('Date from QR:', qrData.data_emissao)
      console.log('Final expense data:', expenseData)

      return NextResponse.json({ qr_data: expenseData }, { status: 200 })
    } finally {
      // Clean up temp image file
      try {
        if (existsSync(imagePath)) {
          unlinkSync(imagePath)
        }
      } catch (e) {
        console.warn('Erro ao limpar ficheiros temporários:', e)
      }
    }
  } catch (error: any) {
    console.error('Erro ao processar QR code:', error)
    return NextResponse.json(
      { message: `Erro ao processar QR code: ${error.message}` },
      { status: 500 }
    )
  }
}

function extractMainVATRate(linhas_iva: any[]): string {
  if (!linhas_iva || linhas_iva.length === 0) return ''

  // Return the highest tax rate (most likely to be relevant)
  let mainLine = linhas_iva[0]
  for (const linha of linhas_iva) {
    if ((linha.taxa_iva_percentagem || 0) > (mainLine.taxa_iva_percentagem || 0)) {
      mainLine = linha
    }
  }

  // If taxa_iva_percentagem not set, calculate from base and iva
  if (!mainLine.taxa_iva_percentagem || mainLine.taxa_iva_percentagem === 0) {
    if (mainLine.base_tributavel && mainLine.valor_iva) {
      const calculatedRate = (mainLine.valor_iva / mainLine.base_tributavel) * 100
      // Round to nearest standard rate
      if (calculatedRate > 20) return '23'
      if (calculatedRate > 10) return '13'
      if (calculatedRate > 0) return '6'
    }
  }

  return mainLine.taxa_iva_percentagem?.toString() || ''
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}