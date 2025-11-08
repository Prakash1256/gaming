const Tournament = require("../models/tournament.model");
const Venue = require("../models/venue.model");
const Match = require("../models/match.model");
const Booking = require("../models/booking.model");
const PlayerRecord = require("../models/playerRecord.model");
const TableRecord = require("../models/tablerecord.model");
const TournamentSignup = require("../models/tournamentSignup.model");
const User = require("../models/user.model");
const Table = require("../models/tabel.model");
const fs = require("fs");
const ExcelJS = require("exceljs");
const path = require("path");
const {
  tournamentSchema,
  tournamentEditSignupSchema,
  tournamentParticipantStatusBulkUpdateSchema,
  tournamentParticipantPaidStatusBulkUpdateSchema,
  addPlayerToTournamentSchema,
  addMultiplePlayersToTournamentSchema,
} = require("../schemas/TournamentSchema");
const { matchResultSchema } = require("../schemas/MatchSchema");
const {
  resetTournament,
  getTournamentBrackets,
  createWinnersBracket,
  createLoosersBracket,
  createFinalBracket,
  refreshTournamentBracket,
  shufflePlayersAcrossMatches,
  getAvailableTableListForTournament,
  getAllNonByeIncompleteMatchesService,
} = require("../services/tournament.service");
const { ZodError } = require("zod");
const logger = require("../utils/logger");
const { formatError } = require("../utils/FormatZodError");
const mongoose = require("mongoose");
const tournamentSignupModel = require("../models/tournamentSignup.model");
const SupportTicket = require("../models/support.model");
const roleModel = require("../models/role.model");
const matchModel = require("../models/match.model");
const { deleteTableBookings } = require("./venue.controller");
const bookingModel = require("../models/booking.model");
const userModel = require("../models/user.model");
const { brotliDecompress } = require("zlib");

// const createTournament = async (req, res) => {
//   try {
//     const body = req.body;
//     tournamentSchema.parse(body);

//     const {
//       name,
//       flyerImage,
//       tournamentLocation,
//       startDateTime,
//       endDateTime,
//       tournamentType,
//       game,
//       description,
//       maxPlayer,
//       entryFee,
//       ratingSystem,
//       winnersRace,
//       losersRace,
//       published,
//       payoutOptions,
//       // tables, // Array of table IDs
//     } = body;

//     const start = new Date(startDateTime);
//     const end = new Date(endDateTime);

//     if (Number(winnersRace) > 99) {
//       return res.status(400).json({
//         status: false,
//         message: "Winners race cannot be greater than 99",
//       });
//     }

//     if (Number(losersRace) > 99) {
//       return res.status(400).json({
//         status: false,
//         message: "Losers race cannot be greater than 99",
//       });
//     }

//     if (isNaN(start) || isNaN(end)) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid date format",
//       });
//     } else if (start >= end) {
//       return res.status(400).json({
//         status: false,
//         message: "Start date must be before end date",
//       });
//     }

//     if (start < new Date(Date.now())) {
//       return res.status(400).json({
//         status: false,
//         message: "Inavlid start date",
//       });
//     }

//     if (maxPlayer % 8 !== 0) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid max players. Must be a multiple of 8",
//       });
//     }

//     // Check if venue exists
//     const venue = await Venue.findById(tournamentLocation);

//     if (!venue) {
//       return res
//         .status(404)
//         .json({ message: "Tournament location not found!" });
//     }

//     // **Check if any of the selected tables are already booked during the tournament time**
//     // const existingBookings = await Booking.find({
//     //   tableId: { $in: tables },
//     //   $or: [
//     //     { startDateTime: { $lt: end }, endDateTime: { $gt: start } }, // Overlapping start
//     //     { startDateTime: { $gte: start, $lt: end } }, // Starts inside new tournament time
//     //     { endDateTime: { $gt: start, $lte: end } }, // Ends inside new tournament time
//     //   ],
//     // });

//     // if (existingBookings.length > 0) {
//     //   return res.status(400).json({
//     //     status: false,
//     //     message: `Some tables are already booked for another tournament.`,
//     //     bookedTables: existingBookings.map((b) => b.tableId), // Return booked tables
//     //   });
//     // }

//     // **Create bookings for all selected tables**
//     // const bookings = tables.map((tableId) => ({
//     //   tableId,
//     //   tournamentId: null, // Will update after tournament creation
//     //   startDateTime: start,
//     //   endDateTime: end,
//     // }));
//     // const createdBookings = await Booking.insertMany(bookings);

//     // **Create tournament**
//     const tournament = new Tournament({
//       name,
//       flyerImage,
//       tournamentLocation,
//       startDateTime,
//       endDateTime,
//       tournamentType,
//       game,
//       description,
//       maxPlayer,
//       entryFee,
//       ratingSystem,
//       winnersRace,
//       losersRace,
//       published,
//       // payoutOptions,
//       managerId: req.user?.id,
//       status: "upcomming",
//       // tables, // Store the assigned tables
//     });

//     await tournament.save();

//     return res.status(201).json({
//       message: "Tournament created successfully!",
//       tournament,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     console.error("Error creating tournament:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

// // const updateTournament = async (req, res) => {
// //   try {
// //     const { tournamentId } = req.params;
// //     const body = req.body;
// //     tournamentSchema.partial().parse(body); // Accept partial updates

// //     const {
// //       name,
// //       flyerImage,
// //       tournamentLocation,
// //       startDateTime,
// //       endDateTime,
// //       tournamentType,
// //       game,
// //       description,
// //       maxPlayer,
// //       entryFee,
// //       ratingSystem,
// //       winnersRace,
// //       losersRace,
// //       published,
// //       payoutOptions,
// //       // tables, // Optional table update
// //     } = body;

// //     // Find existing tournament
// //     const existingTournament = await Tournament.findById(id);
// //     if (!existingTournament) {
// //       return res.status(404).json({
// //         status: false,
// //         message: "Tournament not found",
// //       });
// //     }

// //     // Validate dates if provided
// //     let start = existingTournament.startDateTime;
// //     let end = existingTournament.endDateTime;

// //     if (startDateTime) {
// //       start = new Date(startDateTime);
// //       if (isNaN(start)) {
// //         return res.status(400).json({
// //           status: false,
// //           message: "Invalid start date format",
// //         });
// //       }
// //     }

// //     if (endDateTime) {
// //       end = new Date(endDateTime);
// //       if (isNaN(end)) {
// //         return res.status(400).json({
// //           status: false,
// //           message: "Invalid end date format",
// //         });
// //       }
// //     }

// //     if (start >= end) {
// //       return res.status(400).json({
// //         status: false,
// //         message: "Start date must be before end date",
// //       });
// //     }

// //     if (maxPlayer && maxPlayer % 8 !== 0) {
// //       return res.status(400).json({
// //         status: false,
// //         message: "Invalid max players. Must be a multiple of 8",
// //       });
// //     }

// //     // Check venue if location is changed
// //     if (tournamentLocation) {
// //       const venue = await Venue.findById(tournamentLocation);
// //       if (!venue) {
// //         return res.status(404).json({
// //           status: false,
// //           message: "Tournament location not found",
// //         });
// //       }
// //     }

// //     // Optional: Check table conflicts and update bookings if you're using that part
// //     // (Commented out for now, same as in createTournament)

// //     if(String(existingTournament.managerId) != String(req.user.id)){
// //       return res.status(400).json(
// //         {
// //           status: false,
// //           message: "You are not authorized"
// //         }
// //       );
// //     }

// //     // Update tournament
// //     const updatedTournament = await Tournament.findByIdAndUpdate(
// //       id,
// //       {
// //         ...(name && { name }),
// //         ...(flyerImage && { flyerImage }),
// //         ...(tournamentLocation && { tournamentLocation }),
// //         ...(startDateTime && { startDateTime: start }),
// //         ...(endDateTime && { endDateTime: end }),
// //         ...(tournamentType && { tournamentType }),
// //         ...(game && { game }),
// //         ...(description && { description }),
// //         ...(maxPlayer && { maxPlayer }),
// //         ...(entryFee && { entryFee }),
// //         ...(ratingSystem && { ratingSystem }),
// //         ...(winnersRace && { winnersRace }),
// //         ...(losersRace && { losersRace }),
// //         ...(published !== undefined && { published }),
// //         ...(payoutOptions && { payoutOptions }),
// //         updatedAt: new Date(),
// //       },
// //       { new: true }
// //     );

// //     return res.status(200).json({
// //       status: true,
// //       message: "Tournament updated successfully!",
// //       tournament: updatedTournament,
// //     });
// //   } catch (error) {
// //     if (error instanceof ZodError) {
// //       const errors = formatError(error);
// //       return res.status(422).json({
// //         status: false,
// //         message: "Invalid data",
// //         errors,
// //       });
// //     }

// //     console.error("Error updating tournament:", error);
// //     return res.status(500).json({
// //       status: false,
// //       message: "Something went wrong, please try again",
// //       error: error.message,
// //     });
// //   }
// // };

// const updateTournament = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     const body = req.body;
//     tournamentSchema.parse(body);

//     const {
//       name,
//       flyerImage,
//       tournamentLocation,
//       startDateTime,
//       endDateTime,
//       tournamentType,
//       game,
//       description,
//       maxPlayer,
//       entryFee,
//       ratingSystem,
//       winnersRace,
//       losersRace,
//       published,
//     } = body;

//     // check if the tournmanent exists in db;

//     const tournamentInDb = await Tournament.findById(tournamentId);

//     if (!tournamentInDb) {
//       return res.status(404).json({
//         status: false,
//         message: "Tournament does not exists",
//       });
//     }

//     const start = new Date(startDateTime);
//     const end = new Date(endDateTime);

//     if (isNaN(start) || isNaN(end)) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid date format",
//       });
//     } else if (start >= end) {
//       return res.status(400).json({
//         status: false,
//         message: "Start date must be before end date",
//       });
//     }

//     if (start < new Date(Date.now())) {
//       return res.status(400).json({
//         status: false,
//         message: "Inavlid start date",
//       });
//     }

//     if (Number(winnersRace) > 99) {
//       return res.status(400).json({
//         status: false,
//         message: "Winners Race cannot be greater than 99",
//       });
//     }

//     if (Number(losersRace) > 99) {
//       return res.status(400).json({
//         status: false,
//         message: "Losers Race cannot be greater than 99",
//       });
//     }

//     // const start = new Date(startDateTime);
//     // const end = new Date(endDateTime);

//     let tournamentLocationInDb;

//     // if (
//     //   new Date(tournamentInDb.startDateTime) != start ||
//     //   new Date(tournamentInDb.endDateTime) != end
//     // ) {
//     //   if (tournamentInDb.status == "ongoing") {
//     //     return res.status(500).json({
//     //       status: false,
//     //       message:
//     //         "Cannot change the time for a tournament that is already started",
//     //     });
//     //   }
//     // }

//     if (tournamentInDb.tournamentType != tournamentType) {
//       if (tournamentInDb.status == "ongoing") {
//         return res.status(400).json({
//           status: false,
//           message: "Cannot change the tournament type of an ongoing tournament",
//         });
//       }
//     }

//     if (
//       new Date(tournamentInDb.startDateTime).getTime() !==
//         new Date(start).getTime() ||
//       new Date(tournamentInDb.endDateTime).getTime() !== new Date(end).getTime()
//     ) {
//       if (tournamentInDb.status === "ongoing") {
//         return res.status(500).json({
//           status: false,
//           message: "Cannot change the time of an ongoing tournament",
//         });
//       }
//     }

//     if (tournamentInDb.maxPlayer != maxPlayer) {
//       if (tournamentInDb.status == "ongoing") {
//         return res.status(400).json({
//           status: false,
//           message: "Cannot change maxplayer of an ongoing tournament",
//         });
//       } else {
//         const tournamentSignupsConfirmed = await tournamentSignupModel.find({
//           tournamentId,
//           status: "Confirmed",
//         });
//         const tournamentSignupsTentative = await tournamentSignupModel.find({
//           tournamentId,
//           status: "Tentative",
//         });
//         const tournamentSignupsWaiting = await tournamentSignupModel.find({
//           tournamentId,
//           status: "Waiting",
//         });

//         if (maxPlayer >= tournamentSignupsConfirmed.length) {
//           if (tournamentSignupsConfirmed.length == maxPlayer) {
//             for (let i = 0; i < tournamentSignupsTentative.length; i++) {
//               tournamentSignupsTentative[i].status = "Waiting";

//               await tournamentSignupsTentative[i].save();
//             }
//           } else {
//             if (maxPlayer < tournamentSignupsConfirmed.length) {
//               // throw new Error(
//               //   `Max players (${maxPlayer}) cannot be less than confirmed players (${tournamentSignupsConfirmed.length})`
//               // );

//               return res.status(400).json({
//                 status: false,
//                 message: "Max players cannot be less than confirmed players",
//               });
//             }

//             // Calculate how many tentative players can fit
//             const availableSpotsForTentative =
//               maxPlayer - tournamentSignupsConfirmed.length;
//             const currentTentativeCount = tournamentSignupsTentative.length;

//             console.log(`Max Players: ${maxPlayer}`);
//             console.log(
//               `Confirmed Players: ${tournamentSignupsConfirmed.length}`
//             );
//             console.log(
//               `Available spots for tentative: ${availableSpotsForTentative}`
//             );
//             console.log(`Current tentative players: ${currentTentativeCount}`);
//             console.log(
//               `Current waiting players: ${tournamentSignupsWaiting.length}`
//             );

//             // Case 1: We have more tentative players than available spots (DECREASING max players)
//             if (currentTentativeCount > availableSpotsForTentative) {
//               const playersToMoveToWaiting =
//                 currentTentativeCount - availableSpotsForTentative;

//               console.log(
//                 `Moving ${playersToMoveToWaiting} players from tentative to waiting`
//               );

//               // Sort tentative players by signup date (latest signups moved to waiting first)
//               tournamentSignupsTentative.sort(
//                 (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//               );

//               // Move excess tentative players to waiting
//               for (let i = 0; i < playersToMoveToWaiting; i++) {
//                 const player = tournamentSignupsTentative[i];
//                 player.status = "Waiting";

//                 console.log(
//                   `Moving player ${
//                     player.id || player.name
//                   } from tentative to waiting`
//                 );
//                 await player.save();
//               }
//             }
//             // Case 2: We have available spots and waiting players (INCREASING max players)
//             else if (
//               currentTentativeCount < availableSpotsForTentative &&
//               tournamentSignupsWaiting.length > 0
//             ) {
//               const availableSpots =
//                 availableSpotsForTentative - currentTentativeCount;
//               const playersToMoveToTentative = Math.min(
//                 availableSpots,
//                 tournamentSignupsWaiting.length
//               );

//               console.log(
//                 `Moving ${playersToMoveToTentative} players from waiting to tentative`
//               );

//               // Sort waiting players by signup date (earliest signups get priority)
//               tournamentSignupsWaiting.sort(
//                 (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//               );

//               // Move waiting players to tentative
//               for (let i = 0; i < playersToMoveToTentative; i++) {
//                 const player = tournamentSignupsWaiting[i];
//                 player.status = "Tentative";

//                 console.log(
//                   `Moving player ${
//                     player.id || player.name
//                   } from waiting to tentative`
//                 );
//                 await player.save();
//               }
//             }
//             // Case 3: No changes needed
//             else {
//               console.log("No player status changes needed");
//             }
//           }
//         } else {
//           return res.status(400).json({
//             status: false,
//             message:
//               "Max player should be greater than or equal to number of confirmed player",
//           });
//         }
//       }
//     }

//     if (String(tournamentInDb.tournamentLocation) != tournamentLocation) {
//       if (tournamentInDb.status == "upcomming") {
//         tournamentLocationInDb = await Venue.findById(tournamentLocation);

//         if (!tournamentLocationInDb) {
//           return res.status(404).json({
//             status: false,
//             message: "Venue does not exist",
//           });
//         }
//         await bookingModel.deleteMany({tournamentId});

//       } else {
//         return res.status(404).json({
//           status: false,
//           message: "Tournament already started, reset it to change Venue",
//         });
//       }
//     }
//     //check if the tournament location exists

//     await Tournament.findByIdAndUpdate(tournamentId, {
//       $set: {
//         name,
//         flyerImage,
//         tournamentLocation,
//         startDateTime,
//         endDateTime,
//         tournamentType,
//         game,
//         description,
//         maxPlayer: Number(maxPlayer),
//         entryFee: Number(entryFee),
//         ratingSystem,
//         winnersRace,
//         losersRace,
//         published,
//       },
//     });

//     return res.status(200).json({
//       status: false,
//       message: "Tournament Updated successfully",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }
//     console.error("Error creating tournament:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

//for admin

const createTournament = async (req, res) => {
  try {
    // const body = req.body.tournament;
    const file = req.file;

    console.log(req.body.tournament);

    // return res.status(200).json(
    //   {
    //     status: true,
    //     message: "testing"
    //   }
    // );
    // Validate body using Zod
    const body = tournamentSchema.parse(JSON.parse(req.body.tournament));

    const {
      name,
      tournamentLocation,
      startDateTime,
      endDateTime,
      tournamentType,
      game,
      description,
      maxPlayer,
      entryFee,
      ratingSystem,
      winnersRace,
      losersRace,
      published,
      payoutOptions,
    } = body;

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    const userRole = await roleModel.findById(req.user.roleId);

    // console.log(userRole);
    if (userRole.name != "Admin" && userRole.name != "Manager") {
      return res.status(400).json({
        status: false,
        message: "permission denied",
      });
    }

    if (Number(winnersRace) > 99 || Number(losersRace) > 99) {
      return res.status(400).json({
        status: false,
        message: "Race values cannot exceed 99",
      });
    }

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({
        status: false,
        message: "Start Date must be before End Date",
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        status: false,
        message: "Start date must be in the future",
      });
    }

    if (maxPlayer % 8 !== 0) {
      return res.status(400).json({
        status: false,
        message: "Max players must be a multiple of 8",
      });
    }

    const venue = await Venue.findById(tournamentLocation);
    if (!venue) {
      return res
        .status(404)
        .json({ message: "Tournament location not found!" });
    }

    // Handle image upload
    let flyerImage = null;
    if (file) {
      flyerImage = file.filename; // Store filename in DB
    }

    const tournament = new Tournament({
      name,
      flyerImage,
      tournamentLocation,
      startDateTime,
      endDateTime,
      tournamentType,
      game,
      ...(body.description ? { description: description } : {}),
      maxPlayer,
      entryFee,
      ratingSystem,
      winnersRace,
      losersRace,
      published,
      payoutOptions,
      managerId: req.user?.id,
      status: "upcomming",
    });

    await tournament.save();

    return res.status(201).json({
      message: "Tournament created successfully!",
      tournament,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: formatError(error),
      });
    }

    console.error("Error creating tournament:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

// const updateTournament = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;
//     // const body = req.body.tou;

//     // If a new file is uploaded, attach its filename

//     const body = tournamentSchema.parse(JSON.parse(req.body.tournament));

//     if (req.file) {
//       body.flyerImage = req.file.filename;
//     }

//     const {
//       name,
//       flyerImage,
//       tournamentLocation,
//       startDateTime,
//       endDateTime,
//       tournamentType,
//       game,
//       description,
//       maxPlayer,
//       entryFee,
//       ratingSystem,
//       winnersRace,
//       losersRace,
//       published,
//     } = body;

//     const tournamentInDb = await Tournament.findById(tournamentId);

//     if (!tournamentInDb) {
//       return res.status(404).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const start = new Date(startDateTime);
//     const end = new Date(endDateTime);

//     if (isNaN(start) || isNaN(end)) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid date format",
//       });
//     } else if (start >= end) {
//       return res.status(400).json({
//         status: false,
//         message: "Start date must be before end date",
//       });
//     }

//     if (start < new Date(Date.now())) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid start date",
//       });
//     }

//     if (Number(winnersRace) > 99 || Number(losersRace) > 99) {
//       return res.status(400).json({
//         status: false,
//         message: "Race values cannot exceed 99",
//       });
//     }

//     let tournamentLocationInDb;

//     if (String(tournamentInDb.tournamentLocation) !== tournamentLocation) {
//       if (tournamentInDb.status === "upcomming") {
//         tournamentLocationInDb = await Venue.findById(tournamentLocation);

//         if (!tournamentLocationInDb) {
//           return res.status(404).json({
//             status: false,
//             message: "Venue does not exist",
//           });
//         }
//       } else {
//         return res.status(400).json({
//           status: false,
//           message: "Tournament already started, reset it to change venue",
//         });
//       }
//     }

//     const updateData = {
//       name,
//       tournamentLocation,
//       startDateTime,
//       endDateTime,
//       tournamentType,
//       game,
//       description,
//       maxPlayer: Number(maxPlayer),
//       entryFee: Number(entryFee),
//       ratingSystem,
//       winnersRace,
//       losersRace,
//       published,
//     };

//     if (flyerImage) {
//       updateData.flyerImage = flyerImage;
//     }

//     await Tournament.findByIdAndUpdate(tournamentId, {
//       $set: updateData,
//     });

//     return res.status(200).json({
//       status: true,
//       message: "Tournament updated successfully",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors,
//       });
//     }

//     console.error("Error updating tournament:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

const updateTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // const body = req.body;
    // tournamentSchema.parse(body);

    const body = tournamentSchema.parse(JSON.parse(req.body.tournament));

    if (req.file) {
      body.flyerImage = req.file.filename;
    }

    const {
      name,
      flyerImage,
      tournamentLocation,
      startDateTime,
      endDateTime,
      tournamentType,
      game,
      description,
      maxPlayer,
      entryFee,
      ratingSystem,
      winnersRace,
      losersRace,
      published,
    } = body;

    // check if the tournmanent exists in db;

    const tournamentInDb = await Tournament.findById(tournamentId);

    if (!tournamentInDb) {
      return res.status(404).json({
        status: false,
        message: "Tournament does not exists",
      });
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        status: false,
        message: "Invalid date format",
      });
    } else if (start >= end) {
      return res.status(400).json({
        status: false,
        message: "Start date must be before end date",
      });
    }

    if (start < new Date(Date.now())) {
      // console.log(start.getTime());
      // console.log(tournamentInDb.startDateTime);
      // console.log();

      // console.log(start.getTime() == new Date(tournamentInDb.startDateTime).getTime());
      if (start.getTime() == new Date(tournamentInDb.startDateTime).getTime()) {
        //  console.log("hello");
      } else {
        return res.status(400).json({
          status: false,
          message: "Inavlid start date",
        });
      }
    }

    if (end < new Date(Date.now())) {
      // console.log(start.getTime());
      // console.log(tournamentInDb.startDateTime);
      // console.log();
      if (end.getTime() == new Date(tournamentInDb.endDateTime).getTime()) {
        //  console.log("hello");
      } else {
        return res.status(400).json({
          status: false,
          message: "Invalid end date",
        });
      }
    }

    if (Number(winnersRace) > 99) {
      return res.status(400).json({
        status: false,
        message: "Winners Race cannot be greater than 99",
      });
    }

    if (Number(losersRace) > 99) {
      return res.status(400).json({
        status: false,
        message: "Losers Race cannot be greater than 99",
      });
    }

    // const start = new Date(startDateTime);
    // const end = new Date(endDateTime);

    let tournamentLocationInDb;

    // if (
    //   new Date(tournamentInDb.startDateTime) != start ||
    //   new Date(tournamentInDb.endDateTime) != end
    // ) {
    //   if (tournamentInDb.status == "ongoing") {
    //     return res.status(500).json({
    //       status: false,
    //       message:
    //         "Cannot change the time for a tournament that is already started",
    //     });
    //   }
    // }

    if (tournamentInDb.tournamentType != tournamentType) {
      if (tournamentInDb.status == "ongoing") {
        return res.status(400).json({
          status: false,
          message: "Cannot change the tournament type of an ongoing tournament",
        });
      }
    }

    if (tournamentInDb.ratingSystem != ratingSystem) {
      if (tournamentInDb.status == "ongoing") {
        return res.status(400).json({
          status: false,
          message: "Cannot change the rating system of an ongoing tournament",
        });
      }

      //if the rating system is none then purge all the rated players

      if (
        tournamentInDb.ratingSystem == "fargorate" &&
        ratingSystem == "none"
      ) {
        await TournamentSignup.deleteMany({
          forgorateReadableId: { $ne: null },
        });
      }
      tournamentInDb.ratingSystem = ratingSystem;
    }

    if (
      new Date(tournamentInDb.startDateTime).getTime() !==
        new Date(start).getTime() ||
      new Date(tournamentInDb.endDateTime).getTime() !== new Date(end).getTime()
    ) {
      if (tournamentInDb.status === "ongoing") {
        return res.status(500).json({
          status: false,
          message: "Cannot change the time of an ongoing tournament",
        });
      }
    }

    if (tournamentInDb.maxPlayer != maxPlayer) {
      if (tournamentInDb.status == "ongoing") {
        return res.status(400).json({
          status: false,
          message: "Cannot change maxplayer of an ongoing tournament",
        });
      } else {
        const tournamentSignupsConfirmed = await tournamentSignupModel.find({
          tournamentId,
          status: "Confirmed",
        });
        const tournamentSignupsTentative = await tournamentSignupModel.find({
          tournamentId,
          status: "Tentative",
        });
        const tournamentSignupsWaiting = await tournamentSignupModel.find({
          tournamentId,
          status: "Waiting",
        });

        if (maxPlayer >= tournamentSignupsConfirmed.length) {
          if (tournamentSignupsConfirmed.length == maxPlayer) {
            for (let i = 0; i < tournamentSignupsTentative.length; i++) {
              tournamentSignupsTentative[i].status = "Waiting";

              await tournamentSignupsTentative[i].save();
            }
          } else {
            if (maxPlayer < tournamentSignupsConfirmed.length) {
              // throw new Error(
              //   `Max players (${maxPlayer}) cannot be less than confirmed players (${tournamentSignupsConfirmed.length})`
              // );

              return res.status(400).json({
                status: false,
                message: "Max players cannot be less than confirmed players",
              });
            }

            // Calculate how many tentative players can fit
            const availableSpotsForTentative =
              maxPlayer - tournamentSignupsConfirmed.length;
            const currentTentativeCount = tournamentSignupsTentative.length;

            console.log(`Max Players: ${maxPlayer}`);
            console.log(
              `Confirmed Players: ${tournamentSignupsConfirmed.length}`
            );
            console.log(
              `Available spots for tentative: ${availableSpotsForTentative}`
            );
            console.log(`Current tentative players: ${currentTentativeCount}`);
            console.log(
              `Current waiting players: ${tournamentSignupsWaiting.length}`
            );

            // Case 1: We have more tentative players than available spots (DECREASING max players)
            if (currentTentativeCount > availableSpotsForTentative) {
              const playersToMoveToWaiting =
                currentTentativeCount - availableSpotsForTentative;

              console.log(
                `Moving ${playersToMoveToWaiting} players from tentative to waiting`
              );

              // Sort tentative players by signup date (latest signups moved to waiting first)
              tournamentSignupsTentative.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              );

              // Move excess tentative players to waiting
              for (let i = 0; i < playersToMoveToWaiting; i++) {
                const player = tournamentSignupsTentative[i];
                player.status = "Waiting";

                console.log(
                  `Moving player ${
                    player.id || player.name
                  } from tentative to waiting`
                );
                await player.save();
              }
            }
            // Case 2: We have available spots and waiting players (INCREASING max players)
            else if (
              currentTentativeCount < availableSpotsForTentative &&
              tournamentSignupsWaiting.length > 0
            ) {
              const availableSpots =
                availableSpotsForTentative - currentTentativeCount;
              const playersToMoveToTentative = Math.min(
                availableSpots,
                tournamentSignupsWaiting.length
              );

              console.log(
                `Moving ${playersToMoveToTentative} players from waiting to tentative`
              );

              // Sort waiting players by signup date (earliest signups get priority)
              tournamentSignupsWaiting.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              );

              // Move waiting players to tentative
              for (let i = 0; i < playersToMoveToTentative; i++) {
                const player = tournamentSignupsWaiting[i];
                player.status = "Tentative";

                console.log(
                  `Moving player ${
                    player.id || player.name
                  } from waiting to tentative`
                );
                await player.save();
              }
            }
            // Case 3: No changes needed
            else {
              console.log("No player status changes needed");
            }
          }
        } else {
          return res.status(400).json({
            status: false,
            message:
              "Max player should be greater than or equal to number of confirmed player",
          });
        }
      }
    }

    if (String(tournamentInDb.tournamentLocation) != tournamentLocation) {
      if (tournamentInDb.status == "upcomming") {
        tournamentLocationInDb = await Venue.findById(tournamentLocation);

        if (!tournamentLocationInDb) {
          return res.status(404).json({
            status: false,
            message: "Venue does not exist",
          });
        }
        await bookingModel.deleteMany({ tournamentId });
      } else {
        return res.status(404).json({
          status: false,
          message: "Tournament already started, reset it to change Venue",
        });
      }
    }
    //check if the tournament location exists

    await Tournament.findByIdAndUpdate(tournamentId, {
      $set: {
        name,
        flyerImage,
        tournamentLocation,
        startDateTime,
        endDateTime,
        tournamentType,
        game,
        ...(body.description ? { description: body.description } : {}),
        maxPlayer: Number(maxPlayer),
        entryFee: Number(entryFee),
        ratingSystem,
        winnersRace,
        losersRace,
        published,
      },
    });

    return res.status(200).json({
      status: false,
      message: "Tournament Updated successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }
    console.error("Error creating tournament:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

const getAllTournamentAdminBasedOnStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const { status = "*" } = req.query;

    const userInDB = await User.findById(userId).populate("role");

    if (!userInDB) {
      return res.status(404).json({
        status: false,
        message: "user does not exists",
      });
    }

    if (userInDB.role.name !== "Admin") {
      return res.status(403).json({
        status: false,
        message: "Permission denied",
      });
    }

    const AllTournaments = await Tournament.find({
      ...(status == "*" ? {} : { status: status }),
    }).populate([
      {
        path: "managerId",
        select: "_id firstName lastName",
      },
    ]);

    return res.status(200).json({
      status: false,
      tournamentList: AllTournaments,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }
    console.error("Error creating tournament:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

// const getAllTournamentBasedOnStatus = async (req, res) => {
//   try {
//     const {
//       status,
//       page = 1,
//       limit = 10,
//       sort = "createdAt",
//       game,
//       state,
//       type,
//       search,
//     } = req.query;

//     const userId = req.user.id;

//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

//     if (!status) {
//       return res.status(400).json({ status: false, message: "Status is required" });
//     }

//     if (
//       isNaN(pageNumber) ||
//       isNaN(limitNumber) ||
//       pageNumber < 1 ||
//       limitNumber < 1
//     ) {
//       return res.status(400).json({ status: false, message: "Invalid pagination parameters" });
//     }

//     const filter = { status };
//     if (game) filter.game = game;
//     if (type) filter.type = type;
//     if (search) {
//       filter.name = { $regex: search, $options: "i" };
//     }

//     const matchStage = {
//       ...filter,
//     };

//     if (state !== "Select State") {
//       matchStage["location.state"] = state;
//     }

//     const tournaments = await Tournament.aggregate([
//       {
//         $lookup: {
//           from: "venues",
//           localField: "tournamentLocation",
//           foreignField: "_id",
//           as: "location",
//         },
//       },
//       { $unwind: "$location" },
//       { $match: matchStage },

//       // 👇 Lookup tournament signups by current user
//       {
//         $lookup: {
//           from: "tournamentsignups",
//           let: { tournamentId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$tournamentId", "$$tournamentId"] },
//                     { $eq: ["$userId", userId] }, // match current user
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "userSignup",
//         },
//       },

//       // 👇 Add isSignedUp field based on whether there's a signup
//       {
//         $addFields: {
//           isSignedUp: { $gt: [{ $size: "$userSignup" }, 0] },
//         },
//       },

//       // 👇 Remove userSignup array if not needed in response
//       {
//         $project: {
//           userSignup: 0,
//         },
//       },

//       { $sort: { [sort]: 1 } },
//       { $skip: (pageNumber - 1) * limitNumber },
//       { $limit: limitNumber },
//     ]);

//     const totalTournaments = tournaments.length;

//     return res.status(200).json({
//       status: true,
//       message: "Tournaments fetched successfully",
//       tournaments,
//       pagination: {
//         total: totalTournaments,
//         page: pageNumber,
//         limit: limitNumber,
//         totalPages: Math.ceil(totalTournaments / limitNumber),
//       },
//     });
//   } catch (error) {
//     console.log("Something went wrong while fetching tournaments", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

const getAllTournamentBasedOnStatus = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      sort = "createdAt",
      game,
      state,
      type,
      search,
    } = req.query;

    const userId = req?.user?.id;

    if (userId) {
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      if (!status) {
        return res
          .status(400)
          .json({ status: false, message: "Status is required" });
      }

      if (
        isNaN(pageNumber) ||
        isNaN(limitNumber) ||
        pageNumber < 1 ||
        limitNumber < 1
      ) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid pagination parameters" });
      }

      const filter = { status };
      // if (game) filter.game = game;
      if (game) {
        filter.game = { $regex: `^${game}$`, $options: "i" };
      }
      if (type) filter.type = type;
      if (search) {
        filter.name = { $regex: search, $options: "i" };
      }

      const matchStage = {
        ...filter,
      };

      if (state !== "Select State") {
        matchStage["location.state"] = state;
      }

      // Convert userId to ObjectId if it's a string
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // First, get the total count without pagination
      const totalCountPipeline = [
        {
          $lookup: {
            from: "venues",
            localField: "tournamentLocation",
            foreignField: "_id",
            as: "location",
          },
        },
        { $unwind: "$location" },
        { $match: matchStage },
        { $count: "total" },
      ];

      const countResult = await Tournament.aggregate(totalCountPipeline);
      const totalTournaments =
        countResult.length > 0 ? countResult[0].total : 0;

      // Now get the paginated results with signup status
      const tournaments = await Tournament.aggregate([
        {
          $lookup: {
            from: "venues",
            localField: "tournamentLocation",
            foreignField: "_id",
            as: "location",
          },
        },
        { $unwind: "$location" },
        { $match: matchStage },

        // Sort before pagination
        { $sort: { [sort]: 1 } },
        { $skip: (pageNumber - 1) * limitNumber },
        { $limit: limitNumber },

        // Lookup tournament signups by current user
        {
          $lookup: {
            from: "tournamentsignups", // Make sure this matches your collection name exactly
            let: { tournamentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$tournamentId", "$$tournamentId"] },
                      { $eq: ["$userId", userObjectId] }, // Use ObjectId for proper matching
                    ],
                  },
                },
              },
            ],
            as: "userSignup",
          },
        },

        // Add isSignedUp field based on whether there's a signup
        {
          $addFields: {
            isSignedUp: { $gt: [{ $size: "$userSignup" }, 0] },
          },
        },

        // Remove userSignup array as it's not needed in response
        {
          $project: {
            userSignup: 0,
          },
        },
      ]);

      return res.status(200).json({
        status: true,
        message: "Tournaments fetched successfully",
        tournaments,
        pagination: {
          total: totalTournaments,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(totalTournaments / limitNumber),
        },
      });
    } else {
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      if (!status) {
        return res
          .status(400)
          .json({ status: false, message: "Status is required" });
      }

      if (
        isNaN(pageNumber) ||
        isNaN(limitNumber) ||
        pageNumber < 1 ||
        limitNumber < 1
      ) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid pagination parameters" });
      }

      const filter = { status };
      if (game) filter.game = game;
      if (game) {
        filter.game = { $regex: `^${game}$`, $options: "i" };
      }
      // if (state) filter.state = state;
      if (type) filter.type = type;

      // ✅ Handle search
      if (search) {
        filter.name = { $regex: search, $options: "i" }; // Case-insensitive search on name
      }

      // const tournaments = await Tournament.find(filter)
      //   .sort({ [sort]: 1 })
      //   .skip((pageNumber - 1) * limitNumber)
      //   .limit(limitNumber);

      // console.log(state);

      // console.log(await Tournament.find({}));

      // const tournaments = await Tournament.find(filter)
      //   .populate({
      //     path: "tournamentLocation",
      //     ...(state ? { match: { state:"Alabama"} } : {}), // Apply match only if state exists
      //   })
      //   .sort({ [sort]: 1 })
      //   .skip((pageNumber - 1) * limitNumber)
      //   .limit(limitNumber);

      let tournaments;

      if (state == "Select State") {
        tournaments = await Tournament.aggregate([
          // Join with Venue collection
          {
            $lookup: {
              from: "venues", // Collection name, not model name
              localField: "tournamentLocation",
              foreignField: "_id",
              as: "location",
            },
          },
          // Unwind the location array to make it a single object
          { $unwind: "$location" },

          // Filter by Venue state
          {
            $match: {
              // "location.state": state, // e.g., "Alabama"
              ...filter, // any additional Tournament-level filters
            },
          },

          // Sort
          {
            $sort: { [sort]: 1 },
          },

          // Pagination
          {
            $skip: (pageNumber - 1) * limitNumber,
          },
          {
            $limit: limitNumber,
          },
        ]);
      } else {
        tournaments = await Tournament.aggregate([
          // Join with Venue collection
          {
            $lookup: {
              from: "venues", // Collection name, not model name
              localField: "tournamentLocation",
              foreignField: "_id",
              as: "location",
            },
          },
          // Unwind the location array to make it a single object
          { $unwind: "$location" },

          // Filter by Venue state
          {
            $match: {
              "location.state": state, // e.g., "Alabama"
              ...filter, // any additional Tournament-level filters
            },
          },

          // Sort
          {
            $sort: { [sort]: 1 },
          },

          // Pagination
          {
            $skip: (pageNumber - 1) * limitNumber,
          },
          {
            $limit: limitNumber,
          },
        ]);
      }

      console.log(tournaments);

      const totalTournaments = tournaments.length;

      return res.status(200).json({
        status: true,
        message: "Tournaments fetched successfully",
        tournaments,
        pagination: {
          total: totalTournaments,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(totalTournaments / limitNumber),
        },
      });
    }
  } catch (error) {
    console.log("Something went wrong while fetching tournaments", error);

    if (res.headersSent) return;

    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

const startTournament = async (req, res) => {
  try {
    if (!req.params.tournamentId) {
      return res.status(400).json({
        status: false,
        message: "TournamentId is required",
      });
    }

    // check if tournaments already started
    const tournament = await Tournament.findById(req.params.tournamentId);

    if (!tournament) {
      return res.status(400).json({
        status: false,
        message: "Tournament not found",
      });
    }

    if (tournament.status === "ongoing") {
      return res.status(400).json({
        status: false,
        message: "Tournament already started",
      });
    }

    // console.log(String(tournament.managerId) != String(req.user?.id));

    // if (String(tournament.managerId) != String(req.user?.id)) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "you are not authorized",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournament?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    await createWinnersBracket(tournament._id);
    await createLoosersBracket(tournament._id);
    await createFinalBracket(tournament._id);

    tournament.status = "ongoing";

    await tournament.save();

    return res
      .status(200)
      .json({ message: "Tournament started successfully!" });
  } catch (err) {
    logger.error(err);
    console.log("Something went wrong while registered user", err);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: err.message,
    });
  }
};

const resetTournamentController = async (req, res) => {
  try {
    if (!req.params.tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is missing",
      });
    }

    const tournament = await Tournament.findById(req.params?.tournamentId);

    if (!tournament) {
      return res.status(404).json({
        status: false,
        message: "Tournament not found",
      });
    }

    // console.log(tournament?.managerId, req?.user?.id);

    // console.log(String(tournament?.managerId) != String(req?.user?.id))

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournament?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    // if (String(tournament.managerId) != String(req.user?.id)) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "you are not authorized",
    //   });
    // }

    await resetTournament(req.params.tournamentId);

    return res.status(200).json({
      status: true,
      message: "Tournament data reset successfully",
    });
  } catch (error) {
    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const deleteTournamentController = async (req, res) => {
  try {
    if (!req.params.tournamentId) {
      return res.status().json({
        status: true,
        message: "Tournament Id not found",
      });
    }

    const tournament = await Tournament.findById(req.params.tournamentId);

    if (!tournament) {
      return res.status(200).json({
        status: 400,
        message: "Tournament not found",
      });
    }

    //check if the manager has created this tournament

    // if (String(req?.user?.id) != String(tournament.managerId)) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "Not authorized",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournament?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    // delete player records
    await PlayerRecord.deleteMany({ tournament: tournament._id });

    // delete table records
    await TableRecord.deleteMany({ tournament: tournament._id });

    // delete bookings
    await Booking.deleteMany({ tournamentId: tournament._id });

    await Tournament.findByIdAndDelete(tournament?._id);

    if (tournament.flyerImage) {
      console.log(tournament.flyerImage);

      const filename = path.basename(tournament.flyerImage);

      const filePath = path.join(__dirname, "..", "uploads", filename);
      console.log(filePath);

      // Check if file exists
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          return;
        }

        // Delete file
        fs.unlink(filePath, (err) => {
          if (err) {
            return;
          }

          return;
        });
      });
    }

    await matchModel.deleteMany({ tournamentId: tournament._id });

    return res.status(200).json({
      status: true,
      message: "Tournament Successfully",
    });
  } catch (error) {
    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const getBracketController = async (req, res) => {
  try {
    const { tounamentId } = req.params;

    if (!tounamentId) {
      return res.status(200).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tounamentId);
    const response = await getTournamentBrackets(tounamentId);

    // console.log(response?.winners.get('round1')?.[3]?.player1?.userId);
    return res.status(200).json({
      status: true,
      response: response,
      managerId: tournamentInDB.managerId,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const getAllParticipatedTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const tournaments = await TournamentSignup.find({ userId }).populate(
      "tournamentId"
    );

    return res.status(200).json({
      status: true,
      message: "Participated tournaments fetched successfully",
      tournaments,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

const getAllCreatedTournaments = async (req, res) => {
  try {
    //check if manager

    const userId = req.user.id;

    if (!userId) {
      return res.status(200).json({
        status: 400,
        message: "Invalid user Id",
      });
    }

    // const tournaments = await Tournament.find({ managerId: userId });

    const tournaments = await Tournament.find({ managerId: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: true,
      message: "Created tournaments fetched successfully",
      tournaments,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

// const getAllTournamentBasedOnStatus = async (req, res) => {
//   try {
//     const { status, page = 1, limit = 10 } = req.query;
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

//     if (!status) {
//       return res.status(400).json({
//         status: false,
//         message: "Status is required",
//       });
//     }

//     if (
//       isNaN(pageNumber) ||
//       isNaN(limitNumber) ||
//       pageNumber < 1 ||
//       limitNumber < 1
//     ) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid pagination parameters",
//       });
//     }

//     // Get tournaments based on status with pagination
//     const tournamentsWithStatus = await Tournament.find({ status })
//       .skip((pageNumber - 1) * limitNumber)
//       .limit(limitNumber);

//     const totalTournaments = await Tournament.countDocuments({ status });

//     return res.status(200).json({
//       status: true,
//       message: "Tournaments fetched successfully",
//       tournaments: tournamentsWithStatus,
//       pagination: {
//         total: totalTournaments,
//         page: pageNumber,
//         limit: limitNumber,
//         totalPages: Math.ceil(totalTournaments / limitNumber),
//       },
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     console.log("Something went wrong while fetching tournaments", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

//api to get tournament details

// const getAllTournamentBasedOnStatus = async (req, res) => {
//   try {
//     const {
//       status,
//       page = 1,
//       limit = 10,
//       sort = 'createdAt',
//       game,
//       state,
//       type,
//     } = req.query;

//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

//     if (!status) {
//       return res.status(400).json({ status: false, message: "Status is required" });
//     }

//     if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
//       return res.status(400).json({ status: false, message: "Invalid pagination parameters" });
//     }

//     const filter = { status };
//     if (game) filter.game = game;
//     if (state) filter.state = state;
//     if (type) filter.type = type;

//     const tournaments = await Tournament.find(filter)
//       .sort({ [sort]: 1 })
//       .skip((pageNumber - 1) * limitNumber)
//       .limit(limitNumber);

//     const totalTournaments = await Tournament.countDocuments(filter);

//     return res.status(200).json({
//       status: true,
//       message: "Tournaments fetched successfully",
//       tournaments,
//       pagination: {
//         total: totalTournaments,
//         page: pageNumber,
//         limit: limitNumber,
//         totalPages: Math.ceil(totalTournaments / limitNumber),
//       },
//     });
//   } catch (error) {
//     console.log("Something went wrong while fetching tournaments", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

const getAllTournamentBasedOnStatusForGuest = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      sort = "createdAt",
      game,
      state,
      type,
      search, // ✅ Accept search from query
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (!status) {
      return res
        .status(400)
        .json({ status: false, message: "Status is required" });
    }

    if (
      isNaN(pageNumber) ||
      isNaN(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1
    ) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid pagination parameters" });
    }

    const filter = { status };
    if (game) filter.game = game;
    // if (state) filter.state = state;
    if (type) filter.type = type;

    // ✅ Handle search
    if (search) {
      filter.name = { $regex: search, $options: "i" }; // Case-insensitive search on name
    }

    // const tournaments = await Tournament.find(filter)
    //   .sort({ [sort]: 1 })
    //   .skip((pageNumber - 1) * limitNumber)
    //   .limit(limitNumber);

    // console.log(state);

    // console.log(await Tournament.find({}));

    // const tournaments = await Tournament.find(filter)
    //   .populate({
    //     path: "tournamentLocation",
    //     ...(state ? { match: { state:"Alabama"} } : {}), // Apply match only if state exists
    //   })
    //   .sort({ [sort]: 1 })
    //   .skip((pageNumber - 1) * limitNumber)
    //   .limit(limitNumber);

    let tournaments;

    if (state == "Select State") {
      tournaments = await Tournament.aggregate([
        // Join with Venue collection
        {
          $lookup: {
            from: "venues", // Collection name, not model name
            localField: "tournamentLocation",
            foreignField: "_id",
            as: "location",
          },
        },
        // Unwind the location array to make it a single object
        { $unwind: "$location" },

        // Filter by Venue state
        {
          $match: {
            // "location.state": state, // e.g., "Alabama"
            ...filter, // any additional Tournament-level filters
          },
        },

        // Sort
        {
          $sort: { [sort]: 1 },
        },

        // Pagination
        {
          $skip: (pageNumber - 1) * limitNumber,
        },
        {
          $limit: limitNumber,
        },
      ]);
    } else {
      tournaments = await Tournament.aggregate([
        // Join with Venue collection
        {
          $lookup: {
            from: "venues", // Collection name, not model name
            localField: "tournamentLocation",
            foreignField: "_id",
            as: "location",
          },
        },
        // Unwind the location array to make it a single object
        { $unwind: "$location" },

        // Filter by Venue state
        {
          $match: {
            "location.state": state, // e.g., "Alabama"
            ...filter, // any additional Tournament-level filters
          },
        },

        // Sort
        {
          $sort: { [sort]: 1 },
        },

        // Pagination
        {
          $skip: (pageNumber - 1) * limitNumber,
        },
        {
          $limit: limitNumber,
        },
      ]);
    }

    console.log(tournaments);

    const totalTournaments = tournaments.length;

    return res.status(200).json({
      status: true,
      message: "Tournaments fetched successfully",
      tournaments,
      pagination: {
        total: totalTournaments,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalTournaments / limitNumber),
      },
    });
  } catch (error) {
    console.log("Something went wrong while fetching tournaments", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

const matchResultController = async (req, res) => {
  try {
    let body = req.body;
    body = matchResultSchema.parse(body);

    const { tournamentId, matchId } = req.params;

    if (!tournamentId || !matchId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id and Match Id is required",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(200).json({
        status: false,
        message: "Tournament not found",
      });
    }

    const match = await Match.findById(matchId);

    if (!match || String(match.tournamentId) !== String(tournament._id)) {
      return res.status(200).json({
        status: false,
        message: "Match not found",
      });
    }

    // if (tournament.managerId != req.user?.id) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "Unauthorized",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournament?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    if (match.status == "Completed") {
      await Match.findByIdAndUpdate(matchId, {
        score: body?.playerScores,
        status: "Completed",
        table: null,
        endTime: Date.now(),
      });

      return res.status(200).json({
        status: true,
        message: "score updated successfully",
      });
    }

    //if has no occupied table then do not proceeed only for testing

    if (!match.table) {
      return res.status(400).json({
        status: false,
        message: "No table assigned to the match",
      });
    }

    //update the match result in the db

    if (match.player1 == null || match.player2 == null) {
      return res.status(400).json({
        status: false,
        message: "Match not started yet",
      });
    }

    if (
      String(body?.winnerId) != String(match.player1) &&
      String(body?.winnerId) != String(match.player2)
    ) {
      return res.status(400).json({
        status: false,
        message: "Winner must be a tournament participant",
      });
    }

    if (
      String(body?.loosersId) != String(match.player1) &&
      String(body?.loosersId) != String(match.player2)
    ) {
      return res.status(400).json({
        status: false,
        message: "Looser must be a tournament participant",
      });
    }

    // discuss this

    await Match.findByIdAndUpdate(matchId, {
      winner: body?.winnerId,
      loser: body?.loosersId,
      score: body?.playerScores,
      status: "Completed",
      table: null,
      endTime: Date.now(),
    });

    tournament.totalCompleteMatches += 1;

    await tournament.save();

    await refreshTournamentBracket(match.tournamentId);

    res.status(200).json({ message: "Match result processed successfully." });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const getAllnonByeIncompleteMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    // const matches = await Match.find({
    //   tournamentId: tournamentId,
    //   player1: {
    //     $ne: null,
    //   },
    //   player2: {
    //     $ne: null,
    //   },
    //   status: {
    //     $ne: "Completed",
    //   },
    //   isBye: false,
    // }).populate([
    //   {
    //     path: "player1",
    //     populate: {
    //       path: "userId",
    //       select: "_id firstName lastName",
    //     },
    //   },
    //   {
    //     path: "player2",
    //     populate: {
    //       path: "userId",
    //       select: "_id firstName lastName",
    //     },
    //   },
    //   {
    //     path: "table",
    //   },
    // ]);

    const matches = await getAllNonByeIncompleteMatchesService(tournamentId);

    return res.status(200).json({
      status: true,
      message: "Matches fetched successfully",
      matches,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const shuffleIncompleteMatches = async (req, res) => {
  try {
    //work in progress

    const { tournamentId } = req.body;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return tes.status(400).json({
        status: false,
        message: "Tournament not found",
      });
    }

    if (String(req?.user?.id) != String(tournament.managerId)) {
      return res.status(401).json({
        status: false,
        message: "Not authorized",
      });
    }

    await shufflePlayersAcrossMatches(tournament._id);

    return res.status(200).json({
      status: false,
      message: "Matches shuffeled successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const assignTablesToMatch = async (req, res) => {
  try {
    const { tournamentId, matchId, tableId } = req.params;

    if (!tournamentId || !matchId || !tableId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id and Match Id and tableId is required",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(400).json({
        status: false,
        message: "Tournament not found",
      });
    }

    if (tournament.status != "ongoing") {
      return res.status(400).json({
        status: false,
        message: "Tournament not started yet",
      });
    }

    const match = await Match.findById(matchId);

    if (!match || String(match.tournamentId) != String(tournament._id)) {
      return res.status(404).json({
        status: false,
        message: "Match not found",
      });
    }

    if (match?.status == "Completed") {
      return res.status(400).json({
        status: false,
        message: "Match already completed",
      });
    }

    // if (String(req?.user?.id) != String(tournament.managerId)) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "Not authorized",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournament?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    // we will also get the tableId from req obj

    //check if belongs to the correct venue

    const table = await Table.findById(tableId);

    if (
      !table ||
      String(table.venueId) != String(tournament.tournamentLocation)
    ) {
      return res.status(400).json({
        status: false,
        message: "Table not found",
      });
    }

    // check if it is available

    const matchAssignedTable = await Match.findOne({ table: table._id });

    if (matchAssignedTable) {
      return res.status(400).json({
        status: false,
        message: "Table already assigned to another match",
      });
    }

    if (match.player1 == null || match.player2 == null) {
      return res.status(400).json({
        status: false,
        message: "Table cannot be assigned",
      });
    }

    match.table = tableId;
    match.status = "Ongoing";
    match.startTimme = Date.now();

    await match.save();

    return res.status(200).json({
      status: true,
      message: "Match assigned successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const assignOpenTablesToMatch = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(200).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "Tournament Id not found",
      });
    }

    const tableList = await getAvailableTableListForTournament(tournamentInDB);

    const matches = await getAllNonByeIncompleteMatchesService(
      tournamentInDB._id
    );

    let j = 0;
    for (let i = 0; i < matches.length; i++) {
      if (matches[i]?.table) {
        continue;
      } else {
        if (j >= tableList.length) {
          break;
        }
        matches[i].table = tableList[j++];
        matches[i].startTimme = Date.now();

        await matches[i].save();
      }
    }

    return res.status(200).json({
      status: true,
      message: "All open tables assigned successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const cancelTableAssignedToAMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    console.log(matchId);

    if (!matchId) {
      return res.status(400).json({
        status: false,
        message: "Match Id is required",
      });
    }

    const matchInDb = await Match.findById(matchId).populate([
      {
        path: "tournamentId",
      },
    ]);

    if (!matchInDb) {
      return res.status(404).json({
        status: false,
        message: "Match not found",
      });
    }

    // if (String(req.user.id) != String(matchInDb?.tournamentId?.managerId)) {
    //   return res.status(403).json({
    //     status: false,
    //     message: "Unauthorized",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(matchInDb?.tournamentId?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    if (matchInDb.status == "Completed") {
      return res.status(400).json({
        status: false,
        message: "Match is already completed",
      });
    }

    matchInDb.table = null;
    matchInDb.startTimme = null;

    await matchInDb.save();

    return res.status(200).json({
      status: true,
      message: "Table removed from match",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const separatetoutnament = async (req, res) => {
  try {
    // 1. Validate request parameters
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // 2. Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID format",
      });
    }

    // 3. Query the database
    const tournaments = await Tournament.find({
      managerId: new mongoose.Types.ObjectId(userId),
    }).populate("tournamentLocation", "name address"); // Example population

    // 4. Handle empty results
    if (!tournaments || tournaments.length === 0) {
      return res.status(404).json({
        success: true,
        message: "No tournaments found for this manager",
        data: [],
      });
    }

    // 5. Successful response
    res.status(200).json({
      success: true,
      count: tournaments.length,
      data: tournaments,
    });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getTournamentInfo = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { userId } = req.query;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "tournament Id is required",
      });
    }

    console.log(userId);

    const tournamentInDb = await Tournament.findById(tournamentId)
      .populate("tournamentLocation")
      .exec();

    if (!tournamentInDb) {
      return res.status(404).json({
        status: false,
        message: "tournament not found",
      });
    }

    let isSignedUp = false;
    if (userId) {
      const tournamentSignupForUserId = await TournamentSignup.findOne({
        tournamentId: tournamentInDb._id,
        userId: userId,
      });

      if (tournamentSignupForUserId) {
        isSignedUp = true;
      }
    }

    // add manager validation if needed

    tournamentInDb._doc.isSignedUp = isSignedUp;
    return res.status(200).json({
      status: true,
      message: "Tournament info fetched",
      tournament: tournamentInDb,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const getTournamentInfoWithoutPopulate = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "tournament Id is required",
      });
    }

    const tournamentInDb = await Tournament.findById(tournamentId);

    if (!tournamentInDb) {
      return res.status(404).json({
        status: false,
        message: "tournament not found",
      });
    }

    // add manager validation if needed

    return res.status(200).json({
      status: true,
      message: "Tournament info fetched",
      tournament: tournamentInDb,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const matchSummaryController = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid tournament ID" });
    }

    const matches = await Match.find({
      tournamentId: tournamentId,
      isBye: false,
      status: { $in: ["Completed", "Upcomming", "Cancelled", "Ongoing"] }, // Match enum values exactly
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
        path: "winner",
        populate: {
          path: "userId",
          select: "_id firstName lastName",
        },
      },
      {
        path: "loser",
        populate: {
          path: "userId",
          select: "_id firstName lastName",
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Match summary retrieved successfully",
      matches,
    });
  } catch (error) {
    console.error("Error fetching match summary:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
};

const editTournamentSignupPlayerDetails = async (req, res) => {
  try {
    const { tournamentSignupId } = req.params;

    let message = "player edited successfully";
    if (!tournamentSignupId) {
      return res.status(400).json({
        status: false,
        message: "tournamentSignUpId is required",
      });
    }

    const { name, phone, status, paid, rating } =
      tournamentEditSignupSchema.parse(req.body);

    const tournamentSignupInDB = await tournamentSignupModel
      .findById(tournamentSignupId)
      .populate([
        {
          path: "userId",
          select: "_id firstName lastName",
        },
        {
          path: "tournamentId",
        },
      ]);

    if (!tournamentSignupInDB) {
      return res.status(404).json({
        status: false,
        message: "player does not exists",
      });
    }

    // if (
    //   String(req.user.id) !=
    //   String(tournamentSignupInDB.tournamentId?.managerId)
    // ) {
    //   return res.status(403).json({
    //     status: false,
    //     message: "you are not authorized to perform this action",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (
      String(tournamentSignupInDB?.tournamentId?.managerId) !=
      String(req.user?.id)
    ) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    tournamentSignupInDB.name = name;
    if (phone) {
      tournamentSignupInDB.phone = phone;
    }
    tournamentSignupInDB.paid = paid;
    tournamentSignupInDB.rating = rating;

    if (status == "Waiting") {
    } else {
      if (tournamentSignupInDB.status == "Waiting") {
        const tournamentTentaiveSignup = await TournamentSignup.findOne({
          tournamentId: tournamentSignupInDB.tournamentId,
          status: "Tentative",
        });

        if (tournamentTentaiveSignup) {
          if (status == "Confirmed") {
            console.log("tentative", tournamentTentaiveSignup);
            tournamentTentaiveSignup.status = "Waiting";
            tournamentSignupInDB.status = status;
            await tournamentTentaiveSignup.save();
          }
        }
      } else {
        tournamentSignupInDB.status = status;
      }
    }

    // const tournamentConfirmSignups = await TournamentSignup.find({
    //   tournamentId: tournamentSignupInDB.tournamentId,
    //   status: "Confirmed",
    // });

    // const tournamentTentaiveSignup = await TournamentSignup.findOne({
    //   tournamentId: tournamentSignupInDB.tournamentId,
    //   status: "Tentative",
    // });

    // if (
    //   tournamentConfirmSignups.length >=
    //   tournamentSignupInDB?.tournamentId?.maxPlayer
    // ) {
    //   status = "waiting";
    //   message = "Status cannot be updated";
    // } else {
    //   if (status == "Confirmed") {

    //     if(tournamentTentaiveSignup){
    //         tournamentTentaiveSignup.status = "Waiting";
    //         tournamentSignupInDB.status = status;
    //         await tournamentTentaiveSignup.save();
    //     }

    //   }
    // }

    // console.log(tournamentSignupInDB);
    await tournamentSignupInDB.save();

    return res.status(200).json({
      status: true,
      message,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

// const tournamentParticipantController = async (req, res) => {
//   const { tournamentId } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
//     return res
//       .status(400)
//       .json({ status: false, message: "Invalid tournament ID" });
//   }

//   try {
//     const TournamentInDb = await Tournament.findById(tournamentId);

//     if (!TournamentInDb) {
//       return res.status(404).json({
//         status: false,
//         message: "Tournament does not exists",
//       });
//     }

//     const participants = await TournamentSignup.find({
//       tournamentId,
//       status: {
//         $ne: "Waiting",
//       },
//     }).populate([
//       {
//         path: "userId",
//         select: "_id firstName lastName",
//       },
//     ]);

//     return res.status(200).json({ status: true, data: participants });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: false, message: "Server error" });
//   }
// };

// const tournamentParticipantStatusBulkUpdate = async (req, res) => {
//   try {
//     const { participantIds, tournamentId } = req.params;

//     if (!participantIds || !tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Participant Ids and tournament Id are required",
//       });
//     }

//     const body = tournamentParticipantStatusBulkUpdateSchema.parse(req.body);

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(404).json({
//         status: false,
//         message: "tournament does not exists",
//       });
//     }

//     // if (String(req.user.id) != String(tournamentInDB.managerId)) {
//     //   return res.status(403).json({
//     //     status: false,
//     //     message: "You are unauthorized to perform this action",
//     //   });
//     // }

//     const userRole = await roleModel.findById(req.user.roleId);

//     if (String(tournamentInDB?.managerId) != String(req.user?.id)) {
//       if (userRole.name != "Admin") {
//         return res.status(401).json({
//           status: false,
//           message: "Unauthorized",
//         });
//       }
//     }

//     //   here we need to add validations

//     await TournamentSignup.updateMany(
//       {
//         _id: { $in: participantIds.split(",") },
//         tournamentId: tournamentId,
//       },
//       {
//         $set: { status: body.status },
//       }
//     );

//     return res.status(200).json({
//       status: true,
//       message: "Status updated successfully",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);

//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     console.log("Something went wrong while registered user", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

const tournamentParticipantController = async (req, res) => {
  const { tournamentId } = req.params;
  const { query } = req.query;

  if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
    return res
      .status(400)
      .json({ status: false, message: "Invalid tournament ID" });
  }

  try {
    const TournamentInDb = await Tournament.findById(tournamentId);

    if (!TournamentInDb) {
      return res.status(404).json({
        status: false,
        message: "Tournament does not exists",
      });
    }

    // const participants = await TournamentSignup.find({
    //   tournamentId,
    //   status: {
    //     $ne: "Waiting",
    //   },
    // })
    //   .sort({ createdAt: -1 }) // Sort by createdAt in descending order (newest first)
    //   .populate([
    //     {
    //       path: "userId",
    //       select: "_id firstName lastName",
    //     },
    //   ]);

    let participants = await TournamentSignup.find({
      tournamentId,
      status: {
        $ne: "Waiting",
      },
    })
      .sort({ createdAt: -1 }) // Newest first
      // .limit(5) // Limit to 5 results
      .populate([
        {
          path: "userId",
          select: "_id firstName lastName",
        },
      ]);

    if (query == "shuffle") {
      for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
      }
    }

    return res.status(200).json({ status: true, data: participants });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

const tournamentParticipantStatusBulkUpdate = async (req, res) => {
  try {
    console.log("Endeterd ");
    const { participantIds, tournamentId } = req.params;

    if (!participantIds) {
      return res.status(400).json({
        status: false,
        message: "tournamentSignupIds is required",
      });
    }

    const body = tournamentParticipantStatusBulkUpdateSchema.parse(req.body);

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "tournament does not exists",
      });
    }

    if (tournamentInDB.status == "ongoing") {
      return res.status(400).json({
        status: false,
        message: "Cannot update status of ongoing` tournament",
      });
    }

    // if (String(req.user.id) != String(tournamentInDB.managerId)) {
    //   return res.status(403).json({
    //     status: false,
    //     message: "You are unauthorized to perform this action",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournamentInDB?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    // Convert comma-separated string to array if needed
    const idsArray = Array.isArray(participantIds)
      ? participantIds
      : participantIds
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id);

    if (idsArray.length === 0) {
      return res.status(400).json({
        status: false,
        message: "At least one valid tournamentSignupId is required",
      });
    }

    const { status } = body;

    const results = [];
    const errors = [];

    // Process each tournament signup ID
    for (const tournamentSignupId of idsArray) {
      try {
        const tournamentSignupInDB = await tournamentSignupModel
          .findById(tournamentSignupId)
          .populate([
            {
              path: "userId",
              select: "_id firstName lastName",
            },
            {
              path: "tournamentId",
            },
          ]);

        if (!tournamentSignupInDB) {
          errors.push({
            tournamentSignupId,
            message: "Player does not exist",
          });
          continue;
        }

        // // Authorization check
        // if (
        //   String(tournamentSignupInDB?.tournamentId?.managerId) !=
        //   String(req.user?.id)
        // ) {
        //   if (userRole.name != "Admin") {
        //     errors.push({
        //       tournamentSignupId,
        //       message: "Unauthorized to update this player",
        //     });
        //     continue;
        //   }
        // }

        // Update basic fields
        // tournamentSignupInDB.name = name;
        // if (phone) {
        //   tournamentSignupInDB.phone = phone;
        // }
        // tournamentSignupInDB.paid = paid;

        // Handle status update logic
        if (tournamentSignupInDB.status == "Waiting") {
          const tournamentTentativeSignup = await TournamentSignup.findOne({
            tournamentId: tournamentSignupInDB.tournamentId,
            status: "Tentative",
          });

          if (tournamentTentativeSignup) {
            if (status == "Confirmed") {
              console.log("tentative", tournamentTentativeSignup);
              tournamentTentativeSignup.status = "Waiting";
              tournamentSignupInDB.status = status;
              await tournamentTentativeSignup.save();
            }
          }
        } else {
          tournamentSignupInDB.status = status;
        }

        await tournamentSignupInDB.save();

        results.push({
          tournamentSignupId,
          message: "Player updated successfully",
          status: true,
        });
      } catch (individualError) {
        console.log(`Error updating ${tournamentSignupId}:`, individualError);
        errors.push({
          tournamentSignupId,
          message: "Failed to update player",
          error: individualError.message,
        });
      }
    }

    // Prepare response
    const response = {
      status: true,
      message: `Bulk update completed. ${results.length} successful, ${errors.length} failed.`,
      results: {
        successful: results,
        failed: errors,
      },
      summary: {
        total: idsArray.length,
        successful: results.length,
        failed: errors.length,
      },
    };

    // If all failed, return error status
    if (results.length === 0 && errors.length > 0) {
      response.status = false;
      response.message = "All updates failed";
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong during bulk update", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const tournamentParticipantPaidStatusBulkUpdate = async (req, res) => {
  try {
    const { participantIds, tournamentId } = req.params;

    if (!participantIds || !tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Participant Ids and tournament Id are required",
      });
    }

    const body = tournamentParticipantPaidStatusBulkUpdateSchema.parse(
      req.body
    );

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "tournament does not exists",
      });
    }

    if (tournamentInDB.status == "ongoing") {
      return res.status(400).json({
        status: false,
        message: "Cannot update status of ongoing tournament",
      });
    }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournamentInDB?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    const tournamentSignups = await TournamentSignup.find({
      tournamentId,
      status: "Confirmed",
    });

    if (tournamentSignups >= tournamentInDB.maxPlayer) {
      return res.status(400).json({
        status: "Already has the maximum confirm players",
      });
    }

    // get all signups (confirmed)

    // get all signups (tentative)

    // now iterate through the names array and insert

    // check if cofirmed + tentative < maxplayer
    // directly add them

    // is confirmed + tentative == maxplayer

    //  if tentative then do nothing

    // if confirmed then do one thing
    // take one tentatve ->waiting
    // current one -> confirmed

    await TournamentSignup.updateMany(
      {
        _id: {
          $in: participantIds.split(","),
        },
        status: {
          $ne: "Waiting",
        },
        tournamentId: tournamentId,
      },
      {
        $set: {
          paid: body.paid,
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "Paid Status updated successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const downloadExcelReportOfMatchSummary = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: " Tournament does not exists",
      });
    }

    // if (String(req.user.id) != String(tournamentInDB.managerId)) {
    //   return res.status(403).json({
    //     status: false,
    //     message: "You are unauhtorized to perform this action",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournamentInDB?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Participants");

    // Sample headers
    worksheet.columns = [
      { header: "Round", key: "Round", width: 25 },
      { header: "Player 1", key: "Player1", width: 30 },
      { header: "Score 1", key: "Score1", width: 15 },
      { header: "Player 2", key: "Player2", width: 30 },
      { header: "Score 2", key: "Score2", width: 15 },
      { header: "Winner", key: "Winner", width: 15 },
      { header: "Match Length", key: "Duration", width: 25 },
    ];

    const matches = await Match.find({
      status: "Completed",
      isBye: false,
    }).populate([{ path: "player1" }, { path: "player2" }, { path: "winner" }]);

    const data = matches.map((match, index) => {
      return {
        Round: `${match.side} ${match.round}`,
        Player1: `${match.player1.name}`,
        Score1: `${match.score?.player1Score}`,
        Player2: `${match.player2.name}`,
        Score2: `${match.score.player2Score}`,
        Winner: `${match.winner?.name}`,
        Duration: `${`${Math.abs(
          Number(
            (new Date(match.startTimme) - new Date(match.endTime)) / 60000 / 60
          )
        ).toFixed(0)} hours ${Math.abs(
          Number(
            ((new Date(match.endTime) - new Date(match.startTimme)) / 60000) %
              60
          )
        ).toFixed(0)} mins`}`,
      };
    });
    worksheet.addRows(data);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=participants.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

    // return res.status(200).json(
    //   {
    //     status: true
    //   }
    // );

    return;
  } catch (error) {
    console.error("Excel generation failed:", error);
    res.status(500).send("Could not generate Excel file.");
  }
};

const TournamentSignupUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tournamentId } = req.params;

    if (!userId || !tournamentId) {
      return res.status(400).json({
        status: false,
        message: "user Id and tournament Id are required",
      });
    }

    const userInDb = await User.findById(userId).populate("role");

    if (!userInDb) {
      return res.status(404).json({
        status: false,
        message: "user does not exists",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "Tournament does not exists",
      });
    }

    const userSignUpInDB = await TournamentSignup.findOne({
      tournamentId: tournamentInDB._id,
      userId: userInDb._id,
    });

    if (userSignUpInDB) {
      return res.status(400).json({
        status: false,
        message: "You have already signed up for this tournament",
      });
    }

    if (userInDb?.role?.name != "Player") {
      return res.status(400).json({
        status: false,
        message: "Not allowed to signup for tournament",
      });
    }

    if (tournamentInDB.status !== "upcomming") {
      return res.status(400).json({
        status: false,
        message: "Tournament has already started",
      });
    }

    const noOfTournamentParticipants = await TournamentSignup.find({
      tournamentId: tournamentInDB._id,
    });

    if (noOfTournamentParticipants.length >= tournamentInDB.maxPlayer) {
      await TournamentSignup.create({
        name:
          userInDb.firstName + userInDb.lastName ? ` ${userInDb.lastName}` : "",
        tournamentId: tournamentInDB._id,
        userId: req.user.id,
        paid: false,
        status: "Waiting",
        signupType: "registered",
        rating: 0, // we will get it from forgorate
      });

      return res.status(200).json({
        status: 200,
        message: "Tournament Signup successfully",
      });
    }

    await TournamentSignup.create({
      name:
        userInDb.firstName + userInDb.lastName ? ` ${userInDb.lastName}` : "",
      tournamentId: tournamentInDB._id,
      userId: req.user.id,
      paid: false,
      status: "Tentative",
      signupType: "registered",
      rating: 0, // we will get it from forgorate
    });

    return res.status(200).json({
      status: 200,
      message: "Tournament Signup successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const addPlayerToTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tournamentId } = req.params;

    console.log("request", req.body);

    const body = addPlayerToTournamentSchema.parse(req.body);

    if (!userId || !tournamentId) {
      return res.status(400).json({
        status: false,
        message: "user Id and tournament Id is required",
      });
    }

    if (body.forgorateReadableId) {
      const alreadySignedUp = await TournamentSignup.findOne({
        forgorateReadableId: body.forgorateReadableId,
        tournamentId: tournamentId,
      });

      console.log("I am here");

      if (alreadySignedUp) {
        return res.status(400).json({
          status: false,
          message: "The fargorate player has already signed up",
        });
      }
    }

    const userInDB = await User.findById(userId);
    const tournamentInDB = await Tournament.findById(tournamentId);

    console.log("this is body", body);

    if (!userInDB) {
      return res.status(404).json({
        status: false,
        message: "User does not exists",
      });
    }

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "Tournament does not exists",
      });
    }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournamentInDB?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    const tournamentParticipantsConfirmed = await TournamentSignup.find({
      tournamentId: tournamentId,
      status: "Confirmed",
    });

    const tournamentParticipantsTentative = await TournamentSignup.find({
      tournamentId: tournamentId,
      status: "Tentative",
    });

    if (tournamentParticipantsConfirmed.length >= tournamentInDB.maxPlayer) {
      const result = await TournamentSignup.create({
        name: body.forgorateData
          ? `${body.forgorateData?.firstName} ${body.forgorateData?.lastName}`
          : body.name,
        paid: body.paid || false,
        phone: body.phone || null,
        status: "Waiting",
        signupType: "external",
        forgorateReadableId: body.forgorateReadableId,
        forgorateData: body.forgorateData,
        rating: body.rating || 0,
        tournamentId: tournamentId,
      });

      return res.status(200).json({
        status: false,
        message: "Player added successfully",
        player: result,
      });
    } else if (
      tournamentParticipantsConfirmed.length +
        tournamentParticipantsTentative.length <
      tournamentInDB.maxPlayer
    ) {
      const result = await TournamentSignup.create({
        name: body.forgorateData
          ? `${body.forgorateData?.firstName} ${body.forgorateData?.lastName}`
          : body.name,
        paid: body.paid || false,
        phone: body.phone || null,
        status: body.status || "Tentative",
        signupType: "external",
        forgorateReadableId: body.forgorateReadableId,
        forgorateData: body.forgorateData,
        rating: body.rating || 0,
        tournamentId: tournamentId,
      });

      return res.status(200).json({
        status: true,
        message: "Player added successfully",
        player: result,
      });
    } else if (
      tournamentParticipantsConfirmed.length +
        tournamentParticipantsTentative.length >=
      tournamentInDB.maxPlayer
    ) {
      if (body.status == "Tentative") {
        //add to waiting list

        const result = await TournamentSignup.create({
          name: body.forgorateData
            ? `${body.forgorateData?.firstName} ${body.forgorateData?.lastName}`
            : body.name,
          paid: body.paid || false,
          phone: body.phone || null,
          status: "Waiting",
          signupType: "external",
          forgorateReadableId: body.forgorateReadableId,
          forgorateData: body.forgorateData,
          rating: body.rating || 0,
          tournamentId: tournamentId,
        });

        return res.status(200).json({
          status: true,
          message: "Player added successfully",
          player: result,
        });
      } else {
        // make one tentative to waiting

        tournamentParticipantsTentative[0].status = "Waiting";
        await tournamentParticipantsTentative[0].save();
        // and add current to confirmed

        const result = await TournamentSignup.create({
          name: body.forgorateData
            ? `${body.forgorateData?.firstName} ${body.forgorateData?.lastName}`
            : body.name,
          paid: body.paid || false,
          phone: body.phone || null,
          status: "Confirmed",
          signupType: "external",
          forgorateReadableId: body.forgorateReadableId,
          forgorateData: body.forgorateData,
          rating: body.rating || 0,
          tournamentId: tournamentId,
        });

        return res.status(200).json({
          status: true,
          message: "Player added successfully",
          player: result,
        });
      }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

// const addMultiplePlayersToTournament = async (req, res) => {
//   try {

//     const {tournamentId} = req.params;

//     const {
//       names,
//       status,
//       paid
//     } = req.body;

//     if(!tournamentId){
//       return res.status(400).json(
//         {
//           status: false,
//           message: "tournamentId is required"
//         }
//       )
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if(!tournamentInDB){
//       return res.status(404).json(
//         {
//           status: false,
//           message: "Tournament does not exists"
//         }
//       )
//     }

//     if(String(req.user.id) != String(tournamentInDB.managerId)){
//       return res.status().json(
//         {
//           status: false,
//           message: "You are not authorized to perform this action",
//         }
//       );
//     }

//     //get all the tournament singups

//     const tournamentSingups = await TournamentSignup.find({tournamentId:tournamentId});

//     const currentLength = tournamentSingups.length;
//     const maxPlayer = tournamentInDB.maxPlayer;

//     // if(tournamentSingups.length >= tournamentInDB.maxPlayer){
//     //   status = "Waiting"
//     // }

//     const playerNameArr = names.split(",");

//     const playerToinsert = [];

//     for(let i = 0;i<playerNameArr.length;i++){
//       playerToinsert.push(new TournamentSignup({
//           name:playerNameArr[i],
//           paid,
//           tournamentId,
//           signupType: "external",
//           userId: null,
//           phone: null,
//           rating: 0,
//       }));
//     }

//     await TournamentSignup.insertMany(playerToinsert);

//     return

//   } catch (error) {

//     if (error instanceof ZodError) {
//       const errors = formatError(error);

//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     console.log("Something went wrong while registered user", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });

//   }
// };

const addMultiplePlayersToTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // console.log("hello");
    const body = addMultiplePlayersToTournamentSchema.parse(req.body);
    console.log("hii");
    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(400).json({
        status: false,
        message: "Tournament does not exits",
      });
    }

    console.log(tournamentInDB);

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournamentInDB?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    // const playerNamesArr = body.names.split(",");

    const playerNamesArr = body.names
      .split(",")
      .map((name) => name.trim()) // remove leading/trailing spaces
      .filter((name) => name !== "" && name != " ");

    console.log(playerNamesArr);

    //get confirmed tournamentSingups

    const TournamentSignupsConfirmed = await TournamentSignup.find({
      tournamentId,
      status: "Confirmed",
    });

    console.log(TournamentSignupsConfirmed);

    const TournamentSignupsTentative = await TournamentSignup.find({
      tournamentId,
      status: "Tentative",
    });

    console.log(TournamentSignupsConfirmed);

    const playerToInsert = [];
    let confirmSignUpLength = TournamentSignupsConfirmed.length;
    let tentativeSignUpLength = TournamentSignupsTentative.length;
    let currentTentative = 0;

    for (let i = 0; i < playerNamesArr.length; i++) {
      if (confirmSignUpLength >= tournamentInDB.maxPlayer) {
        playerToInsert.push(
          new TournamentSignup({
            name: playerNamesArr[i],
            status: "Waiting",
            paid: body.paid,
            signupType: "external",
            phone: null,
            tournamentId: tournamentInDB._id,
          })
        );
      } else if (
        confirmSignUpLength + tentativeSignUpLength <
        tournamentInDB.maxPlayer
      ) {
        playerToInsert.push(
          new TournamentSignup({
            name: playerNamesArr[i],
            status: body.status,
            paid: body.paid,
            signupType: "external",
            phone: null,
            tournamentId: tournamentInDB._id,
          })
        );

        if (body.status == "Confirmed") {
          confirmSignUpLength++;
        } else {
          tentativeSignUpLength++;
        }
      } else if (
        confirmSignUpLength + tentativeSignUpLength ==
        tournamentInDB.maxPlayer
      ) {
        if (body.status == "Tentative") {
          playerToInsert.push(
            new TournamentSignup({
              name: playerNamesArr[i],
              status: "Waiting",
              paid: body.paid,
              signupType: "external",
              phone: null,
              tournamentId: tournamentInDB._id,
            })
          );
        } else {
          playerToInsert.push(
            new TournamentSignup({
              name: playerNamesArr[i],
              status: "Confirmed",
              paid: body.paid,
              signupType: "external",
              phone: null,
              tournamentId: tournamentInDB._id,
            })
          );

          confirmSignUpLength++;

          const TournamentSignupTentative = await TournamentSignup.findOne({
            tournamentId,
            status: "Tentative",
          });

          if (TournamentSignupTentative) {
            TournamentSignupTentative.status = "Waiting";
            tentativeSignUpLength--;
            await TournamentSignupTentative.save();
          }

          // TournamentSignupsTentative[currentTentative].status = "Waiting";
        }
      }
    }

    await TournamentSignup.insertMany(playerToInsert);

    return res.status(200).json({
      status: true,
      message: "player added successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const removePlayerFromTournament = async (req, res) => {
  try {
    const { tournamentSignupIds, tournamentId } = req.params;

    if (!tournamentSignupIds || !tournamentId) {
      return res.status(400).json({
        status: false,
        message: "TournamentSignup Ids and tournamentId are required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(200).json({
        status: false,
        message: "tournament does not exists",
      });
    }

    // if (String(req.user.id) != String(tournamentInDB.managerId)) {
    //   return res.status(403).json({
    //     status: false,
    //     message: "You are not authorized to perform this action",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(tournamentInDB?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    const deletetournaments = await TournamentSignup.deleteMany({
      _id: {
        $in: tournamentSignupIds.split(","),
      },
      tournamentId: tournamentInDB._id,
    });

    // console.log("length", deletetournaments.length);
    // console.log(deletetournaments);
    const tournamentSignUps = await TournamentSignup.find({
      tournamentId: tournamentInDB._id,
      status: "Waiting",
    })
      .limit(deletetournaments.deletedCount)
      .exec();

    for (let i = 0; i < tournamentSignUps.length; i++) {
      tournamentSignUps[i].status = "Tentative";
      tournamentSignUps[i].paid = false;
      await tournamentSignUps[i].save();
    }

    return res.status(200).json({
      status: true,
      message: "Player deleted successfully",
    });
  } catch (error) {}
};

const getlistofWaitingplayers = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(404).json({
        status: false,
        message: "tournament id is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "Tournament does not exists",
      });
    }

    const waitingList = await TournamentSignup.find({
      tournamentId: tournamentInDB._id,
      status: "Waiting",
    });

    return res.status(200).json({
      status: true,
      message: "waiting list fetched",
      player: waitingList,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const tournamentPlayerDetails = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status({
        message: "tournamentId is required",
        status: false,
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "Tournament does not exists",
      });
    }

    // const signupplayer = tournamentSignupModel.find({tournamentId}).lean();
    const signupplayer = await tournamentSignupModel
      .find({ tournamentId })
      .lean();

    //  if (!signupplayer) {
    //   return res.status(404).json({
    //     status: false,
    //     message: " Player does not exists",
    //   });
    // }

    //await signupplayer.save();

    return res.status(200).json({
      status: true,
      message: "Player Details fetched successfully",
      signupplayer: signupplayer,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

// const tournamentFinishingOrder = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status().json({
//         status: 400,
//         message: "Tournament does not exists",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const result = {};
//     let places = 1;

//     if (bracket["finals"][1]) {
//       result[`${places++}`] = [bracket["finals"][1].winner];
//       result[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       result[`${places++}`] = [bracket["finals"][0].winner];
//       result[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     //then winners
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];
//       for (let j = 0; j < roundArray.length; j++) {
//         // console.log(roundArray[j]);
//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[1]?.loser?._id)
//         ) {
//           // console.log("hello");
//           continue;
//         }

//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[0]?.loser?._id)
//         ) {
//           // console.log("hello2");
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//       }
//       result[places++] = placesArray;
//     }

//     //return finishing order

//     return res.status(200).json({
//       status: true,
//       message: "",
//       finishingOrder: result,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);

//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);

//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

const tournamentFinishingOrder = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(400).json({
        status: false,
        message: "Tournament does not exists",
      });
    }

    const bracket = await getTournamentBrackets(tournamentId);
    const result = {};
    let places = 1;
    const alreadyRanked = new Set(); // Track already ranked players

    if (tournamentInDB.tournamentType === "Single Elimination") {
      // For Single Elimination, process only winners bracket
      const winnerRounds = Array.from(bracket["winners"].keys());

      // Start from the last round (finals) and work backwards
      for (let i = winnerRounds.length - 1; i >= 0; i--) {
        const roundArray = bracket["winners"].get(winnerRounds[i]);
        const placesArray = [];

        // For the final round, add winner first, then loser
        if (i === winnerRounds.length - 1) {
          for (let j = 0; j < roundArray.length; j++) {
            const match = roundArray[j];

            if (match?.winner && !alreadyRanked.has(String(match.winner._id))) {
              result[places] = [match.winner];
              alreadyRanked.add(String(match.winner._id));
              places++;
            }
          }

          for (let j = 0; j < roundArray.length; j++) {
            const match = roundArray[j];

            if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
              placesArray.push(match.loser);
              alreadyRanked.add(String(match.loser._id));
            }
          }
        } else {
          // For other rounds, only add losers (they were eliminated in this round)
          for (let j = 0; j < roundArray.length; j++) {
            const match = roundArray[j];

            if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
              placesArray.push(match.loser);
              alreadyRanked.add(String(match.loser._id));
            }
          }
        }

        if (placesArray.length > 0) {
          result[places] = placesArray;
          places++;
        }
      }
    } else {
      // For Double Elimination (existing logic)

      // First and second places from finals
      if (bracket["finals"][1]) {
        if (!alreadyRanked.has(String(bracket["finals"][1].winner._id))) {
          result[`${places++}`] = [bracket["finals"][1].winner];
          alreadyRanked.add(String(bracket["finals"][1].winner._id));
        }
        if (!alreadyRanked.has(String(bracket["finals"][1].loser._id))) {
          result[`${places++}`] = [bracket["finals"][1].loser];
          alreadyRanked.add(String(bracket["finals"][1].loser._id));
        }
      } else {
        if (!alreadyRanked.has(String(bracket["finals"][0].winner._id))) {
          result[`${places++}`] = [bracket["finals"][0].winner];
          alreadyRanked.add(String(bracket["finals"][0].winner._id));
        }
        if (!alreadyRanked.has(String(bracket["finals"][0].loser._id))) {
          result[`${places++}`] = [bracket["finals"][0].loser];
          alreadyRanked.add(String(bracket["finals"][0].loser._id));
        }
      }

      // Then process losers bracket
      if (bracket["losers"]) {
        const loserRounds = Array.from(bracket["losers"].keys());

        for (let i = loserRounds.length - 1; i >= 0; i--) {
          const roundArray = bracket["losers"].get(loserRounds[i]);
          const placesArray = [];

          for (let j = 0; j < roundArray.length; j++) {
            const match = roundArray[j];

            if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
              placesArray.push(match.loser);
              alreadyRanked.add(String(match.loser._id));
            }
          }

          if (placesArray.length > 0) {
            result[places++] = placesArray;
          }
        }
      }

      // Finally, process winners bracket (excluding finals participants)
      const winnerRounds = Array.from(bracket["winners"].keys());

      for (let i = winnerRounds.length - 1; i >= 0; i--) {
        const roundArray = bracket["winners"].get(winnerRounds[i]);
        const placesArray = [];

        for (let j = 0; j < roundArray.length; j++) {
          const match = roundArray[j];

          if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
            placesArray.push(match.loser);
            alreadyRanked.add(String(match.loser._id));
          }
        }

        if (placesArray.length > 0) {
          result[places++] = placesArray;
        }
      }
    }

    return res.status(200).json({
      status: true,
      message: "",
      finishingOrder: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);

    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

// const tournamentFinishingOrder = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exists",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const result = {};
//     let places = 1;
//     const alreadyRanked = new Set(); // Track already ranked players

//     if (tournamentInDB.tournamentType === "Single Elimination") {
//       // For Single Elimination, process only winners bracket
//       const winnerRounds = Array.from(bracket["winners"].keys());

//       // Start from the last round (finals) and work backwards
//       for (let i = winnerRounds.length - 1; i >= 0; i--) {
//         const roundArray = bracket["winners"].get(winnerRounds[i]);
//         const placesArray = [];

//         for (let j = 0; j < roundArray.length; j++) {
//           const match = roundArray[j];

//           if (match?.winner && !alreadyRanked.has(String(match.winner._id))) {
//             placesArray.push(match.winner);
//             alreadyRanked.add(String(match.winner._id));
//           }

//           if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
//             placesArray.push(match.loser);
//             alreadyRanked.add(String(match.loser._id));
//           }
//         }

//         if (placesArray.length > 0) {
//           result[places++] = placesArray;
//         }
//       }
//     } else {
//       // For Double Elimination (existing logic)

//       // First and second places from finals
//       if (bracket["finals"][1]) {
//         if (!alreadyRanked.has(String(bracket["finals"][1].winner._id))) {
//           result[`${places++}`] = [bracket["finals"][1].winner];
//           alreadyRanked.add(String(bracket["finals"][1].winner._id));
//         }
//         if (!alreadyRanked.has(String(bracket["finals"][1].loser._id))) {
//           result[`${places++}`] = [bracket["finals"][1].loser];
//           alreadyRanked.add(String(bracket["finals"][1].loser._id));
//         }
//       } else {
//         if (!alreadyRanked.has(String(bracket["finals"][0].winner._id))) {
//           result[`${places++}`] = [bracket["finals"][0].winner];
//           alreadyRanked.add(String(bracket["finals"][0].winner._id));
//         }
//         if (!alreadyRanked.has(String(bracket["finals"][0].loser._id))) {
//           result[`${places++}`] = [bracket["finals"][0].loser];
//           alreadyRanked.add(String(bracket["finals"][0].loser._id));
//         }
//       }

//       // Then process losers bracket
//       if (bracket["losers"]) {
//         const loserRounds = Array.from(bracket["losers"].keys());

//         for (let i = loserRounds.length - 1; i >= 0; i--) {
//           const roundArray = bracket["losers"].get(loserRounds[i]);
//           const placesArray = [];

//           for (let j = 0; j < roundArray.length; j++) {
//             const match = roundArray[j];

//             if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
//               placesArray.push(match.loser);
//               alreadyRanked.add(String(match.loser._id));
//             }
//           }

//           if (placesArray.length > 0) {
//             result[places++] = placesArray;
//           }
//         }
//       }

//       // Finally, process winners bracket (excluding finals participants)
//       const winnerRounds = Array.from(bracket["winners"].keys());

//       for (let i = winnerRounds.length - 1; i >= 0; i--) {
//         const roundArray = bracket["winners"].get(winnerRounds[i]);
//         const placesArray = [];

//         for (let j = 0; j < roundArray.length; j++) {
//           const match = roundArray[j];

//           if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
//             placesArray.push(match.loser);
//             alreadyRanked.add(String(match.loser._id));
//           }
//         }

//         if (placesArray.length > 0) {
//           result[places++] = placesArray;
//         }
//       }
//     }

//     return res.status(200).json({
//       status: true,
//       message: "",
//       finishingOrder: result,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);

//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);

//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };
// const createTicket = async (req, res) => {
//   try {
//     const { subject, description } = req.body;

//     // Ensure required fields are provided
//     if (!subject || !description) {
//       return res
//         .status(400)
//         .json({ message: "Subject and description are required." });
//     }

//     // Create the ticket
//     const newTicket = new SupportTicket({
//       subject,
//       description,
//       // priority: priority || 'medium',
//       user: req.user.id,
//     });

//     const savedTicket = await newTicket.save();

//     res.status(201).json({
//       message: "Support ticket created successfully.",
//       ticket: savedTicket,
//     });
//   } catch (error) {
//     console.error("Error creating ticket:", error);
//     res.status(500).json({ message: "Server error while creating ticket." });
//   }
// };

const createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body; // ✅ Use 'message' instead of 'description'

    if (!subject || !message) {
      // ✅ Check for 'message'
      return res
        .status(400)
        .json({ message: "Subject and message are required." });
    }

    const newTicket = new SupportTicket({
      subject,
      message, // ✅ Use 'message' here
      user: req.user.id,
    });

    const savedTicket = await newTicket.save();

    res.status(201).json({
      message: "Support ticket created successfully.",
      ticket: savedTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Server error while creating ticket." });
  }
};

const getAllTicket = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("params", req.params);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const allTickets = await SupportTicket.find({ user: userId });

    if (!allTickets.length) {
      return res
        .status(404)
        .json({ message: "No tickets found for this user." });
    }

    res.status(200).json({ tickets: allTickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Server error while fetching tickets." });
  }
};

// const getAllTicketAdmin = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     console.log("params", req.params);
//     if (!userId) {
//       return res.status(400).json({ message: "User ID is required." });
//     }

//     const userRole = await roleModel.findById(req.user.roleId);

//     if (userRole.name != "Admin") {
//       return res.status(403).json({
//         status: false,
//         message: "Unauthorized",
//       });
//     }

//     const allTickets = await SupportTicket.find({});

//     if (!allTickets.length) {
//       return res
//         .status(404)
//         .json({ message: "No tickets found for this user." });
//     }

//     res.status(200).json({ tickets: allTickets });
//   } catch (error) {
//     console.error("Error fetching tickets:", error);
//     res.status(500).json({ message: "Server error while fetching tickets." });
//   }
// };

const getAllTicketAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // 1. Verify user existence
    const user = await userModel.findById(userId).populate("role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Check if the user is an Admin
    const adminRole = await roleModel.findOne({ name: "Admin" });
    if (!adminRole) {
      return res
        .status(500)
        .json({ message: "Admin role not found in system." });
    }

    const isAdmin =
      user.role && user.role._id.toString() === adminRole._id.toString();
    if (!isAdmin) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized - Admin access required",
      });
    }

    // 3. Fetch all tickets and populate user and responder info
    const allTickets = await SupportTicket.find({})
      .populate({
        path: "user",
        select: "name email role", // Customize as per your schema
      })
      .populate({
        path: "responses.responder",
        select: "name email role",
      })
      .sort({ createdAt: -1 });

    // 4. Return response
    return res.status(200).json({
      status: true,
      tickets: allTickets,
      message: allTickets.length
        ? "Tickets fetched successfully"
        : "No tickets found",
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching tickets.",
    });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return res.status(400).json({ message: "Ticket ID is required" });
    }

    const deleted = await SupportTicket.findByIdAndDelete(ticketId);

    if (!deleted) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({ message: "Ticket deleted successfully", ticketId });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const updateTicketStatus = async (req, res) => {
//   try {
//     const { ticketId } = req.params;

//     const { status = "open" } = req.body;

//     if (!ticketId) {
//       return res.status.json({
//         status: false,
//         message: "ticketId is required",
//       });
//     }

//     const userRole = await roleModel.findById(req.user.roleId);

//     if (userRole.name != "Admin") {
//       return res.status(403).json({
//         status: false,
//         message: "Unauthorized",
//       });
//     }

//     await SupportTicket.findByIdAndUpdate(ticketId, {
//       status: status,
//     });

//     return res.status(200).json({
//       status: true,
//       message: "The ticket status has been updated successfully",
//     });
//   } catch (error) {
//     // console.error("Error fetching tickets:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

//for admin
const downloadUserInformation = async (req, res) => {
  try {
    // allow only admins

    // const userRole = await roleModel.findById(req.user.roleId);

    // if (userRole.name != "Admin") {
    //   return res.status(401).json({
    //     status: false,
    //     message: "Unauthorized",
    //   });
    // }

    //get all users

    const users = await User.find({});

    const userlist = new ExcelJS.Workbook();
    const worksheet = userlist.addWorksheet("user information");

    // Sample headers
    worksheet.columns = [
      { header: "#", key: "serial", width: 25 },
      { header: "Display Name", key: "DisplayName", width: 30 },
      { header: "Email", key: "Email", width: 50 },
    ];

    const data = users.map((user, index) => {
      return {
        serial: `${index + 1}`,
        DisplayName: `${user.firstName} ${user.lastName ?? ""}`,
        Email: `${user.email}`,
      };
    });
    worksheet.addRows(data);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=participants.xlsx"
    );

    await userlist.xlsx.write(res);
    res.end();

    return;
  } catch (error) {
    console.error("Excel generation failed:", error);
    res.status(500).send("Could not generate Excel file.");
  }
};

// const getTournamentWithMostTraffic = async (req, res) => {
//   try {
//     const { managerId } = req.params;

//     const id = req.user.id;

//     // Validate managerId
//     if (!man) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid manager ID format'
//       });
//     }

//     // Aggregation pipeline to get top 5 tournaments with most signups
//     const topTournaments = await Tournament.aggregate([
//       // Match tournaments for the specific manager
//       {
//         $match: {
//           managerId: new mongoose.Types.ObjectId(managerId)
//         }
//       },
//       // Lookup tournament signups and count them
//       {
//         $lookup: {
//           from: 'tournamentsignups', // Collection name (usually lowercase + s)
//           localField: '_id',
//           foreignField: 'tournamentId',
//           as: 'signups'
//         }
//       },
//       // Add signup count field
//       {
//         $addFields: {
//           signupCount: { $size: '$signups' }
//         }
//       },
//       // Sort by signup count (descending)
//       {
//         $sort: {
//           signupCount: -1
//         }
//       },
//       // Limit to top 5
//       {
//         $limit: 5
//       },
//       // Project only required fields
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           flyerImage: 1,
//           managerId: 1,
//           signupCount: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           // Add any other tournament fields you want to return
//           startDate: 1,
//           endDate: 1,
//           status: 1
//         }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       message: 'Top tournaments fetched successfully',
//       data: {
//         tournaments: topTournaments,
//         managerId: managerId,
//         totalCount: topTournaments.length
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching top tournaments:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

const getTournamentWithMostTraffic = async (req, res) => {
  try {
    // Aggregation pipeline to get top 5 tournaments with most signups
    // const topTournaments = await Tournament.aggregate([
    //   // Lookup tournament signups and count them
    //   {
    //     $lookup: {
    //       from: "tournamentsignups", // Collection name (typically lowercase plural)
    //       localField: "_id",
    //       foreignField: "tournamentId",
    //       as: "signups",
    //     },
    //   },
    //   // Add signup count field
    //   {
    //     $addFields: {
    //       signupCount: { $size: "$signups" },
    //     },
    //   },
    //   // Sort by signup count (descending)
    //   {
    //     $sort: {
    //       signupCount: -1,
    //     },
    //   },
    //   // Limit to top 5
    //   {
    //     $limit: 5,
    //   },
    //   // Project only required fields
    //   {
    //     $project: {
    //       _id: 1,
    //       name: 1,
    //       flyerImage: 1,
    //       managerId: 1,
    //       signupCount: 1,
    //       createdAt: 1,
    //       updatedAt: 1,
    //       startDate: 1,
    //       endDate: 1,
    //       status: 1,
    //       description: 1,
    //     },
    //   },
    // ]);

    const topTournaments = await Tournament.aggregate([
      // Lookup tournament signups and count them
      {
        $lookup: {
          from: "tournamentsignups",
          localField: "_id",
          foreignField: "tournamentId",
          as: "signups",
        },
      },
      // Add signup count field
      {
        $addFields: {
          signupCount: { $size: "$signups" },
        },
      },
      // Filter tournaments where flyerImage is not null or empty
      {
        $match: {
          flyerImage: { $ne: null },
        },
      },
      // Sort by signup count (descending)
      {
        $sort: {
          signupCount: -1,
        },
      },
      // Limit to top 5
      {
        $limit: 5,
      },
      // Project only required fields
      {
        $project: {
          _id: 1,
          name: 1,
          flyerImage: 1,
          managerId: 1,
          signupCount: 1,
          createdAt: 1,
          updatedAt: 1,
          startDate: 1,
          endDate: 1,
          status: 1,
          description: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Top tournaments fetched successfully",
      data: {
        tournaments: topTournaments,
        totalCount: topTournaments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching top tournaments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Get winners and runners-up from finals
//     if (bracket["finals"][1]) {
//       finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     // Get 3rd, 4th, 5th places from winners bracket
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 5; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 5; j++) {
//         // Skip if this loser is already in finals
//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[1]?.loser?._id) ||
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[0]?.loser?._id)
//         ) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//       }

//       if (placesArray.length > 0 && places <= 5) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 5 places
//     const playerIds = [];
//     for (let place = 1; place <= 5; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id);
//           }
//         });
//       }
//     }

//     // Fetch match history for these players
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds } },
//         { player2: { $in: playerIds } }
//       ],
//       status: "Completed"
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();

//       if (player1Id && playerIds.includes(player1Id)) {
//         playerMatchHistory[player1Id].push({
//           matchId: match.matchId,
//           opponent: match.player2?.name || 'Unknown',
//           result: winnerId === player1Id ? 'W' : 'L',
//           score: `${match.score.player1Score}-${match.score.player2Score}`,
//           round: match.round,
//           side: match.side
//         });
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         playerMatchHistory[player2Id].push({
//           matchId: match.matchId,
//           opponent: match.player1?.name || 'Unknown',
//           result: winnerId === player2Id ? 'W' : 'L',
//           score: `${match.score.player2Score}-${match.score.player1Score}`,
//           round: match.round,
//           side: match.side
//         });
//       }
//     });

//     console.log(playerMatchHistory);

//     // Format results with match history
//     const results = [];

//     for (let place = 1; place <= 5; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results.slice(0, 5) // Ensure we only return top 5
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Get winners and runners-up from finals
//     if (bracket["finals"][1]) {
//       finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     // Get 3rd, 4th, 5th places from winners bracket
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 5; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 5; j++) {
//         // Skip if this loser is already in finals
//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[1]?.loser?._id) ||
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[0]?.loser?._id)
//         ) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//       }

//       if (placesArray.length > 0 && places <= 5) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 5 places - FIXED: Convert to strings consistently
//     const playerIds = [];
//     for (let place = 1; place <= 5; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id.toString()); // Convert to string immediately
//           }
//         });
//       }
//     }

//     console.log('Player IDs for match history:', playerIds); // Debug log

//     // Fetch match history for these players - FIXED: Better query structure
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds.map(id => id) } }, // Ensure proper format
//         { player2: { $in: playerIds.map(id => id) } }
//       ],
//       status: "Completed"
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     console.log('Found matches:', matches.length); // Debug log

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();

//       // FIXED: Use includes() with proper string comparison
//       if (player1Id && playerIds.includes(player1Id)) {
//         playerMatchHistory[player1Id].push({
//           matchId: match.matchId,
//           opponent: match.player2?.name || 'Unknown',
//           result: winnerId === player1Id ? 'W' : 'L',
//           score: `${match.score?.player1Score || 0}-${match.score?.player2Score || 0}`,
//           round: match.round,
//           side: match.side
//         });
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         playerMatchHistory[player2Id].push({
//           matchId: match.matchId,
//           opponent: match.player1?.name || 'Unknown',
//           result: winnerId === player2Id ? 'W' : 'L',
//           score: `${match.score?.player2Score || 0}-${match.score?.player1Score || 0}`,
//           round: match.round,
//           side: match.side
//         });
//       }
//     });

//     // FIXED: Debug logging to see what's in match history
//     console.log('Player match history:', JSON.stringify(playerMatchHistory, null, 2));

//     // Format results with match history
//     const results = [];

//     for (let place = 1; place <= 5; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results.slice(0, 5) // Ensure we only return top 5
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Get winners and runners-up from finals
//     if (bracket["finals"][1]) {
//       finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     // Get 3rd, 4th, 5th places from winners bracket
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 5; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 5; j++) {
//         // Skip if this loser is already in finals
//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[1]?.loser?._id) ||
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[0]?.loser?._id)
//         ) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//       }

//       if (placesArray.length > 0 && places <= 5) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 5 places - FIXED: Convert to strings consistently
//     const playerIds = [];
//     for (let place = 1; place <= 5; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id.toString()); // Convert to string immediately
//           }
//         });
//       }
//     }

//     console.log('Player IDs for match history:', playerIds); // Debug log

//     // Fetch match history for these players - FIXED: Better query structure
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds.map(id => id) } }, // Ensure proper format
//         { player2: { $in: playerIds.map(id => id) } }
//       ],
//       status: "Completed",
//       isBye: { $ne: true } // Exclude bye matches
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     console.log('Found matches:', matches.length); // Debug log

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();

//       // FIXED: Use includes() with proper string comparison
//       if (player1Id && playerIds.includes(player1Id)) {
//         playerMatchHistory[player1Id].push({
//           matchId: match.matchId,
//           opponent: match.player2?.name || 'Unknown',
//           result: winnerId === player1Id ? 'W' : 'L',
//           score: `${match.score?.player1Score || 0}-${match.score?.player2Score || 0}`,
//           round: match.round,
//           side: match.side
//         });
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         playerMatchHistory[player2Id].push({
//           matchId: match.matchId,
//           opponent: match.player1?.name || 'Unknown',
//           result: winnerId === player2Id ? 'W' : 'L',
//           score: `${match.score?.player2Score || 0}-${match.score?.player1Score || 0}`,
//           round: match.round,
//           side: match.side
//         });
//       }
//     });

//     // FIXED: Debug logging to see what's in match history
//     console.log('Player match history:', JSON.stringify(playerMatchHistory, null, 2));

//     // Format results with match history
//     const results = [];

//     for (let place = 1; place <= 5; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results.slice(0, 5) // Ensure we only return top 5
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Get winners and runners-up from finals
//     if (bracket["finals"][1]) {
//       finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     // Get 3rd, 4th places from winners bracket (changed condition to places <= 4)
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 4; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 4; j++) {
//         // Skip if this loser is already in finals
//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[1]?.loser?._id) ||
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[0]?.loser?._id)
//         ) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//       }

//       if (placesArray.length > 0 && places <= 4) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 4 places (changed from 5 to 4)
//     const playerIds = [];
//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id);
//           }
//         });
//       }
//     }

//     // Fetch match history for these players
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds } },
//         { player2: { $in: playerIds } }
//       ],
//       status: "Completed"
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();

//       if (player1Id && playerIds.includes(player1Id)) {
//         playerMatchHistory[player1Id].push({
//           matchId: match.matchId,
//           opponent: match.player2?.name || 'Unknown',
//           result: winnerId === player1Id ? 'W' : 'L',
//           score: `${match.score.player1Score}-${match.score.player2Score}`,
//           round: match.round,
//           side: match.side
//         });
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         playerMatchHistory[player2Id].push({
//           matchId: match.matchId,
//           opponent: match.player1?.name || 'Unknown',
//           result: winnerId === player2Id ? 'W' : 'L',
//           score: `${match.score.player2Score}-${match.score.player1Score}`,
//           round: match.round,
//           side: match.side
//         });
//       }
//     });

//     // Format results with match history (changed from 5 to 4)
//     const results = [];

//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results // Removed the slice(0, 5) to return all players in places 1-4
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Get winners and runners-up from finals
//     if (bracket["finals"][1]) {
//       finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     // Get 3rd, 4th places from winners bracket (changed condition to places <= 4)
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 4; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 4; j++) {
//         // Skip if this loser is already in finals
//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[1]?.loser?._id) ||
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[0]?.loser?._id)
//         ) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//       }

//       if (placesArray.length > 0 && places <= 4) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 4 places (changed from 5 to 4)
//     const playerIds = [];
//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id.toString());
//           }
//         });
//       }
//     }

//     // Fetch match history for these players
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds } },
//         { player2: { $in: playerIds } }
//       ],
//       status: "Completed"
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();

//       if (player1Id && playerIds.includes(player1Id)) {
//         playerMatchHistory[player1Id].push({
//           matchId: match.matchId,
//           opponent: match.player2?.name || 'Unknown',
//           result: winnerId === player1Id ? 'W' : 'L',
//           score: `${match.score.player1Score}-${match.score.player2Score}`,
//           round: match.round,
//           side: match.side
//         });
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         playerMatchHistory[player2Id].push({
//           matchId: match.matchId,
//           opponent: match.player1?.name || 'Unknown',
//           result: winnerId === player2Id ? 'W' : 'L',
//           score: `${match.score.player2Score}-${match.score.player1Score}`,
//           round: match.round,
//           side: match.side
//         });
//       }
//     });

//     // Format results with match history (changed from 5 to 4)
//     const results = [];

//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results // Removed the slice(0, 5) to return all players in places 1-4
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Get winners and runners-up from finals
//     if (bracket["finals"][1]) {
//       finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     // Get 3rd, 4th places from winners bracket (changed condition to places <= 4)
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 4; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 4; j++) {
//         // Skip if this loser is already in finals
//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[1]?.loser?._id) ||
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[0]?.loser?._id)
//         ) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//       }

//       if (placesArray.length > 0 && places <= 4) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 4 places (changed from 5 to 4)
//     const playerIds = [];
//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id.toString());
//           }
//         });
//       }
//     }

//     // Fetch match history for these players
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds } },
//         { player2: { $in: playerIds } }
//       ],
//       status: "Completed"
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();

//       if (player1Id && playerIds.includes(player1Id)) {
//         playerMatchHistory[player1Id].push({
//           matchId: match.matchId,
//           opponent: match.player2?.name || 'Unknown',
//           result: winnerId === player1Id ? 'W' : 'L',
//           score: `${match.score.player1Score}-${match.score.player2Score}`,
//           round: match.round,
//           side: match.side
//         });
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         playerMatchHistory[player2Id].push({
//           matchId: match.matchId,
//           opponent: match.player1?.name || 'Unknown',
//           result: winnerId === player2Id ? 'W' : 'L',
//           score: `${match.score.player2Score}-${match.score.player1Score}`,
//           round: match.round,
//           side: match.side
//         });
//       }
//     });

//     // Sort and organize match history by bracket sides
//     Object.keys(playerMatchHistory).forEach(playerId => {
//       const matches = playerMatchHistory[playerId];

//       // Separate matches by bracket side
//       const winnersSide = matches.filter(match => match.side === 'winners').sort((a, b) => a.round - b.round);
//       const losersSide = matches.filter(match => match.side === 'losers').sort((a, b) => a.round - b.round);
//       const finalsSide = matches.filter(match => match.side === 'finals').sort((a, b) => a.round - b.round);

//       // Combine in order: winners, losers, finals
//       playerMatchHistory[playerId] = [...winnersSide, ...losersSide, ...finalsSide];
//     });

//     // Format results with match history (changed from 5 to 4)
//     const results = [];

//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results // Removed the slice(0, 5) to return all players in places 1-4
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Get winners and runners-up from finals
//     if (bracket["finals"][1]) {
//       finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     // Get 3rd, 4th places from winners bracket (changed condition to places <= 4)
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 4; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 4; j++) {
//         // Skip if this loser is already in finals
//         if (
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[1]?.loser?._id) ||
//           String(roundArray[j]?.loser?._id) ==
//           String(bracket["finals"]?.[0]?.loser?._id)
//         ) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//       }

//       if (placesArray.length > 0 && places <= 4) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 4 places (changed from 5 to 4)
//     const playerIds = [];
//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id.toString());
//           }
//         });
//       }
//     }

//     // Fetch match history for these players
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds } },
//         { player2: { $in: playerIds } }
//       ],
//       status: "Completed"
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();
//       const matchId = match.matchId;

//       if (player1Id && playerIds.includes(player1Id)) {
//         // Check if this match is already recorded for this player
//         const existingMatch = playerMatchHistory[player1Id].find(m => m.matchId === matchId);
//         if (!existingMatch) {
//           playerMatchHistory[player1Id].push({
//             matchId: match.matchId,
//             opponent: match.player2?.name || 'Unknown',
//             result: winnerId === player1Id ? 'W' : 'L',
//             score: `${match.score.player1Score}-${match.score.player2Score}`,
//             round: match.round,
//             side: match.side
//           });
//         }
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         // Check if this match is already recorded for this player
//         const existingMatch = playerMatchHistory[player2Id].find(m => m.matchId === matchId);
//         if (!existingMatch) {
//           playerMatchHistory[player2Id].push({
//             matchId: match.matchId,
//             opponent: match.player1?.name || 'Unknown',
//             result: winnerId === player2Id ? 'W' : 'L',
//             score: `${match.score.player2Score}-${match.score.player1Score}`,
//             round: match.round,
//             side: match.side
//           });
//         }
//       }
//     });

//     // Sort and organize match history by bracket sides
//     Object.keys(playerMatchHistory).forEach(playerId => {
//       const matches = playerMatchHistory[playerId];

//       // Separate matches by bracket side
//       const winnersSide = matches.filter(match => match.side === 'winners').sort((a, b) => a.round - b.round);
//       const losersSide = matches.filter(match => match.side === 'losers').sort((a, b) => a.round - b.round);
//       const finalsSide = matches.filter(match => match.side === 'finals').sort((a, b) => a.round - b.round);

//       // Combine in order: winners, losers, finals
//       playerMatchHistory[playerId] = [...winnersSide, ...losersSide, ...finalsSide];
//     });

//     // Format results with match history (changed from 5 to 4)
//     const results = [];

//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results // Removed the slice(0, 5) to return all players in places 1-4
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Get winners and runners-up from finals
//     if (bracket["finals"][1]) {
//       finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//     } else {
//       finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//       finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//     }

//     // Track players who already have been assigned a place
//     const assignedPlayers = new Set();

//     // Add finals players to assigned set
//     if (bracket["finals"][1]) {
//       assignedPlayers.add(String(bracket["finals"][1].winner?._id));
//       assignedPlayers.add(String(bracket["finals"][1].loser?._id));
//     } else {
//       assignedPlayers.add(String(bracket["finals"][0].winner?._id));
//       assignedPlayers.add(String(bracket["finals"][0].loser?._id));
//     }

//     // Get 3rd, 4th places from winners bracket (changed condition to places <= 4)
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 4; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 4; j++) {
//         const loserId = String(roundArray[j]?.loser?._id);

//         // Skip if this player has already been assigned a place
//         if (assignedPlayers.has(loserId)) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//         assignedPlayers.add(loserId); // Mark this player as assigned
//       }

//       if (placesArray.length > 0 && places <= 4) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 4 places (changed from 5 to 4)
//     const playerIds = [];
//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id.toString());
//           }
//         });
//       }
//     }

//     // Fetch match history for these players
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds } },
//         { player2: { $in: playerIds } }
//       ],
//       status: "Completed"
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();
//       const matchId = match.matchId;

//       if (player1Id && playerIds.includes(player1Id)) {
//         // Check if this match is already recorded for this player
//         const existingMatch = playerMatchHistory[player1Id].find(m => m.matchId === matchId);
//         if (!existingMatch) {
//           playerMatchHistory[player1Id].push({
//             matchId: match.matchId,
//             opponent: match.player2?.name || 'Unknown',
//             result: winnerId === player1Id ? 'W' : 'L',
//             score: `${match.score.player1Score}-${match.score.player2Score}`,
//             round: match.round,
//             side: match.side
//           });
//         }
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         // Check if this match is already recorded for this player
//         const existingMatch = playerMatchHistory[player2Id].find(m => m.matchId === matchId);
//         if (!existingMatch) {
//           playerMatchHistory[player2Id].push({
//             matchId: match.matchId,
//             opponent: match.player1?.name || 'Unknown',
//             result: winnerId === player2Id ? 'W' : 'L',
//             score: `${match.score.player2Score}-${match.score.player1Score}`,
//             round: match.round,
//             side: match.side
//           });
//         }
//       }
//     });

//     // Sort and organize match history by bracket sides
//     Object.keys(playerMatchHistory).forEach(playerId => {
//       const matches = playerMatchHistory[playerId];

//       // Separate matches by bracket side
//       const winnersSide = matches.filter(match => match.side === 'winners').sort((a, b) => a.round - b.round);
//       const losersSide = matches.filter(match => match.side === 'losers').sort((a, b) => a.round - b.round);
//       const finalsSide = matches.filter(match => match.side === 'finals').sort((a, b) => a.round - b.round);

//       // Combine in order: winners, losers, finals
//       playerMatchHistory[playerId] = [...winnersSide, ...losersSide, ...finalsSide];
//     });

//     // Format results with match history (changed from 5 to 4)
//     const results = [];

//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results // Removed the slice(0, 5) to return all players in places 1-4
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Check if it's a single elimination tournament (no finals bracket)
//     const isSingleElimination =
//       !bracket["finals"] || bracket["finals"].length === 0;

//     if (isSingleElimination) {
//       // For single elimination, winner is from the last round of winners bracket
//       const winnerRounds = Array.from(bracket["winners"].keys());
//       const lastRound = winnerRounds[winnerRounds.length - 1];
//       const finalMatch = bracket["winners"].get(lastRound)[0];

//       if (finalMatch) {
//         finishingOrder[`${places++}`] = [finalMatch.winner];
//         finishingOrder[`${places++}`] = [finalMatch.loser];
//       }
//     } else {
//       // Double elimination logic (original)
//       if (bracket["finals"][1]) {
//         finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//         finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//       } else {
//         finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//         finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//       }
//     }

//     // Track players who already have been assigned a place
//     const assignedPlayers = new Set();

//     // Add top 2 players to assigned set
//     if (isSingleElimination) {
//       const winnerRounds = Array.from(bracket["winners"].keys());
//       const lastRound = winnerRounds[winnerRounds.length - 1];
//       const finalMatch = bracket["winners"].get(lastRound)[0];

//       if (finalMatch) {
//         assignedPlayers.add(String(finalMatch.winner?._id));
//         assignedPlayers.add(String(finalMatch.loser?._id));
//       }
//     } else {
//       // Double elimination
//       if (bracket["finals"][1]) {
//         assignedPlayers.add(String(bracket["finals"][1].winner?._id));
//         assignedPlayers.add(String(bracket["finals"][1].loser?._id));
//       } else {
//         assignedPlayers.add(String(bracket["finals"][0].winner?._id));
//         assignedPlayers.add(String(bracket["finals"][0].loser?._id));
//       }
//     }

//     // Get 3rd, 4th places from winners bracket (changed condition to places <= 4)
//     const winnerRounds = Array.from(bracket["winners"].keys());

//     for (let i = winnerRounds.length - 1; i >= 0 && places <= 4; i--) {
//       const roundArray = bracket["winners"].get(winnerRounds[i]);
//       const placesArray = [];

//       for (let j = 0; j < roundArray.length && places <= 4; j++) {
//         const loserId = String(roundArray[j]?.loser?._id);

//         // Skip if this player has already been assigned a place
//         if (assignedPlayers.has(loserId)) {
//           continue;
//         }

//         placesArray.push(roundArray[j]?.loser);
//         assignedPlayers.add(loserId); // Mark this player as assigned
//       }

//       if (placesArray.length > 0 && places <= 4) {
//         finishingOrder[places++] = placesArray;
//       }
//     }

//     // Get all player IDs from top 4 places (changed from 5 to 4)
//     const playerIds = [];
//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach((player) => {
//           if (player && player._id) {
//             playerIds.push(player._id.toString());
//           }
//         });
//       }
//     }

//     // Fetch match history for these players
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [{ player1: { $in: playerIds } }, { player2: { $in: playerIds } }],
//       status: "Completed",
//     })
//       .populate("player1", "name")
//       .populate("player2", "name")
//       .populate("winner", "name")
//       .populate("loser", "name")
//       .sort({ round: 1 });

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach((playerId) => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach((match) => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();
//       const matchId = match.matchId;

//       if (player1Id && playerIds.includes(player1Id)) {
//         // Check if this match is already recorded for this player
//         const existingMatch = playerMatchHistory[player1Id].find(
//           (m) => m.matchId === matchId
//         );
//         if (!existingMatch) {
//           playerMatchHistory[player1Id].push({
//             matchId: match.matchId,
//             opponent: match.player2?.name || "Unknown",
//             result: winnerId === player1Id ? "W" : "L",
//             score: `${match.score.player1Score}-${match.score.player2Score}`,
//             round: match.round,
//             side: match.side,
//           });
//         }
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         // Check if this match is already recorded for this player
//         const existingMatch = playerMatchHistory[player2Id].find(
//           (m) => m.matchId === matchId
//         );
//         if (!existingMatch) {
//           playerMatchHistory[player2Id].push({
//             matchId: match.matchId,
//             opponent: match.player1?.name || "Unknown",
//             result: winnerId === player2Id ? "W" : "L",
//             score: `${match.score.player2Score}-${match.score.player1Score}`,
//             round: match.round,
//             side: match.side,
//           });
//         }
//       }
//     });

//     // Sort and organize match history by bracket sides
//     Object.keys(playerMatchHistory).forEach((playerId) => {
//       const matches = playerMatchHistory[playerId];

//       // Separate matches by bracket side
//       const winnersSide = matches
//         .filter((match) => match.side === "winners")
//         .sort((a, b) => a.round - b.round);
//       const losersSide = matches
//         .filter((match) => match.side === "losers")
//         .sort((a, b) => a.round - b.round);
//       const finalsSide = matches
//         .filter((match) => match.side === "finals")
//         .sort((a, b) => a.round - b.round);

//       // Combine in order: winners, losers, finals
//       playerMatchHistory[playerId] = [
//         ...winnersSide,
//         ...losersSide,
//         ...finalsSide,
//       ];
//     });

//     // Format results with match history (changed from 5 to 4)
//     const results = [];

//     for (let place = 1; place <= 4; place++) {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach((player) => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won
//             const setsWon = matchHistory.filter(
//               (match) => match.result === "W"
//             ).length;

//             results.push({
//               place: place,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               matchHistory: matchHistory,
//             });
//           }
//         });
//       }
//     }

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       results: results, // Removed the slice(0, 5) to return all players in places 1-4
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

const tournamentResults = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    if (!tournamentInDB) {
      return res.status(400).json({
        status: false,
        message: "Tournament does not exist",
      });
    }

    const bracket = await getTournamentBrackets(tournamentId);
    const finishingOrder = {};
    let places = 1;
    const alreadyRanked = new Set(); // Track already ranked players

    if (tournamentInDB.tournamentType === "Single Elimination") {
      // For Single Elimination, process only winners bracket
      const winnerRounds = Array.from(bracket["winners"].keys());

      // Start from the last round (finals) and work backwards
      for (let i = winnerRounds.length - 1; i >= 0 && places <= 4; i--) {
        const roundArray = bracket["winners"].get(winnerRounds[i]);
        const placesArray = [];

        // For the final round, add winner first, then loser
        if (i === winnerRounds.length - 1) {
          for (let j = 0; j < roundArray.length; j++) {
            const match = roundArray[j];

            if (match?.winner && !alreadyRanked.has(String(match.winner._id))) {
              finishingOrder[places] = [match.winner];
              alreadyRanked.add(String(match.winner._id));
              places++;
              if (places > 4) break;
            }
          }

          for (let j = 0; j < roundArray.length && places <= 4; j++) {
            const match = roundArray[j];

            if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
              placesArray.push(match.loser);
              alreadyRanked.add(String(match.loser._id));
            }
          }
        } else {
          // For other rounds, only add losers (they were eliminated in this round)
          for (let j = 0; j < roundArray.length && places <= 4; j++) {
            const match = roundArray[j];

            if (match?.loser && !alreadyRanked.has(String(match.loser._id))) {
              placesArray.push(match.loser);
              alreadyRanked.add(String(match.loser._id));
            }
          }
        }

        if (placesArray.length > 0 && places <= 4) {
          finishingOrder[places] = placesArray;
          places++;
        }
      }
    } else {
      // Double elimination logic (original)
      if (bracket["finals"][1]) {
        finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
        finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
      } else {
        finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
        finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
      }

      // Track players who already have been assigned a place
      const assignedPlayers = new Set();

      // Add top 2 players to assigned set
      if (bracket["finals"][1]) {
        assignedPlayers.add(String(bracket["finals"][1].winner?._id));
        assignedPlayers.add(String(bracket["finals"][1].loser?._id));
      } else {
        assignedPlayers.add(String(bracket["finals"][0].winner?._id));
        assignedPlayers.add(String(bracket["finals"][0].loser?._id));
      }

      // Get 3rd, 4th places from winners bracket (changed condition to places <= 4) (loosers)
      const loserRounds = Array.from(bracket["losers"].keys());

      for (let i = loserRounds.length - 1; i >= 0 && places <= 4; i--) {
        const roundArray = bracket["losers"].get(loserRounds[i]);
        const placesArray = [];

        for (let j = 0; j < roundArray.length && places <= 4; j++) {
          const loserId = String(roundArray[j]?.loser?._id);

          // Skip if this player has already been assigned a place
          if (assignedPlayers.has(loserId)) {
            continue;
          }

          placesArray.push(roundArray[j]?.loser);
          assignedPlayers.add(loserId); // Mark this player as assigned
        }

        if (placesArray.length > 0 && places <= 4) {
          finishingOrder[places++] = placesArray;
        }
      }
    }

    // Get all player IDs from top 4 places (changed from 5 to 4)
    const playerIds = [];
    for (let place = 1; place <= 4; place++) {
      if (finishingOrder[place]) {
        finishingOrder[place].forEach((player) => {
          if (player && player._id) {
            playerIds.push(player._id.toString());
          }
        });
      }
    }

    // Fetch match history for these players
    const matches = await Match.find({
      tournamentId: tournamentId,
      $or: [{ player1: { $in: playerIds } }, { player2: { $in: playerIds } }],
      status: "Completed",
    })
      .populate("player1", "name")
      .populate("player2", "name")
      .populate("winner", "name")
      .populate("loser", "name")
      .sort({ round: 1 });

    // Create match history map for each player
    const playerMatchHistory = {};

    playerIds.forEach((playerId) => {
      playerMatchHistory[playerId] = [];
    });

    matches.forEach((match) => {
      const player1Id = match.player1?._id?.toString();
      const player2Id = match.player2?._id?.toString();
      const winnerId = match.winner?._id?.toString();
      const matchId = match.matchId;

      if (player1Id && playerIds.includes(player1Id)) {
        // Check if this match is already recorded for this player
        const existingMatch = playerMatchHistory[player1Id].find(
          (m) => m.matchId === matchId
        );
        if (!existingMatch) {
          playerMatchHistory[player1Id].push({
            matchId: match.matchId,
            opponent: match.player2?.name || "Unknown",
            result: winnerId === player1Id ? "W" : "L",
            score: `${match.score.player1Score}-${match.score.player2Score}`,
            round: match.round,
            side: match.side,
          });
        }
      }

      if (player2Id && playerIds.includes(player2Id)) {
        // Check if this match is already recorded for this player
        const existingMatch = playerMatchHistory[player2Id].find(
          (m) => m.matchId === matchId
        );
        if (!existingMatch) {
          playerMatchHistory[player2Id].push({
            matchId: match.matchId,
            opponent: match.player1?.name || "Unknown",
            result: winnerId === player2Id ? "W" : "L",
            score: `${match.score.player2Score}-${match.score.player1Score}`,
            round: match.round,
            side: match.side,
          });
        }
      }
    });

    // Sort and organize match history by bracket sides
    Object.keys(playerMatchHistory).forEach((playerId) => {
      const matches = playerMatchHistory[playerId];

      // Separate matches by bracket side
      const winnersSide = matches
        .filter((match) => match.side === "winners")
        .sort((a, b) => a.round - b.round);
      const losersSide = matches
        .filter((match) => match.side === "losers")
        .sort((a, b) => a.round - b.round);
      const finalsSide = matches
        .filter((match) => match.side === "finals")
        .sort((a, b) => a.round - b.round);

      // Combine in order: winners, losers, finals
      playerMatchHistory[playerId] = [
        ...winnersSide,
        ...losersSide,
        ...finalsSide,
      ];
    });

    // Format results with match history (changed from 5 to 4)
    const results = [];

    for (let place = 1; place <= 4; place++) {
      if (finishingOrder[place]) {
        finishingOrder[place].forEach((player) => {
          if (player && player._id) {
            const playerId = player._id.toString();
            const matchHistory = playerMatchHistory[playerId] || [];

            // Calculate sets won
            const setsWon = matchHistory.filter(
              (match) => match.result === "W"
            ).length;

            results.push({
              place: place,
              playerId: player._id,
              name: player.name,
              setsWon: setsWon,
              matchHistory: matchHistory,
            });
          }
        });
      }
    }

    // Sort results by place
    results.sort((a, b) => a.place - b.place);

    return res.status(200).json({
      status: true,
      message: "Tournament results fetched successfully",
      results: results, // Removed the slice(0, 5) to return all players in places 1-4
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

// const tournamentResults = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!tournamentInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bracket = await getTournamentBrackets(tournamentId);
//     const finishingOrder = {};
//     let places = 1;

//     // Check if it's a single elimination tournament (no finals bracket)
//     const isSingleElimination = !bracket["finals"] || bracket["finals"].length === 0;

//     // Track players who already have been assigned a place
//     const assignedPlayers = new Set();

//     if (isSingleElimination) {
//       // For single elimination, winner is from the last round of winners bracket
//       const winnerRounds = Array.from(bracket["winners"].keys());
//       const lastRound = winnerRounds[winnerRounds.length - 1];
//       const finalMatch = bracket["winners"].get(lastRound)[0];

//       if (finalMatch) {
//         finishingOrder[`${places++}`] = [finalMatch.winner];
//         finishingOrder[`${places++}`] = [finalMatch.loser];
//         assignedPlayers.add(String(finalMatch.winner?._id));
//         assignedPlayers.add(String(finalMatch.loser?._id));
//       }

//       // For single elimination, get remaining places from winners bracket elimination order
//       for (let i = winnerRounds.length - 2; i >= 0; i--) {
//         const roundArray = bracket["winners"].get(winnerRounds[i]);
//         const placesArray = [];

//         for (let j = 0; j < roundArray.length; j++) {
//           const loserId = String(roundArray[j]?.loser?._id);

//           // Skip if this player has already been assigned a place
//           if (assignedPlayers.has(loserId)) {
//             continue;
//           }

//           placesArray.push(roundArray[j]?.loser);
//           assignedPlayers.add(loserId);
//         }

//         if (placesArray.length > 0) {
//           finishingOrder[places++] = placesArray;
//         }
//       }
//     } else {
//       // Double elimination - places determined by WINNERS BRACKET elimination order only

//       // 1st and 2nd place from finals
//       if (bracket["finals"][1]) {
//         // Grand finals reset happened
//         finishingOrder[`${places++}`] = [bracket["finals"][1].winner];
//         finishingOrder[`${places++}`] = [bracket["finals"][1].loser];
//         assignedPlayers.add(String(bracket["finals"][1].winner?._id));
//         assignedPlayers.add(String(bracket["finals"][1].loser?._id));
//       } else {
//         // Regular grand finals
//         finishingOrder[`${places++}`] = [bracket["finals"][0].winner];
//         finishingOrder[`${places++}`] = [bracket["finals"][0].loser];
//         assignedPlayers.add(String(bracket["finals"][0].winner?._id));
//         assignedPlayers.add(String(bracket["finals"][0].loser?._id));
//       }

//       // Get remaining places from WINNERS BRACKET elimination order (reverse chronological)
//       const winnerRounds = Array.from(bracket["winners"].keys());

//       // Start from the last round and work backwards
//       for (let i = winnerRounds.length - 1; i >= 0; i--) {
//         const roundArray = bracket["winners"].get(winnerRounds[i]);
//         const placesArray = [];

//         for (let j = 0; j < roundArray.length; j++) {
//           const loserId = String(roundArray[j]?.loser?._id);

//           // Skip if this player has already been assigned a place
//           if (assignedPlayers.has(loserId)) {
//             continue;
//           }

//           placesArray.push(roundArray[j]?.loser);
//           assignedPlayers.add(loserId);
//         }

//         if (placesArray.length > 0) {
//           // Assign places based on elimination round
//           // Later elimination = better placement
//           finishingOrder[places] = placesArray;
//           places += placesArray.length;
//         }
//       }
//     }

//     // Get all player IDs from all places
//     const playerIds = [];
//     Object.keys(finishingOrder).forEach(place => {
//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             playerIds.push(player._id.toString());
//           }
//         });
//       }
//     });

//     // Fetch match history for these players
//     const matches = await Match.find({
//       tournamentId: tournamentId,
//       $or: [
//         { player1: { $in: playerIds } },
//         { player2: { $in: playerIds } }
//       ],
//       status: "Completed"
//     })
//     .populate('player1', 'name')
//     .populate('player2', 'name')
//     .populate('winner', 'name')
//     .populate('loser', 'name')
//     .sort({ round: 1 });

//     // Create match history map for each player
//     const playerMatchHistory = {};

//     playerIds.forEach(playerId => {
//       playerMatchHistory[playerId] = [];
//     });

//     matches.forEach(match => {
//       const player1Id = match.player1?._id?.toString();
//       const player2Id = match.player2?._id?.toString();
//       const winnerId = match.winner?._id?.toString();
//       const matchId = match.matchId;

//       if (player1Id && playerIds.includes(player1Id)) {
//         // Check if this match is already recorded for this player
//         const existingMatch = playerMatchHistory[player1Id].find(m => m.matchId === matchId);
//         if (!existingMatch) {
//           playerMatchHistory[player1Id].push({
//             matchId: match.matchId,
//             opponent: match.player2?.name || 'Unknown',
//             result: winnerId === player1Id ? 'W' : 'L',
//             score: `${match.score.player1Score}-${match.score.player2Score}`,
//             round: match.round,
//             side: match.side
//           });
//         }
//       }

//       if (player2Id && playerIds.includes(player2Id)) {
//         // Check if this match is already recorded for this player
//         const existingMatch = playerMatchHistory[player2Id].find(m => m.matchId === matchId);
//         if (!existingMatch) {
//           playerMatchHistory[player2Id].push({
//             matchId: match.matchId,
//             opponent: match.player1?.name || 'Unknown',
//             result: winnerId === player2Id ? 'W' : 'L',
//             score: `${match.score.player2Score}-${match.score.player1Score}`,
//             round: match.round,
//             side: match.side
//           });
//         }
//       }
//     });

//     // Sort and organize match history by bracket sides
//     Object.keys(playerMatchHistory).forEach(playerId => {
//       const matches = playerMatchHistory[playerId];

//       // Separate matches by bracket side
//       const winnersSide = matches.filter(match => match.side === 'winners').sort((a, b) => a.round - b.round);
//       const losersSide = matches.filter(match => match.side === 'losers').sort((a, b) => a.round - b.round);
//       const finalsSide = matches.filter(match => match.side === 'finals').sort((a, b) => a.round - b.round);

//       // Combine in order: winners, losers, finals
//       playerMatchHistory[playerId] = [...winnersSide, ...losersSide, ...finalsSide];
//     });

//     // Format results with match history
//     const results = [];

//     // Process all places in finishing order
//     Object.keys(finishingOrder).forEach(place => {
//       const placeNumber = parseInt(place);

//       if (finishingOrder[place]) {
//         finishingOrder[place].forEach(player => {
//           if (player && player._id) {
//             const playerId = player._id.toString();
//             const matchHistory = playerMatchHistory[playerId] || [];

//             // Calculate sets won (only counting winners bracket matches for placement logic)
//             const winnersMatches = matchHistory.filter(match => match.side === 'winners');
//             const setsWon = matchHistory.filter(match => match.result === 'W').length;
//             const winnersSetsWon = winnersMatches.filter(match => match.result === 'W').length;

//             results.push({
//               place: placeNumber,
//               playerId: player._id,
//               name: player.name,
//               setsWon: setsWon,
//               winnersBracketSetsWon: winnersSetsWon, // Added this for clarity
//               matchHistory: matchHistory,
//               eliminationSource: isSingleElimination ? 'single_elimination' : 'winners_bracket' // Track elimination source
//             });
//           }
//         });
//       }
//     });

//     // Sort results by place
//     results.sort((a, b) => a.place - b.place);

//     return res.status(200).json({
//       status: true,
//       message: "Tournament results fetched successfully",
//       tournamentType: isSingleElimination ? 'single_elimination' : 'double_elimination',
//       placementRule: "Places determined by elimination order in Winners Bracket only",
//       results: results
//     });

//   } catch (error) {
//     if (error instanceof ZodError) {
//       const errors = formatError(error);
//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     logger.error(error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const getTicketResponses = async (req, res) => {
//   try {
//     const { ticketId } = req.params;
//      console.log("this is the ticket id" , ticketId);
//     // Validate ticketId format
//     if (!mongoose.Types.ObjectId.isValid(ticketId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid ticket ID format'
//       });
//     }

//     // Find the ticket with proper population
//     const ticket = await SupportTicket.findById(ticketId)
//       .populate('user', 'name email')
//       .populate('responses.responder', 'name email role')
//       .lean();

//     if (!ticket) {
//       return res.status(404).json({
//         success: false,
//         message: 'Ticket not found'
//       });
//     }

//     // Format the response according to your database structure
//     const responseData = {
//       ticketId: ticket._id,
//       subject: ticket.subject,
//       status: ticket.status,
//       createdAt: ticket.createdAt,
//       responses: ticket.responses.map(response => ({
//         id: response._id,
//         message: response.message,
//         responder: response.responder ? { // Only if you have responders
//           id: response.responder._id,
//           name: response.responder.name,
//           email: response.responder.email,
//           role: response.responder.role
//         } : null,
//         createdAt: response.createdAt
//       }))
//     };

//     res.status(200).json({
//       success: true,
//       data: responseData
//     });

//   } catch (error) {
//     console.error('Error fetching ticket responses:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching ticket responses',
//       error: error.message
//     });
//   }
// };

const getTicketResponses = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Validate ticketId format
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID format",
      });
    }

    // Find the ticket with proper population
    const ticket = await SupportTicket.findById(ticketId)
      .populate("user", "name email")
      .populate("responses.responder", "name email role")
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Format the response including status for each response
    const responseData = {
      ticketId: ticket._id,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      responses: ticket.responses.map((response) => ({
        id: response._id,
        message: response.message,
        status: response.status, // Include the individual response status
        responder: response.responder
          ? {
              id: response.responder._id,
              name: response.responder.name,
              email: response.responder.email,
              role: response.responder.role,
            }
          : null,
        createdAt: response.createdAt,
      })),
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching ticket responses:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching ticket responses",
      error: error.message,
    });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status = "pending", subject, description } = req.body;

    // Validate inputs
    if (!ticketId) {
      return res.status(400).json({
        status: false,
        message: "ticketId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid ticket ID format",
      });
    }

    // Check user permissions
    const userRole = await roleModel.findById(req.user.roleId);
    if (userRole.name !== "Admin") {
      return res.status(403).json({
        status: false,
        message: "Unauthorized - Only Admins can update tickets",
      });
    }

    // Get current ticket to verify it exists
    const currentTicket = await SupportTicket.findById(ticketId);
    if (!currentTicket) {
      return res.status(404).json({
        status: false,
        message: "Ticket not found",
      });
    }

    // Create response object with status tracking
    const responseEntry = {
      message: description,
      responder: req.user._id,
      status: status, // Store the status at time of response
      createdAt: new Date(),
    };

    // Update ticket with new status and response
    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      {
        $set: {
          status,
          subject,
          updatedAt: new Date(),
        },
        $push: {
          responses: responseEntry,
        },
      },
      { new: true }
    )
      .populate("user", "name email")
      .populate("responses.responder", "name email");

    return res.status(200).json({
      status: true,
      message: "Ticket updated successfully",
      data: {
        ticketId: updatedTicket._id,
        subject: updatedTicket.subject,
        status: updatedTicket.status,
        responses: updatedTicket.responses.map((res) => ({
          id: res._id,
          message: res.message,
          status: res.status, // Include individual response status
          responder: res.responder
            ? {
                id: res.responder._id,
                name: res.responder.name,
                email: res.responder.email,
              }
            : null,
          createdAt: res.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// const swapPlayersMatches = async (req, res) => {
//   try {
//     const {
//       sourceMatchId,
//       sourcePlayerPosition,
//       targetMatchId,
//       targetPlayerPosition,
//     } = req.body;

//     // Input validation
//     if (
//       !sourceMatchId ||
//       !sourcePlayerPosition ||
//       !targetMatchId ||
//       !targetPlayerPosition
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "All fields are required: sourceMatchId, sourcePlayerPosition, targetMatchId, targetPlayerPosition",
//       });
//     }

//     // Validate player positions
//     const validPositions = ["player1", "player2"];
//     if (
//       !validPositions.includes(sourcePlayerPosition) ||
//       !validPositions.includes(targetPlayerPosition)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           'Invalid player position. Must be either "player1" or "player2"',
//       });
//     }

//     // Validate ObjectId format
//     if (
//       !mongoose.Types.ObjectId.isValid(sourceMatchId) ||
//       !mongoose.Types.ObjectId.isValid(targetMatchId)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid match ID format",
//       });
//     }

//     // Prevent swapping within the same match
//     if (sourceMatchId === targetMatchId) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot swap players within the same match",
//       });
//     }

//     // Find both matches
//     const [sourceMatch, targetMatch] = await Promise.all([
//       Match.findById(sourceMatchId),
//       Match.findById(targetMatchId),
//     ]);

//     // Check if both matches exist
//     if (!sourceMatch) {
//       return res.status(404).json({
//         success: false,
//         message: "Source match not found",
//       });
//     }

//     if (!targetMatch) {
//       return res.status(404).json({
//         success: false,
//         message: "Target match not found",
//       });
//     }

//     // Check if either match has started (has a table assigned)
//     if (sourceMatch.table) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot swap players - source match has already started",
//       });
//     }

//     if (targetMatch.table) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot swap players - target match has already started",
//       });
//     }

//     if (sourceMatch.status == "Completed") {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot swap players - source match has already completed",
//       });
//     }

//     if (targetMatch.status == "Completed") {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot swap players - target match has already completed",
//       });
//     }

//     if (
//       sourceMatch.round != targetMatch.round ||
//       sourceMatch.side != targetMatch.side
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Source and target match should be from the same side and same round",
//       });
//     }

//     // Check if both matches have players in the specified positions
//     if (!sourceMatch[sourcePlayerPosition]) {
//       return res.status(400).json({
//         success: false,
//         message: `No player found in ${sourcePlayerPosition} position of source match`,
//       });
//     }

//     if (!targetMatch[targetPlayerPosition]) {
//       return res.status(400).json({
//         success: false,
//         message: `No player found in ${targetPlayerPosition} position of target match`,
//       });
//     }

//     // Get the players to swap
//     const sourcePlayer = sourceMatch[sourcePlayerPosition];
//     const targetPlayer = targetMatch[targetPlayerPosition];

//     // Perform the swap using a transaction to ensure atomicity
//     // const session = await mongoose.startSession();
//     // session.startTransaction();

//     try {
//       // Update source match
//       await Match.findByIdAndUpdate(
//         sourceMatchId,
//         { [sourcePlayerPosition]: targetPlayer }
//         // { session, new: true }
//       );

//       // Update target match
//       await Match.findByIdAndUpdate(
//         targetMatchId,
//         { [targetPlayerPosition]: sourcePlayer }
//         // { session, new: true }
//       );

//       // await session.commitTransaction();

//       // Fetch updated matches with populated player data
//       const [updatedSourceMatch, updatedTargetMatch] = await Promise.all([
//         Match.findById(sourceMatchId).populate("player1 player2"),
//         Match.findById(targetMatchId).populate("player1 player2"),
//       ]);

//       return res.status(200).json({
//         success: true,
//         message: "Players swapped successfully",
//         data: {
//           sourceMatch: updatedSourceMatch,
//           targetMatch: updatedTargetMatch,
//         },
//       });
//     } catch (transactionError) {
//       // await session.abortTransaction();
//       throw transactionError;
//     } finally {
//       // session.endSession();
//     }
//   } catch (error) {
//     console.error("Error swapping players:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error while swapping players",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

module.exports = {
  // swapPlayersMatches,
  createTicket,
  deleteTicket,
  getAllTicket,
  assignOpenTablesToMatch,
  cancelTableAssignedToAMatch,
  createTournament,
  startTournament,
  editTournamentSignupPlayerDetails,
  resetTournamentController,
  deleteTournamentController,
  matchResultController,
  getBracketController,
  getAllTournamentBasedOnStatus,
  getAllParticipatedTournament,
  getAllCreatedTournaments,
  getAllnonByeIncompleteMatches,
  shuffleIncompleteMatches,
  assignTablesToMatch,
  getTournamentInfo,
  matchSummaryController,
  tournamentParticipantController,
  tournamentParticipantStatusBulkUpdate,
  tournamentParticipantPaidStatusBulkUpdate,
  downloadExcelReportOfMatchSummary,
  TournamentSignupUser,
  addPlayerToTournament,
  removePlayerFromTournament,
  getlistofWaitingplayers,
  addMultiplePlayersToTournament,
  tournamentPlayerDetails,
  tournamentFinishingOrder,
  updateTournament,
  getAllTournamentAdminBasedOnStatus,
  downloadUserInformation,
  getAllTicketAdmin,
  updateTicketStatus,
  getTournamentWithMostTraffic,
  getAllTournamentBasedOnStatusForGuest,
  separatetoutnament,
  getTournamentInfoWithoutPopulate,
  tournamentResults,
  getTicketResponses,
};
