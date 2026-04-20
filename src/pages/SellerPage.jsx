import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, LayoutDashboard, Package, ShoppingBag, Settings, Download } from 'lucide-react'
import { ProductFormModal } from '../components/ProductFormModal'
import { ProductListTable } from '../components/ProductListTable'
import { getSellerProducts, createProduct, updateProduct, deleteProduct } from '../services/sellerApi'

export function SellerPage({ session, onLogout }) {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    loadProducts(0)
  }, [])

  const loadProducts = async (page = 0) => {
    setIsLoading(true)
    try {
      const result = await getSellerProducts(page, 10)
      setProducts(result.content || [])
      setTotalPages(result.totalPages || 0)
      setTotalElements(result.totalElements || 0)
      setCurrentPage(result.number ?? page)
    } catch (error) {
      console.error('Error loading products:', error)
      if (String(error.message || '').includes('401')) {
        onLogout()
        return
      }
      alert('Loi tai danh sach san pham: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const buildProductPayload = (formData) => {
    const attributes = {
      skuCode: formData.skuCode || '',
      variants: formData.variants || [],
    }

    return {
      productName: formData.productName,
      description: formData.description,
      price: Number(formData.price) || 0,
      stockQuantity: Number(formData.stockQuantity) || 0,
      imageUrl: formData.imageUrl || null,
      attributes: JSON.stringify(attributes),
      category: formData.categoryId ? { categoryId: Number(formData.categoryId) } : null,
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      setIsLoading(true)
      const payload = buildProductPayload(formData)

      if (editingProduct) {
        await updateProduct(editingProduct.productId, payload)
        alert('Cap nhat san pham thanh cong!')
      } else {
        await createProduct(payload)
        alert('Them san pham thanh cong!')
      }

      setIsFormOpen(false)
      setEditingProduct(null)
      await loadProducts(currentPage)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Loi luu san pham: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      setIsLoading(true)
      await deleteProduct(productId)
      alert('Xoa san pham thanh cong!')
      await loadProducts(currentPage)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Loi xoa san pham: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return products

    return products.filter((p) => {
      const name = (p.productName || '').toLowerCase()
      const attrs = p.attributes || ''
      return name.includes(keyword) || attrs.toLowerCase().includes(keyword)
    })
  }, [products, searchTerm])

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-blue-600">
            <span className="inline-block rounded-md bg-blue-100 px-2 py-1">M</span>
            Marketplace Pro
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">Switch to Buyer</span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold"
            >
              Dang xuat
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <nav className="space-y-2 text-sm">
            <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50">
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button type="button" className="flex w-full items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700">
              <Package size={16} /> Products
            </button>
            <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50">
              <ShoppingBag size={16} /> Orders
            </button>
            <button type="button" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50">
              <Settings size={16} /> Settings
            </button>
          </nav>
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Quan ly san pham</h1>
                <p className="mt-1 text-sm text-slate-600">Xem, them, sua va xoa san pham cua shop</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  <Download size={16} /> Xuat CSV
                </button>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={16} /> Them san pham
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Tong san pham</p>
              <p className="mt-1 text-2xl font-bold">{totalElements}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Dang hoat dong</p>
              <p className="mt-1 text-2xl font-bold">{products.filter((p) => p.status === 1).length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Cho phe duyet</p>
              <p className="mt-1 text-2xl font-bold">{products.filter((p) => !p.isApproved).length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tim kiem san pham..."
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <ProductListTable
              products={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
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
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadProducts(idx)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                      idx === currentPage ? 'bg-blue-600 text-white' : 'border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => loadProducts(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </section>
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
