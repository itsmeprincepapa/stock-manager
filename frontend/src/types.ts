// Les deux rôles possibles (comme dans le backend)
export type Role = 'MANAGER' | 'SELLER'

// Un utilisateur tel que l'API le renvoie (jamais de mot de passe)
export interface User {
  id: number
  name: string
  email: string
  role: Role
}

// La réponse de POST /auth/login
export interface AuthResponse {
  accessToken: string
  user: User
}

// Une catégorie, telle que l'API la renvoie
export interface Category {
  id: number
  name: string
}

// Un produit, avec sa catégorie (ou null s'il n'en a pas)
export interface Product {
  id: number
  name: string
  price: number
  quantity: number
  alertThreshold: number
  category: Category | null
}

// Une liste paginée : les éléments de la page et les infos pour naviguer.
// <T> est un « type à remplir » : Paginated<Product>, Paginated<Sale>...
export interface Paginated<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Une ligne d'une vente : un produit, une quantité, et le prix au moment de la vente
export interface SaleItem {
  id: number
  quantity: number
  unitPrice: number
  product: Product
}

// Une vente, telle que l'API la renvoie
export interface Sale {
  id: number
  total: number
  status: 'COMPLETED' | 'CANCELLED'
  cancelledAt: string | null
  createdAt: string // une date, envoyée en texte par l'API
  items: SaleItem[]
}