import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createVoucher, deleteVoucher, getSellerVouchers } from '../../services/sellerApi'

const emptyForm = {
  code: '',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderValue: 0,
  maxDiscount: 50000,
  usageLimit: 100,
  startDate: '',
  endDate: '',
}

export function SellerVouchersPanel() {
  const [vouchers, setVouchers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getSellerVouchers()
      setVouchers(Array.isArray(data) ? data : [])
    } catch (e) {
      alert('Loi tai voucher: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createVoucher({
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
        maxDiscount: Number(form.maxDiscount),
        usageLimit: Number(form.usageLimit),
        startDate: form.startDate ? `${form.startDate}T00:00:00` : null,
        endDate: form.endDate ? `${form.endDate}T23:59:59` : null,
      })
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      alert('Loi tao voucher: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xoa voucher nay?')) return
    try {
      await deleteVoucher(id)
      await load()
    } catch (e) {
      alert('Loi xoa: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ma giam gia shop</h1>
          <p className="mt-1 text-sm text-slate-600">Tao va quan ly voucher cho gian hang</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} /> Tao voucher
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <input
            placeholder="Ma voucher"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="rounded-lg border px-3 py-2 text-sm"
            required
          />
          <select
            value={form.discountType}
            onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="PERCENT">Phan tram</option>
            <option value="FIXED">So tien co dinh</option>
          </select>
          <input
            type="number"
            placeholder="Gia tri giam"
            value={form.discountValue}
            onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Don toi thieu"
            value={form.minOrderValue}
            onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
            Luu voucher
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Dang tai...</p>
      ) : vouchers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Chua co voucher
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Ma</th>
                <th className="px-4 py-3 text-left">Loai</th>
                <th className="px-4 py-3 text-left">Gia tri</th>
                <th className="px-4 py-3 text-left">Da dung</th>
                <th className="px-4 py-3 text-right">Hanh dong</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.voucherId} className="border-t">
                  <td className="px-4 py-3 font-semibold">{v.code}</td>
                  <td className="px-4 py-3">{v.discountType}</td>
                  <td className="px-4 py-3">{v.discountValue}</td>
                  <td className="px-4 py-3">
                    {v.usedCount}/{v.usageLimit}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(v.voucherId)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
