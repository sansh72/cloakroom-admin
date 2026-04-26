import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Star, Check, X, Trash2, Database } from 'lucide-react';

const DEFAULT_REVIEWS = [
  { name: 'Arjun Mehta', email: 'arjun@example.com', role: 'College Fest Organizer', rating: 5, message: "Ordered 150 custom hoodies for our college fest and the quality was absolutely insane. The prints didn't fade even after multiple washes. CloakRoom literally saved our event merch game." },
  { name: 'Priya Sharma', email: 'priya@example.com', role: 'HR Manager, TechCorp', rating: 5, message: "We needed 200 branded polo t-shirts for a corporate marathon and CloakRoom delivered on time with premium quality. The bulk pricing was unbeatable. Our entire team was impressed." },
  { name: 'Rohit Verma', email: 'rohit@example.com', role: 'Graphic Designer', rating: 5, message: "The 3D customization tool is next level — I could see exactly how my design would look on the hoodie before ordering. The final product matched the preview perfectly. Mind blown." },
  { name: 'Sneha Kapoor', email: 'sneha@example.com', role: 'Startup Founder', rating: 5, message: "Got varsity jackets made for my entire team of 30. The embroidery quality was premium and everyone absolutely loved them. CloakRoom made our company swag actually cool for once." },
  { name: 'Vikram Patel', email: 'vikram@example.com', role: 'Regular Customer', rating: 4, message: "Been buying graphic tees from CloakRoom for months now. Super comfortable fabric and the designs are genuinely unique — not the same recycled stuff you see on every other brand." },
  { name: 'Ananya Iyer', email: 'ananya@example.com', role: 'School Coordinator', rating: 5, message: "Ordered polo t-shirts for our school's annual sports day. The kids loved the vibrant colors, the material was durable, and delivery was 2 days early. Already planning next year's order!" },
];

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

  const seedDefaultReviews = async () => {
    const existing = await getDocs(query(collection(db, REVIEWS_COLLECTION), where('seeded', '==', true)));
    if (existing.docs.length > 0) {
      alert('Default reviews already seeded.');
      return;
    }
    for (const r of DEFAULT_REVIEWS) {
      await addDoc(collection(db, REVIEWS_COLLECTION), {
        ...r,
        approved: true,
        seeded: true,
        createdAt: serverTimestamp(),
      });
    }
    await loadReviews();
    alert('Default reviews seeded successfully.');
  };

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
        <button
          onClick={seedDefaultReviews}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Seed Default Reviews
        </button>
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
