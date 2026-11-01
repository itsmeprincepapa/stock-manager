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