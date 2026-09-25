/**
 * Kalaghar — Product Model
 * Full e-commerce schema per DATABASE DESIGN spec.
 * Includes: Categories (hierarchical), Products, ProductImages,
 * CartItems, Orders, OrderItems, Payments support.
 */
const mongoose = require('mongoose');

// ─── Valid Craft / Category slugs ───────────────────────────────────────────
const VALID_CRAFTS = [
  'pottery', 'textiles', 'paintings', 'jewellery', 'woodcraft',
  'bamboo', 'home-lifestyle', 'sustainable', 'furniture', 'fragrance',
  'kids', 'pet', 'hardware', 'smart-home', 'lighting',
  'Metal Craft', 'Leather Craft', 'Stone & Marble Craft', 'Paper & Handmade Craft',
  'Organic & Handmade Foods', 'Plants & Planters', 'Festive & Pooja Essentials',
  'Wood & Bamboo Craft', 'Jewellery & Accessories', 'Paintings & Wall Art', 'Apparel'
];
const VALID_STATUSES = ['pending', 'approved', 'rejected'];

// ─── Rating sub-schema ───────────────────────────────────────────────────────
const ratingSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:    { type: Number, min: 1, max: 5, required: true },
  review:    { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

// ─── Product Image sub-schema (per DB design: PRODUCT_IMAGES table) ─────────
const productImageSchema = new mongoose.Schema({
  url:        { type: String, required: true },
  isPrimary:  { type: Boolean, default: false },
  altText:    { type: String, trim: true },
  createdAt:  { type: Date, default: Date.now },
}, { _id: true });

// ─── Main Product Schema ──────────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  // Core identity
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
    sparse: true,
  },

  // Pricing (per DB design: price + discount_price)
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [1, 'Price must be greater than 0'],
  },
  discountPrice: {
    type: Number,
    default: null,
  },

  // Inventory (per DB design: stock_quantity)
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  // Alias kept for backward compat
  quantity: {
    type: Number,
    default: function () { return this.stock; },
  },

  // Images (per DB design: ProductImages - 1:N)
  images: [String],             // simple array for legacy compat
  productImages: [productImageSchema], // full sub-collection per DB spec

  // Status / visibility (per DB design: is_active)
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  status: {
    type: String,
    enum: VALID_STATUSES,
    default: 'pending',
  },

  // Kalaghar craft taxonomy
  craft: {
    type: String,
    required: [true, 'Craft category is required'],
  },
  region:    { type: String, trim: true },
  technique: { type: String, trim: true },

  // Category hierarchy (per DB design: category_id FK → CATEGORIES)
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  // Legacy flat category field
  category: { type: String, trim: true },

  // Seller / artisan link (per DB design: user_id FK → USERS)
  sellerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: { type: String, trim: true },

  // Ratings
  ratings: [ratingSchema],

  // Video showcase
  video: { type: String },

  // Tags for search
  tags: [String],

}, { timestamps: true });

// ─── Indexes ─────────────────────────────────────────────────────────────────
productSchema.index({ sellerId: 1 });
productSchema.index({ craft: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ craft: 1, status: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ discountPrice: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // full-text

// ─── Virtuals ────────────────────────────────────────────────────────────────
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= 5 && this.stock > 0;
});

productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice ?? this.price;
});

productSchema.virtual('discountPercent').get(function () {
  if (this.discountPrice && this.discountPrice < this.price) {
    return Math.round((1 - this.discountPrice / this.price) * 100);
  }
  return 0;
});

const Product = mongoose.model('Product', productSchema);
module.exports = { Product, productSchema, ratingSchema, VALID_CRAFTS, VALID_STATUSES };