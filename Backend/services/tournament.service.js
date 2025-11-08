const Tournament = require("../models/tournament.model");
const TournamentSignup = require("../models/tournamentSignup.model");
const Match = require("../models/match.model");
const Table = require("../models/tabel.model");
const TableRecord = require("../models/tablerecord.model");
const PlayerRecord = require("../models/playerRecord.model");
const Booking = require("../models/booking.model");
const mongoose = require("mongoose");
const Bracket = require("../models/bracket.model");
const matchModel = require("../models/match.model");
const bookingModel = require("../models/booking.model");
const {
  getAllTournamentBasedOnStatus,
} = require("../controllers/tourament.controller");

const getTournamentBrackets = async (tournamentId) => {
  try {
    const tournament = await Tournament.findById(tournamentId)
      .populate({
        path: "bracket",
        populate: [
          {
            path: "winners",
            populate: {
              path: "$*",
              model: "Match",
              populate: [
                {
                  path: "player1 player2 winner loser",
                  model: "TournamentSignup",
                  populate: {
                    path: "userId",
                    model: "User",
                    select: "_id firstName lastName", // only select _id and name
                  },
                },
                {
                  path: "source1 source2",
                  model: "Match",
                },
                {
                  path: "table",
                  model: "Table",
                },
              ],
            },
          },
          {
            path: "losers",
            populate: {
              path: "$*",
              model: "Match",
              populate: [
                {
                  path: "player1 player2 winner loser",
                  model: "TournamentSignup",
                  populate: {
                    path: "userId",
                    model: "User",
                    select: "_id firstName lastName", // only select _id and name
                  },
                },
                {
                  path: "source1 source2",
                  model: "Match",
                },
                {
                  path: "table",
                  model: "Table",
                },
              ],
            },
          },
          {
            path: "finals",
            model: "Match",
            populate: [
              {
                path: "player1 player2 winner loser",
                model: "TournamentSignup",
                populate: {
                  path: "userId",
                  model: "User",
                  select: "_id firstName lastName", // only select _id and name
                },
              },
              {
                path: "source1 source2",
                model: "Match",
              },
              {
                path: "table",
                model: "Table",
              },
            ],
          },
          {
            path: "winner",
            model: "TournamentSignup",
            populate: [
              {
                path: "userId",
                model: "User",
                select: "_id firstName lastName",
              },
            ],
          },
        ],
      })
      .exec();

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (!tournament.bracket) {
      throw new Error("Tournament not started");
    }

    return tournament.bracket;
  } catch (error) {
    console.error("Error fetching tournament bracket:", error.message);
    throw error;
  }
};

const resetTournament = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  // Delete all matches
  await Match.deleteMany({
    tournamentId: new mongoose.Types.ObjectId(tournamentId),
  });

  await Bracket.findByIdAndDelete(tournament.bracket);

  // await bookingModel.deleteMany({ tournamentId: tournament._id });

  tournament.status = "upcomming";
  tournament.matches = [];
  tournament.bracket = null;
  tournament.totalMatches = 0;
  tournament.totalCompleteMatches = 0;
  tournament.totalNonByeMatches = 0;

  await tournament.save();

  return { message: "Tournament has been reset successfully." };
};

function sortOrShufflePlayers(realPlayers, tournament) {
  
    // Shuffle using Fisher-Yates algorithm
    for (let i = realPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [realPlayers[i], realPlayers[j]] = [realPlayers[j], realPlayers[i]];
    }
  // } else {
  //   // Sort by rating (assumes rating field is from FargoRate or similar)
  //   realPlayers.sort((a, b) => (a?.rating ?? 0) - (b?.rating ?? 0));
  // }

  return realPlayers;
}

const createWinnersBracket = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error("Tournament does not exists");

  const players = await TournamentSignup.find({
    tournamentId: tournament._id,
    status: "Confirmed",
    paid: true,
  }).populate("userId");

  // console.log(players);

  if (players.length < 4) {
    throw new Error("Not Enough players to start the tournament");
  }

  if (tournament.status != "upcomming") {
    throw new Error("Cannot start this tournament");
  }

  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(players.length)));
  const byesToAdd = nextPowerOfTwo - players.length;

  for (let i = 0; i < byesToAdd; i++) {
    players.push("BYE");
  }

  let realPlayers = players.filter((p) => p !== "BYE");
  const byePlayers = players.filter((p) => p === "BYE");

  // realPlayers.sort((a, b) => a?.rating - b?.rating);

  realPlayers = sortOrShufflePlayers(realPlayers, tournament);
  

  let totalMatches = tournament.totalMatches;
  let totalCompleteMatches = tournament.totalCompleteMatches;
  let totalNonByeMatches = tournament.totalNonByeMatches;

  const winnerBracket = {};

  const roundInWinnerBracket = Math.log2(players.length);

  for (let i = 1; i <= roundInWinnerBracket; i++) {
    if (i == 1) {
      const matches = [];
      while (realPlayers.length && byePlayers.length) {
        const realPlayer = realPlayers.pop();
        byePlayers.pop();
        matches.push(
          new Match({
            matchId: ++totalMatches,
            player1: realPlayer._id,
            player2: null,
            source1: null,
            source2: null,
            round: i,
            tournamentId: tournament._id,
            isBye: true,
            winner: realPlayer._id,
            loser: null,
            status: "Completed",
            side: "winners",
          })
        );
      }

      // Pair remaining real players with closest ratings
      while (realPlayers.length >= 2) {
        const p1 = realPlayers.pop();

        let closestIndex = -1;
        let closestDiff = Infinity;

        for (let i = 0; i < realPlayers.length; i++) {
          const diff = Math.abs(p1?.rating - realPlayers[i]?.rating);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestIndex = i;
          }
        }

        totalNonByeMatches++;

        const p2 = realPlayers.splice(closestIndex, 1)[0];
        matches.push(
          new Match({
            matchId: ++totalMatches,
            player1: p1._id,
            player2: p2._id,
            source1: null,
            source2: null,
            round: i,
            tournamentId: tournament._id,
            winner: null,
            loser: null,
            status: "Upcomming",
            side: "winners",
          })
        );
      }

      await Match.insertMany(matches);

      winnerBracket[`round${i}`] = matches;
    } else {
      let matches = [];

      for (let j = 0; j < players.length / Math.pow(2, i); ++j) {
        //  previousMatches
        let previousRound = winnerBracket[`round${i - 1}`];
        let source1 = previousRound[j * 2];
        let source2 = previousRound[j * 2 + 1];

        let player1 = null;
        let player2 = null;

        totalNonByeMatches++;

        const sourceMatch1 = await Match.findById(source1);
        const sourceMatch2 = await Match.findById(source2);

        if (sourceMatch1.isBye === true) player1 = sourceMatch1.winner;
        if (sourceMatch2.isBye === true) player2 = sourceMatch2.winner;

        matches.push(
          new Match({
            matchId: ++totalMatches,
            player1: player1,
            player2: player2,
            source1: sourceMatch1._id,
            source2: sourceMatch2._id,
            round: i,
            tournamentId: tournament._id,
            winner: null,
            loser: null,
            status: "Upcomming",
            side: "winners",
          })
        );
      }

      await Match.insertMany(matches);

      winnerBracket[`round${i}`] = matches;
    }
  }

  const bracket = await Bracket.create({
    winners: winnerBracket,
    tournamentType: tournament.tournamentType,
    losers: {},
  });

  tournament.bracket = bracket._id;
  tournament.totalMatches = totalMatches;
  tournament.totalNonByeMatches = totalNonByeMatches;

  await tournament.save();
};

// to create loosers bracket (with autoadvance)
// const createLoosersBracket = async (tournamentId) => {
//   const tournament = await Tournament.findById(tournamentId).populate(
//     "bracket"
//   );
//   let totalMatches = tournament.totalMatches;
//   let totalNonByeMatches = tournament.totalNonByeMatches;

//   let playersCount = tournament.bracket?.winners.get("round1").length * 2;
//   // const players = await TournamentSignup.find({ tournamentId: tournament._id });
//   if (!tournament) throw new Error("Tournament not found");

//   if (tournament.tournamentType === "Single Elimination") {
//     return;
//   }

//   const totalRoundInLosersBracket = 2 * Math.log2(playersCount) - 2;
//   // console.log(tournament.bracket?.winners.get('round1'));
//   const loosersBracket = {};
//   let reduce = false;

//   const totalWinnerRounds = Math.log2(playersCount);
//   let currentWinnerRound = 2;
//   for (let j = 1; j <= totalRoundInLosersBracket; j++) {
//     if (j == 1) {
//       let matches = [];
//       for (
//         let i = 0;
//         i < tournament.bracket?.winners.get(`round1`).length;
//         i += 2
//       ) {
//         const source1 = tournament.bracket?.winners.get("round1")[i];
//         const source2 = tournament.bracket?.winners.get("round1")[i + 1];

//         const sourceMatch1 = await Match.findById(source1);
//         const sourceMatch2 = await Match.findById(source2);

//         let player1 = null;
//         let player2 = null;
//         let winner = null;
//         let status = "Upcomming";
//         let isBye = false;
//         let loser = null;

//         if (
//           sourceMatch1.status == "Completed" &&
//           sourceMatch2.status == "Completed"
//         ) {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;

//           if (player1 == null && player2 == null) {
//             isBye = true;
//             winner = null;
//             status = "Completed";
//             loser = null;
//           } else if (player1 == null) {
//             isBye = true;
//             status = "Upcomming";
//             loser = null;
//           } else if (player2 == null) {
//             isBye = true;
//             status = "Upcomming";
//             loser = null;
//           } else {
//             (isBye = false), (status = "Upcomming");
//           }
//         } else if (
//           sourceMatch1.status == "Completed" ||
//           sourceMatch2.status == "Completed"
//         ) {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;

//           if (sourceMatch1.status == "Completed" && player1 == null) {
//             isBye = true;
//           } else if (sourceMatch1.status == "Completed" && player1 == null) {
//             isBye = true;
//           }
//           status = "Upcomming";
//           winner = null;
//           loser = null;
//         } else {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;
//           isBye = false;
//           winner = null;
//           status = "Upcomming";
//         }

//         if (isBye == false) {
//           totalNonByeMatches++;
//         }

//         matches.push(
//           new Match({
//             matchId: ++totalMatches,
//             player1: null,
//             player2: null,
//             source1,
//             source2,
//             round: j,
//             tournamentId: tournament._id,
//             winner,
//             loser,
//             status,
//             isBye,
//             side: "losers",
//           })
//         );
//       }

//       await Match.insertMany(matches);

//       loosersBracket[`round${j}`] = matches;
//     } else {
//       let matches = [];
//       if (reduce) {
//         const previousLoosersRound = loosersBracket[`round${j - 1}`];

//         const currentLoosersRoundLength = previousLoosersRound.length / 2;

//         for (let i = 0; i < currentLoosersRoundLength; i++) {
//           const source1 = previousLoosersRound[i * 2];
//           const source2 = previousLoosersRound[i * 2 + 1];

//           const sourceMatch1 = await Match.findById(source1);
//           const sourceMatch2 = await Match.findById(source2);

//           let player1 = null;
//           let player2 = null;
//           let winner = null;
//           let status = "Upcomming";
//           let isBye = false;
//           let loser = null;

//           if (
//             sourceMatch1.status == "Completed" &&
//             sourceMatch2.status == "Completed"
//           ) {
//             player1 = sourceMatch1.loser;
//             player2 = sourceMatch2.loser;

//             if (player1 == null && player2 == null) {
//               isBye = true;
//               winner = null;
//               status = "Completed";
//               loser = null;
//             } else if (player1 == null) {
//               isBye = true;
//               status = "Upcomming";
//               loser = null;
//             } else if (player2 == null) {
//               isBye = true;
//               status = "Upcomming";
//               loser = null;
//             } else {
//               (isBye = false), (status = "Upcomming");
//             }
//           } else if (
//             sourceMatch1.status == "Completed" ||
//             sourceMatch2.status == "Completed"
//           ) {
//             player1 = sourceMatch1.loser;
//             player2 = sourceMatch2.loser;

//             if (sourceMatch1.status == "Completed" && player1 == null) {
//               isBye = true;
//             } else if (sourceMatch1.status == "Completed" && player1 == null) {
//               isBye = true;
//             }
//             status = "Upcomming";
//             winner = null;
//             loser = null;
//           } else {
//             player1 = sourceMatch1.loser;
//             player2 = sourceMatch2.loser;
//             isBye = false;
//             winner = null;
//             status = "Upcomming";
//           }

//           if (isBye == false) {
//             totalNonByeMatches++;
//           }

//           matches.push(
//             new Match({
//               matchId: ++totalMatches,
//               player1,
//               player2,
//               source1,
//               source2,
//               status,
//               isBye,
//               winner,
//               round: j,
//               loser,
//               tournamentId: tournament._id,
//               side: "losers",
//             })
//           );
//         }

//         await Match.insertMany(matches);

//         reduce = false;

//         loosersBracket[`round${j}`] = matches;
//       } else {
//         const previousLoosersRound = loosersBracket[`round${j - 1}`];
//         const currentWinnersRound = tournament.bracket?.winners?.get(
//           `round${currentWinnerRound}`
//         );

//         const currentWinnerRoundLength = tournament.bracket?.winners?.get(`round${currentWinnerRound}`)?.length

//         currentWinnerRound++;
        
//         for (let i = 0; i < previousLoosersRound.length; i++) {
//           const sourceMatch1 = await Match.findById(previousLoosersRound[i]);
//           const sourceMatch2 = await Match.findById(currentWinnersRound[currentWinnerRoundLength - 1 - i]);

//           let player1 = null;
//           let player2 = null;
//           let winner = null;
//           let status = "Upcomming";
//           let isBye = false;
//           let loser = null;

//           if (
//             sourceMatch1.status == "Completed" &&
//             sourceMatch2.status == "Completed"
//           ) {
//             player1 = sourceMatch1.winner;
//             player2 = sourceMatch2.winner;

//             if (player1 == null && player2 == null) {
//               isBye = true;
//               winner = null;
//               status = "Completed";
//               loser = null;
//             } else if (player1 == null) {
//               isBye = true;
//               status = "Upcomming";
//               loser = null;
//             } else if (player2 == null) {
//               isBye = true;
//               status = "Upcomming";
//               loser = null;
//             } else {
//               (isBye = false), (status = "Upcomming");
//             }
//           } else if (
//             sourceMatch1.status == "Completed" ||
//             sourceMatch2.status == "Completed"
//           ) {
//             player1 = sourceMatch1.winner;
//             player2 = sourceMatch2.winner;

//             if (sourceMatch1.status == "Completed" && player1 == null) {
//               isBye = true;
//             } else if (sourceMatch1.status == "Completed" && player1 == null) {
//               isBye = true;
//             }
//             status = "Upcomming";
//             winner = null;
//             loser = null;
//           } else {
//             player1 = sourceMatch1.winner;
//             player2 = sourceMatch2.winner;
//             isBye = false;
//             winner = null;
//             status = "Upcomming";
//           }

//           if (isBye == false) {
//             totalNonByeMatches++;
//           }

//           matches.push(
//             new Match({
//               matchId: ++totalMatches,
//               player1,
//               player2,
//               winner,
//               status,
//               loser,
//               round: j,
//               source1: sourceMatch1._id,
//               source2: sourceMatch2._id,
//               tournamentId: tournament._id,
//               isBye,
//               side: "losers",
//             })
//           );
//         }

//         reduce = true;

//         await Match.insertMany(matches);
//         loosersBracket[`round${j}`] = matches;

//         if (currentWinnerRound > totalWinnerRounds) {
//           break;
//         }
//       }
//     }
//   }

//   const bracket = await Bracket.findByIdAndUpdate(
//     tournament.bracket._id,
//     {
//       losers: loosersBracket,
//     },
//     { new: true }
//   );

//   tournament.totalMatches = totalMatches;
//   tournament.totalNonByeMatches = totalNonByeMatches;

//   await tournament.save();

//   console.log(bracket);

//   return;
// };


// const createLoosersBracket = async (tournamentId) => {
//   const tournament = await Tournament.findById(tournamentId).populate("bracket");
//   let totalMatches = tournament.totalMatches;
//   let totalNonByeMatches = tournament.totalNonByeMatches;

//   let playersCount = tournament.bracket?.winners.get("round1").length * 2;
  
//   if (!tournament) throw new Error("Tournament not found");

//   if (tournament.tournamentType === "Single Elimination") {
//     return;
//   }

//   // Calculate bracket parameters
//   const bracketSize = Math.pow(2, Math.ceil(Math.log2(playersCount)));
//   const winnersRounds = Math.log2(bracketSize);
//   const losersRounds = 2 * (bracketSize / 2 / 2); // This should be (bracketSize/2 - 1) * 2
//   const actualLosersRounds = 2 * (winnersRounds - 1);

//   const loosersBracket = {};
//   let previousWinnersMatch = 1;
//   let currentWinnersRoundNumber = 2;
//   let rmatchcnt = bracketSize / 4; // Starting matches count for losers bracket
//   let options = 1; // Options for different pairing strategies
//   let firstPreviousWinnersMatch = 0;

//   for (let round = 1; round <= actualLosersRounds; round++) {
//     const matches = [];
//     const isEvenRound = round % 2 === 0;
    
//     for (let matchIndex = 0; matchIndex < rmatchcnt; matchIndex++) {
//       let source1, source2;
//       let player1 = null, player2 = null;
//       let winner = null, loser = null;
//       let status = "Upcomming";
//       let isBye = false;

//       if (round === 1) {
//         // First round: losers from winners bracket round 1
//         const winnersRound1 = tournament.bracket?.winners.get("round1");
//         source1 = winnersRound1[matchIndex * 2];
//         source2 = winnersRound1[matchIndex * 2 + 1];

//         const sourceMatch1 = await Match.findById(source1);
//         const sourceMatch2 = await Match.findById(source2);

//         // Set players based on match completion status
//         if (sourceMatch1.status === "Completed" && sourceMatch2.status === "Completed") {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;
          
//           if (player1 == null && player2 == null) {
//             isBye = true;
//             status = "Completed";
//           } else if (player1 == null || player2 == null) {
//             isBye = true;
//           } else {
//             isBye = false;
//           }
//         }

//         previousWinnersMatch += 2; // Move to next pair of winners matches
//       } else {
//         if (isEvenRound) {
//           // Even rounds: winners from losers bracket + losers from winners bracket
//           const currentWinnersRound = tournament.bracket?.winners?.get(`round${Math.floor(currentWinnersRoundNumber)}`);
//           const previousLosersRound = loosersBracket[`round${round - 1}`];
          
//           // Handle final round special case
//           if (round === actualLosersRounds) {
//             options = 4;
//           }

//           if (options === 1) {
//             // Option 1: Standard pairing with reverse order from winners
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             const winnersIndex = (currentWinnersRound?.length || 0) - 1 - matchIndex;
//             source1 = currentWinnersRound?.[winnersIndex]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status === "Completed" && sourceMatch2?.status === "Completed") {
//                 player1 = sourceMatch1.loser; // Loser from winners
//                 player2 = sourceMatch2.winner; // Winner from previous losers round
                
//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   status = "Completed";
//                 } else if (player1 == null || player2 == null) {
//                   isBye = true;
//                 } else {
//                   isBye = false;
//                 }
//               }
//             }
            
//             previousWinnersMatch++;
//           } else if (options === 2) {
//             // Option 2: Different pairing strategy for mid-tournament
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             let winnersIndex = firstPreviousWinnersMatch + Math.floor(rmatchcnt / 2) - 1 - matchIndex;
//             if (winnersIndex < firstPreviousWinnersMatch) {
//               winnersIndex = firstPreviousWinnersMatch + rmatchcnt - 1;
//             }
            
//             source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status === "Completed" && sourceMatch2?.status === "Completed") {
//                 player1 = sourceMatch1.loser;
//                 player2 = sourceMatch2.winner;
                
//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   status = "Completed";
//                 } else if (player1 == null || player2 == null) {
//                   isBye = true;
//                 } else {
//                   isBye = false;
//                 }
//               }
//             }
            
//             previousWinnersMatch++;
//           } else if (options === 3) {
//             // Option 3: Another pairing strategy
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             let winnersIndex = firstPreviousWinnersMatch + Math.floor(rmatchcnt / 2) + matchIndex;
//             if (winnersIndex >= firstPreviousWinnersMatch + rmatchcnt) {
//               winnersIndex = firstPreviousWinnersMatch;
//             }
            
//             source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status === "Completed" && sourceMatch2?.status === "Completed") {
//                 player1 = sourceMatch1.loser;
//                 player2 = sourceMatch2.winner;
                
//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   status = "Completed";
//                 } else if (player1 == null || player2 == null) {
//                   isBye = true;
//                 } else {
//                   isBye = false;
//                 }
//               }
//             }
            
//             previousWinnersMatch++;
//           } else if (options === 4) {
//             // Option 4: Final round logic
//             source1 = currentWinnersRound?.[matchIndex]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status === "Completed" && sourceMatch2?.status === "Completed") {
//                 player1 = sourceMatch1.loser;
//                 player2 = sourceMatch2.winner;
                
//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   status = "Completed";
//                 } else if (player1 == null || player2 == null) {
//                   isBye = true;
//                 } else {
//                   isBye = false;
//                 }
//               }
//             }
            
//             previousWinnersMatch++;
//           }
//         } else {
//           // Odd rounds: winners from previous losers round
//           const previousLosersRound = loosersBracket[`round${round - 1}`];
          
//           if (previousLosersRound && previousLosersRound.length >= 2) {
//             source1 = previousLosersRound[matchIndex * 2]?._id;
//             source2 = previousLosersRound[matchIndex * 2 + 1]?._id;

//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status === "Completed" && sourceMatch2?.status === "Completed") {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;
                
//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   status = "Completed";
//                 } else if (player1 == null || player2 == null) {
//                   isBye = true;
//                 } else {
//                   isBye = false;
//                 }
//               }
//             }
//           }
//         }
//       }

//       if (!isBye) {
//         totalNonByeMatches++;
//       }

//       matches.push(
//         new Match({
//           matchId: ++totalMatches,
//           player1,
//           player2,
//           source1,
//           source2,
//           round,
//           tournamentId: tournament._id,
//           winner,
//           loser,
//           status,
//           isBye,
//           side: "losers",
//         })
//       );
//     }

//     await Match.insertMany(matches);
//     loosersBracket[`round${round}`] = matches;

//     // Update match count and options for next round
//     if (isEvenRound) {
//       rmatchcnt = rmatchcnt / 2;
//       currentWinnersRoundNumber++;
      
//       // Update options based on PHP logic
//       if (options === 4) {
//         options = 1;
//       } else {
//         options++;
//       }
//     }

//     // Break if we've reached the end
//     if (rmatchcnt < 1) {
//       break;
//     }
//   }

//   // Create the final championship match (winners bracket winner vs losers bracket winner)
//   // const finalRound = actualLosersRounds + 1;
//   // const winnersChampion = tournament.bracket?.winners.get(`round${winnersRounds}`)?.[0];
//   // const losersChampion = loosersBracket[`round${actualLosersRounds}`]?.[0];

//   // if (winnersChampion && losersChampion) {
//   //   const finalMatch = new Match({
//   //     matchId: ++totalMatches,
//   //     player1: null,
//   //     player2: null,
//   //     source1: winnersChampion._id,
//   //     source2: losersChampion._id,
//   //     round: finalRound,
//   //     tournamentId: tournament._id,
//   //     winner: null,
//   //     loser: null,
//   //     status: "Upcomming",
//   //     isBye: false,
//   //     side: "final",
//   //   });

//   //   await finalMatch.save();
//   //   loosersBracket[`final`] = [finalMatch];
//   // }

//   // // Update tournament bracket
//   const bracket = await Bracket.findByIdAndUpdate(
//     tournament.bracket._id,
//     {
//       losers: loosersBracket,
//     },
//     { new: true }
//   );

//   tournament.totalMatches = totalMatches;
//   tournament.totalNonByeMatches = totalNonByeMatches;
//   await tournament.save();

//   // console.log(bracket);
//   // return bracket;
// };

// const createLoosersBracket = async (tournamentId) => {
//   const tournament = await Tournament.findById(tournamentId).populate("bracket");
//   let totalMatches = tournament.totalMatches;
//   let totalNonByeMatches = tournament.totalNonByeMatches;

//   let playersCount = tournament.bracket?.winners.get("round1").length * 2;
  
//   if (!tournament) throw new Error("Tournament not found");

//   if (tournament.tournamentType === "Single Elimination") {
//     return;
//   }

//   // Calculate bracket parameters
//   const bracketSize = Math.pow(2, Math.ceil(Math.log2(playersCount)));
//   const winnersRounds = Math.log2(bracketSize);
//   const actualLosersRounds = 2 * (winnersRounds - 1); // Correct formula for losers rounds

//   const loosersBracket = {};
//   let previousWinnersMatch = 0; // Start from 0 for proper indexing
//   let currentWinnersRoundNumber = 2;
//   let rmatchcnt = bracketSize / 4; // Starting matches count for losers bracket
//   let options = 1; // Options for different pairing strategies
//   let firstPreviousWinnersMatch = 0;

//   for (let round = 1; round <= actualLosersRounds; round++) {
//     const matches = [];
//     const isEvenRound = round % 2 === 0;

    
    
//     console.log(`Processing Losers Round ${round}, isEven: ${isEvenRound}, rmatchcnt: ${rmatchcnt}, currentWinnersRoundNumber: ${currentWinnersRoundNumber}`, options);
    
//     for (let matchIndex = 0; matchIndex < rmatchcnt; matchIndex++) {
//       let source1, source2;
//       let player1 = null, player2 = null;
//       let winner = null, loser = null;
//       let status = "Upcomming";
//       let isBye = false;

//       if (round === 1) {
//         // First round: losers from winners bracket round 1
//         const winnersRound1 = tournament.bracket?.winners.get("round1");
//         source1 = winnersRound1[matchIndex * 2];
//         source2 = winnersRound1[matchIndex * 2 + 1];

//         const sourceMatch1 = await Match.findById(source1);
//         const sourceMatch2 = await Match.findById(source2);

//         // Your specific logic for round 1
//         if (sourceMatch1.status == "Completed" && sourceMatch2.status == "Completed") {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;

//           if (player1 == null && player2 == null) {
//             isBye = true;
//             winner = null;
//             status = "Completed";
//             loser = null;
//           } else if (player1 == null) {
//             isBye = true;
//             status = "Upcomming";
//             loser = null;
//           } else if (player2 == null) {
//             isBye = true;
//             status = "Upcomming";
//             loser = null;
//           } else {
//             isBye = false;
//             status = "Upcomming";
//           }
//         } else if (sourceMatch1.status == "Completed" || sourceMatch2.status == "Completed") {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;

//           if (sourceMatch1.status == "Completed" && player1 == null) {
//             isBye = true;
//           } else if (sourceMatch2.status == "Completed" && player2 == null) {
//             isBye = true;
//           }
//           status = "Upcomming";
//           winner = null;
//           loser = null;
//         } else {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;
//           isBye = false;
//           winner = null;
//           status = "Upcomming";
//         }

//         previousWinnersMatch += 2; // Move to next pair of winners matches
//       } else {
//         if (isEvenRound) {
//           // Even rounds: winners from losers bracket + losers from winners bracket
//           const currentWinnersRound = tournament.bracket?.winners?.get(`round${Math.floor(currentWinnersRoundNumber)}`);
//           const previousLosersRound = loosersBracket[`round${round - 1}`];



//           if(round == 6){
//           console.log("-------------");
//           console.log(round);
//           console.log(currentWinnersRound);
//           console.log(previousLosersRound);
//           console.log(options);
//           console.log("--------------");
//           }
          
          
//           // Handle final round special case
//           if (round === actualLosersRounds) {
//             options = 4;
//           }

//           if(round == 6){

          
//           console.log("option is ", options);
//           }

//           if (options === 1) {
//             // Option 1: Standard pairing with reverse order from winners
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             const winnersIndex = (currentWinnersRound?.length || 0) - 1 - matchIndex;
//             source1 = currentWinnersRound?.[winnersIndex]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner; // Winner from previous losers round
//                 player2 = sourceMatch1.loser;  // Loser from winners

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
//           } else if (options === 2) {
//             // Option 2: Different pairing strategy for mid-tournament
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             let winnersIndex = firstPreviousWinnersMatch + Math.floor(rmatchcnt / 2) - 1 - matchIndex;
//             if (winnersIndex < firstPreviousWinnersMatch) {
//               winnersIndex = firstPreviousWinnersMatch + rmatchcnt - 1;
//             }
            
//             source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             previousWinnersMatch++;
//           } else if (options === 3) {
//             // Option 3: Another pairing strategy
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             let winnersIndex = firstPreviousWinnersMatch + Math.floor(rmatchcnt / 2) + matchIndex;

            
//             if (winnersIndex >= firstPreviousWinnersMatch + rmatchcnt) {
//               winnersIndex = firstPreviousWinnersMatch;
//             }
            
//             source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;

//             if(round == 6){
//               console.log(winnersIndex);
//               console.log(matchIndex)
//               console.log(rmatchcnt)
//               console.log(firstPreviousWinnersMatch + Math.floor(rmatchcnt / 2) + matchIndex)
//               console.log(firstPreviousWinnersMatch);
//               console.log(winnersIndex - firstPreviousWinnersMatch);
//               console.log(source1, source2);

//             }
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             previousWinnersMatch++;
//           } else if (options === 4) {
//             // Option 4: Final round logic
//             source1 = currentWinnersRound?.[matchIndex]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             previousWinnersMatch++;
//           }
//         } else {
//           // Odd rounds: winners from previous losers round (reduce logic)
//           const previousLosersRound = loosersBracket[`round${round - 1}`];
          
//           if (previousLosersRound && previousLosersRound.length >= 2) {
//             source1 = previousLosersRound[matchIndex * 2]?._id;
//             source2 = previousLosersRound[matchIndex * 2 + 1]?._id;

//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;

//                 if (sourceMatch1.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
//           }
//         }
//       }

//       // Only count non-bye matches towards totalNonByeMatches
//       if (!isBye) {
//         totalNonByeMatches++;
//       }

//       matches.push(
//         new Match({
//           matchId: ++totalMatches,
//           player1: round === 1 ? null : player1,
//           player2: round === 1 ? null : player2,
//           source1,
//           source2,
//           round,
//           tournamentId: tournament._id,
//           winner,
//           loser,
//           status,
//           isBye,
//           side: "losers",
//         })
//       );
//     }

//     await Match.insertMany(matches);
//     loosersBracket[`round${round}`] = matches;

//     // Update match count and options for next round
//     if (isEvenRound) {
//       rmatchcnt = rmatchcnt / 2;
//       currentWinnersRoundNumber++;
//       previousWinnersMatch = 0; // Reset for next winners round
      
//       // Update options based on proper double elimination logic
//       if (options === 4) {
//         options = 1;
//       } else {
//         options++;
//       }
//     }

//     // Break if we've reached the end
//     if (rmatchcnt < 1) {
//       break;
//     }
//   }

//   // Create the final championship match (winners bracket winner vs losers bracket winner)
//   // const finalRound = actualLosersRounds + 1;
//   // const winnersChampion = tournament.bracket?.winners.get(`round${winnersRounds}`)?.[0];
//   // const losersChampion = loosersBracket[`round${actualLosersRounds}`]?.[0];

//   // if (winnersChampion && losersChampion) {
//   //   const finalMatch = new Match({
//   //     matchId: ++totalMatches,
//   //     player1: null,
//   //     player2: null,
//   //     source1: winnersChampion._id,
//   //     source2: losersChampion._id,
//   //     round: finalRound,
//   //     tournamentId: tournament._id,
//   //     winner: null,
//   //     loser: null,
//   //     status: "Upcomming",
//   //     isBye: false,
//   //     side: "final",
//   //   });

//   //   await finalMatch.save();
//   //   loosersBracket[`final`] = [finalMatch];
//   // }

//   // Update tournament bracket
//   const bracket = await Bracket.findByIdAndUpdate(
//     tournament.bracket._id,
//     {
//       losers: loosersBracket,
//     },
//     { new: true }
//   );

//   tournament.totalMatches = totalMatches;
//   tournament.totalNonByeMatches = totalNonByeMatches;
//   await tournament.save();

//   // console.log(bracket);
//   // return bracket;
// };


// const createLoosersBracket = async (tournamentId) => {
//   const tournament = await Tournament.findById(tournamentId).populate("bracket");
//   let totalMatches = tournament.totalMatches;
//   let totalNonByeMatches = tournament.totalNonByeMatches;

//   let playersCount = tournament.bracket?.winners.get("round1").length * 2;
  
//   if (!tournament) throw new Error("Tournament not found");

//   if (tournament.tournamentType === "Single Elimination") {
//     return;
//   }

//   // Calculate bracket parameters
//   const bracketSize = Math.pow(2, Math.ceil(Math.log2(playersCount)));
//   const winnersRounds = Math.log2(bracketSize);
//   const actualLosersRounds = 2 * (winnersRounds - 1); // Correct formula for losers rounds

//   const loosersBracket = {};
//   let previousWinnersMatch = 0; // Start from 0 for proper indexing
//   let currentWinnersRoundNumber = 2;
//   let rmatchcnt = bracketSize / 4; // Starting matches count for losers bracket
//   let options = 1; // Options for different pairing strategies
//   let firstPreviousWinnersMatch = 0;
//   let r = 0; // For option 3 PHP-style logic

//   for (let round = 1; round <= actualLosersRounds; round++) {
//     const matches = [];
//     const isEvenRound = round % 2 === 0;

    
    
//     console.log(`Processing Losers Round ${round}, isEven: ${isEvenRound}, rmatchcnt: ${rmatchcnt}, currentWinnersRoundNumber: ${currentWinnersRoundNumber}`, options);
    
//     for (let matchIndex = 0; matchIndex < rmatchcnt; matchIndex++) {
//       let source1, source2;
//       let player1 = null, player2 = null;
//       let winner = null, loser = null;
//       let status = "Upcomming";
//       let isBye = false;

//       if (round === 1) {
//         // First round: losers from winners bracket round 1
//         const winnersRound1 = tournament.bracket?.winners.get("round1");
//         source1 = winnersRound1[matchIndex * 2];
//         source2 = winnersRound1[matchIndex * 2 + 1];

//         const sourceMatch1 = await Match.findById(source1);
//         const sourceMatch2 = await Match.findById(source2);

//         // Your specific logic for round 1
//         if (sourceMatch1.status == "Completed" && sourceMatch2.status == "Completed") {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;

//           if (player1 == null && player2 == null) {
//             isBye = true;
//             winner = null;
//             status = "Completed";
//             loser = null;
//           } else if (player1 == null) {
//             isBye = true;
//             status = "Upcomming";
//             loser = null;
//           } else if (player2 == null) {
//             isBye = true;
//             status = "Upcomming";
//             loser = null;
//           } else {
//             isBye = false;
//             status = "Upcomming";
//           }
//         } else if (sourceMatch1.status == "Completed" || sourceMatch2.status == "Completed") {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;

//           if (sourceMatch1.status == "Completed" && player1 == null) {
//             isBye = true;
//           } else if (sourceMatch2.status == "Completed" && player2 == null) {
//             isBye = true;
//           }
//           status = "Upcomming";
//           winner = null;
//           loser = null;
//         } else {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;
//           isBye = false;
//           winner = null;
//           status = "Upcomming";
//         }

//         previousWinnersMatch += 2; // Move to next pair of winners matches
//       } else {
//         if (isEvenRound) {
//           // Even rounds: winners from losers bracket + losers from winners bracket
//           const currentWinnersRound = tournament.bracket?.winners?.get(`round${Math.floor(currentWinnersRoundNumber)}`);
//           const previousLosersRound = loosersBracket[`round${round - 1}`];



//           if(round == 6){
//           console.log("-------------");
//           console.log(round);
//           console.log(currentWinnersRound);
//           console.log(previousLosersRound);
//           console.log(options);
//           console.log("--------------");
//           }
          
          
//           // Handle final round special case
//           if (round === actualLosersRounds) {
//             options = 4;
//           }

//           if(round == 6){

          
//           console.log("option is ", options);
//           }

//           if (options === 1) {
//             // Option 1: Standard pairing with reverse order from winners
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             const winnersIndex = (currentWinnersRound?.length || 0) - 1 - matchIndex;
//             source1 = currentWinnersRound?.[winnersIndex]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner; // Winner from previous losers round
//                 player2 = sourceMatch1.loser;  // Loser from winners

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
//           } else if (options === 2) {
//             // Option 2: Different pairing strategy for mid-tournament
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             let winnersIndex = firstPreviousWinnersMatch + Math.floor(rmatchcnt / 2) - 1 - matchIndex;
//             if (winnersIndex < firstPreviousWinnersMatch) {
//               winnersIndex = firstPreviousWinnersMatch + rmatchcnt - 1;
//             }
            
//             source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             previousWinnersMatch++;
//           } else if (options === 3) {
//             // Option 3: PHP-style pairing logic
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//               r = previousWinnersMatch + Math.floor(rmatchcnt / 2);
//             }
            
//             // Calculate the winners index based on PHP logic
//             // The PHP code uses: $p1pmid = $r; then increments and wraps around
//             let winnersIndex = r;
            
//             source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;

//             if(round == 6){
//               console.log("Match index:", matchIndex);
//               console.log("rmatchcnt:", rmatchcnt);
//               console.log("firstPreviousWinnersMatch:", firstPreviousWinnersMatch);
//               console.log("r value:", r);
//               console.log("winnersIndex:", winnersIndex);
//               console.log("winnersIndex - firstPreviousWinnersMatch:", winnersIndex - firstPreviousWinnersMatch);
//               console.log("source1, source2:", source1, source2);
//             }
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             // Increment previousWinnersMatch (equivalent to $previouswinnersmatch++ in PHP)
//             previousWinnersMatch++;
            
//             // Handle the wraparound logic from PHP
//             if (r == (firstPreviousWinnersMatch + (rmatchcnt - 1))) {
//               r = firstPreviousWinnersMatch;
//             } else {
//               r++;
//             }
//           } else if (options === 4) {
//             // Option 4: Final round logic
//             source1 = currentWinnersRound?.[matchIndex]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             previousWinnersMatch++;
//           }
//         } else {
//           // Odd rounds: winners from previous losers round (reduce logic)
//           const previousLosersRound = loosersBracket[`round${round - 1}`];
          
//           if (previousLosersRound && previousLosersRound.length >= 2) {
//             source1 = previousLosersRound[matchIndex * 2]?._id;
//             source2 = previousLosersRound[matchIndex * 2 + 1]?._id;

//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;

//                 if (sourceMatch1.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
//           }
//         }
//       }

//       // Only count non-bye matches towards totalNonByeMatches
//       if (!isBye) {
//         totalNonByeMatches++;
//       }

//       matches.push(
//         new Match({
//           matchId: ++totalMatches,
//           player1: round === 1 ? null : player1,
//           player2: round === 1 ? null : player2,
//           source1,
//           source2,
//           round,
//           tournamentId: tournament._id,
//           winner,
//           loser,
//           status,
//           isBye,
//           side: "losers",
//         })
//       );
//     }

//     await Match.insertMany(matches);
//     loosersBracket[`round${round}`] = matches;

//     // Update match count and options for next round
//     if (isEvenRound) {
//       rmatchcnt = rmatchcnt / 2;
//       currentWinnersRoundNumber++;
//       previousWinnersMatch = 0; // Reset for next winners round
      
//       // Update options based on proper double elimination logic
//       if (options === 4) {
//         options = 1;
//       } else {
//         options++;
//       }
//     }

//     // Break if we've reached the end
//     if (rmatchcnt < 1) {
//       break;
//     }
//   }

//   // Create the final championship match (winners bracket winner vs losers bracket winner)
//   // const finalRound = actualLosersRounds + 1;
//   // const winnersChampion = tournament.bracket?.winners.get(`round${winnersRounds}`)?.[0];
//   // const losersChampion = loosersBracket[`round${actualLosersRounds}`]?.[0];

//   // if (winnersChampion && losersChampion) {
//   //   const finalMatch = new Match({
//   //     matchId: ++totalMatches,
//   //     player1: null,
//   //     player2: null,
//   //     source1: winnersChampion._id,
//   //     source2: losersChampion._id,
//   //     round: finalRound,
//   //     tournamentId: tournament._id,
//   //     winner: null,
//   //     loser: null,
//   //     status: "Upcomming",
//   //     isBye: false,
//   //     side: "final",
//   //   });

//   //   await finalMatch.save();
//   //   loosersBracket[`final`] = [finalMatch];
//   // }

//   // Update tournament bracket
//   const bracket = await Bracket.findByIdAndUpdate(
//     tournament.bracket._id,
//     {
//       losers: loosersBracket,
//     },
//     { new: true }
//   );

//   tournament.totalMatches = totalMatches;
//   tournament.totalNonByeMatches = totalNonByeMatches;
//   await tournament.save();

//   // console.log(bracket);
//   // return bracket;
// };

const createLoosersBracket = async (tournamentId) => {
  const tournament = await Tournament.findById(tournamentId).populate("bracket");
  let totalMatches = tournament.totalMatches;
  let totalNonByeMatches = tournament.totalNonByeMatches;

  let playersCount = tournament.bracket?.winners.get("round1").length * 2;
  
  if (!tournament) throw new Error("Tournament not found");

  if (tournament.tournamentType === "Single Elimination") {
    return;
  }

  // Calculate bracket parameters
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(playersCount)));
  const winnersRounds = Math.log2(bracketSize);
  const actualLosersRounds = 2 * (winnersRounds - 1); // Correct formula for losers rounds

  const loosersBracket = {};
  let previousWinnersMatch = 0; // Start from 0 for proper indexing
  let currentWinnersRoundNumber = 2;
  let rmatchcnt = bracketSize / 4; // Starting matches count for losers bracket
  let options = 1; // Options for different pairing strategies
  let firstPreviousWinnersMatch = 0;
  let r = 0; // For option 3 PHP-style logic

  for (let round = 1; round <= actualLosersRounds; round++) {
    const matches = [];
    const isEvenRound = round % 2 === 0;

    
    
    console.log(`Processing Losers Round ${round}, isEven: ${isEvenRound}, rmatchcnt: ${rmatchcnt}, currentWinnersRoundNumber: ${currentWinnersRoundNumber}`, options);
    
    for (let matchIndex = 0; matchIndex < rmatchcnt; matchIndex++) {
      let source1, source2;
      let player1 = null, player2 = null;
      let winner = null, loser = null;
      let status = "Upcomming";
      let isBye = false;

      if (round === 1) {
        // First round: losers from winners bracket round 1
        const winnersRound1 = tournament.bracket?.winners.get("round1");
        source1 = winnersRound1[matchIndex * 2];
        source2 = winnersRound1[matchIndex * 2 + 1];

        const sourceMatch1 = await Match.findById(source1);
        const sourceMatch2 = await Match.findById(source2);

        // Your specific logic for round 1
        if (sourceMatch1.status == "Completed" && sourceMatch2.status == "Completed") {
          player1 = sourceMatch1.loser;
          player2 = sourceMatch2.loser;

          if (player1 == null && player2 == null) {
            isBye = true;
            winner = null;
            status = "Completed";
            loser = null;
          } else if (player1 == null) {
            isBye = true;
            status = "Upcomming";
            loser = null;
          } else if (player2 == null) {
            isBye = true;
            status = "Upcomming";
            loser = null;
          } else {
            isBye = false;
            status = "Upcomming";
          }
        } else if (sourceMatch1.status == "Completed" || sourceMatch2.status == "Completed") {
          player1 = sourceMatch1.loser;
          player2 = sourceMatch2.loser;

          if (sourceMatch1.status == "Completed" && player1 == null) {
            isBye = true;
          } else if (sourceMatch2.status == "Completed" && player2 == null) {
            isBye = true;
          }
          status = "Upcomming";
          winner = null;
          loser = null;
        } else {
          player1 = sourceMatch1.loser;
          player2 = sourceMatch2.loser;
          isBye = false;
          winner = null;
          status = "Upcomming";
        }

        previousWinnersMatch += 2; // Move to next pair of winners matches
      } else {
        if (isEvenRound) {
          // Even rounds: winners from losers bracket + losers from winners bracket
          const currentWinnersRound = tournament.bracket?.winners?.get(`round${Math.floor(currentWinnersRoundNumber)}`);
          const previousLosersRound = loosersBracket[`round${round - 1}`];



          // if(round == 6){
          // console.log("-------------");
          // console.log(round);
          // console.log(currentWinnersRound);
          // console.log(previousLosersRound);
          // console.log(options);
          // console.log("--------------");
          // }
          
          
          // Handle final round special case
          if (round === actualLosersRounds) {
            options = 4;
          }

          // if(round == 6){

          
          // console.log("option is ", options);
          // }

          if (options === 1) {
            // Option 1: Standard pairing with reverse order from winners
            if (matchIndex === 0) {
              firstPreviousWinnersMatch = previousWinnersMatch;
            }
            
            const winnersIndex = (currentWinnersRound?.length || 0) - 1 - matchIndex;
            source1 = currentWinnersRound?.[winnersIndex]?._id;
            source2 = previousLosersRound?.[matchIndex]?._id;
            
            if (source1 && source2) {
              const sourceMatch1 = await Match.findById(source1);
              const sourceMatch2 = await Match.findById(source2);

              if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
                player1 = sourceMatch2.winner; // Winner from previous losers round
                player2 = sourceMatch1.loser;  // Loser from winners

                if (player1 == null && player2 == null) {
                  isBye = true;
                  winner = null;
                  status = "Completed";
                  loser = null;
                } else if (player1 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else if (player2 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else {
                  isBye = false;
                  status = "Upcomming";
                }
              } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;

                if (sourceMatch1.status == "Completed" && player2 == null) {
                  isBye = true;
                } else if (sourceMatch2.status == "Completed" && player1 == null) {
                  isBye = true;
                }
                status = "Upcomming";
                winner = null;
                loser = null;
              } else {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;
                isBye = false;
                winner = null;
                status = "Upcomming";
              }
            }
          } else if (options === 2) {
            // Option 2: PHP-style pairing logic (reverse order from middle)
            if (matchIndex === 0) {
              firstPreviousWinnersMatch = previousWinnersMatch;
              r = previousWinnersMatch + Math.floor(rmatchcnt / 2) - 1;
            }
            
            // Calculate the winners index based on PHP logic
            // The PHP code uses: $p1pmid = $r; then decrements and wraps around
            let winnersIndex = r;
            
            source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
            source2 = previousLosersRound?.[matchIndex]?._id;
            
            if (source1 && source2) {
              const sourceMatch1 = await Match.findById(source1);
              const sourceMatch2 = await Match.findById(source2);

              if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;

                if (player1 == null && player2 == null) {
                  isBye = true;
                  winner = null;
                  status = "Completed";
                  loser = null;
                } else if (player1 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else if (player2 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else {
                  isBye = false;
                  status = "Upcomming";
                }
              } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;

                if (sourceMatch1.status == "Completed" && player2 == null) {
                  isBye = true;
                } else if (sourceMatch2.status == "Completed" && player1 == null) {
                  isBye = true;
                }
                status = "Upcomming";
                winner = null;
                loser = null;
              } else {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;
                isBye = false;
                winner = null;
                status = "Upcomming";
              }
            }
            
            // Increment previousWinnersMatch (equivalent to $previouswinnersmatch++ in PHP)
            previousWinnersMatch++;
            
            // Handle the wraparound logic from PHP (reverse direction)
            if (r == firstPreviousWinnersMatch) {
              r = firstPreviousWinnersMatch + rmatchcnt - 1;
            } else {
              r--;
            }
          } else if (options === 3) {
            // Option 3: PHP-style pairing logic
            if (matchIndex === 0) {
              firstPreviousWinnersMatch = previousWinnersMatch;
              r = previousWinnersMatch + Math.floor(rmatchcnt / 2);
            }
            
            // Calculate the winners index based on PHP logic
            // The PHP code uses: $p1pmid = $r; then increments and wraps around
            let winnersIndex = r;
            
            source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
            source2 = previousLosersRound?.[matchIndex]?._id;

            // if(round == 6){
            //   console.log("Match index:", matchIndex);
            //   console.log("rmatchcnt:", rmatchcnt);
            //   console.log("firstPreviousWinnersMatch:", firstPreviousWinnersMatch);
            //   console.log("r value:", r);
            //   console.log("winnersIndex:", winnersIndex);
            //   console.log("winnersIndex - firstPreviousWinnersMatch:", winnersIndex - firstPreviousWinnersMatch);
            //   console.log("source1, source2:", source1, source2);
            // }
            
            if (source1 && source2) {
              const sourceMatch1 = await Match.findById(source1);
              const sourceMatch2 = await Match.findById(source2);

              if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;

                if (player1 == null && player2 == null) {
                  isBye = true;
                  winner = null;
                  status = "Completed";
                  loser = null;
                } else if (player1 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else if (player2 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else {
                  isBye = false;
                  status = "Upcomming";
                }
              } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;

                if (sourceMatch1.status == "Completed" && player2 == null) {
                  isBye = true;
                } else if (sourceMatch2.status == "Completed" && player1 == null) {
                  isBye = true;
                }
                status = "Upcomming";
                winner = null;
                loser = null;
              } else {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;
                isBye = false;
                winner = null;
                status = "Upcomming";
              }
            }
            
            // Increment previousWinnersMatch (equivalent to $previouswinnersmatch++ in PHP)
            previousWinnersMatch++;
            
            // Handle the wraparound logic from PHP
            if (r == (firstPreviousWinnersMatch + (rmatchcnt - 1))) {
              r = firstPreviousWinnersMatch;
            } else {
              r++;
            }
          } else if (options === 4) {
            // Option 4: Final round logic
            source1 = currentWinnersRound?.[matchIndex]?._id;
            source2 = previousLosersRound?.[matchIndex]?._id;
            
            if (source1 && source2) {
              const sourceMatch1 = await Match.findById(source1);
              const sourceMatch2 = await Match.findById(source2);

              if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;

                if (player1 == null && player2 == null) {
                  isBye = true;
                  winner = null;
                  status = "Completed";
                  loser = null;
                } else if (player1 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else if (player2 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else {
                  isBye = false;
                  status = "Upcomming";
                }
              } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;

                if (sourceMatch1.status == "Completed" && player2 == null) {
                  isBye = true;
                } else if (sourceMatch2.status == "Completed" && player1 == null) {
                  isBye = true;
                }
                status = "Upcomming";
                winner = null;
                loser = null;
              } else {
                player1 = sourceMatch2.winner;
                player2 = sourceMatch1.loser;
                isBye = false;
                winner = null;
                status = "Upcomming";
              }
            }
            
            previousWinnersMatch++;
          }
        } else {
          // Odd rounds: winners from previous losers round (reduce logic)
          const previousLosersRound = loosersBracket[`round${round - 1}`];
          
          if (previousLosersRound && previousLosersRound.length >= 2) {
            source1 = previousLosersRound[matchIndex * 2]?._id;
            source2 = previousLosersRound[matchIndex * 2 + 1]?._id;

            if (source1 && source2) {
              const sourceMatch1 = await Match.findById(source1);
              const sourceMatch2 = await Match.findById(source2);

              if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
                player1 = sourceMatch1.winner;
                player2 = sourceMatch2.winner;

                if (player1 == null && player2 == null) {
                  isBye = true;
                  winner = null;
                  status = "Completed";
                  loser = null;
                } else if (player1 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else if (player2 == null) {
                  isBye = true;
                  status = "Upcomming";
                  loser = null;
                } else {
                  isBye = false;
                  status = "Upcomming";
                }
              } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
                player1 = sourceMatch1.winner;
                player2 = sourceMatch2.winner;

                if (sourceMatch1.status == "Completed" && player1 == null) {
                  isBye = true;
                } else if (sourceMatch2.status == "Completed" && player2 == null) {
                  isBye = true;
                }
                status = "Upcomming";
                winner = null;
                loser = null;
              } else {
                player1 = sourceMatch1.winner;
                player2 = sourceMatch2.winner;
                isBye = false;
                winner = null;
                status = "Upcomming";
              }
            }
          }
        }
      }

      // Only count non-bye matches towards totalNonByeMatches
      if (!isBye) {
        totalNonByeMatches++;
      }

      matches.push(
        new Match({
          matchId: ++totalMatches,
          player1: round === 1 ? null : player1,
          player2: round === 1 ? null : player2,
          source1,
          source2,
          round,
          tournamentId: tournament._id,
          winner,
          loser,
          status,
          isBye,
          side: "losers",
        })
      );
    }

    await Match.insertMany(matches);
    loosersBracket[`round${round}`] = matches;

    // Update match count and options for next round
    if (isEvenRound) {
      rmatchcnt = rmatchcnt / 2;
      currentWinnersRoundNumber++;
      previousWinnersMatch = 0; // Reset for next winners round
      
      // Update options based on proper double elimination logic
      if (options === 4) {
        options = 1;
      } else {
        options++;
      }
    }

    // Break if we've reached the end
    if (rmatchcnt < 1) {
      break;
    }
  }

  // Create the final championship match (winners bracket winner vs losers bracket winner)
  // const finalRound = actualLosersRounds + 1;
  // const winnersChampion = tournament.bracket?.winners.get(`round${winnersRounds}`)?.[0];
  // const losersChampion = loosersBracket[`round${actualLosersRounds}`]?.[0];

  // if (winnersChampion && losersChampion) {
  //   const finalMatch = new Match({
  //     matchId: ++totalMatches,
  //     player1: null,
  //     player2: null,
  //     source1: winnersChampion._id,
  //     source2: losersChampion._id,
  //     round: finalRound,
  //     tournamentId: tournament._id,
  //     winner: null,
  //     loser: null,
  //     status: "Upcomming",
  //     isBye: false,
  //     side: "final",
  //   });

  //   await finalMatch.save();
  //   loosersBracket[`final`] = [finalMatch];
  // }

  // Update tournament bracket
  const bracket = await Bracket.findByIdAndUpdate(
    tournament.bracket._id,
    {
      losers: loosersBracket,
    },
    { new: true }
  );

  tournament.totalMatches = totalMatches;
  tournament.totalNonByeMatches = totalNonByeMatches;
  await tournament.save();

  // console.log(bracket);
  // return bracket;
};


// const createLoosersBracket = async (tournamentId) => {
//   const tournament = await Tournament.findById(tournamentId).populate("bracket");
//   let totalMatches = tournament.totalMatches;
//   let totalNonByeMatches = tournament.totalNonByeMatches;

//   let playersCount = tournament.bracket?.winners.get("round1").length * 2;
  
//   if (!tournament) throw new Error("Tournament not found");

//   if (tournament.tournamentType === "Single Elimination") {
//     return;
//   }

//   // Calculate bracket parameters
//   const bracketSize = Math.pow(2, Math.ceil(Math.log2(playersCount)));
//   const winnersRounds = Math.log2(bracketSize);
//   const actualLosersRounds = 2 * (winnersRounds - 1); // Correct formula for losers rounds

//   const loosersBracket = {};
//   let previousWinnersMatch = 0; // Start from 0 for proper indexing
//   let currentWinnersRoundNumber = 2;
//   let rmatchcnt = bracketSize / 4; // Starting matches count for losers bracket
//   let options = 1; // Options for different pairing strategies
//   let firstPreviousWinnersMatch = 0;

//   for (let round = 1; round <= actualLosersRounds; round++) {
//     const matches = [];
//     const isEvenRound = round % 2 === 0;
    
//     console.log(`Processing Losers Round ${round}, isEven: ${isEvenRound}, rmatchcnt: ${rmatchcnt}, currentWinnersRoundNumber: ${currentWinnersRoundNumber}`);
    
//     for (let matchIndex = 0; matchIndex < rmatchcnt; matchIndex++) {
//       let source1, source2;
//       let player1 = null, player2 = null;
//       let winner = null, loser = null;
//       let status = "Upcomming";
//       let isBye = false;

//       if (round === 1) {
//         // First round: losers from winners bracket round 1
//         const winnersRound1 = tournament.bracket?.winners.get("round1");
//         source1 = winnersRound1[matchIndex * 2];
//         source2 = winnersRound1[matchIndex * 2 + 1];

//         const sourceMatch1 = await Match.findById(source1);
//         const sourceMatch2 = await Match.findById(source2);

//         // Your specific logic for round 1
//         if (sourceMatch1.status == "Completed" && sourceMatch2.status == "Completed") {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;

//           if (player1 == null && player2 == null) {
//             isBye = true;
//             winner = null;
//             status = "Completed";
//             loser = null;
//           } else if (player1 == null) {
//             isBye = true;
//             status = "Upcomming";
//             loser = null;
//           } else if (player2 == null) {
//             isBye = true;
//             status = "Upcomming";
//             loser = null;
//           } else {
//             isBye = false;
//             status = "Upcomming";
//           }
//         } else if (sourceMatch1.status == "Completed" || sourceMatch2.status == "Completed") {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;

//           if (sourceMatch1.status == "Completed" && player1 == null) {
//             isBye = true;
//           } else if (sourceMatch2.status == "Completed" && player2 == null) {
//             isBye = true;
//           }
//           status = "Upcomming";
//           winner = null;
//           loser = null;
//         } else {
//           player1 = sourceMatch1.loser;
//           player2 = sourceMatch2.loser;
//           isBye = false;
//           winner = null;
//           status = "Upcomming";
//         }

//         previousWinnersMatch += 2; // Move to next pair of winners matches
//       } else {
//         if (isEvenRound) {
//           // Even rounds: winners from losers bracket + losers from winners bracket
//           const currentWinnersRound = tournament.bracket?.winners?.get(`round${Math.floor(currentWinnersRoundNumber)}`);
//           const previousLosersRound = loosersBracket[`round${round - 1}`];
          
//           // Handle final round special case
//           if (round === actualLosersRounds) {
//             options = 4;
//           }

//           if (options === 1) {
//             // Option 1: Standard pairing with reverse order from winners
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             const winnersIndex = (currentWinnersRound?.length || 0) - 1 - matchIndex;
//             source1 = currentWinnersRound?.[winnersIndex]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner; // Winner from previous losers round
//                 player2 = sourceMatch1.loser;  // Loser from winners

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
//           } else if (options === 2) {
//             // Option 2: Different pairing strategy for mid-tournament
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             let winnersIndex = firstPreviousWinnersMatch + Math.floor(rmatchcnt / 2) - 1 - matchIndex;
//             if (winnersIndex < firstPreviousWinnersMatch) {
//               winnersIndex = firstPreviousWinnersMatch + rmatchcnt - 1;
//             }
            
//             source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             previousWinnersMatch++;
//           } else if (options === 3) {
//             // Option 3: Another pairing strategy
//             if (matchIndex === 0) {
//               firstPreviousWinnersMatch = previousWinnersMatch;
//             }
            
//             let winnersIndex = firstPreviousWinnersMatch + Math.floor(rmatchcnt / 2) + matchIndex;
//             if (winnersIndex >= firstPreviousWinnersMatch + rmatchcnt) {
//               winnersIndex = firstPreviousWinnersMatch + matchIndex; // Use matchIndex offset instead of resetting to firstPreviousWinnersMatch
//             }
            
//             source1 = currentWinnersRound?.[winnersIndex - firstPreviousWinnersMatch]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             previousWinnersMatch++;
//           } else if (options === 4) {
//             // Option 4: Final round logic
//             source1 = currentWinnersRound?.[matchIndex]?._id;
//             source2 = previousLosersRound?.[matchIndex]?._id;
            
//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;

//                 if (sourceMatch1.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch2.winner;
//                 player2 = sourceMatch1.loser;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
            
//             previousWinnersMatch++;
//           }
//         } else {
//           // Odd rounds: winners from previous losers round (reduce logic)
//           const previousLosersRound = loosersBracket[`round${round - 1}`];
          
//           if (previousLosersRound && previousLosersRound.length >= 2) {
//             source1 = previousLosersRound[matchIndex * 2]?._id;
//             source2 = previousLosersRound[matchIndex * 2 + 1]?._id;

//             if (source1 && source2) {
//               const sourceMatch1 = await Match.findById(source1);
//               const sourceMatch2 = await Match.findById(source2);

//               if (sourceMatch1?.status == "Completed" && sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;

//                 if (player1 == null && player2 == null) {
//                   isBye = true;
//                   winner = null;
//                   status = "Completed";
//                   loser = null;
//                 } else if (player1 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else if (player2 == null) {
//                   isBye = true;
//                   status = "Upcomming";
//                   loser = null;
//                 } else {
//                   isBye = false;
//                   status = "Upcomming";
//                 }
//               } else if (sourceMatch1?.status == "Completed" || sourceMatch2?.status == "Completed") {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;

//                 if (sourceMatch1.status == "Completed" && player1 == null) {
//                   isBye = true;
//                 } else if (sourceMatch2.status == "Completed" && player2 == null) {
//                   isBye = true;
//                 }
//                 status = "Upcomming";
//                 winner = null;
//                 loser = null;
//               } else {
//                 player1 = sourceMatch1.winner;
//                 player2 = sourceMatch2.winner;
//                 isBye = false;
//                 winner = null;
//                 status = "Upcomming";
//               }
//             }
//           }
//         }
//       }

//       // Only count non-bye matches towards totalNonByeMatches
//       if (!isBye) {
//         totalNonByeMatches++;
//       }

//       matches.push(
//         new Match({
//           matchId: ++totalMatches,
//           player1: round === 1 ? null : player1,
//           player2: round === 1 ? null : player2,
//           source1,
//           source2,
//           round,
//           tournamentId: tournament._id,
//           winner,
//           loser,
//           status,
//           isBye,
//           side: "losers",
//         })
//       );
//     }

//     await Match.insertMany(matches);
//     loosersBracket[`round${round}`] = matches;

//     // Update match count and options for next round
//     if (isEvenRound) {
//       rmatchcnt = rmatchcnt / 2;
//       currentWinnersRoundNumber++;
//       previousWinnersMatch = 0; // Reset for next winners round
      
//       // Update options based on proper double elimination logic
//       if (options === 4) {
//         options = 1;
//       } else {
//         options++;
//       }
//     }

//     // Break if we've reached the end
//     if (rmatchcnt < 1) {
//       break;
//     }
//   }

//   // Create the final championship match (winners bracket winner vs losers bracket winner)
//   // const finalRound = actualLosersRounds + 1;
//   // const winnersChampion = tournament.bracket?.winners.get(`round${winnersRounds}`)?.[0];
//   // const losersChampion = loosersBracket[`round${actualLosersRounds}`]?.[0];

//   // if (winnersChampion && losersChampion) {
//   //   const finalMatch = new Match({
//   //     matchId: ++totalMatches,
//   //     player1: null,
//   //     player2: null,
//   //     source1: winnersChampion._id,
//   //     source2: losersChampion._id,
//   //     round: finalRound,
//   //     tournamentId: tournament._id,
//   //     winner: null,
//   //     loser: null,
//   //     status: "Upcomming",
//   //     isBye: false,
//   //     side: "final",
//   //   });

//   //   await finalMatch.save();
//   //   loosersBracket[`final`] = [finalMatch];
//   // }

//   // Update tournament bracket
//   const bracket = await Bracket.findByIdAndUpdate(
//     tournament.bracket._id,
//     {
//       losers: loosersBracket,
//     },
//     { new: true }
//   );

//   tournament.totalMatches = totalMatches;
//   tournament.totalNonByeMatches = totalNonByeMatches;
//   await tournament.save();

//   // console.log(bracket);
//   // return bracket;
// };

// to create final bracket
const createFinalBracket = async (tournamentId) => {
  // get the last round in the winners bracket

  const players = await TournamentSignup.find({
    tournamentId: tournamentId,
    status: "Confirmed",
    paid: true,
  });
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(players.length)));
  const lastRoundInWinnerBracket = Math.log2(nextPowerOfTwo);
  const lastRoundInLosersBrackeT = 2 * Math.log2(nextPowerOfTwo) - 2;

  const tournament = await Tournament.findById(tournamentId).populate(
    "bracket"
  );

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  if (tournament.tournamentType == "Single Elimination") {
    return;
  }

  const winnerSideFinalMatch = tournament.bracket.winners?.get(
    `round${lastRoundInWinnerBracket}`
  )[0];
  const looserSideFinalMatch = tournament.bracket.losers?.get(
    `round${lastRoundInLosersBrackeT}`
  )[0];

  let totalMatches = tournament.totalMatches;
  const matches = [];

  matches.push(
    new Match({
      matchId: ++totalMatches,
      player1: null,
      player2: null,
      isBye: false,
      round: 1,
      status: "Upcomming",
      source1: winnerSideFinalMatch,
      source2: looserSideFinalMatch,
      winner: null,
      tournamentId: tournament._id,
      side: "finals",
      loser: null,
    })
  );

  await Match.insertMany(matches);

  const bracket = await Bracket.findByIdAndUpdate(tournament.bracket._id, {
    finals: matches,
  });

  tournament.totalMatches = totalMatches;
  tournament.totalNonByeMatches = tournament.totalNonByeMatches + 1;
  tournament.status = "ongoing";
  await tournament.save();
};

// refresh tournament when any mach result is updated
const refreshTournamentBracket = async (tournamentId) => {
  const bracket = await getTournamentBrackets(tournamentId);

  const tournament = await Tournament.findById(tournamentId);

  let totalMatches = tournament.totalMatches;

  //for winners

  const noOfRounds = Array.from(bracket?.winners.keys()).length;

  for (let i = 1; i <= noOfRounds; i++) {
    for (let j = 0; j < bracket?.winners.get(`round${i}`)?.length; j++) {
      const match = bracket?.winners.get(`round${i}`)?.[j];

      // console.log(bracket?.winners?.get(`round${i}`)?.[j], "----- ", j);
      if (
        match.status == "Completed" ||
        (match.source1 == null && match.source2 == null)
      ) {
        continue;
      }

      const source1 = await Match.findById(match.source1);
      const source2 = await Match.findById(match.source2);

      let player1 = null;
      let player2 = null;

      if (source1.status == "Completed") {
        player1 = source1.winner;
      }

      if (source2.status == "Completed") {
        player2 = source2.winner;
      }

      if (source1.status == "Completed" || source2.status == "Completed") {
        await Match.findByIdAndUpdate(match._id, {
          player1,
          player2,
        });
      }
    }
  }

  if (tournament.tournamentType == "Single Elimination") {
    const match = bracket?.winners.get(`round${noOfRounds}`)?.[0];

    console.log("this is ", noOfRounds);

    if (match.status == "Completed") {
      console.log("is the winner");

      const updatedBracket = await Bracket.findByIdAndUpdate(
        tournament.bracket,
        {
          $set: {
            winner: match.winner._id,
          },
        },
        { new: true } // returns the updated document
      );

      tournament.status = "completed";
      tournament.completedAt = Date.now();
      await bookingModel.deleteMany({tournamentId:tournament._id});
      await tournament.save();

      return;
    }
  }

  //for loosers

  const noOfRoundsLosers = Array.from(bracket?.losers.keys()).length;

  // console.log(noOfRoundsLosers);
  //iterate all the matches in the rounds

  for (let i = 1; i <= noOfRoundsLosers; i++) {
    for (let j = 0; j < bracket?.losers?.get(`round${i}`)?.length; j++) {
      const match = bracket?.losers?.get(`round${i}`)?.[j];

      console.log(match);

      if (match.status == "Completed") {
        continue;
      }

      const source1 = await Match.findById(match.source1);
      const source2 = await Match.findById(match.source2);

      let player2 = null;
      let player1 = null;
      let isBye = false;
      let status = "Upcomming";
      let winner = null;
      let loser = null;

      if (source1.side == "winners" && source2.side == "winners") {
        console.log("hello");
        if (source1.status == "Completed") {
          console.log("inside");
          player1 = source1.loser?._id;

          isBye = player1 == null ? true : false;
        }

        if (source2.status == "Completed") {
          player2 = source2.loser?._id;

          isBye = player2 == null ? true : false;
        }

        if (
          source1.status === "Completed" &&
          source2.status == "Completed" &&
          (player1 == null || player2 == null)
        ) {
          winner = player1 == null ? player2 : player1;
          loser = null;
          isBye = true;
          status = "Completed";
        }
      } else if (source1.side === "losers" && source2.side === "winners") {
        if (source2.status == "Completed") {
          player2 = source2.loser?._id;
        }

        if (source1.status == "Completed") {
          player1 = source1.winner?._id;
          isBye = player1 == null ? true : false;
        }

        if (
          isBye &&
          source2.status == "Completed" &&
          source2.status == "Completed"
        ) {
          winner = player2;
          loser = player1;
          status = "Completed";
        }
      } else if (source1.side === "losers" && source2.side === "losers") {
        if (source1.status == "Completed") {
          player1 = source1.winner?._id;
          isBye = player1 == null ? true : false;
        }

        if (source2.status == "Completed") {
          player2 = source2.winner?._id;
          isBye = player2 == null ? true : false;
        }

        if (
          source1.status === "Completed" &&
          source2.status == "Completed" &&
          (player1 == null || player2 == null)
        ) {
          winner = player1 == null ? player2._id : player1._id;
          loser = null;
          isBye = true;
          status = "Completed";
        }
      }

      //update the match by Id

      await Match.findByIdAndUpdate(match._id, {
        player1,
        player2,
        isBye,
        status,
        winner,
        loser,
      });
    }
  }

  // skip is the match is completed

  // if not then

  //no of rounds in the loosers bracket

  // iterate rouns

  // iterate all matches in a round

  // skip if the match is completed

  // if not then follow any of the following case:

  // if completed then skip
  // if not completed :

  // check if source 1 is completed
  //      if source1 match is on winners bracket then
  //      player1 = winner.looser
  //            and if current match is isBye then winner = player1
  //            else do the same for source2

  // at last do the same for finals:

  // iterate through the loosers brakcet
  // if the source1 match is from winner bracket then check if it is completed and if yes then get its looser
  //  and after that if it is a bye match then currentMatch.player = winner.looser

  // source1 and source2 both from

  // for finals

  const finals = bracket?.finals;

  // console.log(finals);

  if (finals[0] && finals[0]?.status != "Completed") {
    // console.log("jai mata di");
    const source1 = finals[0]?.source1;
    const source2 = finals[0]?.source2;

    const sourceMatch1 = await Match.findById(source1);
    const sourceMatch2 = await Match.findById(source2);

    let player1 = null;
    let player2 = null;

    if (sourceMatch1.status == "Completed") {
      player1 = sourceMatch1.winner?._id;
    }

    if (sourceMatch2.status == "Completed") {
      player2 = sourceMatch2.winner?._id;
    }

    await Match.findByIdAndUpdate(finals[0]?._id, {
      player1,
      player2,
    });
  }

  let winner = null;

  if (!finals?.[1] && finals[0]?.status == "Completed") {
    //if winner is from the winner side
    if (String(finals[0]?.winner?._id) == String(finals[0]?.player1._id)) {
      console.log(finals[0]?.winner + "has won the tournament");
      winner = finals[0]?.winner?._id;
      tournament.status = "completed";
      tournament.completedAt = Date.now();
      await bookingModel.deleteMany({tournamentId:tournament._id});
      await tournament.save();
    }

    //if winner is from the loosers side

    if (String(finals[0]?.winner._id) == String(finals[0]?.player2._id)) {
      // console.log("hello");
      const match = new Match({
        matchId: ++totalMatches,
        source1: finals[0]?.source1,
        source2: finals[0]?.source2,
        tournamentId: tournamentId,
        player1: finals[0]?.player1,
        player2: finals[0]?.player2,
        round: 2,
        status: "Upcomming",
        side: "finals",
      });

      await match.save();

      finals?.push(match);

      console.log("this is finakl", finals);

      const brcklet = await Bracket.findByIdAndUpdate(tournament.bracket._id, {
        finals: finals,
      });

      tournament.totalMatches = totalMatches;
      tournament.totalNonByeMatches = tournament.totalNonByeMatches + 1;
      await tournament.save();
    }
  }

  if (finals?.[1] && finals?.[1]?.status == "Completed") {
    //tournament winner

    console.log("winner ", finals?.[1].winner);

    winner = finals?.[1].winner?._id;

    tournament.status = "completed";
    tournament.completedAt = Date.now();
    await bookingModel.deleteMany({tournamentId:tournament._id});

    await tournament.save();
  }

  const brcklet = await Bracket.findByIdAndUpdate(tournament.bracket._id, {
    winner,
  });
};

//match service

//check for managerId
// const shufflePlayersAcrossMatches = async (tournamentId) => {

//   const tournament = await Tournament.findById(tournamentId);

//   if(!tournament){
//     throw new Error("Tournament doesnot exists");
//   }

//   const matches = await Match.find({
//     tournamentId: tournamentId,
//     player1: {
//       $ne: null,
//     },
//     player2: {
//       $ne: null,
//     },
//     status: {
//       $ne: "Completed",
//     },
//     isBye: false,
//   });

//   const shuffled = JSON.parse(JSON.stringify(matches));
//   const allPlayers = [];

//   shuffled.forEach((match) => {
//     if (match.player1) allPlayers.push(match.player1);
//     if (match.player2) allPlayers.push(match.player2);
//   });

//   for (let i = allPlayers.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [allPlayers[i], allPlayers[j]] = [allPlayers[j], allPlayers[i]];
//   }

//   let index = 0;
//   for (const match of shuffled) {
//     match.player1 = index < allPlayers.length ? allPlayers[index++] : null;
//     match.player2 = index < allPlayers.length ? allPlayers[index++] : null;
//   }

//   // Step 3: Write updates to DB
//   const updatePromises = shuffled.map((match) =>
//     Match.updateOne(
//       { _id: match._id },
//       { $set: { player1: match.player1, player2: match.player2 } }
//     )
//   );

//   await Promise.all(updatePromises);
//   console.log("Player assignments shuffled and updated in the database.");
// };

const getAvailableTableListForTournament = async (tournament) => {
  const tables = (
    await Booking.find({ tournamentId: tournament._id }).populate("tableId")
  ).map((booking) => booking.tableId);

  // loop and check if any match has a table remove them from the list and if not add them to the list

  const tableList = [];

  // console.log(tables);

  for (let i = 0; i < tables.length; i++) {
    const match = await matchModel.findOne({ table: tables[i]._id });

    // console.log(match);
    if (match) {
      continue;
    } else {
      tableList.push(tables[i]);
    }
  }

  return tableList;
};

const getAllNonByeIncompleteMatchesService = async (tournamentId) => {
  const matches = await Match.find({
    tournamentId: tournamentId,
    player1: {
      $ne: null,
    },
    player2: {
      $ne: null,
    },
    status: {
      $ne: "Completed",
    },
    isBye: false,
  }).populate([
    {
      path: "player1",
      populate: {
        path: "userId",
        select: "_id firstName lastName",
      },
    },
    {
      path: "player2",
      populate: {
        path: "userId",
        select: "_id firstName lastName",
      },
    },
    {
      path: "table",
    },
  ]);

  return matches;
};

module.exports = {
  getTournamentBrackets,
  resetTournament,
  createWinnersBracket,
  createLoosersBracket,
  createFinalBracket,
  refreshTournamentBracket,
  // shufflePlayersAcrossMatches,
  getAvailableTableListForTournament,
  getAllNonByeIncompleteMatchesService,
};
