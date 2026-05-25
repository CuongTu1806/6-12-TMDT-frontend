import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  PackageCheck,
  Users,
  Ticket,
  ArrowLeft,
  Shield,
} from 'lucide-react'
import { getAdminDashboard } from '../services/adminApi'
import { AdminDashboardPanel } from '../components/admin/AdminDashboardPanel'
import { AdminProductsPanel } from '../components/admin/AdminProductsPanel'
import { AdminUsersPanel } from '../components/admin/AdminUsersPanel'
import { AdminVouchersPanel } from '../components/admin/AdminVouchersPanel'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Kiem duyet SP', icon: PackageCheck },
  { id: 'users', label: 'Nguoi dung', icon: Users },
  { id: 'vouchers', label: 'Voucher', icon: Ticket },
]

export function AdminPage({ session, onLogout, onBackHome, onNotify }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    getAdminDashboard()
      .then((data) => setPendingCount(data?.pendingProducts || 0))
      .catch((err) => {
        if (err.status === 401 || String(err.message).includes('401')) {
          onLogout?.()
        }
      })
  }, [onLogout])

  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardPanel />
      case 'products':
        return <AdminProductsPanel onNotify={onNotify} />
      case 'users':
        return <AdminUsersPanel onNotify={onNotify} />
      case 'vouchers':
        return <AdminVouchersPanel onNotify={onNotify} />
      default:
        return <AdminDashboardPanel />
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-violet-200 bg-gradient-to-r from-violet-900 to-indigo-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {onBackHome && (
              <button type="button" onClick={onBackHome} className="rounded-lg border border-white/30 p-2 hover:bg-white/10" title="Ve trang chu">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-2 font-extrabold tracking-tight">
              <Shield size={20} />
              Admin Console
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-violet-100 sm:inline">{session?.username || 'Admin'}</span>
            <button type="button" onClick={onLogout} className="rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
              Dang xuat
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === id
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {label}
                </span>
                {id === 'products' && pendingCount > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === id ? 'bg-white text-violet-700' : 'bg-amber-100 text-amber-800'}`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {renderPanel()}
        </main>
      </div>
    </div>
  )
}
