// const mongoose = require('mongoose');

// // Define the schema for a venue
// const venueSchema = new mongoose.Schema({
//   managerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   address: {
//     type: String,
//     required: true
//   },
//   city: {
//     type: String,
//     required: true,
//   },
//   zip: {
//     type: String,
//     required: true
//   },
//   state:{
//     type: String,
//     required: true,
//   },
//   timeZone: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "TimeZone"
//   },
//   tables: [
//     { 
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Table"
//     }
//   ],
//   status: {
//     type: String,
//     enum: ['available', 'partially booked', 'completely booked'],
//     default: 'available',
//   },
//   latitude: {
//     type: Number,
//     required: true, // You can make this optional if not all venues will have coordinates
//   },
//   longitude: {
//     type: Number,
//     required: true, // You can make this optional if not all venues will have coordinates
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   }
// });

// // Add a method to check booking status and update the venue status
// venueSchema.methods.updateBookingStatus = async function () {
//   // Get all tables of this venue
//   const tables = await this.populate('tables').execPopulate();

//   // Check if all tables have bookings
//   let allBooked = true;
//   for (let table of tables) {
//     const bookings = await mongoose.model('Booking').find({ tableId: table._id });
//     if (bookings.length === 0) {
//       allBooked = false;
//       break;
//     }
//   }

//   // Update the venue status based on the booking status of the tables
//   if (allBooked) {
//     this.status = 'completely booked';
//   } else if (tables.length > 0 && tables.some(table => table.bookings.length > 0)) {
//     this.status = 'partially booked';
//   } else {
//     this.status = 'available';
//   }

//   await this.save();
// };

// venueSchema.pre('save', function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model('Venue', venueSchema);


const mongoose = require('mongoose');

// Define the schema for a venue
const venueSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true,
  },
  zip: {
    type: String,
    required: true
  },
  state:{
    type: String,
    required: true,
  },
  timeZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimeZone"
  },
  tables: [
    { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table"
    }
  ],
  status: {
    type: String,
    enum: ['available', 'partially booked', 'completely booked'],
    default: 'available',
  },
  latitude: {
    type: Number,
    required: true, // You can make this optional if not all venues will have coordinates
  },
  longitude: {
    type: Number,
    required: true, // You can make this optional if not all venues will have coordinates
  },
  // updatedAt: {
  //   type: Date,
  //   default: Date.now,
  // }
},  {
    timestamps: true  // ✅ Adds createdAt and updatedAt automatically
  });

// Add a method to check booking status and update the venue status
venueSchema.methods.updateBookingStatus = async function () {
  // Get all tables of this venue
  const tables = await this.populate('tables').execPopulate();

  // Check if all tables have bookings
  let allBooked = true;
  for (let table of tables) {
    const bookings = await mongoose.model('Booking').find({ tableId: table._id });
    if (bookings.length === 0) {
      allBooked = false;
      break;
    }
  }

  // Update the venue status based on the booking status of the tables
  if (allBooked) {
    this.status = 'completely booked';
  } else if (tables.length > 0 && tables.some(table => table.bookings.length > 0)) {
    this.status = 'partially booked';
  } else {
    this.status = 'available';
  }

  await this.save();
};

venueSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Venue', venueSchema);