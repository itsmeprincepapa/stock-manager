import { api } from './client'
import type { Category } from '../types'

// Toutes les catégories (la liste n'est pas paginée côté API)
export async function fetchCategories() {
  const { data } = await api.get<Category[]>('/categories')
  return data
}

// Crée une catégorie (réservé au gérant)
export async function createCategory(name: string) {
  const { data } = await api.post<Category>('/categories', { name })
  return data
}