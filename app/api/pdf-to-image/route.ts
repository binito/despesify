import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { fromPath } from 'pdf2pic'

const handler = async (req: NextRequest, context: any) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Método não suportado' }, { status: 405 })
  }

  try {
    const { pdfPath } = await req.json()

    if (!pdfPath) {
      return NextResponse.json(
        { message: 'Caminho do PDF não fornecido' },
        { status: 400 }
      )
    }

    console.log('Convertendo PDF para imagem:', pdfPath)

    // Construir caminho absoluto
    const fullPath = path.join(process.cwd(), 'public', pdfPath.startsWith('/') ? pdfPath.substring(1) : pdfPath)

    if (!fs.existsSync(fullPath)) {
      console.error('PDF não encontrado:', fullPath)
      return NextResponse.json(
        { message: 'PDF não encontrado' },
        { status: 404 }
      )
    }

    // Diretório temporário
    const tempDir = os.tmpdir()
    const timestamp = Date.now()

    try {
      // Tentar pdf2pic primeiro
      const converter = fromPath(fullPath, {
        density: 150,
        saveFilename: `pdf-preview-${timestamp}`,
        savePath: tempDir,
        format: 'png',
        width: 1200,
        height: 1600
      })

      const result = await converter(1, { responseType: 'image' })

      if (result && result.path) {
        console.log('PDF convertido com sucesso:', result.path)

        // Ler a imagem gerada
        const imageBuffer = fs.readFileSync(result.path)
        const base64 = imageBuffer.toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`

        // Limpar arquivo temporário
        try {
          fs.unlinkSync(result.path)
        } catch (e) {
          console.warn('Erro ao limpar arquivo temporário:', e)
        }

        return NextResponse.json({ dataUrl }, { status: 200 })
      }
    } catch (pdf2picError) {
      console.warn('pdf2pic falhou, tentando Ghostscript:', pdf2picError)
    }

    // Fallback: Ghostscript
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execPromise = promisify(exec)
    const tempPngPath = path.join(tempDir, `pdf-preview-${timestamp}.png`)

    try {
      const gsCommand = `gs -dSAFER -dNOPAUSE -dBATCH -dFirstPage=1 -dLastPage=1 -r150 -sDEVICE=png16m -sOutputFile="${tempPngPath}" "${fullPath}"`
      console.log('Executando Ghostscript:', gsCommand)
      await execPromise(gsCommand)

      if (fs.existsSync(tempPngPath)) {
        console.log('PDF convertido com Ghostscript:', tempPngPath)
        const imageBuffer = fs.readFileSync(tempPngPath)
        const base64 = imageBuffer.toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`

        // Limpar
        try {
          fs.unlinkSync(tempPngPath)
        } catch (e) {
          console.warn('Erro ao limpar arquivo temporário:', e)
        }

        return NextResponse.json({ dataUrl }, { status: 200 })
      }
    } catch (gsError) {
      console.error('Ghostscript falhou:', gsError)
      return NextResponse.json(
        { message: `Erro ao converter PDF: ${gsError instanceof Error ? gsError.message : 'Desconhecido'}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Não foi possível converter o PDF' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('Erro na conversão de PDF:', error)
    return NextResponse.json(
      { message: 'Erro ao converter PDF: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, context: any) {
  return withAuth(handler)(req, context)
}
