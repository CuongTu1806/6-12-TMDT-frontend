import { useEffect, useState } from 'react'
import { getSellerRevenue } from '../../services/sellerApi'

const formatMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}₫`

export function SellerRevenuePanel() {
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const result = await getSellerRevenue(from, to)
      setData(result)
    } catch (e) {
      alert('Loi tai doanh thu: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Tai chinh / Doanh thu</h1>
        <p className="mt-1 text-sm text-slate-600">Thong ke don hang da hoan thanh theo thoi gian</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Tu ngay</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Den ngay</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Loc
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Dang tai...</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Doanh thu (ky)</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{formatMoney(data.totalRevenue)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Don hoan thanh (ky)</p>
              <p className="mt-1 text-2xl font-bold">{data.completedOrders}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Tong don (shop)</p>
              <p className="mt-1 text-2xl font-bold">{data.totalOrders}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 font-semibold">Theo ngay</h2>
            {(data.byDay || []).length === 0 ? (
              <p className="text-sm text-slate-500">Khong co du lieu trong khoang thoi gian</p>
            ) : (
              <div className="space-y-2">
                {data.byDay.map((row) => (
                  <div key={row.date} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
                    <span>{row.date}</span>
                    <span className="font-semibold text-emerald-600">{formatMoney(row.revenue)}</span>
                    <span className="text-slate-500">{row.orderCount} don</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
