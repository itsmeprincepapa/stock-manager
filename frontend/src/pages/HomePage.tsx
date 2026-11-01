import { useAuth } from '../auth/auth-context'

// Page d'accueil provisoire : elle servira à vérifier que la connexion marche.
// On la remplacera par le vrai tableau de bord.
export function HomePage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100">
      <h1 className="text-3xl font-bold text-indigo-600">Stock Manager</h1>
      <p className="text-slate-700">
        Bonjour {user?.name} ({user?.role === 'MANAGER' ? 'gérant' : 'vendeur'})
      </p>
      <button
        onClick={logout}
        className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-900"
      >
        Se déconnecter
      </button>
    </div>
  )
}