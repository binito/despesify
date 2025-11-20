'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export default function Perfil() {
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUser(token)
  }, [])

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      const data = await res.json()
      setUser(data.user)
      setName(data.user.name)
      setEmail(data.user.email)
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const token = localStorage.getItem('token')

      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erro ao atualizar perfil')
        return
      }

      setUser(data.user)
      setSuccess('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('token')

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erro ao alterar senha')
        return
      }

      setSuccess('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando perfil...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Erro ao carregar perfil</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            ← Voltar
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Perfil e Definições</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Informações do Utilizador */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Informações Pessoais</h2>

            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Membro desde:</strong> {new Date(user.created_at).toLocaleDateString('pt-PT')}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
              >
                {saving ? 'Guardando...' : 'Atualizar Perfil'}
              </button>
            </form>
          </div>

          {/* Alterar Senha */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Alterar Senha</h2>

            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Digite a nova senha"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Confirme a nova senha"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg"
              >
                {saving ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
          </div>

          {/* Informações da Aplicação */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Informações da Aplicação</h2>

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <p><strong>Nome:</strong> Despesify v2.0</p>
              <p><strong>Descrição:</strong> Gestor de despesas pessoais com OCR</p>
              <p><strong>Versão:</strong> 2.0.0</p>
              <p><strong>Tecnologia:</strong> Next.js, React, MariaDB</p>
            </div>
          </div>

          {/* Ações Perigosas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ações</h2>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
