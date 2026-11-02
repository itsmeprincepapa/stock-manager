import type { MovementType } from '../types'

// Les trois types, avec leur mot et leurs couleurs.
// Couleur ET mot : jamais la couleur seule.
const TYPES: Record<MovementType, { label: string; style: string; dot: string }> = {
  IN: { label: 'Entrée', style: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  OUT: { label: 'Sortie', style: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  ADJUSTMENT: { label: 'Ajustement', style: 'bg-cyan-50 text-cyan-800 ring-cyan-600/20', dot: 'bg-cyan-500' },
}

export function MovementTypeBadge({ type }: { type: MovementType }) {
  const state = TYPES[type]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${state.style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} aria-hidden="true" />
      {state.label}
    </span>
  )
}