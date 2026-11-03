// Les comptes de démonstration, affichés sur la page de connexion.
// Ils correspondent à ceux créés par le script de données (backend/src/seed.ts).
// Ces mots de passe sont PUBLICS : ils ne protègent que des données fictives.

// Le bloc n'apparaît que si la variable VITE_SHOW_DEMO_ACCOUNTS vaut « true » dans le .env.
// Les variables Vite sont toujours du texte, d'où la comparaison avec 'true'.
export const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true'

export const DEMO_ACCOUNTS = [
  {
    label: 'Gérant',
    description: 'Accès complet : catalogue, stock, tableau de bord et comptes.',
    email: 'gerant@demo.test',
    password: 'DemoGerant2026',
  },
  {
    label: 'Vendeur',
    description: 'Consulte les produits et enregistre des ventes.',
    email: 'vendeur@demo.test',
    password: 'DemoVendeur2026',
  },
]