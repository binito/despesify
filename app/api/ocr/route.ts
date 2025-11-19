import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import Tesseract from 'tesseract.js'
import { fromBuffer } from 'pdf2pic'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Preprocess image for better OCR results
async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('Iniciando pré-processamento de imagem...')

    // Enhance image for OCR:
    // 1. Normalize colors
    // 2. Increase contrast
    // 3. Sharpen
    // 4. Increase size if too small
    const processed = await sharp(imageBuffer)
      .normalize() // Normalize histogram
      .sharpen({ sigma: 2 }) // Sharpen for text clarity
      .threshold(128) // Convert to black and white (binary)
      .toBuffer()

    console.log(`Pré-processamento concluído. Tamanho original: ${imageBuffer.length}, Processado: ${processed.length}`)
    return processed
  } catch (error) {
    console.warn('Erro no pré-processamento:', error)
    // Return original if preprocessing fails
    return imageBuffer
  }
}

// Convert buffer to base64 data URL
function bufferToDataUrl(buffer: Buffer, mimeType: string = 'image/png'): string {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
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

    const buffer = await file.arrayBuffer()
    const bufferNode = Buffer.from(buffer)
    let text = ''
    let dataUrl = ''

    // Handle PDFs by converting to image
    if (file.type === 'application/pdf') {
      try {
        console.log(`Convertendo PDF para imagem: ${file.name}`)

        // Save PDF to temp file first
        const tempDir = os.tmpdir()
        const timestamp = Date.now()
        const tempPdfPath = path.join(tempDir, `ocr-input-${timestamp}.pdf`)
        const tempPngPath = path.join(tempDir, `ocr-output-${timestamp}.png`)

        // Write PDF to temp file
        fs.writeFileSync(tempPdfPath, bufferNode)
        console.log(`PDF salvo temporariamente: ${tempPdfPath}`)

        // Try pdf2pic first
        let imageBuffer: Buffer | null = null
        try {
          const converter = fromBuffer(bufferNode, {
            density: 200,
            saveFilename: `ocr-pdf2pic-${timestamp}`,
            savePath: tempDir,
            format: 'png',
            width: 2000,
            height: 2600
          })

          const result = await converter(1) // Convert page 1

          if (result && result.path) {
            console.log(`PDF convertido com pdf2pic: ${result.path}`)
            imageBuffer = fs.readFileSync(result.path)

            // Clean up
            try {
              fs.unlinkSync(result.path)
            } catch (e) {}
          }
        } catch (pdf2picError) {
          console.warn('pdf2pic falhou, tentando ImageMagick diretamente:', pdf2picError)
        }

        // Fallback: Use Ghostscript directly via command line
        if (!imageBuffer) {
          console.log('Usando Ghostscript diretamente...')
          const { exec } = require('child_process')
          const { promisify } = require('util')
          const execPromise = promisify(exec)

          try {
            // Use Ghostscript to convert PDF to PNG (page 1 only)
            // -dFirstPage=1 -dLastPage=1: Only first page
            // -r200: 200 DPI resolution
            // -dNOPAUSE -dBATCH: Non-interactive
            // -sDEVICE=png16m: 24-bit color PNG
            const gsCommand = `gs -dSAFER -dNOPAUSE -dBATCH -dFirstPage=1 -dLastPage=1 -r200 -sDEVICE=png16m -sOutputFile="${tempPngPath}" "${tempPdfPath}"`

            console.log('Executando Ghostscript:', gsCommand)
            await execPromise(gsCommand)

            if (fs.existsSync(tempPngPath)) {
              console.log(`PDF convertido com Ghostscript: ${tempPngPath}`)
              imageBuffer = fs.readFileSync(tempPngPath)
            } else {
              console.error('Ghostscript executou mas não gerou ficheiro PNG')
            }
          } catch (gsError) {
            console.error('Ghostscript falhou:', gsError)

            // Last resort: Try ImageMagick if Ghostscript fails
            console.log('Tentando ImageMagick como último recurso...')
            try {
              await execPromise(`convert -density 200 -quality 100 "${tempPdfPath}[0]" "${tempPngPath}"`)

              if (fs.existsSync(tempPngPath)) {
                console.log(`PDF convertido com ImageMagick (último recurso): ${tempPngPath}`)
                imageBuffer = fs.readFileSync(tempPngPath)
              }
            } catch (imError) {
              console.error('ImageMagick também falhou:', imError)
            }
          }
        }

        // Clean up temp files
        try {
          if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath)
          if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath)
        } catch (e) {
          console.warn('Erro ao limpar ficheiros temporários:', e)
        }

        if (!imageBuffer) {
          throw new Error('Não foi possível converter PDF para imagem')
        }

        // Preprocess the converted image
        const processedBuffer = await preprocessImage(imageBuffer)
        dataUrl = bufferToDataUrl(processedBuffer, 'image/png')

        console.log(`PDF convertido e pré-processado: ${file.name}`)
      } catch (pdfError) {
        console.error('Erro ao processar PDF:', pdfError)
        return NextResponse.json(
          { message: `Erro ao processar PDF: ${pdfError instanceof Error ? pdfError.message : 'Desconhecido'}. Por favor, converta o PDF para imagem (JPG/PNG) e tente novamente.` },
          { status: 400 }
        )
      }
    } else if (file.type.startsWith('image/')) {
      // Handle images directly
      console.log(`Processando imagem: ${file.name}`)
      const processedBuffer = await preprocessImage(bufferNode)
      dataUrl = bufferToDataUrl(processedBuffer, file.type)
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

      // Create a worker with proper configuration for Node.js environment
      const worker = await Tesseract.createWorker({
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        },
        errorHandler: (err: any) => console.error('Tesseract Error:', err)
      })

      console.log('Worker criado, carregando idiomas...')
      await worker.loadLanguage('por+eng')
      await worker.initialize('por+eng')

      console.log('Iniciando reconhecimento...')
      const result = await worker.recognize(dataUrl)
      text = result.data.text

      console.log(`OCR concluído. Texto extraído (primeiros 300 chars): ${text.substring(0, 300)}`)

      // Terminate worker to free resources
      await worker.terminate()
      console.log('Worker terminado')
    } catch (ocrError: any) {
      console.error('Erro no OCR:', ocrError)
      console.error('Stack:', ocrError.stack)
      return NextResponse.json(
        { message: `Erro ao processar imagem com OCR: ${ocrError.message || 'Desconhecido'}` },
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
