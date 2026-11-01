// Page provisoire : elle sera remplacée par la vraie page, une par une.
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      <div className="mt-6 rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50 to-fuchsia-50 p-8">
        <p className="text-slate-700">Cette page est en construction.</p>
      </div>
    </div>
  )
}