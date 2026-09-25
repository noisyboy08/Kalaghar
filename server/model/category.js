/**
 * Kalaghar — Category Model
 * Hierarchical categories (per DB design: CATEGORIES with parent_id self-ref)
 */
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: { type: String, trim: true },
  imageUrl:    { type: String },

  // Self-referencing parent for hierarchy (per DB design: parent_id FK)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },

  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },

}, { timestamps: true });

categorySchema.index({ parentId: 1 });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
