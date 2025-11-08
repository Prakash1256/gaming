const Venue = require("../models/venue.model");
const { ZodError } = require("zod");
const logger = require("../utils/logger");
const Match = require("../models/match.model");
const { formatError } = require("../utils/FormatZodError");
const {
  createVenueSchema,
  updateTableSchema,
} = require("../schemas/VenueSchema");
const { CreateTableSchema } = require("../schemas/VenueSchema");
const TimeZone = require("../models/timezone.model");
const Table = require("../models/tabel.model");
const venueService = require("../services/venue.service");
const Tournament = require("../models/tournament.model");
const Booking = require("../models/booking.model");
const matchModel = require("../models/match.model");
const roleModel = require("../models/role.model");
const {
  getAvailableTableListForTournament,
} = require("../services/tournament.service");
const bookingModel = require("../models/booking.model");

//venue controllers

// const createVenueController = async (req, res) => {
//   try {
//     const body = req.body;

//     createVenueSchema.parse(body);

//     //check if timeZone exists
//     const time = await TimeZone.findById(body.timeZone);

//     if (!time) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid timeZone",
//       });
//     }

//     // create venue

//     // check for duplicacy

//     const venueInDB = await Venue.findOne({
//       latitude: body.latitude,
//       longitude: body.longitude,
//       name: body.name,
//     });

//     if (venueInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "Duplicate entries not allowed for venues",
//       });
//     }

//     const venue = new Venue({ ...body, managerId: req.user.id });
//     await venue.save();

//     return res.status(200).json({
//       message: "Venue Created Successfully",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

// const deleteVenueController = async (req, res) => {
//   try {
//     const { venueId } = req.params;

//     if (!venueId) {
//       return res.status(400).json({
//         status: 400,
//         message: "Venue Id is required",
//       });
//     }

//     const venue = await Venue.findById(venueId);

//     if (!venue) {
//       return res.status(400).json({
//         status: 400,
//         message: "Venue does not exists",
//       });
//     }

//     if (venue.managerId != req.user?.id) {
//       return res.status(401).json({
//         status: 401,
//         message: "Unauthorized",
//       });
//     }

//     if (venue.tables?.length > 0) {
//       await Table.deleteMany({ _id: { $in: venue.tables } });
//     }

//     await Venue.findByIdAndDelete(venue._id);

//     return res.status(200).json({
//       status: true,
//       message: "Venue deleted successfully",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

// const getAllVenues = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

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

//     const venues = await Venue.find()
//       .skip((pageNumber - 1) * limitNumber)
//       .limit(limitNumber);

//     const totalVenues = await Venue.countDocuments();

//     return res.status(200).json({
//       status: true,
//       message: "Venues retrieved successfully",
//       data: venues,
//       pagination: {
//         total: totalVenues,
//         page: pageNumber,
//         limit: limitNumber,
//         totalPages: Math.ceil(totalVenues / limitNumber),
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
//     console.log("Something went wrong while retrieving venues", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

// const updateVenueController = async (req, res) => {
//   try {
//     const { venueId } = req.params;
//     const body = req.body;

//     createVenueSchema.parse(body);

//     // Check if venue exists
//     const venue = await Venue.findById(venueId);
//     if (!venue) {
//       return res.status(404).json({
//         status: false,
//         message: "Venue not found",
//       });
//     }

//     // Check if timeZone exists
//     if (body.timeZone) {
//       const time = await TimeZone.findById(body.timeZone);
//       if (!time) {
//         return res.status(400).json({
//           status: false,
//           message: "Invalid timeZone",
//         });
//       }
//     }

//     // Update venue
//     await Venue.findByIdAndUpdate(venueId, body, { new: true });

//     return res.status(200).json({
//       message: "Venue Updated Successfully",
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
//     console.log("Something went wrong while updating venue", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

// table controllers

// const createTableController = async (req, res) => {
//   try {
//     const body = req.body;

//     CreateTableSchema.parse(body);

//     const venue = await Venue.findById(body.venueId);

//     const userRole = await roleModel.findById(req.user.roleId);

//     if (String(venue?.managerId) != String(req.user?.id)) {
//       if (userRole.name != "Admin") {
//         return res.status(401).json({
//           status: false,
//           message: "Unauthorized",
//         });
//       }
//     }

//     if (!venue) {
//       return res.status(400).json({
//         status: false,
//         message: "Venue does not exists",
//       });
//     }

//     const table = new Table({
//       ...body,
//     });

//     await table.save();

//     venue.tables.push(table._id);

//     await venue.save();

//     return res.status(200).json({
//       status: true,
//       message: "Table has been created successfully",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

// const deleteTableController = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         status: false,
//         message: "Table Id is required",
//       });
//     }

//     const table = await Table.findById(id);

//     if (!table) {
//       return res.status(404).json({
//         status: false,
//         message: "Table not found",
//       });
//     }

//     const venue = await Venue.findById(table.venueId);

//     // if (String(venue.managerId) != String(req.user?.id)) {
//     //   return res.status(403).json({
//     //     status: false,
//     //     message: "You are not authorized to delete this table ",
//     //   });
//     // }

//     const userRole = await roleModel.findById(req.user.roleId);

//     if (String(venue?.managerId) != String(req.user?.id)) {
//       if (userRole.name != "Admin") {
//         return res.status(401).json({
//           status: false,
//           message: "Unauthorized",
//         });
//       }
//     }

//     await Table.findByIdAndDelete(table?._id);

//     return res.status(200).json({
//       status: true,
//       message: "Table deleted successfully",
//     });
//   } catch (error) {
//     logger.error(error);
//     console.log("Something went wrong while registered user", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

// const updateTableController = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const body = req.body;

//     updateTableSchema.parse(body);

//     if (!id) {
//       return res.status(200).json({
//         status: false,
//         message: "Id is missing",
//       });
//     }

//     //get the table data

//     const table = await Table.findById(id);

//     if (!table) {
//       return res.status(404).json({
//         status: false,
//         message: "table not found",
//       });
//     }

//     // get the venue details

//     const venue = await Venue.findById(table.venueId);

//     if (!venue) {
//       return res.status(404).json({
//         status: false,
//         message: "Venue not found",
//       });
//     }

//     // check the maanger id and the current user id

//     // if (String(venue.managerId) != String(req.user?.id)) {
//     //   return res.status(401).json({
//     //     status: false,
//     //     message: "you are not authorized",
//     //   });
//     // }

//     const userRole = await roleModel.findById(req.user.roleId);

//     if (String(venue?.managerId) != String(req.user?.id)) {
//       if (userRole.name != "Admin") {
//         return res.status(401).json({
//           status: false,
//           message: "Unauthorized",
//         });
//       }
//     }

//     await Table.findByIdAndUpdate(table._id, { ...body });

//     return res.status(200).json({
//       status: true,
//       message: "Table details updated successfullt",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

// const getAllTablesInVenue = async (req, res) => {
//   try {
//     const { venueId } = req.params;

//     if (!venueId) {
//       return res.status().json({
//         status: 400,
//         message: "This message ",
//       });
//     }

//     const tables = await Table.find({ venueId });

//     return res.status().json({
//       status: true,
//       message: "All tables of the Venue fethched successfully",
//       tables,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

// const getAllTablesInVenuWithStatus = async (req, res) => {
//   try {
//     const { venueId, tournamentId } = req.params;

//     if (!venueId) {
//       return res.status(400).json({
//         status: false,
//         message: "Venue Id is required",
//       });
//     }

//     if(!tournamentId){
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required"
//       });
//     }

//     const venueInDB = await Venue.findById(venueId);
//     const tournamentInDB = await Tournament.findById(tournamentId);

//     if (!venueInDB) {
//       return res.status(404).json({
//         status: false,
//         message: "Venue not found",
//       });
//     }

//     if(!tournamentInDB){
//       return res.status(404).json(
//         {
//           status: false,
//           message: "Venue not found",
//         }
//       );
//     }

//     const tables = await venueService.getTableStatusesForVenue(venueId, tournamentId);

//     return res.status(200).json({
//       status: true,
//       message: "Tables in a venue fetched successfully",
//       tables,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

// const bookTableInAVenue = async (req, res) => {
//   try {
//     const { tournamentId, venueId, tableId } = req.params;

//     if (!tournamentId || !venueId || !tableId) {
//       return res.status(400).json({
//         status: 400,
//         message: "Tournament Id, venueId, tableId is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);
//     const venueInDB = await Venue.findById(venueId);
//     const tableInDB = await Table.findById(tableId);

//     if (!tournamentInDB) {
//       return res.status(404).json({
//         status: false,
//         message: "Tournament not found",
//       });
//     }

//     if (
//       !venueInDB ||
//       String(tournamentInDB.tournamentLocation) != String(venueInDB._id)
//     ) {
//       return res.status(400).json({
//         status: false,
//         message: "Venue not valid",
//       });
//     }

//     if (!tableInDB || String(tableInDB.venueId) != String(venueInDB._id)) {
//       return res.status(400).json({
//         status: false,
//         message: "table not valid",
//       });
//     }

//     if (req.user?.id != tournamentInDB?.managerId) {
//       return res.status(401).json({
//         status: false,
//         message: "unauthorized",
//       });
//     }

//     const bookedTable = await bookingModel.create({
//       tableId: tableId,
//       tournamentId: tournamentId,
//       bookingDate: Date.now(),
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       status: false,
//       message: "Table booked successfully",
//       bookedTable,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

// const bookTableInAVenue = async (req, res) => {
//   try {
//     const { tournamentId, tableId } = req.params;

//     if (!tournamentId || !tableId) {
//       return res.status(400).json({
//         status: 400,
//         message: "Tournament Id, venueId, tableId is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);

//     const tableInDB = await Table.findById(tableId);

//     if (!tournamentInDB) {
//       return res.status(404).json({
//         status: false,
//         message: "Tournament not found",
//       });
//     }

//     const venueInDB = await Venue.findById(tournamentInDB?.tournamentLocation);

//     if (
//       !venueInDB ||
//       String(tournamentInDB.tournamentLocation) != String(venueInDB._id)
//     ) {
//       return res.status(400).json({
//         status: false,
//         message: "Venue not valid",
//       });
//     }

//     if (!tableInDB || String(tableInDB.venueId) != String(venueInDB._id)) {
//       return res.status(400).json({
//         status: false,
//         message: "table not valid",
//       });
//     }

//     // if (req.user?.id != tournamentInDB?.managerId) {
//     //   return res.status(401).json({
//     //     status: false,
//     //     message: "unauthorized",
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

//     const bookingInDb = await Booking.findOne({ tableId });

//     if (bookingInDb) {
//       return res.status(400).json({
//         status: false,
//         message: "table already booked",
//       });
//     }
//     const bookedTable = await Booking.create({
//       tableId: tableId,
//       tournamentId: tournamentId,
//       bookingDate: Date.now(),
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       status: false,
//       message: "Table booked successfully",
//       bookedTable,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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
// const deleteTableBookings = async (req, res) => {
//   try {
//     const { tournamentId, tableId } = req.params;

//     if (!tournamentId || !tableId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id and TableId is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);
//     const tableInDb = await Table.findById(tableId);

//     if (!tournamentInDB) {
//       return res.status(404).json({
//         status: false,
//         message: "Tournament not found",
//       });
//     }

//     if (
//       !tableInDb ||
//       String(tableInDb.venueId) != String(tournamentInDB.tournamentLocation)
//     ) {
//       return res.status(400).json({
//         status: false,
//         message: "Incorrect booking",
//       });
//     }

//     //check if the user is the manager

//     // if (String(req.user.id) != String(tournamentInDB.managerId)) {
//     //   return res.status(403).json({
//     //     status: false,
//     //     message: "You are not authorized to perform this action",
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
//     // if table is already assigned to a match then dont delete the bookings

//     const matches = await Match.findOne({
//       table: tableInDb._id,
//     });

//     if (matches) {
//       return res.status(400).json({
//         status: false,
//         message: "Table Assigned to an ongoing Match",
//       });
//     }

//     const deletedBookingInDB = await Booking.findOneAndDelete({
//       tableId: tableId,
//       tournamentId: tournamentId,
//     });

//     if (!deletedBookingInDB) {
//       return res.status(200).json({
//         status: false,
//         message: "no bookings to delete",
//       });
//     }

//     return res.status(200).json({
//       status: true,
//       message: "Table booking removed successfully",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

// // const getAllBookingOfAtournament = async (req, res) => {
// //   try {

// //     const {tournamentId} = req.params;

// //     if(!tournamentId){
// //       return res.status(400).json(
// //         {
// //           status: false,
// //           message: "Tournament Id is required"
// //         }
// //       )
// //     }

// //     const tournament = await Tournament.findById(tournamentId);

// //     if(!tournament){
// //       return res.status(400).json(
// //         {
// //           status: false,
// //           message:"Tournament does not exists"
// //         }
// //       )
// //     }

// //     const bookings = await bookingModel.find({tournamentId});

// //     return res.status(200).json(
// //       {
// //         status: true,
// //         message:"Bookings fetched",
// //         bookings
// //       }
// //     );

// //   } catch (error) {
// //     if (error instanceof ZodError) {
// //       // console.log(error);
// //       const errors = formatError(error);

// //       return res.status(422).json({
// //         status: false,
// //         message: "Invalid Data",
// //         errors: errors,
// //       });
// //     }

// //     logger.error(error);
// //     console.log("Something went wrong while registered user", error);
// //     return res.status(500).json({
// //       status: false,
// //       message: "Something went wrong please try again",
// //       error: error.message,
// //     });
// //   }
// // };

// const getAllBookingOfAtournament = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournament = await Tournament.findById(tournamentId);

//     if (!tournament) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament does not exist",
//       });
//     }

//     const bookings = await bookingModel.find({ tournamentId });

//     if (!bookings.length) {
//       return res.status(200).json({
//         status: true,
//         message: "No bookings found",
//         data: {},
//       });
//     }

//     // Group bookings by tableId
//     const groupedData = {};

//     for (let booking of bookings) {
//       const tableId = booking.tableId.toString();

//       if (!groupedData[tableId]) {
//         // Fetch match info once per tableId
//         const match = await Match.findOne({ tableId });

//         groupedData[tableId] = {
//           match: match || null,
//           bookings: [],
//         };
//       }

//       groupedData[tableId].bookings.push(booking);
//     }

//     return res.status(200).json({
//       status: true,
//       message: "Bookings with matches fetched",
//       data: groupedData,
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
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

// const getListOFAvailablesTablesInATournament = async (req, res) => {
//   try {
//     const { tournamentId } = req.params;

//     if (!tournamentId) {
//       return res.status(400).json({
//         status: false,
//         message: "Tournament Id is required",
//       });
//     }

//     const tournament = await Tournament.findById(tournamentId);

//     if (!tournament) {
//       return res.status(404).json({
//         status: false,
//         message: "Tournament not found",
//       });
//     }

//     // get all bookings

//     // if (String(req.user.id) != String(tournament.managerId)) {
//     //   return res.status(401).json({
//     //     status: false,
//     //     message: "Unauthorized",
//     //   });
//     // }

//     const userRole = await roleModel.findById(req.user.roleId);

//     if (String(tournament?.managerId) != String(req.user?.id)) {
//       if (userRole.name != "Admin") {
//         return res.status(401).json({
//           status: false,
//           message: "Unauthorized",
//         });
//       }
//     }

//     const tableList = await getAvailableTableListForTournament(tournament);

//     // console.log(tableList);
//     return res.status(200).json({
//       status: true,
//       message: "List of available tables fetched successfully",
//       tableList,
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
//       message: "Something went wrong, please try again",
//       error: error.message,
//     });
//   }
// };

const AllVenues = async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "Venues retrieved successfully",
      data: venues,
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
    console.log("Something went wrong while retrieving venues", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

const createVenueController = async (req, res) => {
  try {
    const body = req.body;

    createVenueSchema.parse(body);

    //check if timeZone exists
    const time = await TimeZone.findById(body.timeZone);

    if (!time) {
      return res.status(400).json({
        status: false,
        message: "Invalid timeZone",
      });
    }

    // create venue

    // check for duplicacy

    const venueInDB = await Venue.findOne({
      latitude: body.latitude,
      longitude: body.longitude,
      name: body.name,
    });

    if (venueInDB) {
      return res.status(400).json({
        status: false,
        message: "Duplicate entries not allowed for venues",
      });
    }

    const userRole = await roleModel.findById(req.user.roleId);
    
        // console.log(userRole);
        if(userRole.name != "Admin" && userRole.name != "Manager"){
          return res.status(400).json(
            {
              status:false,
              message:"permission denied"
            }
          );
        }
        

    const venue = new Venue({ ...body, managerId: req.user.id });
    await venue.save();

    return res.status(200).json({
      message: "Venue Created Successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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

const deleteVenueController = async (req, res) => {
  try {
    const { venueId } = req.params;

    if (!venueId) {
      return res.status(400).json({
        status: 400,
        message: "Venue Id is required",
      });
    }

    const venue = await Venue.findById(venueId);

    if (!venue) {
      return res.status(400).json({
        status: 400,
        message: "Venue does not exists",
      });
    }

    // if (venue.managerId != req.user?.id) {
    //   return res.status(401).json({
    //     status: 401,
    //     message: "Unauthorized",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(venue?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Your are not authorized to edit this venue",
        });
      }
    }

   

    const tournaments = await Tournament.find({
      tournamentLocation: venue._id,
      status: { $ne: "completed" },
    });

    if(tournaments.length > 0){
      return res.status(400).json(
        {
          status:false,
          message:"This venue cannot be deleted because it is currently associated with an active tournament"
        }
      )
    }


     if (venue.tables?.length > 0) {
      await Table.deleteMany({ _id: { $in: venue.tables } });
    }

    await Venue.findByIdAndDelete(venue._id);

    return res.status(200).json({
      status: true,
      message: "Venue deleted successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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

const getAllVenues = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (
      isNaN(pageNumber) ||
      isNaN(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid pagination parameters",
      });
    }

    // const venues = await Venue.find()
    //   .skip((pageNumber - 1) * limitNumber)
    //   .limit(limitNumber);

    const venues = await Venue.find()
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const totalVenues = await Venue.countDocuments();

    return res.status(200).json({
      status: true,
      message: "Venues retrieved successfully",
      data: venues,
      pagination: {
        total: totalVenues,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalVenues / limitNumber),
      },
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
    console.log("Something went wrong while retrieving venues", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

const updateVenueController = async (req, res) => {
  try {
    const { venueId } = req.params;
    const body = req.body;

    createVenueSchema.parse(body);

    // Check if venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        status: false,
        message: "Venue not found",
      });
    }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(venue?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Your are not authorized to edit this venue",
        });
      }
    }

    // Check if timeZone exists
    if (body.timeZone) {
      const time = await TimeZone.findById(body.timeZone);
      if (!time) {
        return res.status(400).json({
          status: false,
          message: "Invalid timeZone",
        });
      }
    }

    // Update venue
    await Venue.findByIdAndUpdate(venueId, body, { new: true });

    return res.status(200).json({
      message: "Venue Updated Successfully",
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
    console.log("Something went wrong while updating venue", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

// table controllers

const createTableController = async (req, res) => {
  try {
    const body = req.body;

    CreateTableSchema.parse(body);

    const venue = await Venue.findById(body.venueId);

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(venue?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Your are not authorized to add table in this venue",
        });
      }
    }

    if (!venue) {
      return res.status(400).json({
        status: false,
        message: "Venue does not exists",
      });
    }

    const table = new Table({
      ...body,
    });

    await table.save();

    venue.tables.push(table._id);

    await venue.save();

    return res.status(200).json({
      status: true,
      message: "Table has been created successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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

// const deleteTableController = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({
//         status: false,
//         message: "Table Id is required",
//       });
//     }

//     const table = await Table.findById(id);

//     if (!table) {
//       return res.status(404).json({
//         status: false,
//         message: "Table not found",
//       });
//     }

//     const venue = await Venue.findById(table.venueId);

//     // if (String(venue.managerId) != String(req.user?.id)) {
//     //   return res.status(403).json({
//     //     status: false,
//     //     message: "You are not authorized to delete this table ",
//     //   });
//     // }

//     const userRole = await roleModel.findById(req.user.roleId);

//     if (String(venue?.managerId) != String(req.user?.id)) {
//       if (userRole.name != "Admin") {
//         return res.status(401).json({
//           status: false,
//           message: "You are not authorized to delete this table",
//         });
//       }
//     }

//     //check if the table is in use

//     const match = await Match.findOne(
//       {
//         table:table?._id
//       }
//     )

//     if(match) {
//       return res.status(400).json(
//         {
//           status: false,
//           message: "The table is already in use"
//         }
//       );
//     }

//     await Table.findByIdAndDelete(table?._id);
//     await bookingModel.deleteMany({tableId:table?._id});

//     return res.status(200).json({
//       status: true,
//       message: "Table deleted successfully",
//     });
//   } catch (error) {
//     logger.error(error);
//     console.log("Something went wrong while registered user", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

const deleteTableController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Table Id is required",
      });
    }

    const table = await Table.findById(id);

    if (!table) {
      return res.status(404).json({
        status: false,
        message: "Table not found",
      });
    }

    const venue = await Venue.findById(table.venueId);
    if (!venue) {
      return res.status(404).json({
        status: false,
        message: "Venue not found for this table",
      });
    }

    const userRole = await roleModel.findById(req.user.roleId);

    // Authorization: either manager or admin
    if (String(venue.managerId) !== String(req.user?.id)) {
      if (userRole?.name !== "Admin") {
        return res.status(401).json({
          status: false,
          message: "You are not authorized to delete this table",
        });
      }
    }

    // Check for existing match using the table
    const match = await Match.findOne({ table: table._id });
    if (match) {
      return res.status(400).json({
        status: false,
        message: "The table is already in use for a match",
      });
    }

    // Check for existing bookings on this table
    const bookingExists = await bookingModel.exists({ tableId: table._id });
    if (bookingExists) {
      return res.status(400).json({
        status: false,
        message: "The table has active or past bookings and cannot be deleted",
      });
    }

    // Remove table reference from venue.tables array
    await Venue.findByIdAndUpdate(table.venueId, {
      $pull: { tables: table._id },
    });

    // Delete the table
    await Table.findByIdAndDelete(table._id);

    // (Optional) Cleanup bookings if needed (should be empty already)
    await bookingModel.deleteMany({ tableId: table._id });

    return res.status(200).json({
      status: true,
      message: "Table deleted successfully",
    });
  } catch (error) {
    logger.error(error);
    console.error("Error deleting table:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong. Please try again.",
      error: error.message,
    });
  }
};

const updateTableController = async (req, res) => {
  try {
    const { id } = req.params;

    const body = req.body;

    updateTableSchema.parse(body);

    if (!id) {
      return res.status(200).json({
        status: false,
        message: "Id is missing",
      });
    }

    //get the table data

    const table = await Table.findById(id);

    if (!table) {
      return res.status(404).json({
        status: false,
        message: "table not found",
      });
    }

    // get the venue details

    const venue = await Venue.findById(table.venueId);

    if (!venue) {
      return res.status(404).json({
        status: false,
        message: "Venue not found",
      });
    }

    // check the maanger id and the current user id

    // if (String(venue.managerId) != String(req.user?.id)) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "you are not authorized",
    //   });
    // }

    const userRole = await roleModel.findById(req.user.roleId);

    if (String(venue?.managerId) != String(req.user?.id)) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    await Table.findByIdAndUpdate(table._id, { ...body });

    return res.status(200).json({
      status: true,
      message: "Table details updated successfullt",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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

const getAllTablesInVenue = async (req, res) => {
  try {
    const { venueId } = req.params;

    if (!venueId) {
      return res.status().json({
        status: 400,
        message: "This message ",
      });
    }

    const tables = await Table.find({ venueId });

    return res.status().json({
      status: true,
      message: "All tables of the Venue fethched successfully",
      tables,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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

const getAllTablesInVenuWithStatus = async (req, res) => {
  try {
    const { venueId, tournamentId } = req.params;

    if (!venueId) {
      return res.status(400).json({
        status: false,
        message: "Venue Id is required",
      });
    }

    const venueInDB = await Venue.findById(venueId);

    if (!venueInDB) {
      return res.status(404).json({
        status: false,
        message: "Venue not found",
      });
    }

    const tables = await venueService.getTableStatusesForVenue(
      venueId,
      tournamentId
    );

    return res.status(200).json({
      status: true,
      message: "Tables in a venue fetched successfully",
      tables,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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

// const bookTableInAVenue = async (req, res) => {
//   try {
//     const { tournamentId, venueId, tableId } = req.params;

//     if (!tournamentId || !venueId || !tableId) {
//       return res.status(400).json({
//         status: 400,
//         message: "Tournament Id, venueId, tableId is required",
//       });
//     }

//     const tournamentInDB = await Tournament.findById(tournamentId);
//     const venueInDB = await Venue.findById(venueId);
//     const tableInDB = await Table.findById(tableId);

//     if (!tournamentInDB) {
//       return res.status(404).json({
//         status: false,
//         message: "Tournament not found",
//       });
//     }

//     if (
//       !venueInDB ||
//       String(tournamentInDB.tournamentLocation) != String(venueInDB._id)
//     ) {
//       return res.status(400).json({
//         status: false,
//         message: "Venue not valid",
//       });
//     }

//     if (!tableInDB || String(tableInDB.venueId) != String(venueInDB._id)) {
//       return res.status(400).json({
//         status: false,
//         message: "table not valid",
//       });
//     }

//     if (req.user?.id != tournamentInDB?.managerId) {
//       return res.status(401).json({
//         status: false,
//         message: "unauthorized",
//       });
//     }

//     const bookedTable = await bookingModel.create({
//       tableId: tableId,
//       tournamentId: tournamentId,
//       bookingDate: Date.now(),
//       userId: req.user?.id,
//     });

//     return res.status(200).json({
//       status: false,
//       message: "Table booked successfully",
//       bookedTable,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

const bookTableInAVenue = async (req, res) => {
  try {
    const { tournamentId, tableId } = req.params;

    if (!tournamentId || !tableId) {
      return res.status(400).json({
        status: 400,
        message: "Tournament Id, venueId, tableId is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);

    const tableInDB = await Table.findById(tableId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "Tournament not found",
      });
    }

    const venueInDB = await Venue.findById(tournamentInDB?.tournamentLocation);

    if (
      !venueInDB ||
      String(tournamentInDB.tournamentLocation) != String(venueInDB._id)
    ) {
      return res.status(400).json({
        status: false,
        message: "Venue not valid",
      });
    }

    if (!tableInDB || String(tableInDB.venueId) != String(venueInDB._id)) {
      return res.status(400).json({
        status: false,
        message: "table not valid",
      });
    }

    // if (req.user?.id != tournamentInDB?.managerId) {
    //   return res.status(401).json({
    //     status: false,
    //     message: "unauthorized",
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

    const bookingInDb = await Booking.findOne({ tableId });

    if (bookingInDb) {
      return res.status(400).json({
        status: false,
        message: "table already booked",
      });
    }
    const bookedTable = await Booking.create({
      tableId: tableId,
      tournamentId: tournamentId,
      bookingDate: Date.now(),
      userId: req.user?.id,
    });

    return res.status(200).json({
      status: false,
      message: "Table booked successfully",
      bookedTable,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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
const deleteTableBookings = async (req, res) => {
  try {
    const { tournamentId, tableId } = req.params;

    if (!tournamentId || !tableId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id and TableId is required",
      });
    }

    const tournamentInDB = await Tournament.findById(tournamentId);
    const tableInDb = await Table.findById(tableId);

    if (!tournamentInDB) {
      return res.status(404).json({
        status: false,
        message: "Tournament not found",
      });
    }

    if (
      !tableInDb ||
      String(tableInDb.venueId) != String(tournamentInDB.tournamentLocation)
    ) {
      return res.status(400).json({
        status: false,
        message: "Incorrect booking",
      });
    }

    //check if the user is the manager

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
    // if table is already assigned to a match then dont delete the bookings

    const matches = await Match.findOne({
      table: tableInDb._id,
    });

    if (matches) {
      return res.status(400).json({
        status: false,
        message: "Table Assigned to an ongoing Match",
      });
    }

    const deletedBookingInDB = await Booking.findOneAndDelete({
      tableId: tableId,
      tournamentId: tournamentId,
    });

    if (!deletedBookingInDB) {
      return res.status(200).json({
        status: false,
        message: "no bookings to delete",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Table booking removed successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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

// const getAllBookingOfAtournament = async (req, res) => {
//   try {

//     const {tournamentId} = req.params;

//     if(!tournamentId){
//       return res.status(400).json(
//         {
//           status: false,
//           message: "Tournament Id is required"
//         }
//       )
//     }

//     const tournament = await Tournament.findById(tournamentId);

//     if(!tournament){
//       return res.status(400).json(
//         {
//           status: false,
//           message:"Tournament does not exists"
//         }
//       )
//     }

//     const bookings = await bookingModel.find({tournamentId});

//     return res.status(200).json(
//       {
//         status: true,
//         message:"Bookings fetched",
//         bookings
//       }
//     );

//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
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

const getAllBookingOfAtournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(400).json({
        status: false,
        message: "Tournament does not exist",
      });
    }

    const bookings = await bookingModel.find({ tournamentId });

    if (!bookings.length) {
      return res.status(200).json({
        status: true,
        message: "No bookings found",
        data: {},
      });
    }

    // Group bookings by tableId
    const groupedData = {};

    for (let booking of bookings) {
      const tableId = booking.tableId.toString();

      if (!groupedData[tableId]) {
        // Fetch match info once per tableId
        const match = await Match.findOne({ tableId });

        groupedData[tableId] = {
          match: match || null,
          bookings: [],
        };
      }

      groupedData[tableId].bookings.push(booking);
    }

    return res.status(200).json({
      status: true,
      message: "Bookings with matches fetched",
      data: groupedData,
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
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

const getListOFAvailablesTablesInATournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        status: false,
        message: "Tournament not found",
      });
    }

    // get all bookings

    // if (String(req.user.id) != String(tournament.managerId)) {
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

    const tableList = await getAvailableTableListForTournament(tournament);

    // console.log(tableList);
    return res.status(200).json({
      status: true,
      message: "List of available tables fetched successfully",
      tableList,
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
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

// const multipledeleteTableController = async (req, res) => {
//   try {
//     const { ids } = req.body;

//     // console.log("=====ids ======", ids);

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({
//         status: false,
//         message: "List of Table IDs is required",
//       });
//     }

//     const tableIdsToDelete = ids;

//     for (const tableId of tableIdsToDelete) {
//       const table = await Table.findById(tableId);
//       if (!table) {
//         return res.status(404).json({
//           status: false,
//           message: `Table with ID ${tableId} not found`,
//         });
//       }

//       const venue = await Venue.findById(table.venueId);
//       const userRole = await roleModel.findById(req.user.roleId);

//       const isOwner = String(venue?.managerId) === String(req.user?.id);
//       const isAdmin = userRole?.name === "Admin";

//       if (!isOwner && !isAdmin) {
//         return res.status(401).json({
//           status: false,
//           message: `Unauthorized to delete table with ID ${tableId}`,
//         });
//       }
//     }

//     await Table.deleteMany({ _id: { $in: tableIdsToDelete } });

//     return res.status(200).json({
//       status: true,
//       message:
//         tableIdsToDelete.length > 1
//           ? "Tables deleted successfully"
//           : "Table deleted successfully",
//     });
//   } catch (error) {
//     logger.error(error);
//     console.error("Error deleting table(s):", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong. Please try again.",
//       error: error.message,
//     });
//   }
// };

const multipledeleteTableController = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "List of Table IDs is required",
      });
    }

    const userRole = await roleModel.findById(req.user.roleId);
    const isAdmin = userRole?.name === "Admin";

    const validatedTableIds = [];

    for (const tableId of ids) {
      const table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({
          status: false,
          message: `Table with ID ${tableId} not found`,
        });
      }

      const venue = await Venue.findById(table.venueId);
      if (!venue) {
        return res.status(404).json({
          status: false,
          message: `Venue not found for table ID ${tableId}`,
        });
      }

      const isOwner = String(venue.managerId) === String(req.user?.id);
      if (!isOwner && !isAdmin) {
        return res.status(401).json({
          status: false,
          message: `Unauthorized to delete table with ID ${tableId}`,
        });
      }

      // Check for match
      const matchExists = await Match.exists({ table: table._id });
      if (matchExists) {
        return res.status(400).json({
          status: false,
          message: `Table with ID ${tableId} is already in use for a match`,
        });
      }

      // Check for bookings
      const bookingExists = await bookingModel.exists({ tableId: table._id });
      if (bookingExists) {
        return res.status(400).json({
          status: false,
          message: `Table has active bookings and cannot be deleted`,
        });
      }

      validatedTableIds.push(table._id);

      // Remove table from venue
      await Venue.findByIdAndUpdate(table.venueId, {
        $pull: { tables: table._id },
      });

      // Cleanup bookings just in case
      await bookingModel.deleteMany({ tableId: table._id });
    }

    // Delete all validated tables
    await Table.deleteMany({ _id: { $in: validatedTableIds } });

    return res.status(200).json({
      status: true,
      message:
        validatedTableIds.length > 1
          ? "Tables deleted successfully"
          : "Table deleted successfully",
    });
  } catch (error) {
    logger.error(error);
    console.error("Error deleting table(s):", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong. Please try again.",
      error: error.message,
    });
  }
};

const getAllTablesInVenuWithStatusListing = async (req, res) => {
  try {
    const { venueId } = req.params;

    if (!venueId) {
      return res.status(400).json({
        status: false,
        message: "Venue Id is required",
      });
    }

    const venueInDB = await Venue.findById(venueId);

    if (!venueInDB) {
      return res.status(404).json({
        status: false,
        message: "Venue not found",
      });
    }

    const tables = await venueService.getTableStatusesForVenueList(venueId);

    return res.status(200).json({
      status: true,
      message: "Tables in a venue fetched successfully",
      tables,
      venueInDB,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
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

module.exports = {
  createVenueController,
  createTableController,
  deleteTableController,
  updateTableController,
  getAllTablesInVenue,
  deleteVenueController,
  getAllVenues,
  updateVenueController,
  getAllTablesInVenuWithStatus,
  bookTableInAVenue,
  getAllBookingOfAtournament,
  getListOFAvailablesTablesInATournament,
  deleteTableBookings,
  multipledeleteTableController,
  getAllTablesInVenuWithStatusListing,
  AllVenues,
};
