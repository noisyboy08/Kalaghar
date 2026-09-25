const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'order_placed',
      'order_confirmed',
      'order_shipped',
      'order_out_for_delivery',
      'order_delivered',
      'order_cancelled',
      'return_requested',
      'return_approved',
      'return_rejected',
      'return_refunded',
      'kyc_submitted',
      'kyc_approved',
      'kyc_rejected',
      'product_approved',
      'product_rejected',
      'coupon_created',
      'support_reply',
    ],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Object, default: {} }, // extra payload (orderId, productId, etc.)
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
