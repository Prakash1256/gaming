const {Router} = require("express");
const venueController = require("../controllers/venue.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");
const checkPermission = require("../middlewares/permission.middleware");
const { checkTournamentFinalized } = require("../middlewares/tournament.middleware");


const router = Router();


router.post("/create-venue",isAuthenticated, 
    // checkPermission({moduleName:"Tournament Manager", subModuleName:"Venue"}, "create"),
    venueController.createVenueController );
router.post("/create-table",isAuthenticated, 
    // checkPermission({moduleName:"Tournament Manager", subModuleName:"Venue"}, "create"),
    venueController.createTableController );
router.delete("/delete-table/:id",isAuthenticated, 
    // checkPermission({moduleName:"Tournament Manager", subModuleName:"Venue"}, "delete"),
    venueController.deleteTableController );

//
router.get("/getallvenue" , isAuthenticated ,venueController.getAllVenues );
router.put("/edit-venue/:venueId", isAuthenticated, venueController.updateVenueController);
router.delete("/delete-venue/:venueId" , isAuthenticated , venueController.deleteVenueController);


router.get("/get-all-table-status/:venueId/:tournamentId",isAuthenticated,  venueController.getAllTablesInVenuWithStatus);
router.post("/book-table/:tournamentId/:venueId/:tableId", isAuthenticated, checkTournamentFinalized, venueController.bookTableInAVenue);
router.get("/get-availables-tables-for-tournament/:tournamentId", isAuthenticated, venueController.getListOFAvailablesTablesInATournament);
// router.post("/updated-table/:id", isAuthenticated, checkPermission({moduleName:"Tournament Manager", subModuleName:"Venue"}, "update"), venueController.Up)
router.delete("/delete-table-booking/:tournamentId/:venueId/:tableId", isAuthenticated, checkTournamentFinalized,  venueController.deleteTableBookings );




router.post("/create-table/:venueId",isAuthenticated, 
    // checkPermission({moduleName:"Tournament Manager", subModuleName:"Venue"}, "create"),
    venueController.createTableController );
router.delete("/delete-table/:id",isAuthenticated, 
    // checkPermission({moduleName:"Tournament Manager", subModuleName:"Venue"}, "delete"),
    venueController.deleteTableController );

router.put("/update-table/:id" , isAuthenticated , venueController.updateTableController);


router.delete("/delete-table/",isAuthenticated, 
    // checkPermission({moduleName:"Tournament Manager", subModuleName:"Venue"}, "delete"),
    venueController.multipledeleteTableController );// this one


router.get("/get-all-table-status/:venueId",isAuthenticated,  venueController.getAllTablesInVenuWithStatusListing);// this one
router.get("/allvenue" , isAuthenticated ,venueController.AllVenues );


module.exports = router;