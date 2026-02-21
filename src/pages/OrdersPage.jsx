import { useEffect, useState } from 'react';
import { getMergedOrders, updateOrderTrackingStatus } from '../services/orderService';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle,
  Truck,
  Home,
  XCircle,
  Clock,
  X,
} from 'lucide-react';

const ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_CONFIG = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ACCEPTED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  PREPARING: { color: 'bg-purple-100 text-purple-800', icon: Package },
  SHIPPED: { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  DELIVERED: { color: 'bg-green-100 text-green-800', icon: Home },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle },
};

function getDisplayStatus(order) {
  if (order.tracking?.status) return order.tracking.status;
  const s = (order.status || '').toUpperCase();
  if (ORDER_STATUSES.includes(s)) return s;
  const map = { CONFIRMED: 'ACCEPTED', PROCESSING: 'PREPARING' };
  return map[s] || 'PENDING';
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMergedOrders();
      setOrders(data);
    } catch (err) {
      showToast('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (o.id || '').toLowerCase().includes(term) ||
      (o.userEmail || '').toLowerCase().includes(term) ||
      (o.shippingAddress?.fullName || '').toLowerCase().includes(term);
    const status = getDisplayStatus(o);
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = orders.reduce((acc, o) => {
    const s = getDisplayStatus(o);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} total orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All ({orders.length})
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order ID, email, or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search || statusFilter !== 'ALL' ? 'No orders match your filters' : 'No orders found'}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedOrders.map((order) => {
            const status = getDisplayStatus(order);
            const isExpanded = expandedOrder === order.id;
            const isCustom = !!order.customOrder;

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Row — email as title, order ID secondary */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{order.userEmail || 'Unknown'}</p>
                      {isCustom && (
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ID: {order.id} &middot;{' '}
                      {order.createdAt instanceof Date
                        ? order.createdAt.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {order.total != null ? `₹${order.total.toLocaleString()}` : '—'}
                    </p>
                    <StatusBadge status={status} />
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-5 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Shipping Address */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                          Shipping Address
                        </h4>
                        {order.shippingAddress ? (
                          <div className="text-sm text-gray-700 space-y-1">
                            <p className="font-medium">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>
                              {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                              {order.shippingAddress.pincode}
                            </p>
                            <p className="text-gray-500">{order.shippingAddress.phone}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No address</p>
                        )}
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items</h4>
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.product?.name || 'Custom Item'}{' '}
                                  <span className="text-gray-400">
                                    x{item.quantity} · {item.selectedSize}
                                  </span>
                                </span>
                                <span className="text-gray-900 font-medium">
                                  ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">{isCustom ? 'Custom design order' : 'No items'}</p>
                        )}
                        {order.total != null && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm font-semibold">
                            <span>Total</span>
                            <span>₹{order.total.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Tracking info */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                          Tracking Details
                        </h4>
                        <div className="text-sm space-y-2">
                          {order.tracking?.trackingNumber && (
                            <p>
                              <span className="text-gray-500">Tracking #:</span>{' '}
                              <span className="font-medium">{order.tracking.trackingNumber}</span>
                            </p>
                          )}
                          {order.tracking?.courierService && (
                            <p>
                              <span className="text-gray-500">Courier:</span> {order.tracking.courierService}
                            </p>
                          )}
                          {order.tracking?.estimatedDelivery && (
                            <p>
                              <span className="text-gray-500">Est. Delivery:</span>{' '}
                              {new Date(
                                order.tracking.estimatedDelivery.seconds
                                  ? order.tracking.estimatedDelivery.seconds * 1000
                                  : order.tracking.estimatedDelivery
                              ).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                          {order.paymentMethod && (
                            <p>
                              <span className="text-gray-500">Payment:</span> {order.paymentMethod}
                            </p>
                          )}
                        </div>

                        {/* Status history */}
                        {order.tracking?.statusHistory && order.tracking.statusHistory.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                              Status History
                            </p>
                            <div className="space-y-1.5">
                              {order.tracking.statusHistory.map((entry, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <StatusBadge status={entry.status} />
                                  <span className="text-gray-400 mt-0.5">
                                    {entry.timestamp?.toDate
                                      ? entry.timestamp.toDate().toLocaleString('en-IN')
                                      : new Date(entry.timestamp).toLocaleString('en-IN')}
                                  </span>
                                  {entry.notes && <span className="text-gray-500 mt-0.5">— {entry.notes}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Custom order notes */}
                        {isCustom && order.customOrder.additionalNotes && (
                          <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                            <p className="text-xs font-semibold text-violet-600 mb-1">Custom Order Notes</p>
                            <p className="text-sm text-violet-800">{order.customOrder.additionalNotes}</p>
                          </div>
                        )}

                        {/* Update status button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdateModal(order);
                          }}
                          className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ORDERS_PER_PAGE + 1}–
            {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dot-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium cursor-pointer ${
                      currentPage === p
                        ? 'bg-gray-900 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {updateModal && (
        <UpdateStatusModal
          order={updateModal}
          currentStatus={getDisplayStatus(updateModal)}
          onClose={() => setUpdateModal(null)}
          onUpdated={() => {
            setUpdateModal(null);
            fetchOrders();
            showToast('Order status updated');
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}
    </div>
  );
}

function UpdateStatusModal({ order, currentStatus, onClose, onUpdated, onError }) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierService, setCourierService] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (status === currentStatus && !notes && !trackingNumber) return;
    try {
      setSaving(true);
      const extra = {};
      if (trackingNumber) extra.trackingNumber = trackingNumber;
      if (courierService) extra.courierService = courierService;
      if (estimatedDelivery) extra.estimatedDelivery = new Date(estimatedDelivery);

      await updateOrderTrackingStatus(order.id, status, notes || undefined, extra);
      onUpdated();
    } catch (err) {
      onError('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">Order #{order.id.slice(0, 14)}...</p>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Current Status</p>
          <StatusBadge status={currentStatus} />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {(status === 'SHIPPED' || status === 'DELIVERED') && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Optional"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Courier Service</label>
              <input
                type="text"
                value={courierService}
                onChange={(e) => setCourierService(e.target.value)}
                placeholder="e.g. FedEx, Blue Dart"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </>
        )}

        {status !== 'DELIVERED' && status !== 'CANCELLED' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
            <input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes visible to customer..."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
