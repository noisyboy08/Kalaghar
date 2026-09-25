/**
 * Kalaghar — User Model
 * Full e-commerce schema per DATABASE DESIGN spec.
 * Includes: Users, Addresses (1:N), Cart Items, Wishlist, Roles.
 */
const mongoose = require('mongoose');

// ─── Address sub-schema (per DB design: ADDRESSES table - 1:N to Users) ──────
const addressSchema = new mongoose.Schema({
  label:     { type: String, default: 'Home', trim: true },  // 'Home', 'Work', etc.
  fullName:  { type: String, required: true, trim: true },
  phone:     { type: String, required: true, trim: true },
  line1:     { type: String, required: true, trim: true },
  line2:     { type: String, trim: true },
  city:      { type: String, required: true, trim: true },
  state:     { type: String, required: true, trim: true },
  pincode:   { type: String, required: true, trim: true },
  country:   { type: String, default: 'India', trim: true },
  isDefault: { type: Boolean, default: false }, // per DB design: is_default flag
}, { _id: true, timestamps: true });

// ─── Cart Item sub-schema (per DB design: CART_ITEMS table) ──────────────────
const cartItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String },
  imageUrl:    { type: String },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1, default: 1 },
}, { _id: true, timestamps: true });

// ─── Artisan Story sub-schema (Kalaghar-specific) ────────────────────────────
const artisanStorySchema = new mongoose.Schema({
  photo:             { type: String },
  village:           { type: String, trim: true },
  region:            { type: String, trim: true },
  yearsOfExperience: { type: Number, min: 0 },
  technique:         { type: String, trim: true },
  bio:               { type: String, trim: true },
  awards:            [String],
  giTagCrafts:       [String],  // GI-certified crafts this artisan practices
});

// ─── Bank Details sub-schema ─────────────────────────────────────────────────
const bankDetailsSchema = new mongoose.Schema({
  accountName:   { type: String, trim: true },
  accountNumber: { type: String, trim: true },
  ifscCode:      { type: String, trim: true },
  bankName:      { type: String, trim: true },
  upiId:         { type: String, trim: true },
}, { _id: false });

// ─── Main User Schema (per DB design: USERS + ROLES tables) ──────────────────
const userSchema = new mongoose.Schema({
  // Core identity
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Please enter a valid email address',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters'],
  },

  // Role (per DB design: ROLES table / role_id FK)
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer',
    index: true,
  },

  // Profile
  phone:    { type: String, trim: true },
  avatar:   { type: String },
  isActive: { type: Boolean, default: true },

  // Auth tokens
  refreshToken: { type: String, default: null },
  fcmToken:     { type: String, default: null },

  // Address book (per DB design: ADDRESSES 1:N)
  addresses: [addressSchema],

  // Cart (per DB design: CART_ITEMS table 1:N to user)
  cart: [cartItemSchema],

  // Wishlist (Kalaghar-specific extension)
  wishlist: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt:   { type: Date, default: Date.now },
  }],

  // Save-for-later list
  savedForLater: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt:   { type: Date, default: Date.now },
  }],

  // ─── Seller-specific fields ─────────────────────────────────────────────
  storeName:     { type: String, trim: true },
  craft: {
    type: String,
    enum: ['pottery', 'textiles', 'paintings', 'jewellery', 'woodcraft', 'bamboo', 'home-lifestyle', 'sustainable', 'furniture', 'fragrance', 'kids', 'pet', 'hardware', 'smart-home', 'lighting', null],
  },
  region:        { type: String, trim: true },
  technique:     { type: String, trim: true },
  storeDescription: { type: String, trim: true },
  storeBanner:   { type: String },
  storeLogo:     { type: String },
  bankDetails:   bankDetailsSchema,
  commissionRate: { type: Number, default: 10 },  // percentage Kalaghar takes

  // KYC / verification
  kycStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  kycDocumentUrl:      { type: String },
  kycDocumentPublicId: { type: String },
  kycRejectedReason:   { type: String },

  // Artisan story (Kalaghar-specific)
  artisanStory: artisanStorySchema,

  // Legacy compat
  address:       { type: String, default: '' },
  saveForLater:  [{ type: mongoose.Schema.Types.Mixed }],
  keepShoppingFor: [{ type: mongoose.Schema.Types.Mixed }],
  wishList:      [{ type: mongoose.Schema.Types.Mixed }],

}, { timestamps: true });

// ─── Indexes (per DB design: INDEXES & CONSTRAINTS) ──────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ kycStatus: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
