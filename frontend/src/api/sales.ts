import { api } from './client'
import type { Sale } from '../types'

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