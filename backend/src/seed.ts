import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AppModule } from './app.module'
import { CategoriesService } from './categories/categories.service'
import { ProductsService } from './products/products.service'
import { SalesService } from './sales/sales.service'
import { MovementType } from './stock-movements/stock-movement.entity'
import { StockMovementsService } from './stock-movements/stock-movements.service'
import { Role } from './users/user.entity'
import { UsersService } from './users/users.service'

// Les comptes de démonstration. Ces mots de passe sont PUBLICS (affichés sur la page de
// connexion) : ils ne doivent donner accès qu'à des données fictives, jamais à de vraies.
// Le domaine « .test » est réservé aux essais : aucune vraie adresse ne peut lui correspondre.
const DEMO_ACCOUNTS = [
  { name: 'Ibrahima Sow', email: 'gerant@demo.test', password: 'DemoGerant2026', role: Role.MANAGER },
  { name: 'Awa Diop', email: 'vendeur@demo.test', password: 'DemoVendeur2026', role: Role.SELLER },
]

const CATEGORIES = ['Smartphones', 'Accessoires', 'Énergie', 'Audio']

// Un produit de démonstration
interface ProductSeed {
  name: string
  price: number
  quantity: number // stock de départ
  alertThreshold: number
  category: string
  maxPerSale: number // quantité maximale vendue d'un coup
  sellable: boolean // apparaît-il dans les ventes générées ?
}

const PRODUCTS: ProductSeed[] = [
  // Smartphones : on en vend un à la fois
  { name: 'iPhone 15 128 Go', price: 650000, quantity: 12, alertThreshold: 3, category: 'Smartphones', maxPerSale: 1, sellable: true },
  { name: 'iPhone 14 128 Go', price: 520000, quantity: 8, alertThreshold: 3, category: 'Smartphones', maxPerSale: 1, sellable: true },
  { name: 'Samsung Galaxy S24', price: 560000, quantity: 10, alertThreshold: 3, category: 'Smartphones', maxPerSale: 1, sellable: true },
  { name: 'Samsung Galaxy A55', price: 285000, quantity: 15, alertThreshold: 4, category: 'Smartphones', maxPerSale: 1, sellable: true },
  { name: 'Tecno Spark 20 Pro', price: 95000, quantity: 25, alertThreshold: 6, category: 'Smartphones', maxPerSale: 1, sellable: true },
  { name: 'Infinix Hot 40', price: 85000, quantity: 20, alertThreshold: 6, category: 'Smartphones', maxPerSale: 1, sellable: true },
  // Accessoires
  { name: 'Coque transparente iPhone 15', price: 5000, quantity: 20, alertThreshold: 6, category: 'Accessoires', maxPerSale: 2, sellable: false }, // sera mise en RUPTURE
  { name: 'Protège-écran verre trempé', price: 3000, quantity: 60, alertThreshold: 15, category: 'Accessoires', maxPerSale: 3, sellable: true },
  { name: 'Câble USB-C 1 m', price: 4000, quantity: 50, alertThreshold: 12, category: 'Accessoires', maxPerSale: 3, sellable: true },
  // Énergie
  { name: 'Chargeur rapide 20 W', price: 15000, quantity: 30, alertThreshold: 8, category: 'Énergie', maxPerSale: 2, sellable: true },
  { name: 'Batterie externe 10 000 mAh', price: 18000, quantity: 14, alertThreshold: 5, category: 'Énergie', maxPerSale: 2, sellable: true },
  { name: 'Chargeur sans fil', price: 22000, quantity: 4, alertThreshold: 6, category: 'Énergie', maxPerSale: 1, sellable: false }, // STOCK FAIBLE
  // Audio
  { name: 'Écouteurs sans fil', price: 25000, quantity: 5, alertThreshold: 6, category: 'Audio', maxPerSale: 1, sellable: false }, // STOCK FAIBLE
  { name: 'Enceinte Bluetooth', price: 32000, quantity: 9, alertThreshold: 4, category: 'Audio', maxPerSale: 1, sellable: true },
  { name: 'Casque audio', price: 28000, quantity: 7, alertThreshold: 3, category: 'Audio', maxPerSale: 1, sellable: true },
]

// Un générateur de nombres « au hasard » mais REPRODUCTIBLE : avec la même graine (2026),
// il donne toujours la même suite. Les données de démonstration sont donc identiques à chaque fois.
function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Une date « il y a N jours », à une heure donnée
function daysAgo(days: number, hour = 10, minute = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date
}

// Les dates des ventes à générer, de la plus ancienne à la plus récente :
// 2 à 4 ventes par jour pendant 13 jours, puis 3 ventes aujourd'hui.
function buildSaleTimes(random: () => number): Date[] {
  const times: Date[] = []

  for (let offset = 13; offset >= 1; offset--) {
    const count = 2 + Math.floor(random() * 3)
    const day: Date[] = []
    for (let i = 0; i < count; i++) {
      // Heures d'ouverture : entre 9 h et 17 h 59
      day.push(daysAgo(offset, 9 + Math.floor(random() * 9), Math.floor(random() * 60)))
    }
    day.sort((a, b) => a.getTime() - b.getTime())
    times.push(...day)
  }

  // Aujourd'hui : des ventes dans les dernières heures, sans jamais dépasser « maintenant »
  const now = Date.now()
  const startOfToday = daysAgo(0, 0, 1).getTime()
  const today: Date[] = []
  for (let i = 0; i < 3; i++) {
    const minutesAgo = 20 + Math.floor(random() * 220)
    const time = Math.max(now - minutesAgo * 60000, startOfToday)
    today.push(new Date(Math.min(time, now - 1000)))
  }
  today.sort((a, b) => a.getTime() - b.getTime())
  times.push(...today)

  return times
}

async function main() {
  // On démarre l'application SANS serveur web : juste le « contexte », c'est-à-dire
  // tous les services, connectés à la base. On peut alors les appeler comme dans l'application.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  })

  try {
    const users = app.get(UsersService)
    const categories = app.get(CategoriesService)
    const products = app.get(ProductsService)
    const movements = app.get(StockMovementsService)
    const sales = app.get(SalesService)
    const db = app.get(DataSource)
    const random = createRandom(2026)

    // GARDE-FOU : on ne remplit jamais une base qui contient déjà des comptes.
    if ((await users.count()) > 0) {
      console.log('La base contient déjà des comptes : rien n’a été créé.')
      console.log('Utilisez une base vide (voir les instructions).')
      return
    }

    // Reculer une date dans la base. C'est la SEULE chose qui contourne les services :
    // les services datent tout « maintenant », et on veut étaler les données sur deux semaines.
    const setDate = (table: string, column: string, value: Date, id: number) =>
      db.query(`UPDATE \`${table}\` SET \`${column}\` = ? WHERE id = ?`, [value, id])

    // 1. LES COMPTES
    for (const account of DEMO_ACCOUNTS) {
      await users.create(account)
    }
    console.log(`${DEMO_ACCOUNTS.length} comptes créés.`)

    // 2. LES CATÉGORIES
    const categoryIds = new Map<string, number>()
    for (const name of CATEGORIES) {
      const category = await categories.create({ name })
      categoryIds.set(name, category.id)
    }

    // 3. LES PRODUITS (chacun avec son mouvement « Stock initial », écrit par ProductsService)
    const created = new Map<string, number>() // nom du produit -> id
    for (const item of PRODUCTS) {
      const product = await products.create({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        alertThreshold: item.alertThreshold,
        categoryId: categoryIds.get(item.category),
      })
      created.set(item.name, product.id)
    }
    console.log(`${PRODUCTS.length} produits créés.`)

    // Le catalogue existe depuis 30 jours : on recule les dates de création et de stock initial
    const catalogDate = daysAgo(30, 9, 0)
    await db.query('UPDATE `products` SET `createdAt` = ?', [catalogDate])
    await db.query('UPDATE `stock_movements` SET `createdAt` = ? WHERE `reason` = ?', [
      catalogDate,
      'Stock initial',
    ])

    // 4. DE L'HISTORIQUE DE STOCK : une entrée, une sortie, un ajustement d'inventaire
    const extras = [
      { name: 'Chargeur rapide 20 W', type: MovementType.IN, quantity: 15, reason: 'Livraison fournisseur', ago: 9 },
      { name: 'Protège-écran verre trempé', type: MovementType.OUT, quantity: 3, reason: 'Produits abîmés', ago: 6 },
      { name: 'Coque transparente iPhone 15', type: MovementType.ADJUSTMENT, quantity: 0, reason: 'Inventaire : plus aucun exemplaire en rayon', ago: 3 },
    ]
    for (const extra of extras) {
      const movement = await movements.create({
        productId: created.get(extra.name) as number,
        type: extra.type,
        quantity: extra.quantity,
        reason: extra.reason,
      })
      await setDate('stock_movements', 'createdAt', daysAgo(extra.ago, 11, 30), movement.id)
    }

    // 5. LES VENTES. On simule le stock restant pour ne jamais vendre plus qu'il n'en reste.
    const left = new Map<number, number>()
    for (const item of PRODUCTS) {
      const product = await products.findOne(created.get(item.name) as number)
      left.set(product.id, product.quantity)
    }
    const sellable = PRODUCTS.filter((item) => item.sellable).map((item) => ({
      ...item,
      id: created.get(item.name) as number,
    }))

    const saleTimes = buildSaleTimes(random)
    const createdSales: { id: number; when: Date }[] = []

    for (const when of saleTimes) {
      // Les produits dont il reste assez pour vendre SANS passer sous leur seuil d'alerte :
      // ainsi, les produits « en stock » le restent, et les alertes sont celles qu'on a choisies.
      const candidates = sellable.filter((p) => (left.get(p.id) ?? 0) > p.alertThreshold + 1)
      if (candidates.length === 0) continue

      // On mélange (algorithme de Fisher-Yates), puis on garde les 1 à 3 premiers
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
      }
      const lineCount = 1 + Math.floor(random() * 3)

      const items = candidates.slice(0, lineCount).map((p) => {
        const room = (left.get(p.id) as number) - p.alertThreshold - 1
        const quantity = 1 + Math.floor(random() * Math.min(p.maxPerSale, room))
        left.set(p.id, (left.get(p.id) as number) - quantity)
        return { productId: p.id, quantity }
      })

      // La vente passe par le vrai service : transaction, verrou, stock, mouvements
      const sale = await sales.create({ items })
      createdSales.push({ id: sale.id, when })

      // On recule la date de la vente et de ses mouvements de stock
      await setDate('sales', 'createdAt', when, sale.id)
      await db.query('UPDATE `stock_movements` SET `createdAt` = ? WHERE `reason` = ?', [
        when,
        `Vente n°${sale.id}`,
      ])
    }
    console.log(`${createdSales.length} ventes créées.`)

    // 6. DEUX ANNULATIONS, par le vrai service : le stock est remis et un mouvement est écrit
    for (const index of [4, 19]) {
      const target = createdSales[index]
      if (!target) continue

      await sales.cancel(target.id)

      // L'annulation a eu lieu 90 minutes après la vente
      const cancelledAt = new Date(target.when.getTime() + 90 * 60000)
      await setDate('sales', 'cancelledAt', cancelledAt, target.id)
      await db.query('UPDATE `stock_movements` SET `createdAt` = ? WHERE `reason` = ?', [
        cancelledAt,
        `Annulation vente n°${target.id}`,
      ])
    }
    console.log('2 ventes annulées.')

    console.log('')
    console.log('Données de démonstration prêtes. Comptes :')
    for (const account of DEMO_ACCOUNTS) {
      console.log(`  ${account.role === Role.MANAGER ? 'Gérant ' : 'Vendeur'} : ${account.email}  /  ${account.password}`)
    }
  } finally {
    // Dans tous les cas, on ferme proprement la connexion à la base
    await app.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})