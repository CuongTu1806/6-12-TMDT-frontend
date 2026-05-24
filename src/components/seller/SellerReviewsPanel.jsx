import { useEffect, useState } from 'react'
import { getSellerReviews, replyToReview } from '../../services/sellerApi'

export function SellerReviewsPanel() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyTexts, setReplyTexts] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const result = await getSellerReviews(0, 50)
      setReviews(result.content || [])
    } catch (e) {
      alert('Loi tai danh gia: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleReply = async (reviewId) => {
    const content = replyTexts[reviewId]
    if (!content?.trim()) {
      alert('Vui long nhap noi dung tra loi')
      return
    }
    try {
      await replyToReview(reviewId, content.trim())
      setReplyTexts((prev) => ({ ...prev, [reviewId]: '' }))
      await load()
    } catch (e) {
      alert('Loi gui phan hoi: ' + e.message)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Dang tai danh gia...</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cham soc khach hang</h1>
        <p className="mt-1 text-sm text-slate-600">Doc va tra loi danh gia san pham</p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Chua co danh gia nao
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.reviewId} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{review.productName}</p>
                <span className="text-amber-500">{'★'.repeat(review.star)}{'☆'.repeat(5 - review.star)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{review.buyerName}</p>
              <p className="mt-2 text-sm text-slate-800">{review.content}</p>

              {review.replyContent ? (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="font-semibold">Phan hoi cua shop:</p>
                  <p>{review.replyContent}</p>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyTexts[review.reviewId] || ''}
                    onChange={(e) =>
                      setReplyTexts((prev) => ({ ...prev, [review.reviewId]: e.target.value }))
                    }
                    placeholder="Nhap phan hoi..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleReply(review.reviewId)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Tra loi
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
