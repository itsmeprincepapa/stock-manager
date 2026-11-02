import { useState, type ReactNode } from 'react'
import { api, TOKEN_KEY, USER_KEY } from '../api/client'
import type { AuthResponse, User } from '../types'
import { AuthContext } from './auth-context'

// Au chargement de la page, on relit l'utilisateur gardé dans le navigateur.
// Ainsi, un rechargement (F5) ne déconnecte pas.
function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    // Si le contenu est illisible, on considère que personne n'est connecté
    return null
  }
}

// Ce composant enveloppe l'application et fournit le contexte à toutes les pages
export function AuthProvider({ children }: { children: ReactNode }) {
  // useState reçoit la fonction readStoredUser : elle n'est appelée qu'une fois, au départ
  const [user, setUser] = useState<User | null>(readStoredUser)

  // Se connecter : appelle l'API, garde le token et l'utilisateur, met à jour l'état
  async function login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    })
    localStorage.setItem(TOKEN_KEY, data.accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setUser(data.user)
  }

  // Se déconnecter : on efface tout et on repasse l'état à « personne »
  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  // Met à jour l'utilisateur connecté, dans le navigateur ET à l'écran.
  // Le token ne change pas : seules les informations affichées changent.
  function updateUser(next: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(next))
    setUser(next)
  }

  return (
    <AuthContext.Provider
      value={{ user, isManager: user?.role === 'MANAGER', login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}