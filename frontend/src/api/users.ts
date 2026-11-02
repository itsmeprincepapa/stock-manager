import { api } from './client'
import type { Role, User } from '../types'

// Les données d'un nouveau compte, telles que l'API les attend
export interface UserInput {
  name: string
  email: string
  password: string
  role: Role
}

// Les changements possibles sur un compte : tous facultatifs
export interface UserChanges {
  name?: string
  email?: string
  password?: string // seulement pour réinitialiser un mot de passe oublié
  role?: Role
}

// La liste de tous les comptes (gérant seulement). Pas de pagination : il y en a peu.
export async function fetchUsers(signal?: AbortSignal) {
  const { data } = await api.get<User[]>('/users', { signal })
  return data
}

// Crée le compte d'un employé (gérant seulement). L'API hache le mot de passe.
export async function createUser(input: UserInput) {
  const { data } = await api.post<User>('/users', input)
  return data
}

// Modifie un compte (gérant seulement)
export async function updateUser(id: number, changes: UserChanges) {
  const { data } = await api.patch<User>(`/users/${id}`, changes)
  return data
}

// Supprime un compte (gérant seulement) : l'API refuse de supprimer son propre compte
export async function deleteUser(id: number) {
  await api.delete(`/users/${id}`)
}