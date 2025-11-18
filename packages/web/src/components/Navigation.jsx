import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navigation() {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary-600">Despesify</h1>
      </div>

      <div className="p-4 border-b">
        <p className="text-sm text-gray-600">Bem-vindo</p>
        <p className="font-semibold text-gray-800">{user?.name}</p>
        <p className="text-xs text-gray-500">{user?.email}</p>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/dashboard"
              className="block px-4 py-2 rounded hover:bg-primary-50 text-gray-700 hover:text-primary-600 transition"
            >
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/expenses"
              className="block px-4 py-2 rounded hover:bg-primary-50 text-gray-700 hover:text-primary-600 transition"
            >
              💰 Despesas
            </Link>
          </li>
          <li>
            <Link
              to="/stats"
              className="block px-4 py-2 rounded hover:bg-primary-50 text-gray-700 hover:text-primary-600 transition"
            >
              📈 Estatísticas
            </Link>
          </li>
        </ul>
      </div>

      <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
        >
          Sair
        </button>
      </div>
    </nav>
  )
}
