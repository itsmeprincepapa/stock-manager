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