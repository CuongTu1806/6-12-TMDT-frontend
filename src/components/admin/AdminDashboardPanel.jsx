import { useEffect, useState } from 'react'
import { getAdminDashboard } from '../../services/adminApi'

const formatMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}₫`

export function AdminDashboardPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getAdminDashboard()
        setStats(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-slate-500">Dang tai thong ke...</p>
  if (!stats) return <p className="text-sm text-rose-600">Khong tai duoc thong ke</p>

  const cards = [
    { label: 'Nguoi dung', value: stats.totalUsers, color: 'text-slate-900' },
    { label: 'Gian hang', value: stats.totalShops, color: 'text-slate-900' },
    { label: 'Tong san pham', value: stats.totalProducts, color: 'text-slate-900' },
    { label: 'SP da duyet', value: stats.approvedProducts, color: 'text-emerald-600' },
    { label: 'SP cho duyet', value: stats.pendingProducts, color: 'text-amber-600' },
    { label: 'Don hang', value: stats.totalOrders, color: 'text-slate-900' },
    { label: 'Doanh thu', value: formatMoney(stats.totalRevenue), color: 'text-violet-600', isMoney: true },
    { label: 'Danh gia', value: stats.totalReviews, color: 'text-slate-900' },
    { label: 'Voucher hoat dong', value: stats.activeVouchers, color: 'text-blue-600' },
    { label: 'Gia tri TB/don', value: formatMoney(stats.averageOrderValue), color: 'text-slate-700', isMoney: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard quan tri</h1>
        <p className="mt-1 text-sm text-slate-600">Tong quan he thong thuong mai dien tu</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {stats.pendingProducts > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Co <strong>{stats.pendingProducts}</strong> san pham dang cho phe duyet. Hay xem muc &quot;Kiem duyet SP&quot;.
        </div>
      )}
    </div>
  )
}
