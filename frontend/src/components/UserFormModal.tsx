import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../api/errors'
import { createUser, updateUser } from '../api/users'
import type { Role, User } from '../types'
import { Modal } from './Modal'
import { RoleBadge } from './RoleBadge'
import { inputClass, primaryButton, secondaryButton } from './styles'

// Les deux rôles, avec l'explication de ce que chacun permet
const ROLES: { value: Role; label: string; hint: string }[] = [
  {
    value: 'SELLER',
    label: 'Vendeur',
    hint: 'Peut consulter les produits et le stock, enregistrer des ventes et voir l’historique des ventes.',
  },
  {
    value: 'MANAGER',
    label: 'Gérant',
    hint: 'Accès complet : catalogue, mouvements de stock, annulation des ventes, tableau de bord et comptes.',
  },
]

// Le formulaire d'un compte. Il sert à CRÉER (account = null) et à MODIFIER (account = le compte).
// isSelf : le compte modifié est celui de la personne connectée.
export function UserFormModal({
  account,
  isSelf,
  onClose,
  onSaved,
}: {
  account: User | null
  isSelf: boolean
  onClose: () => void
  onSaved: (message: string, saved: User) => void
}) {
  const isEdit = account !== null

  const [name, setName] = useState(account?.name ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // À la création : vendeur par défaut, le rôle le moins puissant
  const [role, setRole] = useState<Role>(account?.role ?? 'SELLER')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const base = { name: name.trim(), email: email.trim() }

      if (account) {
        // MODIFICATION : on n'envoie le rôle que si ce n'est pas son propre compte
        // (l'API le refuserait), et le mot de passe seulement s'il y a du texte.
        const saved = await updateUser(account.id, {
          ...base,
          ...(isSelf ? {} : { role }),
          ...(password && { password }),
        })
        onSaved(`Le compte de ${saved.name} a été modifié.`, saved)
      } else {
        // CRÉATION
        const saved = await createUser({ ...base, password, role })
        onSaved(`Le compte de ${saved.name} a été créé.`, saved)
      }
    } catch (err) {
      // Par exemple : « Cet email est déjà utilisé. »
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const label = 'mb-1.5 block text-sm font-medium text-slate-700'
  const current = ROLES.find((item) => item.value === role)

  return (
    <Modal title={isEdit ? 'Modifier l’utilisateur' : 'Ajouter un utilisateur'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="user-name" className={label}>
            Nom complet
          </label>
          <input
            id="user-name"
            required
            maxLength={100}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="user-email" className={label}>
            Adresse email
          </label>
          <input
            id="user-email"
            type="email"
            required
            maxLength={150}
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="user-password" className={label}>
            {isEdit ? 'Nouveau mot de passe' : 'Mot de passe provisoire'}
            {isEdit && <span className="font-normal text-slate-500"> (facultatif)</span>}
          </label>
          <div className="relative">
            <input
              id="user-password"
              type={showPassword ? 'text' : 'password'}
              // Obligatoire à la création seulement. minLength ne vérifie que si le champ est rempli.
              required={!isEdit}
              minLength={8}
              maxLength={72}
              // new-password : le navigateur ne remplit pas ce champ avec TON mot de passe enregistré
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-24`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-2 my-auto h-9 rounded-lg px-3 text-sm font-medium text-violet-700 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-600"
            >
              {showPassword ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            {isEdit
              ? 'Laissez vide pour conserver le mot de passe actuel. Sinon, entre 8 et 72 caractères.'
              : 'Entre 8 et 72 caractères. Communiquez-le à l’employé de vive voix.'}
          </p>
        </div>

        {account && isSelf ? (
          // Son propre rôle : affiché, mais pas modifiable
          <div>
            <p className={label}>Rôle</p>
            <RoleBadge role={account.role} />
            <p className="mt-2 text-sm text-slate-600">Vous ne pouvez pas modifier votre propre rôle.</p>
          </div>
        ) : (
          // Les deux rôles, en boutons radio habillés
          <fieldset>
            <legend className={label}>Rôle</legend>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((item) => (
                <label key={item.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="user-role"
                    value={item.value}
                    checked={role === item.value}
                    onChange={() => setRole(item.value)}
                    className="peer sr-only"
                  />
                  <span className="block rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-700 transition peer-checked:border-transparent peer-checked:bg-linear-to-r peer-checked:from-violet-600 peer-checked:to-fuchsia-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet-600">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-600">{current?.hint}</p>
          </fieldset>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Annuler
          </button>
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le compte'}
          </button>
        </div>
      </form>
    </Modal>
  )
}