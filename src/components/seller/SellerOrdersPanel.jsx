import { useEffect, useState } from 'react'
import {
  getSellerOrders,
  updateOrderStatus,
  ORDER_TABS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
} from '../../services/sellerApi'

const formatMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}₫`

const NEXT_ACTIONS = {
  [ORDER_STATUS.PENDING]: [
    { label: 'Xac nhan don', status: ORDER_STATUS.CONFIRMED },
    { label: 'Huy don', status: ORDER_STATUS.CANCELLED, danger: true },
  ],
  [ORDER_STATUS.CONFIRMED]: [
    { label: 'Ban giao VC', status: ORDER_STATUS.SHIPPING },
    { label: 'Huy don', status: ORDER_STATUS.CANCELLED, danger: true },
  ],
  [ORDER_STATUS.SHIPPING]: [
    { label: 'Da giao', status: ORDER_STATUS.DELIVERED },
  ],
  [ORDER_STATUS.DELIVERED]: [
    { label: 'Hoan thanh', status: ORDER_STATUS.COMPLETED },
  ],
}

export function SellerOrdersPanel() {
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const loadOrders = async (tabKey, pageNum = 0) => {
    const tab = ORDER_TABS.find((t) => t.key === tabKey) || ORDER_TABS[0]
    setLoading(true)
    try {
      const result = await getSellerOrders(tab.status, pageNum, 10)
      setOrders(result.content || [])
      setTotalPages(result.totalPages || 0)
      setPage(result.number ?? pageNum)
    } catch (e) {
      alert('Loi tai don hang: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(activeTab, 0)
  }, [activeTab])

  const handleStatusUpdate = async (orderId, status) => {
    if (!window.confirm('Xac nhan cap nhat trang thai don hang?')) return
    try {
      await updateOrderStatus(orderId, { status, location: 'Kho seller' })
      await loadOrders(activeTab, page)
    } catch (e) {
      alert('Loi cap nhat: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Quan ly don hang</h1>
        <p className="mt-1 text-sm text-slate-600">Xac nhan, dong goi va cap nhat trang thai don ban</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Dang tai don hang...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Khong co don hang nao
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.orderId} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{order.orderCode}</p>
                  <p className="text-sm text-slate-600">
                    {order.buyerName} · {order.shippingPhone}
                  </p>
                  <p className="text-xs text-slate-500">{order.shippingAddress}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    {order.statusLabel || ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <p className="mt-1 font-bold text-emerald-600">{formatMoney(order.totalAmount)}</p>
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                {(order.items || []).map((item, idx) => (
                  <li key={idx} className="flex justify-between text-slate-700">
                    <span>
                      {item.productName} x{item.quantity}
                    </span>
                    <span>{formatMoney(item.priceAtPurchase)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap gap-2">
                {(NEXT_ACTIONS[order.status] || []).map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => handleStatusUpdate(order.orderId, action.status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      action.danger
                        ? 'border border-rose-300 text-rose-600 hover:bg-rose-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => loadOrders(activeTab, page - 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
          >
            Truoc
          </button>
          <span className="text-sm text-slate-600">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => loadOrders(activeTab, page + 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
