import { useEffect, useId, useRef, type ReactNode } from 'react'

// Une fenêtre modale : elle s'affiche par-dessus la page, le reste est assombri.
// On utilise l'élément HTML natif <dialog> : le navigateur s'occupe tout seul
// de garder le clavier dans la fenêtre et de la fermer avec la touche Échap.
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId() // un identifiant unique, pour relier le titre à la fenêtre (accessibilité)

  // À l'apparition du composant, on ouvre la fenêtre en mode « modal ».
  // Le test !dialog.open évite de l'ouvrir deux fois (React le fait en développement).
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Échap déclenche l'événement « close » du navigateur : on prévient la page
      onClose={onClose}
      // Un clic sur le fond assombri (qui est la cible du <dialog> lui-même) ferme la fenêtre
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      // m-auto : centre la fenêtre (Tailwind remet les marges à zéro par défaut)
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-indigo-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-violet-600"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}