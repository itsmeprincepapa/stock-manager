import { api } from './client'
import type { Paginated, Product } from '../types'

// Les paramètres qu'on peut envoyer à GET /products
interface ProductsParams {
  page: number
  limit: number
  search?: string
}

// Récupère une page de produits.
// signal : permet d'ANNULER la requête si elle devient inutile
// (ex. l'utilisateur tape une nouvelle recherche avant la réponse).
export async function fetchProducts(params: ProductsParams, signal?: AbortSignal) {
  const { data } = await api.get<Paginated<Product>>('/products', { params, signal })
  return data
}