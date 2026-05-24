import { useEffect, useState } from 'react'
import { getSellerShop, updateSellerShop } from '../../services/sellerApi'

export function SellerShopPanel() {
  const [form, setForm] = useState({ shopName: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const shop = await getSellerShop()
        setForm({
          shopName: shop.shopName || '',
          description: shop.description || '',
        })
      } catch (e) {
        alert('Loi tai thong tin shop: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateSellerShop(form)
      alert('Cap nhat shop thanh cong!')
    } catch (err) {
      alert('Loi cap nhat: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Dang tai...</p>

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ho so Shop</h1>
        <p className="mt-1 text-sm text-slate-600">Cap nhat ten va mo ta gian hang</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Ten shop</label>
          <input
            type="text"
            value={form.shopName}
            onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Mo ta</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Dang luu...' : 'Luu thay doi'}
        </button>
      </form>
    </div>
  )
}
