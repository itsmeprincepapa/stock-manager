import axios, { type AxiosError } from 'axios'

// Clés sous lesquelles on garde les informations de connexion dans le navigateur
export const TOKEN_KEY = 'token'
export const USER_KEY = 'user'

// Un client axios configuré UNE SEULE fois pour toute l'application.
// baseURL : l'adresse de l'API, lue dans le fichier .env (VITE_API_URL).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

// AVANT chaque requête : si on a un token, on l'ajoute dans l'en-tête Authorization.
// Ainsi, dans les pages, on écrit simplement api.get('/products') :
// le badge est présenté automatiquement.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// APRÈS chaque réponse : si l'API répond 401 (token absent, faux ou expiré),
// on efface la connexion et on renvoie l'utilisateur vers la page de connexion.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // On ignore le 401 de la connexion elle-même : un mauvais mot de passe
    // doit afficher un message, pas recharger la page.
    const isLoginRequest = error.config?.url?.includes('/auth/login')

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.href = '/login'
    }

    // On relance l'erreur pour que la page puisse afficher un message
    return Promise.reject(error)
  },
)