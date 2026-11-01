import { createContext, useContext } from 'react'
import type { User } from '../types'

// Ce que le contexte met à disposition de toute l'application
export interface AuthContextValue {
  user: User | null // l'utilisateur connecté, ou null si personne
  isManager: boolean // raccourci : cet utilisateur est-il gérant ?
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// Le contexte lui-même (vide au départ : le AuthProvider le remplit)
export const AuthContext = createContext<AuthContextValue | null>(null)

// Un "hook" : une fonction que les composants appellent pour lire le contexte.
// Dans une page, on écrira simplement : const { user, logout } = useAuth()
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider')
  }
  return context
}