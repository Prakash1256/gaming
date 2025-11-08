const mongoose = require("mongoose");

const subModuleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("SubModule", subModuleSchema);