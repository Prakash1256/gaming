// const mongoose = require("mongoose");
// const { PayoutSchema } = require("./payoutOptions.model");


// const tournamentSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   managerId:{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
//   flyerImage: {
//     type: String,
//     required: false,
//   },
//   tournamentLocation: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Venue",
//   },
//   startDateTime: {
//     type: Date,
//     required: true,
//   },
//   endDateTime: {
//     type: Date,
//     required: true,
//   },
//   tournamentType: {
//     type: String,
//     enum: ["Single Elimination", "Double Elimination"],
//     required: true,
//   },
//   game: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   maxPlayer: {
//     type: Number,
//   },
//   entryFee: {
//     type: Number,
//     required: true,
//   },
//   ratingSystem: {
//     type: String,
//     required: true,
//   },
//   winnersRace: {
//     type: Number,
//     required: false,
//   },
//   losersRace: {
//     type: Number,
//     required: false,
//   },
//   published: {
//     type: Boolean,
//     default: false,
//   },
//   status: {
//     type: String,
//     enum: ["upcomming", "ongoing", "completed", "cancelled", "incomplete"],
//     required: true,
//   },
//   totalMatches: {
//     type: Number,
//     required: true,
//     default: 0,
//   },
//   totalCompleteMatches: {
//     type:Number,
//     required:false,
//     default: 0,
//   },
//   totalNonByeMatches: {
//     type:Number,
//     required: false,
//     default: 0,
//   },
//   // payoutOptions: PayoutSchema,
//   matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Match" }],
//   bracket:{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Bracket",
//     required: false,
//   }  
// });


// tournamentSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model("Tournament", tournamentSchema);


const mongoose = require("mongoose");
// const { PayoutSchema } = require("./payoutOptions.model");


const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  managerId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  flyerImage: {
    type: String,
    required: false,
  },
  tournamentLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Venue",
  },
  startDateTime: {
    type: Date,
    required: true,
  },
  endDateTime: {
    type: Date,
    required: true,
  },
  tournamentType: {
    type: String,
    enum: ["Single Elimination", "Double Elimination"],
    required: true,
  },
  game: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  maxPlayer: {
    type: Number,
  },
  entryFee: {
    type: Number,
    required: true,
  },
  completedAt:{
    type: Date,
    required: false,
  },
  ratingSystem: {
    type: String,
    enum: ["fargorate", "none"],
    required: true,
    default: "none"
  },
  winnersRace: {
    type: Number,
    required: false,
  },
  losersRace: {
    type: Number,
    required: false,
  },
  published: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["upcomming", "ongoing", "completed", "cancelled", "incomplete","finalized"],
    required: true,
  },
  totalMatches: {
    type: Number,
    required: true,
    default: 0,
  },
  totalCompleteMatches: {
    type:Number,
    required:false,
    default: 0,
  },
  totalNonByeMatches: {
    type:Number,
    required: false,
    default: 0,
  },
  // payoutOptions: PayoutSchema,
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Match" }],
  bracket:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bracket",
    required: false,
  }  
}
,  {
    timestamps: true, 
  }
);


tournamentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Tournament", tournamentSchema);