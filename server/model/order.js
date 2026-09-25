/**
 * Kalaghar — Order Model
 * Full e-commerce order schema per DATABASE DESIGN spec.
 * Includes: Orders, OrderItems, Payment tracking.
 */
const mongoose = require('mongoose');

// ─── Order Item (per DB design: ORDER_ITEMS table) ───────────────────────────
const orderItemSchema = new mongoose.Schema({
  productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  imageUrl:   { type: String },
  quantity:   { type: Number, required: true, min: 1 },
  price:      { type: Number, required: true },  // price at time of order
  total:      { type: Number, required: true },  // quantity × price
}, { _id: true });

// ─── Payment sub-doc (per DB design: PAYMENTS table) ─────────────────────────
const paymentSchema = new mongoose.Schema({
  paymentMethod:   { type: String, enum: ['razorpay', 'cod', 'upi', 'card', 'netbanking'], required: true },
  transactionId:   { type: String, unique: true, sparse: true },
  status:          { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  amount:          { type: Number, required: true },
  currency:        { type: String, default: 'INR' },
  paidAt:          { type: Date },
}, { timestamps: true });

// ─── Main Order Schema (per DB design: ORDERS table) ─────────────────────────
const orderSchema = new mongoose.Schema({
  // User who placed the order (per DB design: user_id FK)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Shipping address snapshot (per DB design: shipping_address_id)
  shippingAddress: {
    fullName: String,
    phone:    String,
    line1:    String,
    line2:    String,
    city:     String,
    state:    String,
    pincode:  String,
    country:  { type: String, default: 'India' },
  },

  // Billing address (per DB design: billing_address_id)
  billingAddress: {
    fullName: String,
    phone:    String,
    line1:    String,
    line2:    String,
    city:     String,
    state:    String,
    pincode:  String,
    country:  { type: String, default: 'India' },
  },

  // Order items (per DB design: ORDER_ITEMS 1:N)
  items: [orderItemSchema],

  // Pricing breakdown
  subtotal:      { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 },
  tax:           { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },

  // Order lifecycle status (per DB design: status ENUM)
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },

  // Tracking
  trackingNumber: { type: String, trim: true },
  estimatedDelivery: { type: Date },
  deliveredAt:   { type: Date },

  // Coupon
  couponCode:    { type: String, trim: true },

  // Payment (per DB design: PAYMENTS 1:1 linked to order)
  payment: paymentSchema,

  // Notes
  customerNote:  { type: String, trim: true },
  adminNote:     { type: String, trim: true },

}, { timestamps: true });

// ─── Indexes (per DB design: INDEX section) ───────────────────────────────────
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.transactionId': 1 }, { sparse: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;