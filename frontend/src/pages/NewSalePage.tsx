import { isCancel } from 'axios'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { fetchProducts } from '../api/products'
import { createSale } from '../api/sales'
import { PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { StockBadge } from '../components/StockBadge'
import { primaryButton } from '../components/styles'
import { formatMoney } from '../lib/format'
import type { Paginated, Product } from '../types'

// Nombre de produits affichés par page dans la liste de choix
const LIMIT = 8

// Une ligne du panier : un produit et la quantité voulue
interface CartLine {
  product: Product
  quantity: number
}

export function NewSalePage() {
  // --- La liste des produits (recherche, pagination, chargement) ---
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  // --- Le panier et la validation ---
  const [cart, setCart] = useState<CartLine[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [saleError, setSaleError] = useState('')
  const [notice, setNotice] = useState('')

  // Recherche retardée : on attend 300 ms sans frappe avant d'interroger l'API
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Chargement de la liste (annule la requête précédente si les paramètres changent)
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

    return () => controller.abort()
  }, [page, query, reload])

  // Le message de confirmation disparaît tout seul au bout de 6 secondes
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  // --- Les actions sur le panier ---
  // Important : en React, on ne MODIFIE jamais un tableau existant. On en fabrique un nouveau
  // (avec [...], .map, .filter) et on le donne à setCart : c'est ce qui déclenche l'affichage.

  // Ajoute un produit (ou +1 s'il y est déjà), sans dépasser le stock connu
  function addToCart(product: Product) {
    setSaleError('')
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id)
      if (!existing) return [...current, { product, quantity: 1 }]
      return current.map((line) =>
        line.product.id === product.id && line.quantity < product.quantity
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      )
    })
  }

  // Change la quantité d'une ligne : +1 ou -1. À 0, la ligne disparaît.
  function changeQuantity(productId: number, delta: number) {
    setSaleError('')
    setCart((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) return line
          const quantity = Math.min(line.quantity + delta, line.product.quantity)
          return { ...line, quantity }
        })
        .filter((line) => line.quantity > 0),
    )
  }

  function removeLine(productId: number) {
    setCart((current) => current.filter((line) => line.product.id !== productId))
  }

  // Valeurs CALCULÉES à partir du panier : on ne les stocke pas dans un état,
  // elles se recalculent à chaque affichage et ne peuvent donc jamais être « fausses ».
  const total = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  // Combien d'exemplaires d'un produit sont déjà dans le panier
  function inCart(productId: number) {
    return cart.find((line) => line.product.id === productId)?.quantity ?? 0
  }

  // Valide la vente : envoie le panier à l'API
  async function validateSale() {
    setSaleError('')
    setSubmitting(true)
    try {
      const sale = await createSale(
        cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      )
      setCart([])
      setNotice(`Vente n°${sale.id} enregistrée : ${formatMoney(sale.total)}.`)
    } catch (err) {
      // Par exemple : « Stock insuffisant pour « iPhone 15 » : il reste 1 unité(s). »
      setSaleError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
      // Dans tous les cas, on recharge la liste : le stock a peut-être changé
      setReload((n) => n + 1)
    }
  }

  const products = result?.data ?? []

  return (
    <div>
      <PageHeader title="Nouvelle vente" description="Choisissez les produits, puis validez le panier." />

      {/* Message de confirmation après une vente */}
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
        >
          {notice}
        </p>
      )}

      {/* Deux colonnes sur grand écran : produits (2/3) et panier (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LE PANIER. Sur téléphone il passe en premier (order-first), sur grand écran à droite. */}
        <section
          aria-label="Panier"
          className="order-first h-fit rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-8 lg:order-last"
        >
          <div className="rounded-t-2xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-5 py-4 text-white">
            <h2 className="font-bold">Panier</h2>
            <p className="text-sm text-white/80">
              {itemCount === 0 ? 'Aucun article' : `${itemCount} article${itemCount > 1 ? 's' : ''}`}
            </p>
          </div>

          {cart.length === 0 ? (
            <p className="p-5 text-sm text-slate-600">
              Le panier est vide. Ajoutez un produit depuis la liste.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cart.map((line) => (
                <li key={line.product.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{line.product.name}</p>
                    <p className="text-xs text-slate-500">{formatMoney(line.product.price)} l’unité</p>
                  </div>

                  {/* Les boutons − et + */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => changeQuantity(line.product.id, -1)}
                      aria-label={`Retirer un ${line.product.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-violet-600"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(line.product.id, 1)}
                      disabled={line.quantity >= line.product.quantity}
                      aria-label={`Ajouter un ${line.product.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.product.id)}
                    aria-label={`Supprimer ${line.product.name} du panier`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-600"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Le total et le bouton de validation */}
          <div className="space-y-3 border-t border-slate-200 p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-600">Total</span>
              <span className="text-2xl font-extrabold tabular-nums text-slate-900">{formatMoney(total)}</span>
            </div>

            {saleError && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {saleError}
              </p>
            )}

            <button
              type="button"
              onClick={validateSale}
              disabled={cart.length === 0 || submitting}
              className={`w-full ${primaryButton}`}
            >
              {submitting ? 'Validation…' : 'Valider la vente'}
            </button>
          </div>
        </section>

        {/* LA LISTE DES PRODUITS */}
        <section aria-label="Produits" className="lg:col-span-2">
          <div className="relative mb-4">
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
              <div className="p-10 text-center">
                <p className="font-medium text-slate-900">Impossible de charger les produits</p>
                <p className="mt-1 text-sm text-slate-600">{error}</p>
                <button type="button" onClick={() => setReload((n) => n + 1)} className={`mt-4 ${primaryButton}`}>
                  Réessayer
                </button>
              </div>
            ) : result === null ? (
              <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Chargement des produits">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-4 px-5 py-4 motion-reduce:animate-none">
                    <div className="h-4 w-1/3 rounded bg-slate-200" />
                    <div className="ml-auto h-8 w-24 rounded-lg bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-medium text-slate-900">{query ? 'Aucun produit trouvé' : 'Le catalogue est vide'}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {query ? `Aucun produit ne correspond à « ${query} ».` : 'Aucun produit n’a encore été ajouté.'}
                </p>
              </div>
            ) : (
              <>
                <ul className={`divide-y divide-slate-100 transition-opacity ${loading ? 'opacity-50' : ''}`}>
                  {products.map((product) => {
                    const alreadyInCart = inCart(product.id)
                    // On ne peut plus ajouter si le stock est épuisé, ou si tout le stock est déjà dans le panier
                    const unavailable = product.quantity === 0 || alreadyInCart >= product.quantity

                    return (
                      <li key={product.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <p className="text-sm text-slate-500">
                            {formatMoney(product.price)} · {product.quantity} en stock
                          </p>
                        </div>
                        <StockBadge quantity={product.quantity} threshold={product.alertThreshold} />
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={unavailable}
                          aria-label={`Ajouter ${product.name} au panier`}
                          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {alreadyInCart > 0 ? `Ajouter (${alreadyInCart})` : 'Ajouter'}
                        </button>
                      </li>
                    )
                  })}
                </ul>

                <Pagination
                  page={result.meta.page}
                  totalPages={result.meta.totalPages}
                  total={result.meta.total}
                  onChange={setPage}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}