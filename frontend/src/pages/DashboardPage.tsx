import { isCancel } from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboard } from '../api/dashboard'
import { getErrorMessage } from '../api/errors'
import { fetchLowStock } from '../api/products'
import { useAuth } from '../auth/auth-context'
import { BarChart, type BarDatum } from '../components/BarChart'
import { PageHeader } from '../components/PageHeader'
import { StockBadge } from '../components/StockBadge'
import { primaryButton } from '../components/styles'
import { formatMoney } from '../lib/format'
import type { DashboardStats, Product } from '../types'

// Le style commun des cartes blanches
const card = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200'

// Outils d'affichage des dates : « lun. » et « lundi 2 novembre »
const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
const fullDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

// Transforme une date en clé « 2026-11-02 », le même format que celui de l'API
function dayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// L'API ne renvoie que les jours où il y a eu des ventes.
// Pour le graphique, on construit nous-mêmes les 7 derniers jours (aujourd'hui compris)
// et on met 0 pour ceux qui ne sont pas dans la réponse.
function buildLastSevenDays(daily: DashboardStats['dailyRevenue']): BarDatum[] {
  const totals = new Map<string, number>(daily.map((item) => [item.day, item.total]))

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index)) // index 0 = il y a 6 jours, index 6 = aujourd'hui
    const key = dayKey(date)
    const value = totals.get(key) ?? 0

    return {
      key,
      label: weekday.format(date),
      sublabel: String(date.getDate()),
      value,
      description: `${fullDate.format(date)} : ${formatMoney(value)}`,
    }
  })
}

// « 1 vente », « 3 ventes »
function sales(count: number): string {
  return `${count} vente${count > 1 ? 's' : ''}`
}

export function DashboardPage() {
  const { user } = useAuth()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  // CHARGEMENT : les deux requêtes sont indépendantes, on les lance EN MÊME TEMPS
  // avec Promise.all (comme dans ton backend), puis on attend les deux réponses.
  useEffect(() => {
    const controller = new AbortController()
    setError('')

    Promise.all([fetchDashboard(controller.signal), fetchLowStock(controller.signal)])
      .then(([dashboard, low]) => {
        setStats(dashboard)
        setLowStock(low)
      })
      .catch((err) => {
        if (!isCancel(err)) setError(getErrorMessage(err))
      })

    return () => controller.abort()
  }, [reload])

  const firstName = user?.name.split(' ')[0]

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={`Bonjour ${firstName}, voici l’état de votre boutique.`}
      />

      {error ? (
        // ÉTAT D'ERREUR
        <div className={`${card} p-10 text-center`}>
          <p className="font-medium text-slate-900">Impossible de charger le tableau de bord</p>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
          <button type="button" onClick={() => setReload((n) => n + 1)} className={`mt-4 ${primaryButton}`}>
            Réessayer
          </button>
        </div>
      ) : stats === null ? (
        // ÉTAT DE CHARGEMENT : des blocs gris qui pulsent, à la place des vraies cartes
        <div className="grid animate-pulse gap-6 lg:grid-cols-3 motion-reduce:animate-none" aria-busy="true" aria-label="Chargement">
          <div className="h-44 rounded-2xl bg-slate-200 lg:col-span-2" />
          <div className="h-44 rounded-2xl bg-slate-200" />
          <div className="h-80 rounded-2xl bg-slate-200 lg:col-span-2" />
          <div className="h-80 rounded-2xl bg-slate-200" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* LIGNE 1 : le chiffre du jour (grande carte en dégradé) et le mois */}
          <div className="grid gap-6 lg:grid-cols-3">
            <section
              aria-label="Aujourd’hui"
              className="rounded-2xl bg-linear-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-6 text-white shadow-lg shadow-fuchsia-900/20 sm:p-8 lg:col-span-2"
            >
              <p className="text-sm font-medium text-white/80">Chiffre d’affaires du jour</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
                {formatMoney(stats.salesToday.total)}
              </p>
              <p className="mt-3 text-white/85">
                {stats.salesToday.count === 0
                  ? 'Aucune vente pour le moment.'
                  : `${sales(stats.salesToday.count)} aujourd’hui.`}
              </p>
              <Link
                to="/sales/new"
                className="mt-6 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 shadow transition hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Nouvelle vente
              </Link>
            </section>

            <section aria-label="Ce mois-ci" className={card}>
              <p className="text-sm font-medium text-slate-600">Ce mois-ci</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900">
                {formatMoney(stats.salesThisMonth.total)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{sales(stats.salesThisMonth.count)}</p>
              <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <strong className="text-slate-900">{stats.productCount}</strong> produit
                {stats.productCount > 1 ? 's' : ''} au catalogue
              </p>
            </section>
          </div>

          {/* LIGNE 2 : le graphique des 7 jours et les alertes de stock */}
          <div className="grid gap-6 lg:grid-cols-3">
            <section aria-label="Chiffre d’affaires des 7 derniers jours" className={`${card} lg:col-span-2`}>
              <h2 className="font-bold text-slate-900">Chiffre d’affaires, 7 derniers jours</h2>
              <p className="text-sm text-slate-600">Les ventes annulées ne sont pas comptées.</p>
              <div className="mt-2">
                <BarChart
                  data={buildLastSevenDays(stats.dailyRevenue)}
                  label="Chiffre d’affaires par jour sur les 7 derniers jours"
                />
              </div>
            </section>

            <section aria-label="Stock à surveiller" className={card}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-bold text-slate-900">Stock à surveiller</h2>
                {stats.lowStockCount > 0 && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                    {stats.lowStockCount} produit{stats.lowStockCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {lowStock.length === 0 ? (
                <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  Tout va bien : aucun produit n’est en stock faible.
                </p>
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-slate-100">
                    {/* On n'affiche que les 5 plus urgents : la liste est triée par quantité croissante */}
                    {lowStock.slice(0, 5).map((product) => (
                      <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">
                            {product.quantity} en stock, seuil {product.alertThreshold}
                          </p>
                        </div>
                        <StockBadge quantity={product.quantity} threshold={product.alertThreshold} />
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/stock"
                    className="mt-3 inline-block rounded-lg py-1 text-sm font-semibold text-violet-700 hover:text-violet-900 focus-visible:outline-2 focus-visible:outline-violet-600"
                  >
                    Enregistrer une entrée de stock
                  </Link>
                </>
              )}
            </section>
          </div>

          {/* LIGNE 3 : les produits les plus vendus */}
          <section aria-label="Produits les plus vendus" className={card}>
            <h2 className="font-bold text-slate-900">Les plus vendus</h2>
            <p className="text-sm text-slate-600">Sur les 30 derniers jours, en nombre d’exemplaires.</p>

            {stats.topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">Aucune vente sur cette période.</p>
            ) : (
              <ol className="mt-5 space-y-4">
                {stats.topProducts.map((product, index) => {
                  // La longueur de la barre est proportionnelle au meilleur vendeur (le premier)
                  const best = stats.topProducts[0].quantitySold
                  const percent = best > 0 ? (product.quantitySold / best) * 100 : 0

                  return (
                    <li key={product.productId}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-medium text-slate-900">
                          <span className="mr-2 text-slate-400 tabular-nums">{index + 1}.</span>
                          {product.name}
                        </p>
                        <p className="shrink-0 text-sm text-slate-600">
                          <strong className="tabular-nums text-slate-900">{product.quantitySold}</strong> vendu
                          {product.quantitySold > 1 ? 's' : ''}
                          <span className="hidden sm:inline"> · {formatMoney(product.revenue)}</span>
                        </p>
                      </div>
                      {/* La barre : un fond gris, et par-dessus la partie colorée à la bonne largeur */}
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  )
}