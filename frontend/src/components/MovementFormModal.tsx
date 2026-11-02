import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { createMovement } from '../api/stock'
import type { MovementType, Product } from '../types'
import { Modal } from './Modal'
import { inputClass, primaryButton, secondaryButton } from './styles'

// Les trois choix de type, avec l'explication affichée sous les boutons
const OPTIONS: { value: MovementType; label: string; hint: string }[] = [
  {
    value: 'IN',
    label: 'Entrée',
    hint: 'Ajoute cette quantité au stock (réapprovisionnement).',
  },
  {
    value: 'OUT',
    label: 'Sortie',
    hint: 'Retire cette quantité du stock (casse, perte). Les ventes enregistrent déjà leurs sorties toutes seules.',
  },
  {
    value: 'ADJUSTMENT',
    label: 'Ajustement',
    hint: 'Le stock devient exactement cette quantité (après un inventaire).',
  },
]

export function MovementFormModal({
  products,
  defaultProductId,
  onClose,
  onSaved,
}: {
  products: Product[]
  defaultProductId?: number
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const [productId, setProductId] = useState(defaultProductId ? String(defaultProductId) : '')
  const [type, setType] = useState<MovementType>('IN')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Le produit choisi, retrouvé dans la liste (undefined tant qu'on n'en a pas choisi)
  const product = products.find((p) => String(p.id) === productId)
  const amount = Number(quantity)

  // APERÇU : le stock tel qu'il sera après le mouvement.
  // C'est une valeur CALCULÉE, pas un état : elle se met à jour toute seule à chaque saisie.
  let after: number | null = null
  if (product && quantity !== '' && Number.isFinite(amount)) {
    if (type === 'IN') after = product.quantity + amount
    else if (type === 'OUT') after = product.quantity - amount
    else after = amount
  }
  // Une sortie plus grande que le stock serait refusée par l'API : on bloque avant
  const tooMuch = after !== null && after < 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product) return
    setError('')
    setSaving(true)

    try {
      await createMovement({
        productId: product.id,
        type,
        quantity: amount,
        // L'API refuse un motif vide : on ne l'envoie que s'il y a du texte
        ...(reason.trim() && { reason: reason.trim() }),
      })
      onSaved(`Mouvement enregistré pour « ${product.name} ».`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const label = 'mb-1.5 block text-sm font-medium text-slate-700'
  const current = OPTIONS.find((option) => option.value === type)

  return (
    <Modal title="Enregistrer un mouvement de stock" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="movement-product" className={label}>
            Produit
          </label>
          <select
            id="movement-product"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className={inputClass}
          >
            <option value="">Choisir un produit</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (stock : {p.quantity})
              </option>
            ))}
          </select>
        </div>

        {/* Les trois types, en boutons radio habillés.
            Le vrai <input type="radio"> est caché visuellement (sr-only) mais reste utilisable
            au clavier ; "peer-checked" colore le bouton voisin quand il est coché. */}
        <fieldset>
          <legend className={label}>Type de mouvement</legend>
          <div className="grid grid-cols-3 gap-2">
            {OPTIONS.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="movement-type"
                  value={option.value}
                  checked={type === option.value}
                  onChange={() => setType(option.value)}
                  className="peer sr-only"
                />
                <span className="block rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-700 transition peer-checked:border-transparent peer-checked:bg-linear-to-r peer-checked:from-violet-600 peer-checked:to-fuchsia-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet-600">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-600">{current?.hint}</p>
        </fieldset>

        <div>
          <label htmlFor="movement-quantity" className={label}>
            {type === 'ADJUSTMENT' ? 'Nouveau stock' : 'Quantité'}
          </label>
          <input
            id="movement-quantity"
            type="number"
            required
            // Une entrée ou une sortie doit être d'au moins 1 ; un ajustement peut valoir 0
            min={type === 'ADJUSTMENT' ? 0 : 1}
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* L'aperçu : seulement quand on a choisi un produit et saisi une quantité */}
        {product && after !== null && (
          <p
            className={`rounded-xl p-3 text-sm ${
              tooMuch ? 'border border-amber-200 bg-amber-50 text-amber-900' : 'bg-slate-50 text-slate-700'
            }`}
          >
            {tooMuch ? (
              <>Impossible : il ne reste que <strong>{product.quantity}</strong> unité(s) de ce produit.</>
            ) : (
              <>
                Stock actuel : <strong>{product.quantity}</strong>, après le mouvement :{' '}
                <strong className="text-slate-900">{after}</strong>.
              </>
            )}
          </p>
        )}

        <div>
          <label htmlFor="movement-reason" className={label}>
            Motif <span className="font-normal text-slate-500">(facultatif)</span>
          </label>
          <input
            id="movement-reason"
            maxLength={255}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. livraison fournisseur, produit cassé, inventaire"
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Annuler
          </button>
          <button type="submit" disabled={saving || !product || tooMuch} className={primaryButton}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}