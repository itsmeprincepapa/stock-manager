import type { Sale } from '../types'

// Badge « Validée » ou « Annulée » : couleur ET mot, comme pour le stock
export function SaleStatusBadge({ status }: { status: Sale['status'] }) {
  const cancelled = status === 'CANCELLED'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        cancelled
          ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
          : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${cancelled ? 'bg-rose-500' : 'bg-emerald-500'}`}
        aria-hidden="true"
      />
      {cancelled ? 'Annulée' : 'Validée'}
    </span>
  )
}