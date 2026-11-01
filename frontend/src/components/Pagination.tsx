// Les boutons « Précédent / Suivant » sous une liste paginée
export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
}) {
  // Style commun aux deux boutons
  const button =
    'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-6">
      <p className="text-sm text-slate-600">
        Page {page} sur {Math.max(totalPages, 1)} : {total} résultat{total > 1 ? 's' : ''}
      </p>
      <div className="flex gap-2">
        {/* disabled : impossible d'aller avant la page 1 ou après la dernière */}
        <button type="button" className={button} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Précédent
        </button>
        <button type="button" className={button} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Suivant
        </button>
      </div>
    </div>
  )
}