const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    matchId: {
      type: Number,
      required: true,
    },
    round:{
      type:Number,
      required: false,
    },
    side: {
      type: String,
      enum: ["winners", "losers","finals"],
      required: true,
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tournament",
        required: true
    },  
    player1:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"TournamentSignup",
        required:false,
    },
    player2:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"TournamentSignup",
        required:false,
    },
    source1:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Match",
        required:false,
    },
    source2:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Match",
        required:false,
    },
    winner:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"TournamentSignup"
    },
    loser:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"TournamentSignup"
    },
    isBye:{
      type:Boolean,
      default:false,
    },
    score: {
      player1Score: {
        type: Number,
        required: true,
        default: 0
      },
      player2Score: {
        type: Number,
        required: true,
        default: 0
      }
    },
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Table",
        required:false,
    },
    startTimme:{
      type: Date,
      required:false,
    },
    endTime:{
      type: Date,
      required: false,
    },
    status:{
      type: String,
      required:true,
      enum:["Completed","Upcomming","Cancelled","Ongoing"],
      default:"Upcomming"
    }
  },
  {
    timeStamps: true,
  }
);

module.exports = mongoose.model("Match", matchSchema);
