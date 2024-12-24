const { kMaxLength } = require("buffer");
const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "a product must have a name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "a product must have a description"],
  },
  price: {
    type: Number,
    required: [true, "a product must have a price"],
    maxLength: [8, "price cannot exceed 8 figures"],
  },
  rating: {
    type: Number,
    default: 0,
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [true, "a product must be categorized"],
  },
  stock: {
    type: Number,
    required: [true, "a product must have stock value"],
    maxLength: [4, "Stock cannot exceed four figures"],
    default: 1,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      name: { type: String, required: true },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
