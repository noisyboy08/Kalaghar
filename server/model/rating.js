const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

module.exports = ratingSchema;