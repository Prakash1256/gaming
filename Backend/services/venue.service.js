const Table = require("../models/tabel.model");
const Booking = require("../models/booking.model");

// const getTableStatusesForVenue = async (venueId, tournamentId) => {
//   const tables = await Table.find({ venueId });

//   const bookings = await Booking.find({
//     tableId: { $in: tables.map((t) => t._id) },
//   });

//   const bookedTableIds = new Set(bookings.map((b) => b.tableId.toString()));

//   return tables.map((table) => ({
//     table,
//     available: bookedTableIds.has(table._id.toString()) ? false : true,
//   }));
// };

// const getTableStatusesForVenue = async (venueId, tournamentId) => {
//   const tables = await Table.find({ venueId });

//   const bookings = await Booking.find({
//     tableId: { $in: tables.map((t) => t._id) },
//   });

//   return tables.map((table) => {
//     const tableBookings = bookings.filter(
//       (b) => b.tableId.toString() === table._id.toString()
//     );

//     // No booking at all → available = true
//     if (tableBookings.length === 0) {
//       return { table, available: true };
//     }

//     // Booked by current tournament → available = true
//     if (
//       tableBookings.some((b) => b.tournamentId.toString() === tournamentId.toString())
//     ) {
//       return { table, available: true };
//     }

//     // Booked by another tournament → available = "booked"
//     return { table, available: "booked" };
//   });
// };

// const getTableStatusesForVenue = async (venueId, tournamentId) => {
//   const tables = await Table.find({ venueId });

//   const bookings = await Booking.find({
//     tableId: { $in: tables.map((t) => t._id) },
//   });

//   return tables.map((table) => {
//     const tableBookings = bookings.filter(
//       (b) => b.tableId.toString() === table._id.toString()
//     );

//     const bookedByCurrentTournament = tableBookings.some(
//       (b) => b.tournamentId.toString() === tournamentId.toString()
//     );

//     const available = tableBookings.length === 0 || bookedByCurrentTournament;
//     const booked = bookedByCurrentTournament;

//     return {
//       table,
//       available,
//       booked,
//     };
//   });
// };


const getTableStatusesForVenue = async (venueId, tournamentId) => {
  const tables = await Table.find({ venueId });

  const bookings = await Booking.find({
    tableId: { $in: tables.map((t) => t._id) },
  });

  console.log(bookings);
  console.log(tables.map((t) => t._id));

  return tables.map((table) => {
    const tableBookings = bookings.filter(
      (b) => {
        console.log("------");
        console.log(b);
        console.log(table);
        return b.tableId.toString() === table._id.toString()
      }
    );

    console.log("Table bookings", tableBookings);

    const isBookedByCurrent = tableBookings.some(
      (b) => b.tournamentId.toString() === tournamentId.toString()
    );

    // const isBookedByOther = tableBookings.some(
    //   (b) => b.tournamentId.toString() !== tournamentId.toString()
    // );

    const available = tableBookings.length === 0 || isBookedByCurrent;
    const booked = isBookedByCurrent;

    return {
      table,
      available,
      booked,
    };
  });
};


const getTableStatusesForVenueList = async (venueId) => {
  const tables = await Table.find({ venueId });

  const bookings = await Booking.find({
    tableId: { $in: tables.map((t) => t._id) },
  });

  const bookedTableIds = new Set(bookings.map((b) => b.tableId.toString()));

  return tables.map((table) => ({
    table,
    available: bookedTableIds.has(table._id.toString()) ? false : true,
  }));
};

module.exports = {
  getTableStatusesForVenueList,
  getTableStatusesForVenue
};
