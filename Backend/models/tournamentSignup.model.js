const mongoose = require("mongoose");

const TournamentSignupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // Null for external users
  status: {
    type: String,
    enum: ["Tentative", "Confirmed", "Waiting"],
    required: true,
  },
  paid: {
    type: Boolean,
    default: false,
    required: true,
  },
  signupType: {
    type: String,
    enum: ["registered", "external"],
    required: true,
  },
  forgorateReadableId: { type: Number, required: false},
  forgorateData: new mongoose.Schema({
    id: {
      type: String,
      required: false,
      // unique: true,
    },
    readableId: {
      type: String,
      required: false,
    },
    membershipId: {
      type: String,
      required: false,
    },
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    suffix: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
      default: "USA",
    },
    robustness: {
      type: Number,
      required: false,
      default: 0.0,
    },
    effectiveRating: {
      type: Number,
      required: false
    },
  }),
  rating: {
    type: Number,
    required: false,
    defaullt: 0,
  },
},{
    timestamps: true 
});

module.exports = mongoose.model("TournamentSignup", TournamentSignupSchema);


