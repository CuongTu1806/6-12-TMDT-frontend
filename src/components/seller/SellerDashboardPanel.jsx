import { useEffect, useState } from 'react'
import { getSellerDashboard } from '../../services/sellerApi'

const formatMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}₫`

export function SellerDashboardPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const result = await getSellerDashboard()
        setData(result)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-500">Dang tai thong ke...</p>
  }

  if (!data) {
    return <p className="text-sm text-rose-600">Khong tai duoc thong ke</p>
  }

  const cards = [
    { label: 'Tong san pham', value: data.totalProducts },
    { label: 'Dang ban', value: data.activeProducts },
    { label: 'Cho phe duyet', value: data.pendingApprovalProducts },
    { label: 'Don cho xac nhan', value: data.pendingOrders },
    { label: 'Don dang giao', value: data.shippingOrders },
    { label: 'Don hoan thanh', value: data.completedOrders },
    { label: 'Doanh thu tong', value: formatMoney(data.totalRevenue), isMoney: true },
    { label: 'Doanh thu hom nay', value: formatMoney(data.todayRevenue), isMoney: true },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tong quan gian hang <span className="font-semibold text-blue-600">{data.shopName}</span>
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.isMoney ? 'text-emerald-600' : ''}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
