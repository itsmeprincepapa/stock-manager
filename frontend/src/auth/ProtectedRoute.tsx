import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth-context'

// Gardien de pages : on l'entoure autour des pages qui demandent d'être connecté.
// managerOnly : réservé au gérant.
export function ProtectedRoute({ managerOnly = false }: { managerOnly?: boolean }) {
  const { user, isManager } = useAuth()

  // Personne n'est connecté : on renvoie vers la page de connexion.
  // "replace" remplace l'entrée dans l'historique : le bouton Retour ne ramène pas ici.
  if (!user) return <Navigate to="/login" replace />

  // Page réservée au gérant et l'utilisateur est vendeur : retour à l'accueil
  if (managerOnly && !isManager) return <Navigate to="/" replace />

  // Sinon, on affiche la page demandée (Outlet = l'emplacement de la page enfant)
  return <Outlet />
}