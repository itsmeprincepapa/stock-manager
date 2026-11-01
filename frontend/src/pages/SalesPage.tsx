import { isCancel } from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../api/errors'
import { fetchSales } from '../api/sales'
import { useAuth } from '../auth/auth-context'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { SaleDetailModal } from '../components/SaleDetailModal'
import { SaleStatusBadge } from '../components/SaleStatusBadge'
import { primaryButton } from '../components/styles'
import { formatDateTime, formatMoney } from '../lib/format'
import type { Paginated, Sale } from '../types'

// Nombre de ventes par page
const LIMIT = 10

export function SalesPage() {
  const { isManager } = useAuth()

  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<Sale> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0) // on l'augmente pour relancer le chargement

  const [selected, setSelected] = useState<Sale | null>(null) // la vente dont on affiche le détail
  const [notice, setNotice] = useState('') // message de confirmation (vert)

  // CHARGEMENT : se relance quand la page ou « reload » changent
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchSales({ page, limit: LIMIT }, controller.signal)
      .then(setResult)
      .catch((err) => {
        if (!isCancel(err)) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [page, reload])

  // Le message de confirmation disparaît tout seul au bout de 5 secondes
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  // Appelée par la fenêtre de détail quand l'annulation a réussi
  function handleCancelled(message: string) {
    setSelected(null)
    setNotice(message)
    setReload((n) => n + 1) // on recharge la liste pour voir le nouveau statut
  }

  const sales = result?.data ?? []

  return (
    <div>
      <PageHeader title="Ventes" description="L’historique de toutes les ventes, de la plus récente à la plus ancienne.">
        {/* Link est un lien de navigation (sans rechargement), ici habillé comme un bouton */}
        <Link to="/sales/new" className={`inline-block ${primaryButton}`}>
          Nouvelle vente
        </Link>
      </PageHeader>

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
        >
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {error ? (
          // ÉTAT D'ERREUR
          <div className="p-10 text-center">
            <p className="font-medium text-slate-900">Impossible de charger les ventes</p>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <button type="button" onClick={() => setReload((n) => n + 1)} className={`mt-4 ${primaryButton}`}>
              Réessayer
            </button>
          </div>
        ) : result === null ? (
          // ÉTAT DE CHARGEMENT
          <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Chargement des ventes">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-4 motion-reduce:animate-none">
                <div className="h-4 w-12 rounded bg-slate-200" />
                <div className="h-4 w-1/4 rounded bg-slate-200" />
                <div className="ml-auto h-4 w-24 rounded bg-slate-200" />
                <div className="h-6 w-20 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : sales.length === 0 ? (
          // ÉTAT VIDE
          <div className="p-10 text-center">
            <p className="font-medium text-slate-900">Aucune vente pour le moment</p>
            <p className="mt-1 text-sm text-slate-600">Les ventes enregistrées apparaîtront ici.</p>
            <Link to="/sales/new" className={`mt-4 inline-block ${primaryButton}`}>
              Enregistrer une vente
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-sm transition-opacity ${loading ? 'opacity-50' : ''}`}>
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-6">N°</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                    <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Articles</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                    <th scope="col" className="px-4 py-3 font-semibold">État</th>
                    <th scope="col" className="px-4 py-3 sm:px-6">
                      <span className="sr-only">Détails</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((sale) => {
                    // Nombre d'articles = somme des quantités de toutes les lignes
                    const articles = sale.items.reduce((sum, item) => sum + item.quantity, 0)
                    const cancelled = sale.status === 'CANCELLED'

                    return (
                      <tr key={sale.id} className="hover:bg-violet-50/50">
                        <td className="px-4 py-3.5 font-semibold text-slate-900 sm:px-6">#{sale.id}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                          {formatDateTime(sale.createdAt)}
                        </td>
                        <td className="hidden px-4 py-3.5 text-right tabular-nums text-slate-700 sm:table-cell">
                          {articles}
                        </td>
                        {/* Une vente annulée a son total en gris : il ne compte plus */}
                        <td
                          className={`whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums ${
                            cancelled ? 'text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {formatMoney(sale.total)}
                        </td>
                        <td className="px-4 py-3.5">
                          <SaleStatusBadge status={sale.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                          <button
                            type="button"
                            onClick={() => setSelected(sale)}
                            aria-label={`Voir le détail de la vente n°${sale.id}`}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-600"
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={result.meta.page}
              totalPages={result.meta.totalPages}
              total={result.meta.total}
              onChange={setPage}
            />
          </>
        )}
      </div>

      {/* La fenêtre de détail, ouverte quand une vente est sélectionnée */}
      {selected && (
        <SaleDetailModal
          sale={selected}
          canCancel={isManager}
          onClose={() => setSelected(null)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  )
}