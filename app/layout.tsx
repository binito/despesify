import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Despesify - Gestor de Despesas',
  description: 'Aplicação para controle e análise de despesas pessoais',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}
