'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  color: string
}

interface FilePreview {
  type: 'image' | 'pdf'
  data: string
  name: string
}

export default function NovaDespesa() {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [vatPercentage, setVatPercentage] = useState('')
  const [valorIva, setValorIva] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ocrData, setOcrData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null)
  const [ocrMessage, setOcrMessage] = useState('')
  const [qrData, setQrData] = useState<any>(null)
  const [nifEmitente, setNifEmitente] = useState('')
  const [nifAdquirente, setNifAdquirente] = useState('')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [atcud, setAtcud] = useState('')
  const [baseTributavel, setBaseTributavel] = useState('')
  const [qrReadSuccess, setQrReadSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchCategories(token)
  }, [])


  const fetchCategories = async (token: string) => {
    try {
      const res = await fetch('/api/categorias', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles)

      // Criar previews para imagens e PDFs
      const previews: FilePreview[] = []
      let processedCount = 0
      let totalFiles = 0

      // Contar ficheiros
      for (let i = 0; i < selectedFiles.length; i++) {
        const type = selectedFiles[i].type
        if (type.startsWith('image/') || type === 'application/pdf') {
          totalFiles++
        }
      }

      // Ler cada ficheiro
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]

        if (file.type.startsWith('image/')) {
          // Imagem
          const reader = new FileReader()
          reader.onload = (event) => {
            if (event.target?.result) {
              previews.push({
                type: 'image',
                data: event.target.result as string,
                name: file.name
              })
              processedCount++
              if (processedCount === totalFiles) {
                setFilePreviews([...previews])
              }
            }
          }
          reader.readAsDataURL(file)
        } else if (file.type === 'application/pdf') {
          // PDF
          const reader = new FileReader()
          reader.onload = (event) => {
            if (event.target?.result) {
              previews.push({
                type: 'pdf',
                data: event.target.result as string,
                name: file.name
              })
              processedCount++
              if (processedCount === totalFiles) {
                setFilePreviews([...previews])
              }
            }
          }
          reader.readAsDataURL(file)
        }
      }

      // Tentar QR na primeira imagem
      if (selectedFiles[0].type.startsWith('image/')) {
        setQrReadSuccess(false)
        await performQRRead(selectedFiles[0])
      }
    }
  }

  const performOCR = async (file: File, showMessage: boolean = false) => {
    try {
      if (showMessage) setOcrLoading(true)
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('token')
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()
      if (data.ocr_data) {
        setOcrData(data.ocr_data)

        // Preencher campos automaticamente
        const updates: string[] = []
        if (data.ocr_data.amount) {
          setAmount(data.ocr_data.amount)
          updates.push('Valor')
        }
        if (data.ocr_data.description) {
          setDescription(data.ocr_data.description)
          updates.push('Descrição')
        }
        if (data.ocr_data.date) {
          setDate(data.ocr_data.date)
          updates.push('Data')
        }
        if (data.ocr_data.vat) {
          setVatPercentage(data.ocr_data.vat)
          updates.push('IVA')
        }

        if (showMessage) {
          setOcrMessage(`✓ OCR concluído! Preenchidos: ${updates.join(', ')}`)
          setTimeout(() => setOcrMessage(''), 4000)
        }
      } else if (showMessage) {
        setOcrMessage('⚠ Não foi possível extrair dados da imagem')
        setTimeout(() => setOcrMessage(''), 3000)
      }
    } catch (err) {
      console.error('Erro no OCR:', err)
      if (showMessage) {
        setOcrMessage('❌ Erro ao processar imagem')
        setTimeout(() => setOcrMessage(''), 3000)
      }
    } finally {
      if (showMessage) setOcrLoading(false)
    }
  }

  const performQRRead = async (file: File, showMessage: boolean = false) => {
    try {
      if (showMessage) setOcrLoading(true)
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('token')
      const res = await fetch('/api/qr-reader', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()
      console.log('QR Response:', data)
      if (data.qr_data) {
        setQrData(data.qr_data)
        setQrReadSuccess(true)

        // Preencher campos automaticamente do QR
        const updates: string[] = []
        if (data.qr_data.valor_total) {
          setAmount(data.qr_data.valor_total)
          updates.push('Valor Total')
        }
        if (data.qr_data.description) {
          setDescription(data.qr_data.description)
          updates.push('Documento')
        }
        if (data.qr_data.date) {
          setDate(data.qr_data.date)
          updates.push('Data')
        }
        if (data.qr_data.valor_iva) {
          setValorIva(data.qr_data.valor_iva)
          updates.push('Valor IVA')
        }
        // Extract and set vatPercentage from QR data
        if (data.qr_data.linhas_iva && data.qr_data.linhas_iva.length > 0 && data.qr_data.linhas_iva[0].taxa_iva_percentagem !== undefined) {
          setVatPercentage(String(data.qr_data.linhas_iva[0].taxa_iva_percentagem))
          updates.push('Taxa IVA')
        }
        if (data.qr_data.nif_emitente) {
          setNifEmitente(data.qr_data.nif_emitente)
          updates.push('NIF Emitente')
        }
        if (data.qr_data.nif_adquirente) {
          setNifAdquirente(data.qr_data.nif_adquirente)
          updates.push('NIF Adquirente')
        }
        if (data.qr_data.atcud) {
          setAtcud(data.qr_data.atcud)
          updates.push('ATCUD')
        }
        if (data.qr_data.base_tributavel) {
          setBaseTributavel(data.qr_data.base_tributavel)
          updates.push('Base Tributável')
        }
        if (data.qr_data.numero_documento) {
          setNumeroDocumento(data.qr_data.numero_documento)
          updates.push('Número do Documento')
        }

        if (showMessage) {
          setOcrMessage(`✓ QR lido com sucesso! Preenchidos: ${updates.join(', ')}`)
          setTimeout(() => setOcrMessage(''), 5000)
        }
      } else if (showMessage) {
        setQrReadSuccess(false)
        setOcrMessage('⚠ Nenhum código QR encontrado na imagem')
        setTimeout(() => setOcrMessage(''), 3000)
      }
    } catch (err) {
      console.error('Erro ao ler QR:', err)
      if (showMessage) {
        setOcrMessage('❌ Erro ao processar imagem')
        setTimeout(() => setOcrMessage(''), 3000)
      }
    } finally {
      if (showMessage) setOcrLoading(false)
    }
  }

  const handleManualOCR = async (preview: FilePreview) => {
    // Converter preview de volta para File
    const blob = await fetch(preview.data).then(r => r.blob())
    const file = new File([blob], preview.name, { type: preview.type === 'image' ? 'image/jpeg' : 'application/pdf' })
    await performOCR(file, true)
  }

  const handleManualQRRead = async (preview: FilePreview) => {
    // Converter preview de volta para File
    const blob = await fetch(preview.data).then(r => r.blob())
    const file = new File([blob], preview.name, { type: 'image/jpeg' })
    await performQRRead(file, true)
  }

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      setError('Nome da categoria é obrigatório')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategory,
          color: newCategoryColor
        })
      })

      const data = await res.json()
      if (res.ok) {
        setCategories([...categories, data.category])
        setCategoryId(String(data.category.id))
        setNewCategory('')
        setShowNewCategory(false)
      } else {
        setError(data.message || 'Erro ao criar categoria')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar categoria')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()

      formData.append('description', description)
      formData.append('amount', amount)
      formData.append('expense_date', date)
      if (categoryId) formData.append('category_id', categoryId)
      if (vatPercentage !== '') formData.append('vat_percentage', vatPercentage)
      formData.append('payment_method', paymentMethod)
      if (notes) formData.append('notes', notes)
      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i])
        }
      }
      if (ocrData) formData.append('ocr_data', JSON.stringify(ocrData))
      if (qrData) formData.append('qr_data', JSON.stringify(qrData))
      if (nifEmitente) formData.append('nif_emitente', nifEmitente)
      if (nifAdquirente) formData.append('nif_adquirente', nifAdquirente)
      if (numeroDocumento) formData.append('numero_documento', numeroDocumento)
      if (atcud) formData.append('atcud', atcud)
      if (baseTributavel) formData.append('base_tributavel', baseTributavel)
      if (valorIva && qrData) formData.append('valor_iva', valorIva)

      const res = await fetch('/api/despesas', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Erro ao criar despesa')
        return
      }

      router.push('/despesas')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar despesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 sm:py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <Link href="/despesas" className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-block">
            ← Voltar às despesas
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Nova Despesa
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-md">
            <p className="font-bold">Erro</p>
            <p>{error}</p>
          </div>
        )}

        {ocrMessage && (
          <div className={`border-l-4 px-6 py-4 rounded-lg mb-6 shadow-md ${
            ocrMessage.startsWith('✓') ? 'bg-green-50 border-green-500 text-green-800' :
            ocrMessage.startsWith('⚠') ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
            'bg-red-50 border-red-500 text-red-800'
          }`}>
            <p className="font-bold">{ocrMessage}</p>
          </div>
        )}

        {ocrData && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-lg mb-6 shadow-md">
            <p className="font-bold">✓ Dados extraídos da fatura</p>
            <p className="text-sm mt-1">Reveja e ajuste conforme necessário</p>
          </div>
        )}

        {qrData && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 px-6 py-4 rounded-lg mb-6 shadow-md">
            <p className="font-bold">✓ Dados extraídos do código QR da fatura AT</p>
            <p className="text-sm mt-1">Reveja e ajuste conforme necessário</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Dados Básicos */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-black text-gray-800 mb-6 pb-3 border-b-2 border-gray-100">Dados da Despesa</h2>

            <div className="mb-5">
              <label className="block text-gray-700 font-bold mb-2 text-sm">
                Descrição *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Ex: Supermercado Jumbo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  Valor (€) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  Data *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  Método de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                >
                  <option value="cash">💵 Dinheiro</option>
                  <option value="credit_card">💳 Cartão de Crédito</option>
                  <option value="debit_card">💳 Cartão de Débito</option>
                  <option value="bank_transfer">🏦 Transferência</option>
                  <option value="other">📌 Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  Valor IVA (€)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorIva}
                    onChange={(e) => setValorIva(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 font-bold mb-2 text-sm">
                Categoria
              </label>
              <div className="flex gap-3 mb-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                >
                  <option value="">📂 Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                >
                  + Nova
                </button>
              </div>

              {showNewCategory && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl mb-4 border-2 border-blue-100">
                  <div className="mb-4">
                    <label className="block text-gray-700 font-bold mb-2 text-sm">Nome da Categoria</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Ex: Alimentação, Transporte..."
                      className="w-full px-4 py-3 border-2 border-white rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    />
                  </div>
                  <div className="flex gap-3 items-center mb-4">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-14 h-14 border-2 border-white rounded-xl cursor-pointer shadow-md"
                    />
                    <div>
                      <span className="text-gray-700 font-bold block text-sm">Cor da categoria</span>
                      <span className="text-gray-500 text-xs">Escolha uma cor para identificar</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      ✓ Criar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-bold border-2 border-gray-200 transition-all"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-gray-700 font-bold mb-2 text-sm">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                placeholder="Adicione observações ou notas sobre esta despesa..."
                rows={3}
              />
            </div>

            {qrData && (
              <div className="mb-5 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📱</span>
                  <h3 className="text-xl font-black text-blue-900">Dados do QR Code AT</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      NIF Emitente
                    </label>
                    <input
                      type="text"
                      value={nifEmitente}
                      onChange={(e) => setNifEmitente(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="NIF do emitente"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      NIF Adquirente
                    </label>
                    <input
                      type="text"
                      value={nifAdquirente}
                      onChange={(e) => setNifAdquirente(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="NIF do adquirente"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-bold mb-2">
                    Número do Documento
                  </label>
                  <input
                    type="text"
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Número do documento (ex: FT 2024/123)"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-bold mb-2">
                    ATCUD
                  </label>
                  <input
                    type="text"
                    value={atcud}
                    onChange={(e) => setAtcud(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Código ATCUD"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-bold mb-2">
                    Base Tributável (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baseTributavel}
                    onChange={(e) => setBaseTributavel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Coluna 2: Upload e Preview */}
          <div>
            <h2 className="text-2xl font-black text-gray-800 mb-6 pb-3 border-b-2 border-gray-100">Fatura</h2>

            <div className="mb-5">
              <label className="block text-gray-700 font-bold mb-2 text-sm">
                Upload de Fatura
              </label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white file:font-bold file:cursor-pointer hover:file:from-blue-600 hover:file:to-blue-700"
                />
              </div>
              <div className="flex items-center gap-2 mt-3 bg-blue-50 px-4 py-3 rounded-lg">
                <span className="text-blue-600 text-xl">✨</span>
                <p className="text-sm text-blue-800 font-medium">
                  Suporta imagens (JPG, PNG) e PDFs com leitura automática de QR Code AT!
                </p>
              </div>
            </div>

            {/* Previews */}
            {filePreviews.length > 0 && (
              <div className="mb-5">
                <label className="block text-gray-700 font-bold mb-3 text-sm">
                  📎 Preview dos Ficheiros
                </label>
                <p className="text-xs text-gray-600 mb-3">Clique para visualizar em tamanho completo</p>
                <div className="grid grid-cols-2 gap-3">
                  {filePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        onClick={() => setSelectedFile(preview)}
                        className="w-full border-2 border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer transform hover:scale-105"
                      >
                        {preview.type === 'pdf' ? (
                          <div className="w-full h-40 flex items-center justify-center bg-red-50 border-2 border-red-300">
                            <div className="text-center">
                              <p className="text-red-600 font-bold text-4xl">📄</p>
                              <p className="text-red-600 text-sm font-bold mt-2">PDF</p>
                              <p className="text-red-500 text-xs mt-1 px-2 truncate">{preview.name}</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={preview.data}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-40 object-cover"
                          />
                        )}
                      </button>

                      {/* Botões de OCR e QR sobrepostos */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleManualQRRead(preview)}
                          disabled={ocrLoading}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg transition-all transform hover:scale-110"
                          title="Ler código QR da fatura AT"
                        >
                          {ocrLoading ? '⏳' : '📱 QR'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleManualOCR(preview)}
                          disabled={ocrLoading}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg transition-all transform hover:scale-110"
                          title="Executar OCR neste ficheiro"
                        >
                          {ocrLoading ? '⏳' : '🔍 OCR'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal para visualizar em tamanho inteiro */}
            {selectedFile && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-5xl max-h-[90vh] overflow-auto relative">
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold z-10"
                  >
                    ✕
                  </button>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedFile.name}</h3>

                    {selectedFile.type === 'pdf' ? (
                      <div className="bg-gray-100 p-8 text-center">
                        <p className="text-6xl mb-4">📄</p>
                        <p className="text-gray-600 text-lg font-bold">Ficheiro PDF</p>
                        <p className="text-gray-500 text-sm mt-2">Clica para fazer download</p>
                        <a
                          href={selectedFile.data}
                          download={selectedFile.name}
                          className="inline-block mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
                        >
                          Download PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={selectedFile.data}
                        alt="Preview"
                        className="w-full h-auto"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {files && files.length > 0 && (
              <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-900 font-bold">
                  {files.length} ficheiro(s) selecionado(s)
                </p>
                <ul className="text-sm text-blue-800 mt-2">
                  {Array.from(files).map((file, idx) => (
                    <li key={idx} className="truncate">
                      • {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : 'Guardar Despesa'}
          </button>
          <Link
            href="/despesas"
            className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all duration-300"
          >
            Cancelar
          </Link>
        </div>
      </form>
      </div>
    </div>
  )
}
