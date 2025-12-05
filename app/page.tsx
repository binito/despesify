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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6 sm:py-10 max-w-7xl">
          <header className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-2">
                  Olá, {user.name}!
                </h1>
                <p className="text-base sm:text-lg text-gray-600 font-medium">Gerir as suas finanças nunca foi tão fácil</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  window.location.href = '/login'
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Terminar Sessão
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Link
              href="/despesas/nova"
              className="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Nova Despesa</h3>
                <p className="text-sm opacity-90">Registar uma nova despesa</p>
              </div>
            </Link>

            <Link
              href="/despesas"
              className="group relative bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Minhas Despesas</h3>
                <p className="text-sm opacity-90">Ver histórico completo</p>
              </div>
            </Link>

            <Link
              href="/relatorio"
              className="group relative bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Relatórios</h3>
                <p className="text-sm opacity-90">Análise detalhada</p>
              </div>
            </Link>

            <Link
              href="/perfil"
              className="group relative bg-gradient-to-br from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="text-4xl mb-3">⚙️</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Perfil</h3>
                <p className="text-sm opacity-90">Configurações</p>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dicas Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xl">💡</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">QR Code AT</h3>
                  <p className="text-xs text-gray-600">Digitalize faturas automaticamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 text-xl">📈</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Relatórios</h3>
                  <p className="text-xs text-gray-600">Exporte para PDF ou CSV</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xl">🎯</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Categorias</h3>
                  <p className="text-xs text-gray-600">Organize por tipo de despesa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="text-center max-w-3xl relative z-10">
        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-4 tracking-tight">
            Despesify
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full mb-6"></div>
          <p className="text-white text-lg sm:text-xl md:text-2xl mb-4 font-medium opacity-95">
            Controle total das suas finanças
          </p>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto opacity-90">
            Gestão inteligente de despesas com leitura de QR Code AT, relatórios detalhados e muito mais
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/login"
            className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 shadow-2xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto text-lg"
          >
            <span className="group-hover:translate-x-1 inline-block transition-transform">Entrar</span>
          </Link>
          <Link
            href="/registro"
            className="group bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 border-2 border-white shadow-2xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto text-lg"
          >
            <span className="group-hover:translate-x-1 inline-block transition-transform">Criar Conta</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="text-white font-bold text-lg mb-2">QR Code AT</h3>
            <p className="text-blue-100 text-sm">Digitalize faturas instantaneamente</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-white font-bold text-lg mb-2">Relatórios</h3>
            <p className="text-blue-100 text-sm">Análises visuais e exportação</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-white font-bold text-lg mb-2">Seguro</h3>
            <p className="text-blue-100 text-sm">Os seus dados protegidos</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
