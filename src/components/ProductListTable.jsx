import { Trash2, Edit, Eye, EyeOff } from 'lucide-react'
import { getProductImageUrl } from '../utils/image'

export function ProductListTable({ products, onEdit, onDelete, onToggleVisibility, isLoading = false }) {
  const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}₫`

  if (isLoading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
        <p className="text-slate-600">Dang tai san pham...</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
        <p className="text-slate-600 text-lg">Ban chua co san pham nao</p>
        <p className="text-slate-500 text-sm mt-1">Hay them san pham dau tien</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Hinh anh</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Ten san pham</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Danh muc</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Gia</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">So luong</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Trang thai</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase">Hanh dong</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.productId} className="border-b hover:bg-slate-50 transition">
              {/* Image */}
              <td className="px-6 py-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                  {product.imageUrl ? (
                    <img
                      src={getProductImageUrl(product.imageUrl)}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Eye size={20} />
                    </div>
                  )}
                </div>
              </td>

              {/* Product Name */}
              <td className="px-6 py-4">
                <div className="max-w-xs">
                  <p className="font-semibold text-slate-900 line-clamp-1">{product.productName}</p>
                  <p className="text-xs text-slate-500">{product.skuCode}</p>
                </div>
              </td>

              {/* Category */}
              <td className="px-6 py-4 text-sm text-slate-700">{product.categoryName || 'N/A'}</td>

              {/* Price */}
              <td className="px-6 py-4">
                <div className="font-semibold text-blue-600">{formatPrice(product.price)}</div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="text-xs text-slate-500 line-through">{formatPrice(product.originalPrice)}</div>
                )}
              </td>

              {/* Stock */}
              <td className="px-6 py-4 text-sm font-semibold">
                <span className={product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stockQuantity}
                </span>
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className={`inline-block w-fit px-2 py-1 rounded-full text-xs font-semibold ${
                    product.isApproved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {product.isApproved ? 'Duoc phe duyet' : 'Cho phe duyet'}
                  </span>
                  <span className={`inline-block w-fit px-2 py-1 rounded-full text-xs font-semibold ${
                    product.status === 1 ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {product.status === 1 ? 'Dang hien' : 'Da an'}
                  </span>
                </div>
              </td>

              {/* Actions */}
              <td className="px-6 py-4 text-right">
                <div className="flex gap-2 justify-end">
                  {onToggleVisibility && (
                    <button
                      onClick={() => onToggleVisibility(product)}
                      title={product.status === 1 ? 'An san pham' : 'Hien san pham'}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      {product.status === 1 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(product)}
                    title="Sua"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Ban chac chan muon xoa san pham nay?')) {
                        onDelete(product.productId)
                      }
                    }}
                    title="Xoa"
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
