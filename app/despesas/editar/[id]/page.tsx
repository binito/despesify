'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  color: string
}

interface Attachment {
  id: number
  file_name: string
  file_path: string
  file_type: string
}

interface FilePreview {
  type: 'image' | 'pdf'
  data: string
  name: string
  path: string
}

interface Expense {
  id: number
  description: string
  amount: number
  expense_date: string
  category_id: number
  payment_method: string
  vat_percentage: number
  vat_amount: number
  notes: string
  nif_emitente?: string
  nif_adquirente?: string
  numero_documento?: string
  atcud?: string
  base_tributavel?: number
}

export default function EditarDespesa() {
  const params = useParams()
  const expenseId = params.id as string
  const router = useRouter()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [vatPercentage, setVatPercentage] = useState('')
  const [valorIva, setValorIva] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [nifEmitente, setNifEmitente] = useState('')
  const [nifAdquirente, setNifAdquirente] = useState('')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [atcud, setAtcud] = useState('')
  const [baseTributavel, setBaseTributavel] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<FilePreview | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrMessage, setQrMessage] = useState('')
  const [editingNif, setEditingNif] = useState('')
  const [editingName, setEditingName] = useState('')
  const [editingCategory, setEditingCategory] = useState('')
  const [savingNifName, setSavingNifName] = useState(false)
  const router_push = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router_push.push('/login')
      return
    }

    fetchExpense(token)
    fetchCategories(token)
  }, [])

  const fetchExpense = async (token: string) => {
    try {
      const res = await fetch(`/api/despesas/${expenseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        setError('Despesa não encontrada')
        return
      }

      const data = await res.json()
      const expense = data.expense

      setDescription(expense.description)
      setAmount(String(expense.amount))
      // Garantir que a data está no formato YYYY-MM-DD
      const dateStr = expense.expense_date ? String(expense.expense_date).split('T')[0] : ''
      setDate(dateStr)
      console.log('Data carregada:', { expense_date: expense.expense_date, dateStr })
      setCategoryId(String(expense.category_id || ''))
      setPaymentMethod(expense.payment_method || 'cash')
      setVatPercentage(expense.vat_percentage ? String(expense.vat_percentage) : '')
      setValorIva(expense.vat_amount ? String(expense.vat_amount) : '')
      setNotes(expense.notes || '')
      setNifEmitente(expense.nif_emitente || '')
      setNifAdquirente(expense.nif_adquirente || '')
      setNumeroDocumento(expense.numero_documento || '')
      setAtcud(expense.atcud || '')
      setBaseTributavel(expense.base_tributavel ? String(expense.base_tributavel) : '')

      // Carregar anexos
      if (data.attachments && data.attachments.length > 0) {
        setAttachments(data.attachments)
        loadAttachmentPreviews(data.attachments)
      }
    } catch (err) {
      setError('Erro ao carregar despesa')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadAttachmentPreviews = async (attachments: Attachment[]) => {
    const previews: FilePreview[] = []

    for (const attachment of attachments) {
      try {
        const res = await fetch(attachment.file_path)
        const blob = await res.blob()
        const reader = new FileReader()

        reader.onload = (e) => {
          if (e.target?.result) {
            const isImage = attachment.file_type.startsWith('image/')
            previews.push({
              type: isImage ? 'image' : 'pdf',
              data: e.target.result as string,
              name: attachment.file_name,
              path: attachment.file_path
            })
            if (previews.length === attachments.length) {
              setFilePreviews([...previews])
            }
          }
        }
        reader.readAsDataURL(blob)
      } catch (err) {
        console.error('Erro ao carregar preview:', err)
      }
    }
  }

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

  const processQrFile = async (file: File) => {
    const token = localStorage.getItem('token')
    if (!token) return

    setQrLoading(true)
    setQrMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/qr-reader', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()
      console.log('QR Response:', data)

      if (data.qr_data) {
        // Preencher campos automaticamente do QR
        const updates: string[] = []
        if (data.qr_data.description) {
          setDescription(data.qr_data.description)
          setEditingName(data.qr_data.description)  // Pré-preencher com a descrição
          updates.push('Empresa')
        }
        if (data.qr_data.valor_total) {
          setAmount(data.qr_data.valor_total)
          updates.push('Valor Total')
        }
        if (data.qr_data.date) {
          setDate(data.qr_data.date)
          updates.push('Data')
        }
        if (data.qr_data.valor_iva) {
          setValorIva(data.qr_data.valor_iva)
          updates.push('Valor IVA')
        }
        if (data.qr_data.numero_documento) {
          setNumeroDocumento(data.qr_data.numero_documento)
          updates.push('Número do Documento')
        }
        if (data.qr_data.nif_emitente) {
          setNifEmitente(data.qr_data.nif_emitente)
          setEditingNif(data.qr_data.nif_emitente)  // Pré-preencher com o NIF
          updates.push('NIF Emitente')
        }
        // Se vier categoria da cache do NIF, preencher
        if (data.qr_data.category_id) {
          setCategoryId(String(data.qr_data.category_id))
          setEditingCategory(String(data.qr_data.category_id))
          updates.push('Categoria')
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

        setQrMessage(`✓ QR lido com sucesso! Preenchidos: ${updates.join(', ')}`)
        setTimeout(() => setQrMessage(''), 5000)
      } else {
        setQrMessage('⚠ Nenhum código QR encontrado na imagem')
        setTimeout(() => setQrMessage(''), 3000)
      }
    } catch (err: any) {
      setQrMessage(`✗ Erro ao processar QR: ${err.message}`)
      console.error('Erro QR:', err)
      setTimeout(() => setQrMessage(''), 5000)
    } finally {
      setQrLoading(false)
    }
  }

  const handleRescanQrFromAttachment = async (attachment: Attachment) => {
    const token = localStorage.getItem('token')
    if (!token) return

    setQrLoading(true)
    setQrMessage('')

    try {
      // Buscar a imagem do anexo
      const imageRes = await fetch(attachment.file_path)
      const blob = await imageRes.blob()
      const file = new File([blob], attachment.file_name, { type: attachment.file_type })

      // Processar como QR
      await processQrFile(file)
    } catch (err: any) {
      setQrMessage(`✗ Erro ao processar imagem: ${err.message}`)
      console.error('Erro ao rescan:', err)
      setTimeout(() => setQrMessage(''), 5000)
    }
  }

  const handleSaveNifName = async () => {
    // Usar os valores atuais dos campos (editingXxx ou os valores de fallback)
    const nifToSave = editingNif || nifEmitente
    const nameToSave = editingName || description

    if (!nifToSave || !nameToSave) {
      alert('Preenche o NIF e o nome')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    setSavingNifName(true)

    try {
      const res = await fetch('/api/nif-lookup/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nif: nifToSave,
          company_name: nameToSave,
          category_id: editingCategory || categoryId ? parseInt(editingCategory || categoryId) : null
        })
      })

      const data = await res.json()
      if (res.ok) {
        setQrMessage(`✓ Nome e categoria do NIF ${nifToSave} atualizados!`)
        // Não limpar os campos, mas aplicar os valores à despesa atual
        setDescription(nameToSave)
        if (editingCategory || categoryId) {
          setCategoryId(editingCategory || categoryId)
        }
        setTimeout(() => setQrMessage(''), 5000)
      } else {
        setQrMessage(`✗ Erro ao guardar: ${data.message}`)
        setTimeout(() => setQrMessage(''), 5000)
      }
    } catch (err: any) {
      setQrMessage(`✗ Erro ao guardar NIF: ${err.message}`)
      setTimeout(() => setQrMessage(''), 5000)
    } finally {
      setSavingNifName(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const token = localStorage.getItem('token')

      const res = await fetch(`/api/despesas/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description,
          amount,
          expense_date: date,
          category_id: categoryId && categoryId !== '' ? parseInt(categoryId) : null,
          vat_percentage: vatPercentage ? parseFloat(vatPercentage) : null,
          vat_amount: valorIva ? parseFloat(valorIva) : null,
          payment_method: paymentMethod,
          notes,
          nif_emitente: nifEmitente || null,
          nif_adquirente: nifAdquirente || null,
          numero_documento: numeroDocumento || null,
          atcud: atcud || null,
          base_tributavel: baseTributavel ? parseFloat(baseTributavel) : null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Erro ao atualizar despesa')
        return
      }

      router.push('/despesas')
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar despesa')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando despesa...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/despesas" className="text-blue-500 hover:text-blue-600">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Editar Despesa</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Dados */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Dados da Despesa</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
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

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Valor IVA (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorIva}
                  onChange={(e) => setValorIva(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

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

            {/* QR Message */}
            {qrMessage && (
              <div className={`mb-4 p-4 rounded-lg border ${
                qrMessage.includes('✓')
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : qrMessage.includes('⚠')
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-600'
                  : 'bg-red-50 border-red-200 text-red-600'
              } font-semibold`}>
                {qrMessage}
              </div>
            )}

            {/* Editar Nome do NIF na Cache */}
            {nifEmitente && (
              <div className="mb-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-4">Corrigir Nome e Categoria da Empresa</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Se o nome ou categoria extraídos estão incorretos, podes corrigir e guardar na base de dados. Próximas faturas com este NIF usarão estes dados automaticamente.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      NIF
                    </label>
                    <input
                      type="text"
                      value={editingNif || nifEmitente}
                      onChange={(e) => setEditingNif(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="NIF"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      value={editingName || description}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">
                      Categoria Padrão
                    </label>
                    <select
                      value={editingCategory || categoryId}
                      onChange={(e) => setEditingCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveNifName}
                  disabled={savingNifName}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
                >
                  {savingNifName ? '⏳ A guardar...' : '💾 Guardar Nome e Categoria na Cache'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Ao guardar, todas as despesas futuras com este NIF usarão automaticamente este nome e categoria.
                </p>
              </div>
            )}

            {(nifEmitente || nifAdquirente || numeroDocumento || atcud || baseTributavel || valorIva) && (
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
                    placeholder="Número do documento"
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

          {/* Coluna 2: Ficheiros */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ficheiros</h2>

            {filePreviews.length > 0 ? (
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Ficheiros Carregados (clica para ver)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {filePreviews.map((preview, idx) => (
                    <div key={idx} className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 p-3">
                      <button
                        type="button"
                        onClick={() => setSelectedFile(preview)}
                        className="w-full hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        {preview.type === 'pdf' ? (
                          <div className="flex items-center gap-3">
                            <p className="text-2xl">📄</p>
                            <div className="text-left">
                              <p className="text-sm font-bold text-gray-900 truncate">{preview.name}</p>
                              <p className="text-xs text-gray-500">PDF</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <img
                              src={preview.data}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-gray-600 mt-2 truncate">{preview.name}</p>
                          </div>
                        )}
                      </button>
                      {/* Botão refazer scan para imagens */}
                      {preview.type === 'image' && (
                        <button
                          type="button"
                          onClick={() => handleRescanQrFromAttachment(attachments[idx])}
                          disabled={qrLoading}
                          className="w-full mt-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-sm font-bold rounded transition-colors"
                        >
                          {qrLoading ? '⏳ A processar QR...' : '🔄 Refazer Scan QR'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 text-sm">Nenhum ficheiro carregado</p>
              </div>
            )}
          </div>
        </div>

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
                      href={selectedFile.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
                    >
                      Abrir PDF
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

        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
          >
            {saving ? 'Atualizando...' : 'Atualizar Despesa'}
          </button>
          <Link
            href="/despesas"
            className="flex-1 text-center bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
