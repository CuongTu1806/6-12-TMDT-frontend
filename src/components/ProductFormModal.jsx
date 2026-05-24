import { useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
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
  const [newVariant, setNewVariant] = useState('')

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
    }
  }, [product])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stockQuantity' || name === 'originalPrice' 
        ? parseFloat(value) || 0 
        : value
    }))
  }

  const handleAddVariant = () => {
    if (newVariant.trim()) {
      setVariants([...variants, newVariant])
      setNewVariant('')
    }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between bg-white border-b p-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {product ? 'Sua san pham' : 'Them san pham moi'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
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
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newVariant}
                onChange={(e) => setNewVariant(e.target.value)}
                placeholder="VD: Size M, Mau Den"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddVariant}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                + Them
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  {variant}
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="text-blue-600 hover:text-blue-800"
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
              {isLoading ? 'Dang luu...' : product ? 'Cap nhat san pham' : 'Luu san pham'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
