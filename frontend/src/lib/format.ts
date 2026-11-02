// Formate un nombre en francs CFA : 650000 devient « 650 000 F CFA ».
// Intl.NumberFormat est l'outil du navigateur pour afficher nombres et monnaies
// selon la langue (« fr-FR » : espaces entre les milliers).
const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF', // code officiel du franc CFA
  maximumFractionDigits: 0, // pas de centimes
})

export function formatMoney(value: number): string {
  return money.format(value)
}

// Formate une date et une heure : « 2 nov. 2026, 14:35 ».
// L'API envoie les dates en texte (« 2026-11-02T14:35:00.000Z ») :
// new Date(...) le transforme en vraie date, que le navigateur sait afficher.
const dateTime = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDateTime(value: string): string {
  return dateTime.format(new Date(value))
}

// Formate un grand nombre en version courte : 650000 devient « 650 k ».
// Utile pour écrire des valeurs au-dessus des barres d'un graphique, où la place manque.
const compact = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCompact(value: number): string {
  return compact.format(value)
}

// Formate une date seule, sans l'heure : « 2 nov. 2026 »
const dateOnly = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })

export function formatDate(value: string): string {
  return dateOnly.format(new Date(value))
}