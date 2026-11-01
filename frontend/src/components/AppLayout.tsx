import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { Logo } from './Logo'

// Une icône : on lui donne les tracés (paths) du dessin, elle fabrique le SVG
function Icon({ paths, className = 'h-5 w-5' }: { paths: string[]; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

// Les entrées du menu. managerOnly : visible seulement pour le gérant.
const MENU = [
  {
    to: '/dashboard',
    label: 'Tableau de bord',
    managerOnly: true,
    icon: ['M3 3v18h18', 'M7 14l4-4 3 3 5-6'],
  },
  {
    to: '/products',
    label: 'Produits',
    managerOnly: false,
    icon: ['M21 8l-9-5-9 5 9 5 9-5z', 'M3 8v8l9 5 9-5V8', 'M12 13v8'],
  },
    {
    to: '/sales/new',
    label: 'Nouvelle vente',
    managerOnly: false,
    icon: ['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M12 8v8', 'M8 12h8'],
  },
  {
    to: '/sales',
    label: 'Ventes',
    managerOnly: false,
    icon: ['M4 7h16v10H4z', 'M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z'],
  },
  {
    to: '/stock',
    label: 'Stock',
    managerOnly: false,
    icon: ['M7 4v16m0 0l-3-3m3 3l3-3', 'M17 20V4m0 0l-3 3m3-3l3 3'],
  },
  {
    to: '/users',
    label: 'Utilisateurs',
    managerOnly: true,
    icon: ['M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M10 11a4 4 0 100-8 4 4 0 000 8z'],
  },
]

export function AppLayout() {
  const { user, isManager, logout } = useAuth()

  // Sur téléphone, le menu est un tiroir : cet état dit s'il est ouvert
  const [open, setOpen] = useState(false)

  // On ne garde que les entrées auxquelles l'utilisateur a droit.
  // Attention : cacher une entrée est du CONFORT. La vraie protection est dans l'API.
  const items = MENU.filter((item) => !item.managerOnly || isManager)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fond sombre derrière le tiroir ouvert (téléphone seulement) : un clic le ferme */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Le menu. Sur grand écran (lg:) il est fixe à gauche.
          Sur téléphone, il est poussé hors de l'écran (-translate-x-full) tant qu'il est fermé. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-linear-to-b from-indigo-950 via-violet-950 to-indigo-950 text-white transition-transform duration-300 motion-reduce:transition-none lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <Logo />
          <span className="text-lg font-bold">Stock Manager</span>
        </div>

        {/* Les liens. NavLink sait si son adresse est celle de la page affichée (isActive) */}
        <nav aria-label="Navigation principale" className="flex-1 space-y-1 px-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  isActive
                    ? 'bg-linear-to-r from-violet-500/40 to-fuchsia-500/30 text-white ring-1 ring-white/15'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon paths={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* En bas : la personne connectée et le bouton de déconnexion */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 px-2 pb-3">
            {/* Pastille avec la première lettre du nom */}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-violet-500 font-bold text-white">
              {user?.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-white/60">{isManager ? 'Gérant' : 'Vendeur'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Icon paths={['M15 17l5-5-5-5', 'M20 12H9', 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4']} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Tout ce qui est à droite du menu. lg:pl-72 laisse la place du menu fixe. */}
      <div className="lg:pl-72">
        {/* Barre du haut : visible seulement sur téléphone (lg:hidden) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-linear-to-r from-indigo-950 to-violet-900 px-4 text-white lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Icon paths={['M4 6h16M4 12h16M4 18h16']} />
          </button>
          <span className="font-bold">Stock Manager</span>
        </header>

        {/* L'emplacement de la page : Outlet affiche la page enfant choisie par l'adresse */}
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}