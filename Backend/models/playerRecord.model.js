
const mongoose = require("mongoose");

const playerRecordSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    eliminated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('PlayerRecord', playerRecordSchema);