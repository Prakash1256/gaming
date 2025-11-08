const mongoose = require('mongoose');

exports.PayoutSchema = new mongoose.Schema({
    tournamentPool: {
        type: Number,
        default: 0
    },
    percentFieldToPay: {
        type: Number,
        default: 20
    },
    tournamentCurve: {
        type: String,
        default: 2
    },
    calcuttaPool: {
        type: Number,
        default: 0 
    },
    calcuttaPercentFieldToPay: {
        type: Number,
        default: 20 
    },
    calcuttaCurve: {
        type: Number,
        default: 4 
    }
}, { timestamps: true });
