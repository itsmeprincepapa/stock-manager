import type { Role } from '../types'

// Badge « Gérant » ou « Vendeur » : couleur ET mot
export function RoleBadge({ role }: { role: Role }) {
  const manager = role === 'MANAGER'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        manager
          ? 'bg-violet-50 text-violet-700 ring-violet-600/20'
          : 'bg-cyan-50 text-cyan-800 ring-cyan-600/20'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${manager ? 'bg-violet-500' : 'bg-cyan-500'}`} aria-hidden="true" />
      {manager ? 'Gérant' : 'Vendeur'}
    </span>
  )
}