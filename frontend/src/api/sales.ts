import { api } from './client'
import type { Paginated, Sale } from '../types'

// Une ligne du panier telle que l'API l'attend : seulement l'id et la quantité.
// Le prix n'est JAMAIS envoyé : le serveur le lit dans la base.
export interface SaleLineInput {
  productId: number
  quantity: number
}

// Enregistre une vente (gérant ou vendeur)
export async function createSale(items: SaleLineInput[]) {
  const { data } = await api.post<Sale>('/sales', { items })
  return data
}

// Récupère une page de ventes, de la plus récente à la plus ancienne
export async function fetchSales(params: { page: number; limit: number }, signal?: AbortSignal) {
  const { data } = await api.get<Paginated<Sale>>('/sales', { params, signal })
  return data
}

// Annule une vente (gérant seulement) : l'API remet le stock et garde la trace
export async function cancelSale(id: number) {
  const { data } = await api.post<Sale>(`/sales/${id}/cancel`)
  return data
}