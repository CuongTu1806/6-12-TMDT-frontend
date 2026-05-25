import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getAllCategories } from '../services/catalogApi'

export function ProductFormModal({ isOpen, product, onClose, onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    productName: '',
    categoryId: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    skuCode: '',
    imageUrl: '',
    originalPrice: 0,
  })
  const [categories, setCategories] = useState([])
  const [variants, setVariants] = useState([])
  const [variantDraft, setVariantDraft] = useState({ label: '', price: 0, stockQuantity: 0 })

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getAllCategories()
        setCategories(data)
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (product) {
      let skuCode = product.skuCode || ''
      let variants = product.variants || []
      if (!skuCode && product.attributes) {
        try {
          const attrs = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes
          skuCode = attrs?.skuCode || ''
          variants = attrs?.variants || []
        } catch {
          /* ignore */
        }
      }
      setFormData({
        productName: product.productName || '',
        categoryId: product.categoryId || '',
        description: product.description || '',
        price: product.price || 0,
        stockQuantity: product.stockQuantity || 0,
        skuCode,
        imageUrl: product.imageUrl || '',
        originalPrice: product.originalPrice || 0,
      })
      setVariants(variants)
      setVariantDraft({ label: '', price: 0, stockQuantity: 0 })
    } else {
      setFormData({
        productName: '',
        categoryId: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        skuCode: '',
        imageUrl: '',
        originalPrice: 0,
      })
      setVariants([])
      setVariantDraft({ label: '', price: 0, stockQuantity: 0 })
    }
  }, [product])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stockQuantity' || name === 'originalPrice' 
        ? Number.parseFloat(value) || 0 
        : value
    }))
  }

  const handleAddVariant = () => {
    const label = variantDraft.label.trim()
    if (!label) {
      return
    }

    setVariants([
      ...variants,
      {
        label,
        price: Number(variantDraft.price) || 0,
        stockQuantity: Number(variantDraft.stockQuantity) || 0,
      },
    ])
    setVariantDraft({ label: '', price: 0, stockQuantity: 0 })
  }

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      variants,
    })
  }

  const submitLabel = isLoading ? 'Dang luu...' : product ? 'Cap nhat san pham' : 'Luu san pham'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-[3px]">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <h2 className="text-2xl font-bold text-slate-900">
            {product ? 'Sua san pham' : 'Them san pham moi'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dong form"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ten san pham
            </label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              placeholder="VD: MacBook Air M2"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              required
            />
          </div>

          {/* Category & Description Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Danh muc
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
                required
              >
                <option value="">-- Chon danh muc --</option>
                {categories.map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ma SKU
              </label>
              <input
                type="text"
                name="skuCode"
                value={formData.skuCode}
                onChange={handleInputChange}
                placeholder="SKU-XXXXX"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mo ta san pham
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Nhap mo ta chi tiet ve san pham..."
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Price & Stock Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Gia ban ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                So luong kho
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Gia goc ($)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Hinh anh san pham
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="Nhap URL hinh anh..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />
            {formData.imageUrl && (
              <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden bg-slate-100">
                <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Variants */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Bien the (kich thuoc, mau sac)
            </label>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
              <input
                type="text"
                value={variantDraft.label}
                onChange={(e) => setVariantDraft((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="VD: Size M / Mau Den / 8GB RAM"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="number"
                min="0"
                value={variantDraft.price}
                onChange={(e) => setVariantDraft((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Gia"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="number"
                min="0"
                value={variantDraft.stockQuantity}
                onChange={(e) => setVariantDraft((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                placeholder="Ton kho"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Them
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700"
                >
                  <div>
                    <p className="font-semibold">{variant.label}</p>
                    <p className="text-xs text-blue-600">
                      {Number(variant.price || 0).toLocaleString('vi-VN')}₫ · Ton kho: {variant.stockQuantity ?? 0}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="rounded-full px-2 py-1 text-blue-600 hover:bg-blue-100 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
            >
              Huy bo
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
