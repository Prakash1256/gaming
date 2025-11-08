const mongoose = require('mongoose');


const bookingSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  tournamentId:{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  // startDateTime:{
  //   type:Date,
  //   required:true,
  // },
  // endDateTime:{
  //   type:Date,
  //   required:true
  // },
  // status: {
  //   type: String,
  //   enum: ['confirmed', 'pending', 'canceled'],
  //   required: true,
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
