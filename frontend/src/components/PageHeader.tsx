import type { ReactNode } from 'react'

// L'en-tête de chaque page : un titre, une phrase d'explication, et à droite
// un emplacement pour des boutons (children).
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-slate-600">{description}</p>}
      </div>
      {children}
    </div>
  )
}