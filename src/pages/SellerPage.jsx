import { useState, useEffect } from 'react'
import { getSellerDashboard } from '../services/sellerApi'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  MessageSquare,
  Ticket,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react'
import { SellerDashboardPanel } from '../components/seller/SellerDashboardPanel'
import { SellerProductsPanel } from '../components/seller/SellerProductsPanel'
import { SellerOrdersPanel } from '../components/seller/SellerOrdersPanel'
import { SellerShopPanel } from '../components/seller/SellerShopPanel'
import { SellerReviewsPanel } from '../components/seller/SellerReviewsPanel'
import { SellerVouchersPanel } from '../components/seller/SellerVouchersPanel'
import { SellerRevenuePanel } from '../components/seller/SellerRevenuePanel'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'San pham', icon: Package },
  { id: 'orders', label: 'Don hang', icon: ShoppingBag },
  { id: 'revenue', label: 'Doanh thu', icon: TrendingUp },
  { id: 'reviews', label: 'Danh gia', icon: MessageSquare },
  { id: 'vouchers', label: 'Voucher', icon: Ticket },
  { id: 'settings', label: 'Cai dat Shop', icon: Settings },
]

export function SellerPage({ session, onLogout, onBackHome }) {
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    getSellerDashboard().catch((err) => {
      if (err.status === 401 || String(err.message).includes('401')) {
        onLogout?.()
      }
    })
  }, [onLogout])

  const handleNav = (tabId) => setActiveTab(tabId)

  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SellerDashboardPanel />
      case 'products':
        return <SellerProductsPanel />
      case 'orders':
        return <SellerOrdersPanel />
      case 'revenue':
        return <SellerRevenuePanel />
      case 'reviews':
        return <SellerReviewsPanel />
      case 'vouchers':
        return <SellerVouchersPanel />
      case 'settings':
        return <SellerShopPanel />
      default:
        return <SellerDashboardPanel />
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {onBackHome && (
              <button
                type="button"
                onClick={onBackHome}
                className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
                title="Ve trang chu"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-blue-600">
              <span className="inline-block rounded-md bg-blue-100 px-2 py-1">M</span>
              Kenh nguoi ban
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">
              {session?.fullName || session?.username || 'Seller'}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
            >
              Dang xuat
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <nav className="space-y-1 text-sm">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 ${
                  activeTab === id
                    ? 'bg-blue-50 font-semibold text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">{renderPanel()}</section>
      </div>
    </div>
  )
}
