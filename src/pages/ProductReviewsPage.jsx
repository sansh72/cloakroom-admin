import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Star, Trash2, Search, RefreshCw, BadgeCheck, MessageSquareText } from 'lucide-react';

const PRODUCTS_COLLECTION = 'products';

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

export default function ProductReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Product reviews live as a `reviewsList` array on each product doc,
  // so flatten every product's list into one moderation feed.
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
      const flattened = [];
      snapshot.docs.forEach((d) => {
        const product = d.data();
        (product.reviewsList || []).forEach((review, i) => {
          flattened.push({
            key: `${d.id}_${i}`,
            productId: d.id,
            productName: product.name || '(untitled product)',
            productImage: product.images?.[0] || product.image || null,
            raw: review, // exact array element, needed for arrayRemove
            ...review,
            createdAtDate: toDate(review.createdAt),
          });
        });
      });
      flattened.sort(
        (a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0)
      );
      setReviews(flattened);
    } catch (err) {
      showToast('Failed to fetch product reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (review) => {
    if (!window.confirm(`Delete this review on "${review.productName}"? This cannot be undone.`)) return;
    try {
      setDeleting(review.key);
      await updateDoc(doc(db, PRODUCTS_COLLECTION, review.productId), {
        reviewsList: arrayRemove(review.raw),
      });
      setReviews((prev) => prev.filter((r) => r.key !== review.key));
      showToast('Review deleted');
    } catch (err) {
      showToast('Failed to delete review', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        const term = search.toLowerCase();
        const matchesSearch =
          !term ||
          r.productName.toLowerCase().includes(term) ||
          (r.name || '').toLowerCase().includes(term) ||
          (r.title || '').toLowerCase().includes(term) ||
          (r.comment || '').toLowerCase().includes(term);
        const matchesStars = !starFilter || r.stars === starFilter;
        return matchesSearch && matchesStars;
      }),
    [reviews, search, starFilter]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            {reviews.length} review{reviews.length === 1 ? '' : 's'} left by customers on delivered
            orders — shown under each product on the storefront
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Search + star filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, reviewer, or text..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex gap-1.5">
          {[0, 5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                starFilter === s
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 0 ? 'All' : `${s}★`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquareText size={32} className="mx-auto mb-2 text-gray-300" />
          {reviews.length === 0
            ? 'No product reviews yet. Reviews appear here once customers review delivered orders.'
            : 'No reviews match the current filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {review.productImage && (
                      <img
                        src={review.productImage}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                      />
                    )}
                    <p className="font-medium text-gray-900">{review.productName}</p>
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                        <BadgeCheck size={12} />
                        Verified purchase
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= review.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    {review.title && (
                      <p className="text-sm font-semibold text-gray-900">{review.title}</p>
                    )}
                  </div>

                  {review.comment && <p className="text-gray-700 text-sm">"{review.comment}"</p>}

                  <p className="text-xs text-gray-400 mt-2">
                    {review.name || 'Anonymous'}
                    {review.createdAtDate &&
                      ` · ${review.createdAtDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`}
                    {review.orderId && ` · Order ${review.orderId.slice(0, 10)}...`}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(review)}
                  disabled={deleting === review.key}
                  title="Delete review"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
