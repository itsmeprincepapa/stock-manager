import { isAxiosError } from 'axios'

// Transforme n'importe quelle erreur en un message en français à afficher
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Pas de réponse du tout : l'API est éteinte ou injoignable
    if (!error.response) {
      return 'Impossible de joindre le serveur. Vérifiez que l’API est lancée.'
    }

    // L'API met son message dans response.data.message :
    // un texte, ou une liste de textes (erreurs de validation)
    const message = error.response.data?.message
    if (Array.isArray(message)) return message.join(' ')
    if (typeof message === 'string') return message
  }
  return 'Une erreur est survenue. Réessayez.'
}