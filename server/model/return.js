const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'refunded'],
    default: 'requested',
  },
  adminNote: { type: String },
  refundAmount: { type: Number, default: 0 },
  resolvedAt: { type: Date },
}, { timestamps: true });

returnSchema.index({ orderId: 1 });
returnSchema.index({ userId: 1 });
returnSchema.index({ status: 1 });

const Return = mongoose.model('Return', returnSchema);
module.exports = Return;
