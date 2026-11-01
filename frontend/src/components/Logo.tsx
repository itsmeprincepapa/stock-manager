// Le logo : un carré en dégradé avec une icône de colis.
// Il est utilisé sur la page de connexion et dans le menu de l'application.
export function Logo() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500 to-violet-500 shadow-lg shadow-fuchsia-950/40">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-white"
        aria-hidden="true"
      >
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    </span>
  )
}