import { useState, useEffect } from 'react'
import { subscribeAllUsers, updateUser, deleteUserDoc, createUserProfile } from '../utils/firestoreApi'
import { useInstitute } from '../context/InstituteContext.jsx'
import { Card, PageHeader } from '../components/UI.jsx'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { firebaseConfig } from '../firebase'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const { institutes, addInstituteAndSelect, removeInstitute, editInstitute } = useInstitute()
  const [newInstituteName, setNewInstituteName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState('')

  useEffect(() => {
    const unsub = subscribeAllUsers(setUsers)
    return () => unsub()
  }, [])

  async function handleApprove(uid) {
    await updateUser(uid, { status: 'approved' })
  }

  async function handleRevoke(uid) {
    await updateUser(uid, { status: 'pending' })
  }

  async function handleMakeAdmin(uid) {
    if (confirm('Are you sure you want to make this user an Admin?')) {
      await updateUser(uid, { role: 'admin' })
    }
  }

  async function handleRemoveAdmin(uid) {
    if (confirm('Are you sure you want to remove Admin rights from this user?')) {
      await updateUser(uid, { role: 'teacher' })
    }
  }

  async function handleDeleteUser(uid) {
    if (confirm('Are you sure you want to completely remove this user? This cannot be undone.')) {
      await deleteUserDoc(uid)
    }
  }

  async function handleAddInstitute(e) {
    e.preventDefault()
    if (!newInstituteName.trim()) return
    await addInstituteAndSelect(newInstituteName)
    setNewInstituteName('')
  }

  async function handleSaveEdit(oldName) {
    if (editingName.trim() && editingName.trim() !== oldName) {
      await editInstitute(oldName, editingName)
    }
    setEditingId(null)
    setEditingName('')
  }

  async function handleAddUser(e) {
    e.preventDefault()
    if (!newEmail.trim() || !newPassword) return
    setIsAddingUser(true)
    setAddUserError('')
    
    let secondaryApp
    try {
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp')
      const secondaryAuth = getAuth(secondaryApp)
      const cred = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword)
      await createUserProfile(cred.user.uid, newEmail)
      await updateUser(cred.user.uid, { status: 'approved' })
      setNewEmail('')
      setNewPassword('')
      await secondaryAuth.signOut()
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setAddUserError('This email is already registered. If the user was deleted, they can simply Sign In to restore their account.')
      } else {
        setAddUserError(err.message)
      }
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp)
      }
      setIsAddingUser(false)
    }
  }

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manage users, roles and institutes" />
      <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 max-w-5xl mx-auto space-y-8">

        {/* Institute Management */}
        <div>
          <h2 className="text-sm font-semibold text-ink-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-gold-600 dark:text-gold-500">🏫</span> Manage Institutes
          </h2>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-chalk-line dark:divide-board-700">
              {institutes.map((inst) => (
                <li key={inst.id} className="flex items-center gap-3 px-4 py-3">
                  {editingId === inst.id ? (
                    <>
                      <input
                        autoFocus
                        className="flex-1 bg-chalk-bg dark:bg-board-800 border border-chalk-line dark:border-board-600 rounded-card px-2 py-1 text-sm text-ink-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(inst.name)
                          if (e.key === 'Escape') { setEditingId(null); setEditingName('') }
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(inst.name)}
                        className="text-xs px-2 py-1 bg-pass-bg text-pass-text border border-pass-text rounded-card hover:opacity-80 transition"
                      >Save</button>
                      <button
                        onClick={() => { setEditingId(null); setEditingName('') }}
                        className="text-xs px-2 py-1 text-ink-600 dark:text-chalk-bg/60 hover:text-ink-900 dark:hover:text-white transition"
                      >Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-ink-900 dark:text-white">{inst.name}</span>
                      <button
                        onClick={() => { setEditingId(inst.id); setEditingName(inst.name) }}
                        title="Rename"
                        className="text-xs px-2 py-1 rounded border border-chalk-line dark:border-board-600 text-ink-600 dark:text-chalk-bg/60 hover:border-gold-500 hover:text-gold-600 dark:hover:text-gold-500 transition"
                      >✏️ Edit</button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete "${inst.name}"? This cannot be undone.`)) {
                            await removeInstitute(inst.name)
                          }
                        }}
                        title="Delete"
                        className="text-xs px-2 py-1 rounded border border-fail-text/40 text-fail-text hover:bg-fail-text hover:text-white transition"
                      >🗑️ Delete</button>
                    </>
                  )}
                </li>
              ))}
              {institutes.length === 0 && (
                <li className="px-4 py-6 text-sm text-center text-ink-600 dark:text-chalk-bg/50">
                  No institutes yet.
                </li>
              )}
            </ul>
            {/* Add new institute */}
            <form onSubmit={handleAddInstitute} className="flex gap-2 px-4 py-3 border-t border-chalk-line dark:border-board-700 bg-chalk-bg/50 dark:bg-board-800/30">
              <input
                value={newInstituteName}
                onChange={(e) => setNewInstituteName(e.target.value)}
                placeholder="New institute name…"
                className="flex-1 bg-white dark:bg-board-800 border border-chalk-line dark:border-board-600 rounded-card px-3 py-1.5 text-sm text-ink-900 dark:text-white placeholder:text-ink-600/50 dark:placeholder:text-chalk-bg/40 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <button
                type="submit"
                className="text-sm px-3 py-1.5 bg-gold-500 text-board-900 font-medium rounded-card hover:bg-gold-100 transition"
              >+ Add</button>
            </form>
          </Card>
        </div>

        {/* User Management */}
        <div>
          <h2 className="text-sm font-semibold text-ink-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-gold-600 dark:text-gold-500">👥</span> Manage Users
          </h2>
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-chalk-line dark:border-board-700 bg-chalk-bg/50 dark:bg-board-800/30">
              <h3 className="text-xs font-medium text-ink-900 dark:text-white mb-2">Add New User</h3>
              <form onSubmit={handleAddUser} className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-white dark:bg-board-800 border border-chalk-line dark:border-board-600 rounded-card px-3 py-1.5 text-sm text-ink-900 dark:text-white placeholder:text-ink-600/50 dark:placeholder:text-chalk-bg/40 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="flex-1 min-w-[200px] relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password (min 6 characters)"
                    className="w-full bg-white dark:bg-board-800 border border-chalk-line dark:border-board-600 rounded-card px-3 py-1.5 pr-9 text-sm text-ink-900 dark:text-white placeholder:text-ink-600/50 dark:placeholder:text-chalk-bg/40 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-700/60 dark:text-chalk-bg/60 hover:text-ink-900 dark:hover:text-white transition z-10"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="text-sm px-4 py-1.5 bg-gold-500 text-board-900 font-medium rounded-card hover:bg-gold-100 transition disabled:opacity-50"
                >
                  {isAddingUser ? 'Adding...' : '+ Add User'}
                </button>
              </form>
              {addUserError && <p className="text-xs text-fail-text mt-2">{addUserError}</p>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs text-ink-700/60 dark:text-chalk-bg/60 border-b border-chalk-line dark:border-board-700 bg-chalk-card/50 dark:bg-board-800/50">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-chalk-line dark:divide-board-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-chalk-bg/50 dark:hover:bg-board-800/50 transition">
                      <td className="px-4 py-3 text-ink-900 dark:text-white font-medium">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.status === 'approved' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-pass-bg text-pass-text border border-pass-text">Approved</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-fail-bg text-fail-text border border-fail-text">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-700 dark:text-chalk-bg/80 capitalize">
                        {u.role === 'admin' ? (
                          <span className="text-gold-600 dark:text-gold-500 font-medium">Admin</span>
                        ) : (
                          u.role
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {u.status === 'pending' ? (
                            <button onClick={() => handleApprove(u.id)} className="text-xs px-2 py-1 rounded border border-pass-text/40 text-pass-text hover:bg-pass-text hover:text-white transition">✓ Approve</button>
                          ) : (
                            <button onClick={() => handleRevoke(u.id)} className="text-xs px-2 py-1 rounded border border-fail-text/40 text-fail-text hover:bg-fail-text hover:text-white transition">✕ Revoke</button>
                          )}
                          {u.role !== 'admin' ? (
                            <button onClick={() => handleMakeAdmin(u.id)} className="text-xs px-2 py-1 rounded border border-gold-500/40 text-gold-600 dark:text-gold-500 hover:bg-gold-500 hover:text-board-900 transition">👑 Make Admin</button>
                          ) : (
                            <button onClick={() => handleRemoveAdmin(u.id)} className="text-xs px-2 py-1 rounded border border-chalk-line dark:border-board-600 text-ink-600 dark:text-chalk-bg/60 hover:border-gold-500 hover:text-gold-600 dark:hover:text-gold-500 transition">👤 Remove Admin</button>
                          )}
                          <button onClick={() => handleDeleteUser(u.id)} className="text-xs px-2 py-1 rounded border border-fail-text/40 text-fail-text hover:bg-fail-text hover:text-white transition">🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-ink-700/60 dark:text-chalk-bg/60">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
