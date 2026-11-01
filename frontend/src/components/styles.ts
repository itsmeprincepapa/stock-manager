// Les styles qui reviennent partout, écrits UNE fois ici.
// Si on veut changer l'apparence des boutons de toute l'application, on le fait ici.

// Un champ de saisie
export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/20'

// Le bouton principal : dégradé violet, pour l'action importante de l'écran
export const primaryButton =
  'rounded-xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:from-violet-500 hover:to-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60'

// Le bouton secondaire : blanc avec une bordure, pour « Annuler »
export const secondaryButton =
  'rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60'

// Le bouton dangereux : rouge, pour « Supprimer »
export const dangerButton =
  'rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60'