const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['order', 'payment', 'product', 'account', 'return', 'other'],
    default: 'other',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  replies: [{
    authorId: { type: String, required: true },
    authorRole: { type: String, enum: ['buyer', 'seller', 'admin'], required: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  }],
  resolvedAt: { type: Date },
}, { timestamps: true });

supportTicketSchema.index({ userId: 1, status: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
module.exports = SupportTicket;
