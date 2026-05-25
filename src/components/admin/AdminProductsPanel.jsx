import { useEffect, useState } from 'react'
import { Check, X, Eye } from 'lucide-react'
import { approveProduct, getPendingProducts, rejectProduct } from '../../services/adminApi'

const formatPrice = (p) => `${Number(p || 0).toLocaleString('vi-VN')}₫`

export function AdminProductsPanel({ onNotify }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selected, setSelected] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const load = async (pageNum = 0) => {
    setLoading(true)
    try {
      const result = await getPendingProducts(pageNum, 10)
      setProducts(result.content || [])
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

  const handleApprove = async (productId) => {
    if (!window.confirm('Phe duyet san pham nay?')) return
    try {
      await approveProduct(productId)
      onNotify?.('success', 'Da phe duyet san pham')
      setSelected(null)
      await load(page)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    try {
      await rejectProduct(selected.productId, rejectReason)
      onNotify?.('success', 'Da tu choi san pham')
      setShowRejectModal(false)
      setRejectReason('')
      setSelected(null)
      await load(page)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kiem duyet san pham</h1>
        <p className="mt-1 text-sm text-slate-600">Phe duyet hoac tu choi san pham seller gui len</p>
      </div>

      {loading ? (
        <p className="text-slate-500">Dang tai...</p>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Khong co san pham cho duyet
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.productId}
                className={`flex gap-4 rounded-xl border bg-white p-4 transition ${
                  selected?.productId === p.productId ? 'border-violet-400 ring-2 ring-violet-100' : 'border-slate-200'
                }`}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{p.productName}</p>
                  <p className="text-sm text-slate-600">{p.shopName} · {p.categoryName}</p>
                  <p className="mt-1 font-bold text-violet-600">{formatPrice(p.price)}</p>
                  <p className="text-xs text-slate-500">Ton: {p.stockQuantity}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setSelected(p)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                    <Eye size={14} className="inline mr-1" /> Xem
                  </button>
                  <button type="button" onClick={() => handleApprove(p.productId)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                    <Check size={14} className="inline mr-1" /> Duyet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(p)
                      setShowRejectModal(true)
                    }}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <X size={14} className="inline mr-1" /> Tu choi
                  </button>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <button disabled={page === 0} onClick={() => load(page - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Truoc</button>
                <span className="text-sm text-slate-600">{page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Sau</button>
              </div>
            )}
          </div>

          {selected && (
            <aside className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 lg:self-start">
              <h2 className="font-bold">Chi tiet san pham</h2>
              {selected.imageUrl && (
                <img src={selected.imageUrl} alt="" className="mt-3 aspect-square w-full rounded-lg object-cover" />
              )}
              <dl className="mt-4 space-y-2 text-sm">
                <div><dt className="text-slate-500">Ten</dt><dd className="font-semibold">{selected.productName}</dd></div>
                <div><dt className="text-slate-500">Shop</dt><dd>{selected.shopName}</dd></div>
                <div><dt className="text-slate-500">Danh muc</dt><dd>{selected.categoryName}</dd></div>
                <div><dt className="text-slate-500">Gia</dt><dd className="font-bold text-violet-600">{formatPrice(selected.price)}</dd></div>
                <div><dt className="text-slate-500">Mo ta</dt><dd className="text-slate-700">{selected.description || '—'}</dd></div>
              </dl>
            </aside>
          )}
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="font-bold">Tu choi san pham</h3>
            <p className="mt-1 text-sm text-slate-600">{selected?.productName}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ly do tu choi..."
              rows={4}
              className="mt-4 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRejectModal(false)} className="rounded-lg border px-4 py-2 text-sm">Huy</button>
              <button type="button" onClick={handleReject} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Xac nhan tu choi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
