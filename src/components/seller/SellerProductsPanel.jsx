import { useState, useEffect, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { ProductFormModal } from '../ProductFormModal'
import { ProductListTable } from '../ProductListTable'
import { normalizeAttributes } from '../../utils/productVariants'
import {
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductVisibility,
} from '../../services/sellerApi'

export function SellerProductsPanel() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const loadProducts = async (page = 0) => {
    setIsLoading(true)
    try {
      const result = await getSellerProducts(page, 10)
      setProducts(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
      setCurrentPage(result.number ?? page)
    } catch (error) {
      alert('Loi tai danh sach san pham: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts(0)
  }, [])

  const buildProductPayload = (formData) => {
    const normalized = normalizeAttributes({
      skuCode: formData.skuCode || '',
      variants: formData.variants || [],
    })

    const attributes = {
      skuCode: normalized.skuCode,
      variants: normalized.variants,
    }
    return {
      productName: formData.productName,
      description: formData.description,
      price: Number(formData.price) || 0,
      stockQuantity: Number(formData.stockQuantity) || 0,
      imageUrl: formData.imageUrl || null,
      attributes: JSON.stringify(attributes),
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
    }
  }

  const parseProductForEdit = (product) => {
    let skuCode = ''
    let variants = []
    try {
      const attrs = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes
      skuCode = attrs?.skuCode || ''
      variants = normalizeAttributes(attrs).variants
    } catch {
      /* ignore */
    }
    return {
      ...product,
      categoryId: product.categoryId || '',
      skuCode,
      variants,
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      setIsLoading(true)
      const payload = buildProductPayload(formData)
      if (editingProduct) {
        await updateProduct(editingProduct.productId, payload)
      } else {
        await createProduct(payload)
      }
      setIsFormOpen(false)
      setEditingProduct(null)
      await loadProducts(currentPage)
    } catch (error) {
      alert('Loi luu san pham: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleVisibility = async (product) => {
    const nextStatus = product.status === 1 ? 0 : 1
    try {
      await updateProductVisibility(product.productId, nextStatus)
      await loadProducts(currentPage)
    } catch (error) {
      alert('Loi cap nhat trang thai: ' + error.message)
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      setIsLoading(true)
      await deleteProduct(productId)
      await loadProducts(currentPage)
    } catch (error) {
      alert('Loi xoa san pham: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return products
    return products.filter((p) => (p.productName || '').toLowerCase().includes(keyword))
  }, [products, searchTerm])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quan ly san pham</h1>
          <p className="mt-1 text-sm text-slate-600">Them, sua, an/hien san pham cua shop</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProduct(null)
            setIsFormOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Them san pham
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Tong san pham</p>
          <p className="mt-1 text-2xl font-bold">{totalElements}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Dang hien thi</p>
          <p className="mt-1 text-2xl font-bold">{products.filter((p) => p.status === 1).length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Cho phe duyet</p>
          <p className="mt-1 text-2xl font-bold">{products.filter((p) => !p.isApproved).length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tim kiem san pham..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <ProductListTable
          products={filteredProducts}
          onEdit={(p) => {
            setEditingProduct(parseProductForEdit(p))
            setIsFormOpen(true)
          }}
          onDelete={handleDeleteProduct}
          onToggleVisibility={handleToggleVisibility}
          isLoading={isLoading}
        />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => loadProducts(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Truoc
            </button>
            <span className="text-sm text-slate-600">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => loadProducts(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isFormOpen}
        product={editingProduct}
        onClose={() => {
          setIsFormOpen(false)
          setEditingProduct(null)
        }}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
