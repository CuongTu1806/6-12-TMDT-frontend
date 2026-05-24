import { useEffect, useState } from 'react'
import { MarketHeader } from '../components/MarketHeader'
import { getBuyerOrders, cancelBuyerOrder, createReview, BUYER_ORDER_TABS } from '../services/buyerApi'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`

export function OrdersPage({
  session,
  cartCount,
  onGoHome,
  onOpenAuth,
  onLogout,
  onOpenSeller,
  onOpenCart,
  onOpenOrders,
  onNotify,
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewForms, setReviewForms] = useState({})

  useEffect(() => {
    if (!session?.token) {
      onOpenAuth?.('orders')
      return
    }
    loadOrders(activeTab)
  }, [session?.token, activeTab])

  const loadOrders = async (tabKey) => {
    const tab = BUYER_ORDER_TABS.find((t) => t.key === tabKey) || BUYER_ORDER_TABS[0]
    setLoading(true)
    try {
      const result = await getBuyerOrders(tab.status, 0, 50)
      setOrders(result.content || [])
    } catch (e) {
      onNotify?.('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (orderId) => {
    if (!window.confirm('Huy don hang nay?')) return
    try {
      await cancelBuyerOrder(orderId)
      onNotify?.('success', 'Da huy don hang')
      loadOrders(activeTab)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const handleReview = async (order, productId) => {
    const key = `${order.orderId}-${productId}`
    const form = reviewForms[key]
    if (!form?.star) {
      onNotify?.('error', 'Vui long chon so sao')
      return
    }
    try {
      await createReview({
        orderId: order.orderId,
        productId,
        star: Number(form.star),
        content: form.content || '',
      })
      onNotify?.('success', 'Danh gia thanh cong')
      loadOrders(activeTab)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  if (!session?.token) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] p-8 text-center">
        <p>Dang nhap de xem don mua</p>
        <button type="button" onClick={() => onOpenAuth?.('orders')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Dang nhap</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <MarketHeader session={session} cartCount={cartCount} onGoHome={onGoHome} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} onLogout={onLogout} onOpenSeller={onOpenSeller} onOpenOrders={onOpenOrders} />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Don mua cua toi</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {BUYER_ORDER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-6 text-slate-500">Dang tai...</p>
        ) : orders.length === 0 ? (
          <p className="mt-8 text-center text-slate-500">Khong co don hang</p>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <div key={order.orderId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-bold">{order.orderCode}</p>
                    <p className="text-sm text-slate-600">{order.shopName}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{order.statusLabel}</span>
                    <p className="mt-1 font-bold text-emerald-600">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
                  {(order.items || []).map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{item.productName} x{item.quantity}</span>
                      <span>{formatPrice(item.priceAtPurchase)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.status === 0 && (
                    <button type="button" onClick={() => handleCancel(order.orderId)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600">
                      Huy don
                    </button>
                  )}
                  {(order.status === 3 || order.status === 5) && (order.items || []).map((item) => (
                    <div key={item.productId} className="mt-2 w-full rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold">Danh gia: {item.productName}</p>
                      <div className="mt-2 flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewForms((f) => ({ ...f, [`${order.orderId}-${item.productId}`]: { ...f[`${order.orderId}-${item.productId}`], star: s } }))}
                            className={`text-lg ${reviewForms[`${order.orderId}-${item.productId}`]?.star >= s ? 'text-amber-500' : 'text-slate-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Nhan xet..."
                        className="mt-2 w-full rounded border px-2 py-1 text-sm"
                        onChange={(e) => setReviewForms((f) => ({ ...f, [`${order.orderId}-${item.productId}`]: { ...f[`${order.orderId}-${item.productId}`], content: e.target.value } }))}
                      />
                      <button type="button" onClick={() => handleReview(order, item.productId)} className="mt-2 text-xs font-semibold text-blue-600">
                        Gui danh gia
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
