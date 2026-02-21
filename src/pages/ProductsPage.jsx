import { useEffect, useState } from 'react';
import { subscribeToProducts, addProduct, updateProduct, deleteProduct } from '../services/productService';
import { uploadImages } from '../services/cloudinaryService';
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Upload,
  ImageIcon,
} from 'lucide-react';

const CATEGORIES = ['hoodie', 'trouser', 'polo', 'roundneck', 'varsity'];
const GENDERS = ['men', 'women', 'unisex'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'hoodie',
  gender: 'men',
  price: '',
  discountPrice: '',
  sizes: [],
  colors: [],
  images: [],
  inStock: true,
  featured: false,
  customizable: false,
  material: '',
  stockCount: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Real-time listener - products update automatically when stock changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToProducts(
      (data) => {
        setProducts(data);
        setLoading(false);
      },
      () => {
        showToast('Failed to fetch products', 'error');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeleteConfirm(null);
      showToast('Product deleted');
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSaved = () => {
    const wasEditing = !!editingProduct;
    handleFormClose();
    // No need to refetch — real-time listener auto-updates products
    showToast(wasEditing ? 'Product updated' : 'Product added');
  };

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term);
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
          <button
            onClick={() => { setEditingProduct(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer capitalize ${
            categoryFilter === 'ALL'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All ({products.length})
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer capitalize ${
              categoryFilter === c
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {c} ({products.filter((p) => p.category === c).length})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search || categoryFilter !== 'ALL' ? 'No products match your filters' : 'No products yet. Add your first product!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
              {/* Image */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={32} className="text-gray-300" />
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(product)}
                    className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{product.gender}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{product.category}</span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mt-2 truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-gray-900">₹{product.price}</span>
                  {product.discountPrice && (
                    <span className="text-xs text-gray-400 line-through">₹{product.discountPrice}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {product.colors && product.colors.slice(0, 5).map((c, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  {product.colors && product.colors.length > 5 && (
                    <span className="text-xs text-gray-400">+{product.colors.length - 5}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {product.sizes?.join(', ')}
                  </span>
                  <span className={`text-xs font-medium ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
                    {product.inStock
                      ? product.stockCount != null ? `${product.stockCount} in stock` : 'In stock'
                      : 'Out of stock'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
              <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Delete <strong>{deleteConfirm.name}</strong>? This will remove it from the store.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Product Form Modal ───

function ProductFormModal({ product, onClose, onSaved, onError }) {
  const isEditing = !!product;
  const [form, setForm] = useState(() => {
    if (product) {
      return {
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'hoodie',
        gender: product.gender || 'men',
        price: product.price?.toString() || '',
        discountPrice: product.discountPrice?.toString() || '',
        sizes: product.sizes || [],
        colors: product.colors || [],
        images: product.images || [],
        inStock: product.inStock !== false,
        featured: product.featured || false,
        customizable: product.customizable || false,
        material: product.material || '',
        stockCount: product.stockCount?.toString() || '',
      };
    }
    return { ...EMPTY_FORM };
  });

  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState(product?.images || []);
  const [colorInput, setColorInput] = useState({ name: '', hex: '#000000' });
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSize = (size) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const addColor = () => {
    if (!colorInput.name.trim()) return;
    setForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: colorInput.name.trim(), hex: colorInput.hex }],
    }));
    setColorInput({ name: '', hex: '#000000' });
  };

  const removeColor = (index) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (previews.length + files.length > 6) {
      onError('Maximum 6 images allowed');
      return;
    }
    setNewFiles((prev) => [...prev, ...files]);
    // Generate previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    // If it's an existing image (URL string) vs a new file
    const existingCount = form.images.length;
    if (index < existingCount) {
      // Remove existing image
      setForm((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      // Remove new file
      const fileIndex = index - existingCount;
      setNewFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) { onError('Product name is required'); return; }
    if (!form.price || isNaN(Number(form.price))) { onError('Valid price is required'); return; }
    if (form.sizes.length === 0) { onError('Select at least one size'); return; }
    if (previews.length === 0) { onError('Upload at least one image'); return; }

    try {
      setSaving(true);

      // Upload new files to Cloudinary
      let allImageUrls = [...form.images];
      if (newFiles.length > 0) {
        setUploadProgress(`Uploading ${newFiles.length} image${newFiles.length > 1 ? 's' : ''}...`);
        const productSlug = form.name.trim().replace(/\s+/g, '-').toLowerCase();
        const folder = `products/${form.gender}/${productSlug}`;
        const uploadedUrls = await uploadImages(newFiles, folder);
        allImageUrls = [...allImageUrls, ...uploadedUrls];
      }

      setUploadProgress('Saving product...');

      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        gender: form.gender,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        sizes: form.sizes,
        colors: form.colors,
        images: allImageUrls,
        inStock: form.stockCount ? Number(form.stockCount) > 0 : form.inStock,
        featured: form.featured,
        customizable: form.customizable,
        material: form.material.trim() || null,
        stockCount: form.stockCount ? Number(form.stockCount) : null,
      };

      if (isEditing) {
        await updateProduct(product.id, productData);
      } else {
        await addProduct(productData);
      }

      onSaved();
    } catch (err) {
      onError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Gender & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g} className="capitalize">{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Classic Black Hoodie"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Product description..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          {/* Price & Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="1499"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹) <span className="text-gray-400">optional</span></label>
              <input
                type="number"
                value={form.discountPrice}
                onChange={(e) => handleChange('discountPrice', e.target.value)}
                placeholder="1999"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material <span className="text-gray-400">optional</span></label>
            <input
              type="text"
              value={form.material}
              onChange={(e) => handleChange('material', e.target.value)}
              placeholder="e.g. 100% Cotton, Polyester blend"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    form.sizes.includes(size)
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
            {form.colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.colors.map((color, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-sm text-gray-700">{color.name}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(i)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorInput.hex}
                onChange={(e) => setColorInput((prev) => ({ ...prev, hex: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={colorInput.name}
                onChange={(e) => setColorInput((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Color name (e.g. Black)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
              />
              <button
                type="button"
                onClick={addColor}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Stock Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory (number of items available)</label>
            <input
              type="number"
              value={form.stockCount}
              onChange={(e) => handleChange('stockCount', e.target.value)}
              placeholder="e.g. 50"
              min="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">Set to 0 to mark as out of stock</p>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900"
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.customizable}
                onChange={(e) => handleChange('customizable', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900"
              />
              <span className="text-sm text-gray-700">Customizable</span>
            </label>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images <span className="text-gray-400">(up to 6)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {previews.length < 6 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
            >
              {saving ? uploadProgress || 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
