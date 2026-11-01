// Un badge qui dit l'état du stock : couleur ET mot (jamais la couleur seule,
// pour que ce soit lisible aussi par les personnes qui distinguent mal les couleurs).
export function StockBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  // On choisit l'état selon la quantité
  const state =
    quantity === 0
      ? { label: 'Rupture', style: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' }
      : quantity <= threshold
        ? { label: 'Stock faible', style: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' }
        : { label: 'En stock', style: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${state.style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} aria-hidden="true" />
      {state.label}
    </span>
  )
}