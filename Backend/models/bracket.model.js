const mongoose = require("mongoose");
const { Schema } = mongoose;

const bracketSchema = new Schema({
  // tournamentType:{
  //   type: String,
  //   enum:['Single Elimination', 'Double Elimination'],
  //   required: true,
  // },
  winners: {
    type: Map,
    of: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    ],
    required: true, 
  },
  losers: {
    type: Map,
    of: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    ],
    required: function () {
      return this.tournamentType === "Double Elimination";
    },
  },
  finals: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    ],
    validate: {
      validator: function (val) {
        return val.length <= 2;
      },
      message: "Finals can contain at most 2 matches.",
    },
    required: function () {
      return ["Single Elimination", "Double Elimination"].includes(
        this.tournamentType
      );
    },
    default:[],
  },
  winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: false,
  }
});

const Bracket = mongoose.model("Bracket", bracketSchema);

module.exports = Bracket;

//
// bracket:{
//     finals:[
//         match, //first final
//         match  //second only in case of double elimination
//     ],
//     winner:{
//         round1:[match1, match2, match3, match4],
//         round2:[match5, match6],
//     },
//     loser:{
//         round1:[match, match]
//         round2: [match, match]
//         round3: [match, match]

//     }
// }

// when manager starts a tournament
// the number of byes will be decided
// byes will be added
// log2(no of players in first round) => give you number of rounds
// for 8 it is 3
// and loosers it will be log2(no of players in first round) + 1

