// models/tokenBlacklist.model.js
const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
