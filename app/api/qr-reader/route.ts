import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { mkdirSync } from 'fs'
import path from 'path'
import os from 'os'

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

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
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
      }

      // Check if JSON output file was created
      const jsonPath = `/tmp/qr-output-${timestamp}.json`
      if (!existsSync(jsonPath)) {
        console.error('JSON output file not created. Python likely failed to find QR code.')
        return NextResponse.json(
          { message: 'Nenhum código QR encontrado na imagem' },
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

      const expenseData = {
        description: qrData.numero_documento,
        // Use base tributável as the amount (without VAT)
        amount: baseTributavel > 0 ? baseTributavel.toString() : qrData.valor_total?.toString() || '',
        date: qrData.data_emissao || new Date().toISOString().split('T')[0],
        vat_percentage: extractMainVATRate(qrData.linhas_iva),
        nif_emitente: qrData.nif_emitente,
        nif_adquirente: qrData.nif_adquirente,
        atcud: qrData.atcud,
        base_tributavel: baseTributavel,
        valor_iva: valorIva,
        raw_qr_data: qrData
      }

      return NextResponse.json({ qr_data: expenseData }, { status: 200 })
    } finally {
      // Clean up temp image file
      try {
        if (existsSync(imagePath)) {
          unlinkSync(imagePath)
        }
      } catch (e) {
        console.warn('Erro ao limpar ficheiro temporário:', e)
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

  return mainLine.taxa_iva_percentagem?.toString() || ''
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
