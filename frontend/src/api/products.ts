import { api } from './client'
import type { Paginated, Product } from '../types'

// Les paramètres qu'on peut envoyer à GET /products
interface ProductsParams {
  page: number
  limit: number
  search?: string
}

// Les données d'un produit, telles que l'API les attend
export interface ProductInput {
  name: string
  price: number
  quantity?: number // seulement à la création : le stock ne se modifie plus ensuite ici
  alertThreshold: number
  categoryId?: number | null // null à la modification : retire la catégorie
}

// Récupère une page de produits.
// signal : permet d'ANNULER la requête si elle devient inutile
// (ex. l'utilisateur tape une nouvelle recherche avant la réponse).
export async function fetchProducts(params: ProductsParams, signal?: AbortSignal) {
  const { data } = await api.get<Paginated<Product>>('/products', { params, signal })
  return data
}

// Crée un produit (gérant). Si une quantité est donnée, l'API écrit aussi
// un mouvement de stock « Stock initial ».
export async function createProduct(input: ProductInput) {
  const { data } = await api.post<Product>('/products', input)
  return data
}

// Modifie un produit (gérant). Le champ quantity n'est pas accepté par l'API.
export async function updateProduct(id: number, input: Omit<ProductInput, 'quantity'>) {
  const { data } = await api.patch<Product>(`/products/${id}`, input)
  return data
}

// Supprime un produit (gérant). L'API refuse si le produit a un historique.
export async function deleteProduct(id: number) {
  await api.delete(`/products/${id}`)
}