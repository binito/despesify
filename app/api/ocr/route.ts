import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import Tesseract from 'tesseract.js'
import { fromBuffer } from 'pdf2pic'
import fs from 'fs'
import path from 'path'
import os from 'os'

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

    const buffer = await file.arrayBuffer()
    const bufferNode = Buffer.from(buffer)
    let text = ''
    let dataUrl = ''

    // Handle PDFs by converting to image
    if (file.type === 'application/pdf') {
      try {
        console.log(`Convertendo PDF para imagem: ${file.name}`)

        // Convert PDF to image
        const tempDir = os.tmpdir()
        const timestamp = Date.now()

        const converter = fromBuffer(bufferNode, {
          density: 150,
          saveFilename: `ocr-pdf-${timestamp}`,
          savePath: tempDir,
          format: 'png',
          width: 1200,
          height: 1600
        })

        const pages = await converter

        if (!pages || pages.length === 0) {
          throw new Error('Nenhuma página PDF convertida')
        }

        // Use first page
        const imagePath = pages[0].path
        console.log(`PDF convertido para imagem: ${imagePath}`)

        // Read image and convert to base64
        const imageBuffer = fs.readFileSync(imagePath)
        const base64Image = imageBuffer.toString('base64')
        dataUrl = `data:image/png;base64,${base64Image}`

        // Clean up temp file
        try {
          fs.unlinkSync(imagePath)
        } catch (e) {
          console.warn('Erro ao limpar ficheiro temporário:', e)
        }

        console.log(`Iniciando OCR no PDF convertido: ${file.name}`)
      } catch (pdfError) {
        console.error('Erro ao converter PDF para imagem:', pdfError)
        return NextResponse.json(
          { message: 'Não foi possível processar o PDF. Tente converter para imagem (JPG/PNG) e enviar novamente.' },
          { status: 400 }
        )
      }
    } else if (file.type.startsWith('image/')) {
      // Handle images directly
      const base64 = bufferNode.toString('base64')
      dataUrl = `data:${file.type};base64,${base64}`
      console.log(`Processando imagem: ${file.name}`)
    } else {
      return NextResponse.json(
        { message: 'Ficheiro deve ser uma imagem (JPG, PNG) ou PDF' },
        { status: 400 }
      )
    }

    // Run OCR on the image (whether from PDF conversion or direct image)
    if (!dataUrl) {
      return NextResponse.json(
        { message: 'Erro ao processar ficheiro' },
        { status: 400 }
      )
    }

    try {
      console.log(`Executando Tesseract OCR para ${file.name}`)
      const result = await Tesseract.recognize(
        dataUrl,
        'por+eng',
        {
          logger: (m: any) => console.log('OCR Progress:', m)
        }
      )
      text = result.data.text
      console.log(`OCR concluído. Texto extraído (primeiros 300 chars): ${text.substring(0, 300)}`)
    } catch (ocrError) {
      console.error('Erro no OCR:', ocrError)
      return NextResponse.json(
        { message: 'Erro ao processar imagem com OCR' },
        { status: 500 }
      )
    }

    // Extract key information using regex patterns
    const ocrData = {
      raw_text: text,
      amount: extractAmount(text),
      description: extractDescription(text),
      date: extractDate(text),
      vat: extractVAT(text),
      merchant: extractMerchant(text)
    }

    console.log('Dados extraídos:', ocrData)
    return NextResponse.json({ ocr_data: ocrData }, { status: 200 })
  } catch (error: any) {
    console.error('Erro no OCR:', error)
    return NextResponse.json(
      { message: 'Erro ao processar ficheiro: ' + error.message },
      { status: 500 }
    )
  }
}

function extractAmount(text: string): string {
  // Look for currency patterns like €50.00 or 50,00€ or $50.00
  // Improved patterns to catch more variations
  const patterns = [
    // Total variations
    /(?:total|montante|amount|valor\s+total)[:\s=]+€?\s?(\d+[.,]\d{1,2})/i,
    /(?:total|montante)\s*€?\s?(\d+[.,]\d{1,2})/i,
    // Direct euro patterns
    /€\s?(\d+[.,]\d{1,2})/,
    /(\d+[.,]\d{1,2})\s?€/,
    // Dollar patterns
    /\$\s?(\d+[.,]\d{1,2})/,
    /(\d+[.,]\d{1,2})\s?\$/,
    // Numbers at end of important lines
    /(?:subtotal|sub-total|subtotal).*?(\d+[.,]\d{1,2})/i,
    // Just look for large numbers that look like prices
    /\b(\d+[.,]\d{2})\b(?=\D*(?:€|\$|total|amount|valor))/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = match[1].replace(',', '.')
      // Validate it's a reasonable amount (> 0.01 and < 100000)
      const numValue = parseFloat(value)
      if (numValue > 0.01 && numValue < 100000) {
        return value
      }
    }
  }

  return ''
}

function extractDescription(text: string): string {
  // Get first meaningful line of text (usually merchant/description)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  return lines[0] || ''
}

function extractDate(text: string): string {
  // Look for common date patterns
  const patterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // YYYY/MM/DD or YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    // DD MM YYYY with spaces
    /(\d{1,2})\s+(?:de\s+)?(\d{1,2})\s+(?:de\s+)?(\d{4})/i,
    // Look for date after "Data:" or "Date:"
    /(?:data|date)[:\s=]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i,
    // Month names in Portuguese
    /(\d{1,2})\s+(?:de\s+)?(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(\d{4})/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (match[1].length === 4) {
        // YYYY-MM-DD format
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
      } else if (match[3] && match[3].length === 4) {
        // DD-MM-YYYY format
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
      } else if (match[2] && !isNaN(Number(match[2]))) {
        // Portuguese month text format
        return `${match[2]}-${match[1].padStart(2, '0')}-01` // simplified fallback
      }
    }
  }

  return new Date().toISOString().split('T')[0]
}

function extractVAT(text: string): string {
  // Look for IVA or VAT percentage
  const patterns = [
    // IVA variations in Portuguese/Spanish
    /(?:IVA|TVA)[:\s=]*(\d+[.,]\d{0,2})\s?%/i,
    /(\d+[.,]\d{0,2})\s?%\s?(?:IVA|TVA)/i,
    // VAT in English
    /(?:VAT|TAX)[:\s=]*(\d+[.,]\d{0,2})\s?%/i,
    /(\d+[.,]\d{0,2})\s?%\s?(?:VAT|TAX)/i,
    // Look for common rates
    /\b(6|13|23)[.,]?0?\s?%/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = match[1].replace(',', '.')
      const numValue = parseFloat(value)
      if (numValue > 0 && numValue < 100) {
        return value
      }
    }
  }

  return ''
}

function extractMerchant(text: string): string {
  // Look for store/merchant names - usually at the top or in specific fields
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3)

  // Look for "Merchant" or "Store" labels first
  for (let i = 0; i < lines.length; i++) {
    if (/(?:merchant|store|shop|empresa|loja)/i.test(lines[i])) {
      return lines[i + 1] || lines[i]
    }
  }

  // Otherwise look for first uppercase line (usually merchant name)
  for (const line of lines) {
    // Check if it's primarily uppercase (merchant names are often in caps)
    const upperCaseChars = (line.match(/[A-ZÁÉÍÓÚ]/g) || []).length
    const totalChars = (line.match(/[A-Za-záéíóú]/g) || []).length

    if (line.length > 3 && line.length < 80 && upperCaseChars > 0 && upperCaseChars >= totalChars * 0.7) {
      return line
    }
  }

  // Fallback: return first non-empty line
  return lines[0] || ''
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
