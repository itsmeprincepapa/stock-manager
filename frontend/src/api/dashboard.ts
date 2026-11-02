import { api } from './client'
import type { DashboardStats } from '../types'

// Récupère toutes les statistiques du tableau de bord en une seule requête
export async function fetchDashboard(signal?: AbortSignal) {
  const { data } = await api.get<DashboardStats>('/dashboard', { signal })
  return data
}