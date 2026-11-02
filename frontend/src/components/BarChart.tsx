import { formatCompact } from '../lib/format'

// Une barre du graphique
export interface BarDatum {
  key: string // identifiant unique de la barre
  label: string // texte sous la barre, ex. « lun. »
  sublabel: string // petit texte sous le premier, ex. « 2 »
  value: number // la valeur dessinée
  description: string // la phrase lue par les lecteurs d'écran
}

// Un graphique en barres dessiné avec de simples éléments HTML : aucune bibliothèque.
// Chaque hauteur est un pourcentage de la plus grande valeur.
export function BarChart({ data, label }: { data: BarDatum[]; label: string }) {
  // La plus grande valeur sert de référence : sa barre occupe 100 % de la hauteur
  const max = Math.max(...data.map((item) => item.value), 0)

  return (
    // pt-6 : de la place en haut pour la valeur écrite au-dessus de la barre la plus haute
    <ul aria-label={label} className="flex h-64 items-stretch gap-2 pt-6 sm:gap-4">
      {data.map((item, index) => {
        const percent = max > 0 ? (item.value / max) * 100 : 0
        const isLast = index === data.length - 1 // la dernière barre est « aujourd'hui »

        return (
          <li key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            {/* Le texte pour les lecteurs d'écran : invisible, mais lu */}
            <span className="sr-only">{item.description}</span>

            {/* La zone où on dessine la barre. "relative" : les éléments absolus s'y placent. */}
            <div className="relative w-full flex-1" aria-hidden="true">
              {/* La valeur, au-dessus de la barre (cachée sur les très petits écrans) */}
              {item.value > 0 && (
                <span
                  className="absolute inset-x-0 hidden text-center text-xs font-medium tabular-nums text-slate-600 sm:block"
                  style={{ bottom: `calc(${percent}% + 6px)` }}
                >
                  {formatCompact(item.value)}
                </span>
              )}

              {/* La barre elle-même. Une valeur à 0 reste visible : une petite ligne grise. */}
              <div
                className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-14 rounded-t-lg transition-[height] duration-700 motion-reduce:transition-none ${
                  item.value === 0
                    ? 'bg-slate-200'
                    : isLast
                      ? 'bg-linear-to-t from-violet-600 to-fuchsia-500'
                      : 'bg-linear-to-t from-violet-300 to-fuchsia-300'
                }`}
                style={{ height: item.value === 0 ? '4px' : `${Math.max(percent, 3)}%` }}
              />
            </div>

            {/* Les étiquettes sous la barre */}
            <div className="text-center leading-tight" aria-hidden="true">
              <p className={`text-xs ${isLast ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{item.label}</p>
              <p className="text-xs text-slate-400">{item.sublabel}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}