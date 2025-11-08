const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only `createdAt` will be stored
  }
);

module.exports = mongoose.model("EmailLog", newsSchema);