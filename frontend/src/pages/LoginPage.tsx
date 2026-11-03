import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/errors'
import { useAuth } from '../auth/auth-context'
import { BackgroundCarousel } from '../components/BackgroundCarousel'
import { Logo } from '../components/Logo'
import { DEMO_ACCOUNTS, SHOW_DEMO_ACCOUNTS } from '../lib/demo'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  // Un état par information qui change à l'écran
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // afficher ou masquer le mot de passe
  const [error, setError] = useState('') // message d'erreur à afficher
  const [loading, setLoading] = useState(false) // true pendant l'appel à l'API

  // Déjà connecté : inutile de montrer le formulaire
  if (user) return <Navigate to="/" replace />

  // Appelée quand on valide le formulaire
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Empêche le navigateur de recharger la page (son comportement par défaut)
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Connexion réussie : on va à l'accueil
      navigate('/', { replace: true })
    } catch (err) {
      // On affiche le message de l'API (ex. « Email ou mot de passe incorrect. »)
      setError(getErrorMessage(err))
    } finally {
      // Dans tous les cas, l'appel est terminé
      setLoading(false)
    }
  }

  // Remplit le formulaire avec un compte de démonstration (sans se connecter)
  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
  }

  return (
    // Page entière : le diaporama est derrière (position absolute), le contenu par-dessus
    <div className="relative min-h-screen overflow-hidden bg-indigo-950">
      <BackgroundCarousel />

      {/* Deux colonnes sur grand écran : message à gauche, formulaire à droite */}
      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* Colonne de gauche : visible seulement sur grand écran */}
        <section className="hidden flex-col justify-between p-12 pb-24 lg:flex">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-lg font-bold text-white">Stock Manager</span>
          </div>

          <div>
            <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
              Votre stock et vos ventes, au même endroit.
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/80">
              Suivez vos produits, encaissez en quelques clics et sachez toujours
              ce qu’il reste en rayon.
            </p>
          </div>
        </section>

        {/* Colonne de droite : le formulaire et, en dessous, le bloc de démonstration */}
        <section className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-4">
            {/* Carte en « verre dépoli » : fond blanc transparent + flou de ce qui est derrière */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl"
            >
              {/* Le logo n'est répété ici que sur petit écran (la colonne de gauche est masquée) */}
              <div className="flex items-center gap-3 lg:hidden">
                <Logo />
                <span className="text-lg font-bold text-white">Stock Manager</span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">Connexion</h2>
                <p className="mt-1 text-sm text-white/70">
                  Entrez vos identifiants pour accéder à la boutique.
                </p>
              </div>

              {/* Le message d'erreur n'apparaît que s'il y en a un */}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-300/50 bg-rose-500/20 p-3 text-sm text-rose-50"
                >
                  {error}
                </p>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/90">
                  Adresse email
                </label>
                {/* value + onChange : le champ est « contrôlé » par l'état React */}
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-transparent bg-white/95 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/90">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-transparent bg-white/95 py-3 pl-4 pr-24 text-slate-900 placeholder-slate-400 focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-400/30"
                  />
                  {/* Bouton pour afficher ou masquer le mot de passe */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-2 my-auto h-9 rounded-lg px-3 text-sm font-medium text-violet-700 hover:bg-violet-50"
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>

              {/* disabled pendant l'appel : évite de cliquer deux fois */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-linear-to-r from-violet-500 to-fuchsia-500 py-3 font-semibold text-white shadow-lg shadow-fuchsia-950/40 transition hover:from-violet-400 hover:to-fuchsia-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
              >
                {loading ? 'Connexion en cours…' : 'Se connecter'}
              </button>
            </form>

            {/* Le bloc de démonstration : seulement si VITE_SHOW_DEMO_ACCOUNTS vaut « true » */}
            {SHOW_DEMO_ACCOUNTS && (
              <section
                aria-label="Comptes de démonstration"
                className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-xl shadow-indigo-950/40 backdrop-blur-xl"
              >
                <h2 className="text-sm font-semibold text-white">Essayez avec un compte de démonstration</h2>
                <p className="mt-1 text-sm text-white/70">
                  Un clic remplit le formulaire. Les données sont fictives.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillDemo(account.email, account.password)}
                      className="rounded-2xl border border-white/25 bg-white/10 p-4 text-left transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <span className="block font-semibold text-white">{account.label}</span>
                      <span className="mt-1 block text-xs leading-snug text-white/75">
                        {account.description}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Les identifiants en toutes lettres : on voit ce que le bouton a rempli */}
                <dl className="mt-4 space-y-1 border-t border-white/15 pt-4 text-xs text-white/70">
                  {DEMO_ACCOUNTS.map((account) => (
                    <div key={account.email} className="flex flex-wrap gap-x-2">
                      <dt className="font-medium text-white/90">{account.label} :</dt>
                      <dd>
                        {account.email} / {account.password}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}