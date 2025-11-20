'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user)
          else localStorage.removeItem('token')
        })
        .catch(() => localStorage.removeItem('token'))
    }
  }, [])

  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Bem-vindo, {user.name}!</h1>
          <p className="text-gray-600 mt-2">Despesify - Gestor de Despesas Pessoais</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/despesas/nova" className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg">
            <h3 className="text-xl font-bold">Nova Despesa</h3>
            <p className="text-sm">Registar uma nova despesa</p>
          </Link>

          <Link href="/despesas" className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg">
            <h3 className="text-xl font-bold">Minhas Despesas</h3>
            <p className="text-sm">Ver histórico de despesas</p>
          </Link>

          <Link href="/relatorio" className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-xl font-bold">Relatórios</h3>
            <p className="text-sm">Análise de gastos</p>
          </Link>

          <Link href="/perfil" className="bg-gray-500 hover:bg-gray-600 text-white p-6 rounded-lg">
            <h3 className="text-xl font-bold">Perfil</h3>
            <p className="text-sm">Definições</p>
          </Link>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Despesify</h1>
        <p className="text-white text-xl mb-8">Controle suas despesas de forma simples e eficiente</p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100"
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 border-2 border-white"
          >
            Registar
          </Link>
        </div>
      </div>
    </div>
  )
}
