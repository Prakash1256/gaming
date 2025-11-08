const mongoose = require('mongoose');

const TableRecordSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match'},
    tableNumber: { type: Number, required: true },
    status: { type: String, enum: ['Available','Scheduled', 'In Progress', 'Completed']}
});

module.exports = mongoose.model('TableRecord', TableRecordSchema);
