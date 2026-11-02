import { isCancel } from 'axios'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { fetchProducts } from '../api/products'
import { fetchMovements } from '../api/stock'
import { useAuth } from '../auth/auth-context'
import { MovementFormModal } from '../components/MovementFormModal'
import { MovementTypeBadge } from '../components/MovementTypeBadge'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { inputClass, primaryButton } from '../components/styles'
import { formatDateTime } from '../lib/format'
import type { MovementType, Paginated, Product, StockMovement } from '../types'

// Nombre de mouvements par page
const LIMIT = 15

// La quantité d'un mouvement, écrite selon sa règle :
// une entrée AJOUTE (+5), une sortie RETIRE (−3), un ajustement FIXE le stock (= 8)
function formatQuantity(type: MovementType, quantity: number): string {
  if (type === 'IN') return `+${quantity}`
  if (type === 'OUT') return `−${quantity}`
  return `= ${quantity}`
}

export function StockPage() {
  const { isManager } = useAuth()

  const [productFilter, setProductFilter] = useState('') // '' = tous les produits
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<StockMovement> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  const [products, setProducts] = useState<Product[]>([]) // pour le filtre et le formulaire
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')

  // LA LISTE DES PRODUITS (menu du filtre et du formulaire).
  // On demande 100 produits, le maximum autorisé par l'API ; assez pour une boutique.
  // Elle se recharge aussi quand « reload » change, pour que les quantités restent à jour.
  useEffect(() => {
    let cancelled = false
    fetchProducts({ page: 1, limit: 100 })
      .then((list) => {
        if (!cancelled) setProducts(list.data)
      })
      .catch(() => {
        // Si ça échoue, le filtre reste vide : l'historique, lui, s'affiche quand même
      })
    return () => {
      cancelled = true
    }
  }, [reload])

  // L'HISTORIQUE : se relance quand la page, le filtre ou « reload » changent
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchMovements(
      { page, limit: LIMIT, productId: productFilter ? Number(productFilter) : undefined },
      controller.signal,
    )
      .then(setResult)
      .catch((err) => {
        if (!isCancel(err)) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [page, productFilter, reload])

  // Le message de confirmation disparaît tout seul au bout de 5 secondes
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  // Appelée par le formulaire quand l'enregistrement a réussi
  function handleSaved(message: string) {
    setShowForm(false)
    setNotice(message)
    setPage(1) // le nouveau mouvement est tout en haut, sur la première page
    setReload((n) => n + 1)
  }

  const movements = result?.data ?? []

  return (
    <div>
      <PageHeader
        title="Stock"
        description="L’historique de tous les mouvements : entrées, sorties, ventes et ajustements."
      >
        {isManager && (
          <button type="button" onClick={() => setShowForm(true)} className={primaryButton}>
            Enregistrer un mouvement
          </button>
        )}
      </PageHeader>

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
        >
          {notice}
        </p>
      )}

      {/* Le filtre par produit */}
      <div className="mb-4 max-w-md">
        <label htmlFor="stock-filter" className="sr-only">
          Filtrer par produit
        </label>
        <select
          id="stock-filter"
          value={productFilter}
          onChange={(e) => {
            setProductFilter(e.target.value)
            setPage(1) // un nouveau filtre repart de la première page
          }}
          className={inputClass}
        >
          <option value="">Tous les produits</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {error ? (
          // ÉTAT D'ERREUR
          <div className="p-10 text-center">
            <p className="font-medium text-slate-900">Impossible de charger l’historique</p>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <button type="button" onClick={() => setReload((n) => n + 1)} className={`mt-4 ${primaryButton}`}>
              Réessayer
            </button>
          </div>
        ) : result === null ? (
          // ÉTAT DE CHARGEMENT
          <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Chargement de l’historique">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-4 motion-reduce:animate-none">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-4 w-1/4 rounded bg-slate-200" />
                <div className="ml-auto h-6 w-20 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : movements.length === 0 ? (
          // ÉTAT VIDE
          <div className="p-10 text-center">
            <p className="font-medium text-slate-900">Aucun mouvement</p>
            <p className="mt-1 text-sm text-slate-600">
              {productFilter
                ? 'Ce produit n’a pas encore de mouvement de stock.'
                : 'Les mouvements apparaîtront ici dès qu’un produit sera ajouté ou vendu.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-sm transition-opacity ${loading ? 'opacity-50' : ''}`}>
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Date</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Produit</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Quantité</th>
                    <th scope="col" className="hidden px-4 py-3 font-semibold sm:px-6 md:table-cell">Motif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-violet-50/50">
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700 sm:px-6">
                        {formatDateTime(movement.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">{movement.product.name}</td>
                      <td className="px-4 py-3.5">
                        <MovementTypeBadge type={movement.type} />
                      </td>
                      <td className="px-4 py-3.5 text-right text-base font-semibold tabular-nums text-slate-900">
                        {formatQuantity(movement.type, movement.quantity)}
                      </td>
                      <td className="hidden px-4 py-3.5 text-slate-600 sm:px-6 md:table-cell">
                        {movement.reason ?? <span className="text-slate-400">Aucun motif</span>}
                      </td>
                    </tr>
                  ))}
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

      {/* Le formulaire d'un nouveau mouvement */}
      {showForm && (
        <MovementFormModal
          products={products}
          defaultProductId={productFilter ? Number(productFilter) : undefined}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}