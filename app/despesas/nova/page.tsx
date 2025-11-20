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
      if (data.qr_data) {
        setQrData(data.qr_data)
        setQrReadSuccess(true)

        // Preencher campos automaticamente do QR
        const updates: string[] = []
        if (data.qr_data.amount) {
          setAmount(data.qr_data.amount)
          updates.push('Valor')
        }
        if (data.qr_data.description) {
          setDescription(data.qr_data.description)
          updates.push('Documento')
        }
        if (data.qr_data.date) {
          setDate(data.qr_data.date)
          updates.push('Data')
        }
        if (data.qr_data.vat_percentage) {
          setVatPercentage(data.qr_data.vat_percentage)
          updates.push('IVA')
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
      if (vatPercentage) formData.append('vat_percentage', vatPercentage)
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/despesas" className="text-blue-500 hover:text-blue-600">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Nova Despesa</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {ocrMessage && (
        <div className={`border px-4 py-3 rounded mb-4 ${
          ocrMessage.startsWith('✓') ? 'bg-green-100 border-green-400 text-green-700' :
          ocrMessage.startsWith('⚠') ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
          'bg-red-100 border-red-400 text-red-700'
        }`}>
          {ocrMessage}
        </div>
      )}

      {ocrData && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✓ Dados extraídos da fatura. Reveja e ajuste conforme necessário.
        </div>
      )}

      {qrData && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          ✓ Dados extraídos do código QR da fatura AT. Reveja e ajuste conforme necessário.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Dados Básicos */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Dados da Despesa</h2>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Ex: Supermercado Jumbo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Valor (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Método de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="cash">Dinheiro</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="bank_transfer">Transferência</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  IVA
                </label>
                <select
                  value={vatPercentage}
                  onChange={(e) => setVatPercentage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Isento</option>
                  <option value="6">6%</option>
                  <option value="13">13%</option>
                  <option value="23">23%</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Categoria
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold"
                >
                  + Nova
                </button>
              </div>

              {showNewCategory && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="mb-3">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nome da categoria"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 items-center mb-3">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-gray-600">Cor da categoria</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold"
                    >
                      Criar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Notas adicionais"
                rows={3}
              />
            </div>

            {qrData && (
              <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Dados do QR Code AT</h3>

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

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
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

                  <div>
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
              </div>
            )}
          </div>

          {/* Coluna 2: Upload e Preview */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Fatura</h2>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Upload de Ficheiro
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <p className="text-sm text-gray-600 mt-2">
                Imagens (JPG, PNG) ou PDFs. OCR automático!
              </p>
            </div>

            {/* Previews */}
            {filePreviews.length > 0 && (
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Preview dos Ficheiros (clica para abrir em tamanho inteiro)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {filePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        type="button"
                        onClick={() => setSelectedFile(preview)}
                        className="w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:shadow-lg transition-shadow cursor-pointer"
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
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleManualQRRead(preview)}
                          disabled={ocrLoading}
                          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold shadow-lg transition-all"
                          title="Ler código QR da fatura AT"
                        >
                          {ocrLoading ? '⏳' : '📱 QR'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleManualOCR(preview)}
                          disabled={ocrLoading}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-2 py-1 rounded text-xs font-bold shadow-lg transition-all"
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

        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg"
          >
            {loading ? 'Guardando...' : 'Guardar Despesa'}
          </button>
          <Link
            href="/despesas"
            className="flex-1 text-center bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
