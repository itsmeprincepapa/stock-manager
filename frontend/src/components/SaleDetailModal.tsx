import { useState } from 'react'
import { cancelSale } from '../api/sales'
import { getErrorMessage } from '../api/errors'
import { formatDateTime, formatMoney } from '../lib/format'
import type { Sale } from '../types'
import { Modal } from './Modal'
import { SaleStatusBadge } from './SaleStatusBadge'
import { dangerButton, secondaryButton } from './styles'

// Le détail d'une vente : ses lignes, son total, et (gérant) le bouton d'annulation.
export function SaleDetailModal({
  sale,
  canCancel,
  onClose,
  onCancelled,
}: {
  sale: Sale
  canCancel: boolean
  onClose: () => void
  onCancelled: (message: string) => void
}) {
  // confirming : le gérant a cliqué sur « Annuler cette vente » et doit encore confirmer
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleCancel() {
    setError('')
    setBusy(true)
    try {
      await cancelSale(sale.id)
      onCancelled(`La vente n°${sale.id} a été annulée. Le stock a été remis.`)
    } catch (err) {
      // Par exemple : « Cette vente est déjà annulée. » (409)
      setError(getErrorMessage(err))
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Vente n°${sale.id}`} onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">{formatDateTime(sale.createdAt)}</p>
        <SaleStatusBadge status={sale.status} />
      </div>

      {/* Si la vente est annulée, on le dit clairement */}
      {sale.status === 'CANCELLED' && sale.cancelledAt && (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          Annulée le {formatDateTime(sale.cancelledAt)}. Le stock des produits a été remis.
        </p>
      )}

      {/* Les lignes de la vente */}
      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">Produit</th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">Qté</th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-900">{item.product.name}</p>
                  {/* unitPrice : le prix AU MOMENT de la vente, pas le prix actuel du produit */}
                  <p className="text-xs text-slate-500">{formatMoney(item.unitPrice)} l’unité</p>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{item.quantity}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-slate-900">
                  {formatMoney(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-slate-600">Total</span>
        <span className="text-2xl font-extrabold tabular-nums text-slate-900">{formatMoney(sale.total)}</span>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      {/* Le bouton d'annulation : seulement pour le gérant, et seulement si la vente est valide */}
      {canCancel && sale.status === 'COMPLETED' && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          {confirming ? (
            // DEUXIÈME TEMPS : la confirmation
            <div>
              <p className="text-sm text-slate-700">
                Le stock des produits de cette vente sera remis et l’annulation sera inscrite dans
                l’historique. Cette action est définitive.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setConfirming(false)} className={secondaryButton}>
                  Retour
                </button>
                <button type="button" onClick={handleCancel} disabled={busy} className={dangerButton}>
                  {busy ? 'Annulation…' : 'Confirmer l’annulation'}
                </button>
              </div>
            </div>
          ) : (
            // PREMIER TEMPS : le bouton qui lance la demande
            <div className="flex justify-end">
              <button type="button" onClick={() => setConfirming(true)} className={secondaryButton}>
                Annuler cette vente
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}