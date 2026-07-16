import { useState, useEffect } from 'react'
import { subscribeAllUsers, updateUser } from '../utils/firestoreApi'
import { Card, PageHeader } from '../components/UI.jsx'

export default function ManageUsers() {
  const [users, setUsers] = useState([])

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

  return (
    <div>
      <PageHeader title="Manage Users" subtitle="Approve teachers and manage admin roles" />
      <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 max-w-5xl mx-auto">
        <Card className="overflow-hidden">
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
                    <td className="px-4 py-3 text-ink-900 dark:text-white font-medium">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      {u.status === 'approved' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-pass-bg text-pass-text border border-pass-text">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-fail-bg text-fail-text border border-fail-text">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-700 dark:text-chalk-bg/80 capitalize">
                      {u.role === 'admin' ? (
                        <span className="text-gold-600 dark:text-gold-500 font-medium">Admin</span>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      {u.status === 'pending' ? (
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="text-xs text-pass-text hover:underline"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevoke(u.id)}
                          className="text-xs text-fail-text hover:underline"
                        >
                          Revoke Access
                        </button>
                      )}

                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => handleMakeAdmin(u.id)}
                          className="text-xs text-gold-600 dark:text-gold-500 hover:underline"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveAdmin(u.id)}
                          className="text-xs text-ink-600 dark:text-chalk-bg/60 hover:underline"
                        >
                          Remove Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-ink-700/60 dark:text-chalk-bg/60">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
