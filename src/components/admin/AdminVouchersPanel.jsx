import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import {
  getAdminVouchers,
  createAdminVoucher,
  updateAdminVoucher,
  deleteAdminVoucher,
  getAdminShops,
} from '../../services/adminApi'

const emptyForm = {
  code: '',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderValue: 0,
  maxDiscount: 100000,
  usageLimit: 100,
  shopId: '',
  startDate: '',
  endDate: '',
  isActive: 1,
}

const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const toIso = (local) => (local ? `${local}:00` : null)

export function AdminVouchersPanel({ onNotify }) {
  const [vouchers, setVouchers] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const load = async (pageNum = 0) => {
    setLoading(true)
    try {
      const [voucherResult, shopList] = await Promise.all([
        getAdminVouchers(pageNum, 10),
        getAdminShops(),
      ])
      setVouchers(voucherResult.content || [])
      setTotalPages(voucherResult.totalPages || 0)
      setPage(voucherResult.currentPage ?? pageNum)
      setShops(shopList)
    } catch (e) {
      onNotify?.('error', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(0)
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, shopId: shops[0]?.shopId || '' })
    setShowForm(true)
  }

  const openEdit = (v) => {
    setEditingId(v.voucherId)
    setForm({
      code: v.code,
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrderValue: v.minOrderValue || 0,
      maxDiscount: v.maxDiscount || 0,
      usageLimit: v.usageLimit,
      shopId: v.shopId,
      startDate: toLocalInput(v.startDate),
      endDate: toLocalInput(v.endDate),
      isActive: v.isActive ?? 1,
    })
    setShowForm(true)
  }

  const buildPayload = () => ({
    code: form.code.trim().toUpperCase(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderValue: Number(form.minOrderValue) || 0,
    maxDiscount: Number(form.maxDiscount) || null,
    usageLimit: Number(form.usageLimit) || 100,
    shopId: Number(form.shopId),
    startDate: toIso(form.startDate),
    endDate: toIso(form.endDate),
    ...(editingId ? { isActive: Number(form.isActive) } : {}),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = buildPayload()
      if (editingId) {
        await updateAdminVoucher(editingId, payload)
        onNotify?.('success', 'Cap nhat voucher thanh cong')
      } else {
        await createAdminVoucher(payload)
        onNotify?.('success', 'Tao voucher thanh cong')
      }
      setShowForm(false)
      await load(page)
    } catch (err) {
      onNotify?.('error', err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoa voucher nay?')) return
    try {
      await deleteAdminVoucher(id)
      onNotify?.('success', 'Da xoa voucher')
      await load(page)
    } catch (e) {
      onNotify?.('error', e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quan ly voucher</h1>
          <p className="mt-1 text-sm text-slate-600">Tao va quan ly ma giam gia theo shop</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Tao voucher
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Dang tai...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Ma</th>
                <th className="px-4 py-3 text-left">Loai</th>
                <th className="px-4 py-3 text-left">Gia tri</th>
                <th className="px-4 py-3 text-left">Shop</th>
                <th className="px-4 py-3 text-left">Da dung</th>
                <th className="px-4 py-3 text-left">Trang thai</th>
                <th className="px-4 py-3 text-right">Hanh dong</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.voucherId} className="border-t">
                  <td className="px-4 py-3 font-bold">{v.code}</td>
                  <td className="px-4 py-3">{v.discountType}</td>
                  <td className="px-4 py-3">{v.discountValue}</td>
                  <td className="px-4 py-3">{v.shopName}</td>
                  <td className="px-4 py-3">{v.usedCount}/{v.usageLimit}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.isActive === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {v.isActive === 1 ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => openEdit(v)} className="mr-2 text-violet-600"><Pencil size={16} /></button>
                    <button type="button" onClick={() => handleDelete(v.voucherId)} className="text-rose-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="my-8 w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="font-bold">{editingId ? 'Sua voucher' : 'Tao voucher moi'}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required placeholder="Ma voucher" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="rounded-lg border px-3 py-2 text-sm sm:col-span-2" disabled={!!editingId} />
              <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm">
                <option value="PERCENT">Phan tram</option>
                <option value="FIXED">So tien co dinh</option>
              </select>
              <input type="number" required placeholder="Gia tri giam" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              <select required value={form.shopId} onChange={(e) => setForm((f) => ({ ...f, shopId: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm sm:col-span-2">
                <option value="">-- Chon shop --</option>
                {shops.map((s) => (
                  <option key={s.shopId} value={s.shopId}>{s.shopName}</option>
                ))}
              </select>
              <input type="number" placeholder="Don toi thieu" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" placeholder="Giam toi da" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" placeholder="Gioi han su dung" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              <input type="datetime-local" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              <input type="datetime-local" required value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm" />
              {editingId && (
                <select value={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: Number(e.target.value) }))} className="rounded-lg border px-3 py-2 text-sm sm:col-span-2">
                  <option value={1}>Dang hoat dong</option>
                  <option value={0}>Tam tat</option>
                </select>
              )}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Huy</button>
              <button type="submit" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Luu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
