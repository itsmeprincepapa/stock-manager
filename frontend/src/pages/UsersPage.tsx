import { isCancel } from 'axios'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'
import { deleteUser, fetchUsers } from '../api/users'
import { useAuth } from '../auth/auth-context'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { RoleBadge } from '../components/RoleBadge'
import { dangerButton, primaryButton, secondaryButton } from '../components/styles'
import { UserFormModal } from '../components/UserFormModal'
import { formatDate } from '../lib/format'
import type { User } from '../types'

export function UsersPage() {
  // me : la personne connectée. updateUser : met à jour ses informations si elle se modifie elle-même.
  const { user: me, updateUser } = useAuth()

  const [users, setUsers] = useState<User[] | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [notice, setNotice] = useState('')

  // Ce que le gérant est en train de faire :
  // editing : 'new' = ajouter, un compte = le modifier, null = rien
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)

  // CHARGEMENT de la liste (annule la requête si on quitte la page avant la réponse)
  useEffect(() => {
    const controller = new AbortController()
    setError('')

    fetchUsers(controller.signal)
      .then(setUsers)
      .catch((err) => {
        if (!isCancel(err)) setError(getErrorMessage(err))
      })

    return () => controller.abort()
  }, [reload])

  // Le message de confirmation disparaît tout seul au bout de 5 secondes
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  // Appelée par le formulaire quand l'enregistrement a réussi
  function handleSaved(message: string, saved: User) {
    // Si le gérant a modifié SON PROPRE compte, on met à jour ce que le menu affiche
    if (me && saved.id === me.id) {
      updateUser({ id: saved.id, name: saved.name, email: saved.email, role: saved.role })
    }
    setEditing(null)
    setNotice(message)
    setReload((n) => n + 1)
  }

  // Appelée quand le gérant confirme la suppression
  async function confirmDelete() {
    if (!deleting) return
    setDeleteError('')
    setDeleteBusy(true)
    try {
      await deleteUser(deleting.id)
      setNotice(`Le compte de ${deleting.name} a été supprimé.`)
      setDeleting(null)
      setReload((n) => n + 1)
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Utilisateurs" description="Les comptes qui ont accès à votre boutique.">
        <button type="button" onClick={() => setEditing('new')} className={primaryButton}>
          Ajouter un utilisateur
        </button>
      </PageHeader>

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
        >
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {error ? (
          // ÉTAT D'ERREUR
          <div className="p-10 text-center">
            <p className="font-medium text-slate-900">Impossible de charger les utilisateurs</p>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <button type="button" onClick={() => setReload((n) => n + 1)} className={`mt-4 ${primaryButton}`}>
              Réessayer
            </button>
          </div>
        ) : users === null ? (
          // ÉTAT DE CHARGEMENT
          <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Chargement des utilisateurs">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-4 motion-reduce:animate-none">
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="ml-auto h-6 w-20 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          // La liste. Elle n'est jamais vide : la personne connectée en fait partie.
          <ul className="divide-y divide-slate-100">
            {users.map((account) => {
              const isMe = account.id === me?.id

              return (
                <li key={account.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-6">
                  {/* Pastille avec l'initiale, comme dans le menu */}
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-violet-500 font-bold text-white"
                    aria-hidden="true"
                  >
                    {account.name.charAt(0).toUpperCase()}
                  </span>

                  {/* basis-48 : cette zone garde au moins 12 rem, sinon elle passe à la ligne */}
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate font-medium text-slate-900">
                      {account.name}
                      {isMe && (
                        <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                          Vous
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-slate-500">{account.email}</p>
                  </div>

                  {account.createdAt && (
                    <p className="hidden shrink-0 text-sm text-slate-500 lg:block">
                      Créé le {formatDate(account.createdAt)}
                    </p>
                  )}

                  <RoleBadge role={account.role} />

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(account)}
                      aria-label={`Modifier ${account.name}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-violet-600"
                    >
                      Modifier
                    </button>
                    {/* Pas de bouton Supprimer sur son propre compte : l'API le refuserait */}
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('')
                          setDeleting(account)
                        }}
                        aria-label={`Supprimer ${account.name}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Fenêtre d'ajout ou de modification */}
      {editing !== null && (
        <UserFormModal
          account={editing === 'new' ? null : editing}
          isSelf={editing !== 'new' && editing.id === me?.id}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Fenêtre de confirmation de suppression */}
      {deleting && (
        <Modal title="Supprimer ce compte ?" onClose={() => setDeleting(null)}>
          <p className="text-slate-700">
            Vous allez supprimer le compte de <strong>{deleting.name}</strong> ({deleting.email}).
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Cette personne ne pourra plus se connecter, et sera déconnectée dès sa prochaine action.
            Cette action est définitive.
          </p>
          {deleteError && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {deleteError}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setDeleting(null)} className={secondaryButton}>
              Annuler
            </button>
            <button type="button" onClick={confirmDelete} disabled={deleteBusy} className={dangerButton}>
              {deleteBusy ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}