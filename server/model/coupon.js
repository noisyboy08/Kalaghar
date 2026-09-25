const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: { type: String, trim: true },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: [0, 'Discount value cannot be negative'],
  },
  maxDiscount: {
    type: Number, // cap for percentage discounts
    default: null,
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  usageLimit: {
    type: Number,
    default: null, // null = unlimited
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  // Scope: null = global, sellerId = seller-specific
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Restrict to specific craft categories
  applicableCrafts: [{
    type: String,
    enum: ['pottery', 'textiles', 'paintings', 'jewellery', 'woodcraft'],
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

couponSchema.index({ expiresAt: 1 });
couponSchema.index({ sellerId: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
