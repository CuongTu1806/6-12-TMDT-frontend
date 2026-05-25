import { useEffect, useState } from 'react'
import { Trash2, Lock, Unlock } from 'lucide-react'
import {
  getAdminUsers,
  updateUserStatus,
  updateUserRoles,
  deleteAdminUser,
  ADMIN_ROLES,
} from '../../services/adminApi'

export function AdminUsersPanel({ onNotify }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editRoles, setEditRoles] = useState([])

  const load = async (pageNum = 0) => {
    setLoading(true)
    try {
      const result = await getAdminUsers(pageNum, 10)
      setUsers(result.content || [])
      setTotalPages(result.totalPages || 0)
      setPage(result.currentPage ?? pageNum)
    } catch (e) {
      onNotify?.('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(0)
  }, [])

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 1 ? 0 : 1
    const action = newStatus === 0 ? 'khoa' : 'mo khoa'
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} tai khoan ${user.username}?`)) return
    try {
      await updateUserStatus(user.userId, newStatus)
      onNotify?.('success', 'Cap nhat trang thai thanh cong')
      await load(page)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const handleSaveRoles = async () => {
    if (!selectedUser || editRoles.length === 0) {
      onNotify?.('error', 'Chon it nhat mot vai tro')
      return
    }
    try {
      await updateUserRoles(selectedUser.userId, editRoles)
      onNotify?.('success', 'Cap nhat vai tro thanh cong')
      setSelectedUser(null)
      await load(page)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Xoa (vo hieu hoa) tai khoan ${username}?`)) return
    try {
      await deleteAdminUser(userId)
      onNotify?.('success', 'Da xoa nguoi dung')
      await load(page)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const toggleRole = (role) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quan ly nguoi dung</h1>
        <p className="mt-1 text-sm text-slate-600">Khoa/mo khoa, cap nhat vai tro, xoa tai khoan</p>
      </div>

      {loading ? (
        <p className="text-slate-500">Dang tai...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tai khoan</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Vai tro</th>
                  <th className="px-4 py-3 font-semibold">Shop</th>
                  <th className="px-4 py-3 font-semibold">Trang thai</th>
                  <th className="px-4 py-3 font-semibold text-right">Hanh dong</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-xs text-slate-500">{user.fullName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(user.roles || []).map((r) => (
                          <span key={r} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                            {r.replace('ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.shopName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${user.status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.status === 1 ? 'Hoat dong' : 'Bi khoa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title={user.status === 1 ? 'Khoa' : 'Mo khoa'}
                          onClick={() => handleToggleStatus(user)}
                          className="rounded-lg border p-2 hover:bg-slate-50"
                        >
                          {user.status === 1 ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(user)
                            setEditRoles(user.roles || [])
                          }}
                          className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-slate-50"
                        >
                          Vai tro
                        </button>
                        {user.userId !== 1 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(user.userId, user.username)}
                            className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button disabled={page === 0} onClick={() => load(page - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Truoc</button>
              <span className="text-sm">{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Sau</button>
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="font-bold">Cap nhat vai tro — {selectedUser.username}</h3>
            <div className="mt-4 space-y-2">
              {ADMIN_ROLES.map((role) => (
                <label key={role} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50">
                  <input type="checkbox" checked={editRoles.includes(role)} onChange={() => toggleRole(role)} />
                  <span className="text-sm font-semibold">{role.replace('ROLE_', '')}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-lg border px-4 py-2 text-sm">Huy</button>
              <button type="button" onClick={handleSaveRoles} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Luu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
