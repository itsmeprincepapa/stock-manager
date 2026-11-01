import { isCancel } from 'axios'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { deleteProduct, fetchProducts } from '../api/products'
import { useAuth } from '../auth/auth-context'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { ProductFormModal } from '../components/ProductFormModal'
import { StockBadge } from '../components/StockBadge'
import { dangerButton, primaryButton, secondaryButton } from '../components/styles'
import { formatMoney } from '../lib/format'
import type { Paginated, Product } from '../types'

// Nombre de produits par page.
// Astuce pour tester la pagination avec peu de produits : mets 2, puis remets 10.
const LIMIT = 10

export function ProductsPage() {
  const { isManager } = useAuth()

  const [search, setSearch] = useState('') // ce qui est tapé dans le champ
  const [query, setQuery] = useState('') // la recherche envoyée à l'API (retardée)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0) // on l'augmente pour relancer le chargement

  // Ce que le gérant est en train de faire :
  // editing : 'new' = ajouter, un produit = le modifier, null = rien
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [notice, setNotice] = useState('') // message de confirmation (vert)

  // RECHERCHE RETARDÉE (« debounce ») : on attend 300 ms sans frappe avant d'interroger l'API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // CHARGEMENT : se relance quand la page, la recherche ou « reload » changent
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchProducts({ page, limit: LIMIT, search: query || undefined }, controller.signal)
      .then(setResult)
      .catch((err) => {
        if (!isCancel(err)) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    // Si les paramètres changent avant la réponse, on annule la requête
    return () => controller.abort()
  }, [page, query, reload])

  // Le message de confirmation disparaît tout seul au bout de 4 secondes
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  const products = result?.data ?? []

  // Appelée par le formulaire quand l'enregistrement a réussi
  function handleSaved(message: string) {
    setEditing(null)
    setNotice(message)
    setReload((n) => n + 1) // on recharge la liste pour voir le changement
  }

  // Appelée quand le gérant confirme la suppression
  async function confirmDelete() {
    if (!deleting) return
    setDeleteError('')
    setDeleteBusy(true)
    try {
      await deleteProduct(deleting.id)
      setNotice(`Le produit « ${deleting.name} » a été supprimé.`)
      setDeleting(null)
      // S'il n'y avait qu'un produit sur cette page, on recule d'une page
      // (ce qui recharge déjà la liste). Sinon, on recharge simplement.
      if (products.length === 1 && page > 1) setPage(page - 1)
      else setReload((n) => n + 1)
    } catch (err) {
      // Par exemple : « Ce produit a un historique de ventes ou de stock... »
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Produits"
        description="Consultez le catalogue et surveillez les niveaux de stock."
      >
        {/* Le bouton d'ajout n'existe que pour le gérant */}
        {isManager && (
          <button type="button" onClick={() => setEditing('new')} className={primaryButton}>
            Ajouter un produit
          </button>
        )}
      </PageHeader>

      {/* Message de confirmation */}
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
        >
          {notice}
        </p>
      )}

      {/* Champ de recherche, avec une loupe à l'intérieur */}
      <div className="relative mb-4 max-w-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        >
          <path d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit"
          aria-label="Rechercher un produit"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {error ? (
          // ÉTAT D'ERREUR : on explique et on propose de réessayer
          <div className="p-10 text-center">
            <p className="font-medium text-slate-900">Impossible de charger les produits</p>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <button type="button" onClick={() => setReload((n) => n + 1)} className={`mt-4 ${primaryButton}`}>
              Réessayer
            </button>
          </div>
        ) : result === null ? (
          // ÉTAT DE CHARGEMENT (première fois) : des lignes grises qui pulsent
          <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Chargement des produits">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-4 motion-reduce:animate-none">
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="ml-auto h-4 w-20 rounded bg-slate-200" />
                <div className="h-6 w-24 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          // ÉTAT VIDE : on dit pourquoi et ce qu'on peut faire
          <div className="p-10 text-center">
            <p className="font-medium text-slate-900">
              {query ? 'Aucun produit trouvé' : 'Le catalogue est vide'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {query
                ? `Aucun produit ne correspond à « ${query} ». Essayez un autre mot.`
                : isManager
                  ? 'Ajoutez votre premier produit avec le bouton en haut de la page.'
                  : 'Aucun produit n’a encore été ajouté.'}
            </p>
          </div>
        ) : (
          <>
            {/* Le tableau défile horizontalement si l'écran est trop étroit */}
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-sm transition-opacity ${loading ? 'opacity-50' : ''}`}>
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Produit</th>
                    <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">Catégorie</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Prix</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Quantité</th>
                    <th scope="col" className="px-4 py-3 font-semibold">État</th>
                    {/* Colonne des actions : seulement pour le gérant */}
                    {isManager && (
                      <th scope="col" className="px-4 py-3 sm:px-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-violet-50/50">
                      <td className="px-4 py-3.5 font-medium text-slate-900 sm:px-6">{product.name}</td>
                      <td className="hidden px-4 py-3.5 sm:table-cell">
                        {product.category ? (
                          <span className="rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Aucune</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-slate-700">
                        {formatMoney(product.price)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3.5">
                        <StockBadge quantity={product.quantity} threshold={product.alertThreshold} />
                      </td>
                      {isManager && (
                        <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                          {/* aria-label précise de quel produit on parle (lecteurs d'écran) */}
                          <button
                            type="button"
                            onClick={() => setEditing(product)}
                            aria-label={`Modifier ${product.name}`}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-600"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError('')
                              setDeleting(product)
                            }}
                            aria-label={`Supprimer ${product.name}`}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600"
                          >
                            Supprimer
                          </button>
                        </td>
                      )}
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

      {/* Fenêtre d'ajout ou de modification */}
      {editing !== null && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Fenêtre de confirmation de suppression */}
      {deleting && (
        <Modal title="Supprimer ce produit ?" onClose={() => setDeleting(null)}>
          <p className="text-slate-700">
            Vous allez supprimer <strong>{deleting.name}</strong>. Cette action est définitive.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Un produit qui a déjà été vendu, ou dont le stock a bougé, ne peut pas être supprimé : son
            historique est conservé.
          </p>
          {deleteError && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {deleteError}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setDeleting(null)} className={secondaryButton}>
              Annuler
            </button>
            <button type="button" onClick={confirmDelete} disabled={deleteBusy} className={dangerButton}>
              {deleteBusy ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}