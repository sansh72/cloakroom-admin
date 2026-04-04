import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Star, Check, X, Trash2 } from 'lucide-react';

const REVIEWS_COLLECTION = 'reviews';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const q = query(collection(db, REVIEWS_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (id) => {
    await updateDoc(doc(db, REVIEWS_COLLECTION, id), { approved: true });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: true } : r));
  };

  const rejectReview = async (id) => {
    await updateDoc(doc(db, REVIEWS_COLLECTION, id), { approved: false });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: false } : r));
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    await deleteDoc(doc(db, REVIEWS_COLLECTION, id));
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.approved;
    if (filter === 'approved') return r.approved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.approved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            {reviews.length} total • {pendingCount} pending approval
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'approved', label: 'Approved' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No reviews {filter !== 'all' ? `in "${filter}" category` : 'yet'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => (
            <div
              key={review.id}
              className={`bg-white rounded-xl border p-5 ${
                !review.approved ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {review.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.name}</p>
                      <p className="text-xs text-gray-500">{review.email}</p>
                    </div>
                    {review.role && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {review.role}
                      </span>
                    )}
                    {!review.approved && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
                        Pending
                      </span>
                    )}
                    {review.approved && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                        Approved
                      </span>
                    )}
                  </div>

                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>

                  <p className="text-gray-700 text-sm">"{review.message}"</p>

                  {review.createdAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      {review.createdAt?.toDate?.()
                        ? review.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : ''}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!review.approved && (
                    <button
                      onClick={() => approveReview(review.id)}
                      className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors cursor-pointer"
                      title="Approve"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  {review.approved && (
                    <button
                      onClick={() => rejectReview(review.id)}
                      className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors cursor-pointer"
                      title="Unapprove"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
