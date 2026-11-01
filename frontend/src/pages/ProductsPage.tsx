import { isCancel } from 'axios'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { fetchProducts } from '../api/products'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { StockBadge } from '../components/StockBadge'
import { formatMoney } from '../lib/format'
import type { Paginated, Product } from '../types'

// Nombre de produits par page.
// Astuce pour tester la pagination avec peu de produits : mets 2, puis remets 10.
const LIMIT = 10

export function ProductsPage() {
  const [search, setSearch] = useState('') // ce qui est tapé dans le champ
  const [query, setQuery] = useState('') // la recherche envoyée à l'API (retardée)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0) // on l'augmente pour relancer le chargement

  // RECHERCHE RETARDÉE (« debounce ») : on n'interroge pas l'API à chaque touche.
  // On attend 300 ms sans frappe, puis on lance la recherche et on revient à la page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer) // chaque nouvelle touche annule le minuteur précédent
  }, [search])

  // CHARGEMENT : se relance quand la page, la recherche ou « reload » changent
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    fetchProducts({ page, limit: LIMIT, search: query || undefined }, controller.signal)
      .then(setResult)
      .catch((err) => {
        // Une requête annulée volontairement n'est pas une erreur à afficher
        if (!isCancel(err)) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    // Nettoyage : si les paramètres changent avant la réponse, on annule la requête.
    // Ainsi, une vieille réponse lente ne peut pas écraser une plus récente.
    return () => controller.abort()
  }, [page, query, reload])

  const products = result?.data ?? []

  return (
    <div>
      <PageHeader
        title="Produits"
        description="Consultez le catalogue et surveillez les niveaux de stock."
      />

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
            <button
              type="button"
              onClick={() => setReload((n) => n + 1)}
              className="mt-4 rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-violet-500 hover:to-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
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
                : 'Aucun produit n’a encore été ajouté.'}
            </p>
          </div>
        ) : (
          <>
            {/* Le tableau défile horizontalement si l'écran est trop étroit */}
            <div className="overflow-x-auto">
              {/* Pendant le chargement d'une autre page, on atténue les lignes déjà affichées */}
              <table className={`w-full text-left text-sm transition-opacity ${loading ? 'opacity-50' : ''}`}>
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-6">Produit</th>
                    <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">Catégorie</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Prix</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Quantité</th>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-6">État</th>
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
                      <td className="px-4 py-3.5 sm:px-6">
                        <StockBadge quantity={product.quantity} threshold={product.alertThreshold} />
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
    </div>
  )
}