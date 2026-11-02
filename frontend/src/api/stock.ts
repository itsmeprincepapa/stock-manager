import { api } from './client'
import type { MovementType, Paginated, StockMovement } from '../types'

// Les paramètres de GET /stock-movements
interface MovementsParams {
  page: number
  limit: number
  productId?: number // pour ne voir que l'historique d'un produit
}

// Récupère une page de l'historique, du plus récent au plus ancien
export async function fetchMovements(params: MovementsParams, signal?: AbortSignal) {
  const { data } = await api.get<Paginated<StockMovement>>('/stock-movements', { params, signal })
  return data
}

// Les données d'un nouveau mouvement, telles que l'API les attend
export interface MovementInput {
  productId: number
  type: MovementType
  quantity: number
  reason?: string // facultatif : l'API refuse une chaîne vide, on ne l'envoie donc que si elle existe
}

// Enregistre un mouvement (gérant seulement) : l'API met aussi le stock du produit à jour
export async function createMovement(input: MovementInput) {
  const { data } = await api.post<StockMovement>('/stock-movements', input)
  return data
}