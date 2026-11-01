import { useEffect, useState, type FormEvent } from 'react'
import { createCategory, fetchCategories } from '../api/categories'
import { getErrorMessage } from '../api/errors'
import { createProduct, updateProduct } from '../api/products'
import type { Category, Product } from '../types'
import { Modal } from './Modal'
import { inputClass, primaryButton, secondaryButton } from './styles'

// Le formulaire d'un produit. Il sert à CRÉER (product = null) et à MODIFIER (product = le produit).
export function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const isEdit = product !== null

  // Un état par champ. Les champs numériques sont gardés en texte pendant la saisie.
  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [quantity, setQuantity] = useState('0')
  const [threshold, setThreshold] = useState(product ? String(product.alertThreshold) : '5')
  // Le choix de catégorie : '' = aucune, un id en texte, ou 'new' = en créer une
  const [categoryChoice, setCategoryChoice] = useState(product?.category ? String(product.category.id) : '')
  const [newCategory, setNewCategory] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // À l'ouverture, on charge la liste des catégories pour le menu déroulant.
  // "cancelled" évite de modifier l'état si la fenêtre a été fermée entre-temps.
  useEffect(() => {
    let cancelled = false
    fetchCategories()
      .then((list) => {
        if (!cancelled) setCategories(list)
      })
      .catch(() => {
        // Si ça échoue, le menu reste vide : on peut quand même enregistrer sans catégorie
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      // 1. Quelle catégorie ? Si le gérant en crée une nouvelle, on la crée d'abord.
      let categoryId: number | null = null
      if (categoryChoice === 'new') {
        if (newCategory.trim()) {
          const created = await createCategory(newCategory.trim())
          categoryId = created.id
        }
      } else if (categoryChoice) {
        categoryId = Number(categoryChoice)
      }

      // 2. On enregistre le produit
      const base = {
        name: name.trim(),
        price: Number(price),
        alertThreshold: Number(threshold),
      }

      if (isEdit) {
        // À la modification, null retire la catégorie du produit
        await updateProduct(product.id, { ...base, categoryId })
        onSaved(`Le produit « ${base.name} » a été modifié.`)
      } else {
        // À la création, on n'envoie categoryId que s'il y en a un
        await createProduct({
          ...base,
          quantity: Number(quantity),
          ...(categoryId !== null && { categoryId }),
        })
        onSaved(`Le produit « ${base.name} » a été ajouté.`)
      }
    } catch (err) {
      // On affiche le message de l'API, par exemple « Cette catégorie existe déjà. »
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const label = 'mb-1.5 block text-sm font-medium text-slate-700'

  return (
    <Modal title={isEdit ? 'Modifier le produit' : 'Ajouter un produit'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="product-name" className={label}>
            Nom du produit
          </label>
          <input
            id="product-name"
            required
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-price" className={label}>
              Prix (F CFA)
            </label>
            <input
              id="product-price"
              type="number"
              required
              min="0"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="product-threshold" className={label}>
              Seuil d’alerte
            </label>
            <input
              id="product-threshold"
              type="number"
              required
              min="0"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* La quantité se saisit seulement à la création */}
        {isEdit ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            Stock actuel : <strong className="text-slate-900">{product.quantity}</strong>. Il se
            modifie par les mouvements de stock et les ventes, pas depuis ce formulaire.
          </p>
        ) : (
          <div>
            <label htmlFor="product-quantity" className={label}>
              Quantité initiale en stock
            </label>
            <input
              id="product-quantity"
              type="number"
              required
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="product-category" className={label}>
            Catégorie
          </label>
          <select
            id="product-category"
            value={categoryChoice}
            onChange={(e) => setCategoryChoice(e.target.value)}
            className={inputClass}
          >
            <option value="">Aucune catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value="new">+ Nouvelle catégorie…</option>
          </select>
        </div>

        {/* Ce champ n'apparaît que si « Nouvelle catégorie » est choisi */}
        {categoryChoice === 'new' && (
          <div>
            <label htmlFor="new-category" className={label}>
              Nom de la nouvelle catégorie
            </label>
            <input
              id="new-category"
              required
              maxLength={100}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Annuler
          </button>
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  )
}