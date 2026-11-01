import { useEffect, useState } from 'react'

// Les diapositives. Les images se placent dans frontend/public/images/.
// "fond" est un dégradé affiché sous l'image : il apparaît si l'image est absente
// ou pendant qu'elle charge.
const SLIDES = [
  {
    src: '/images/slide-1.jpg',
    fond: 'from-violet-700 to-fuchsia-600',
    label: 'Rayons d’une boutique',
  },
  {
    src: '/images/slide-2.jpg',
    fond: 'from-indigo-700 to-cyan-500',
    label: 'Smartphones et accessoires',
  },
  {
    src: '/images/slide-3.jpg',
    fond: 'from-fuchsia-700 to-rose-500',
    label: 'Caisse et encaissement',
  },
]

// Temps d'affichage de chaque diapositive, en millisecondes
const DELAY = 6000

export function BackgroundCarousel() {
  // L'indice de la diapositive affichée (0, 1 ou 2)
  const [active, setActive] = useState(0)

  // À chaque changement de diapositive, on programme le passage à la suivante.
  // Quand l'utilisateur clique sur un point, "active" change et le minuteur repart de zéro.
  useEffect(() => {
    // Si l'utilisateur a demandé moins d'animations dans son système, on ne fait rien défiler
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = setTimeout(() => {
      setActive((current) => (current + 1) % SLIDES.length)
    }, DELAY)

    // Nettoyage : on annule le minuteur si le composant disparaît ou si "active" change
    return () => clearTimeout(timer)
  }, [active])

  return (
    <>
      {/* Les diapositives : toutes empilées, seule celle de l'indice actif est visible.
          La transition d'opacité crée le fondu enchaîné. */}
      <div className="absolute inset-0" aria-hidden="true">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={`absolute inset-0 bg-linear-to-br ${slide.fond} transition-opacity duration-1000 motion-reduce:transition-none ${
              index === active ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.src}
              alt=""
              className="h-full w-full object-cover"
              // Si l'image n'existe pas, on la masque : le dégradé reste visible
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          </div>
        ))}

        {/* Voile en dégradé par-dessus les images : il unifie les couleurs
            et rend le texte blanc toujours lisible */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950/85 via-violet-900/60 to-fuchsia-700/40" />
      </div>

      {/* Les points de navigation (visibles sur grand écran) */}
      <div className="absolute bottom-10 left-12 z-10 hidden gap-2 lg:flex">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Afficher l’image : ${slide.label}`}
            aria-current={index === active}
            className={`h-2.5 rounded-full transition-all duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              index === active ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </>
  )
}