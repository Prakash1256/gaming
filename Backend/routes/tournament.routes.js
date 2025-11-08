const {Router} = require("express");
const tournamentController = require("../controllers/tourament.controller");
const { isAuthenticated, OptionalAuth } = require("../middlewares/auth.middleware");
const checkPermission = require("../middlewares/permission.middleware");
const {upload} = require("../config/multerconfig");
const {checkTournamentFinalized} = require("../middlewares/tournament.middleware");

const router = Router();


router.post("/create-tournament",isAuthenticated, upload.single('flyerImage'), 
    // checkPermission({moduleName:"Tournament Manager", subModuleName:"Tournament"}, "create"), 
    tournamentController.createTournament);
router.post("/start-tournament/:tournamentId", isAuthenticated, checkTournamentFinalized, tournamentController.startTournament);
router.post("/reset-tournament/:tournamentId", isAuthenticated,checkTournamentFinalized, tournamentController.resetTournamentController);
router.delete("/delete-tournament/:tournamentId", isAuthenticated, tournamentController.deleteTournamentController);
router.put("/update-match-result/:tournamentId/:matchId", isAuthenticated,checkTournamentFinalized, tournamentController.matchResultController);
router.get("/get-bracket/:tounamentId",isAuthenticated, tournamentController.getBracketController);
router.get("/get-all-incomplete-matches/:tournamentId", isAuthenticated, tournamentController.getAllnonByeIncompleteMatches );
router.put("/update-tournament-detail/:tournamentId",isAuthenticated,checkTournamentFinalized, upload.single('flyerImage'), tournamentController.updateTournament);

router.get("/get-bracket/:tounamentId", isAuthenticated, tournamentController.getBracketController);

router.get("/getAll-tournament",isAuthenticated, tournamentController.getAllCreatedTournaments );
router.get("/getall-tournament-basedonStatus" , OptionalAuth , tournamentController.getAllTournamentBasedOnStatus);
// router.get("/getall-tournament-basedonStatus-Guest", tournamentController.getAllTournamentBasedOnStatusForGuest);
router.get("/get-tournament-details/:tournamentId", tournamentController.getTournamentInfo);
router.get("/getAll-participated/:userId" , isAuthenticated , tournamentController.getAllParticipatedTournament);

router.post("/assignTables-to-match/:tournamentId/:matchId/:tableId", isAuthenticated,checkTournamentFinalized, tournamentController.assignTablesToMatch);
router.post("/cancelassignment-tables-to-match/:tournamentId/:matchId",isAuthenticated, checkTournamentFinalized, tournamentController.cancelTableAssignedToAMatch);

router.post("/assign-all-open-tables-match/:tournamentId", isAuthenticated,checkTournamentFinalized, tournamentController.assignOpenTablesToMatch);

router.get("/match-summary/:tournamentId", tournamentController.matchSummaryController );
router.get("/getall-tournament-managerid/:userId" ,isAuthenticated ,tournamentController.separatetoutnament );

router.put("/edit-participant-player/:tournamentSignupId", isAuthenticated, tournamentController.editTournamentSignupPlayerDetails);
router.get("/participant-player/:tournamentId" ,isAuthenticated , tournamentController.tournamentParticipantController);
router.put("/participant-player-status-update-bulk/:participantIds/:tournamentId", isAuthenticated,checkTournamentFinalized, tournamentController.tournamentParticipantStatusBulkUpdate);
router.put("/participant-player-paid-status-update-bulk/:participantIds/:tournamentId", isAuthenticated,checkTournamentFinalized, tournamentController.tournamentParticipantPaidStatusBulkUpdate);
router.get('/results/:tournamentId', tournamentController.tournamentResults);


router.get("/download-match-summary/:tournamentId", isAuthenticated, tournamentController.downloadExcelReportOfMatchSummary);
router.delete("/remove-player-tournament/:tournamentId/:tournamentSignupIds", isAuthenticated,checkTournamentFinalized, tournamentController.removePlayerFromTournament);
router.post("/add-one-player-tournament/:tournamentId", isAuthenticated, checkTournamentFinalized, tournamentController.addPlayerToTournament);
router.post("/add-multiple-player-tournament/:tournamentId", isAuthenticated, checkTournamentFinalized, tournamentController.addMultiplePlayersToTournament);
router.get("/get-waiting-list/:tournamentId", isAuthenticated, tournamentController.getlistofWaitingplayers);

router.get("/player-details/:tournamentId" , tournamentController.tournamentPlayerDetails)
router.post("/signup-player/:tournamentId" ,isAuthenticated , checkTournamentFinalized, tournamentController.TournamentSignupUser);
router.get("/get-finishing-order/:tournamentId",isAuthenticated, tournamentController.tournamentFinishingOrder);

router.post("/create-ticket/:userId" , isAuthenticated , tournamentController.createTicket); 
router.get("/getAll-ticket/:userId" , isAuthenticated , tournamentController.getAllTicket);
router.delete("/delete-ticket/:ticketId", isAuthenticated, tournamentController.deleteTicket);
// router.get("/getAll-ticket-admin/:userId", isAuthenticated, tournamentController.getAllTicketAdmin);
router.put("/update-ticket-status/:ticketId", isAuthenticated, tournamentController.updateTicketStatus);
router.get("/get-top-traffic-tournament", tournamentController.getTournamentWithMostTraffic);
router.get("/getAll-ticket-admin/:userId", isAuthenticated, tournamentController.getAllTicketAdmin);
router.get('/tickets/:ticketId', isAuthenticated,tournamentController.getTicketResponses);


//admin
router.get('/get-all-tournament', isAuthenticated, tournamentController.getAllTournamentAdminBasedOnStatus);
// router.get("/download-site-user-information", tournamentController.downloadUserInformation);
// router.put("/swap-players", isAuthenticated, tournamentController.swapPlayersMatches);


//temp

router.get("/get-tournament-detail-without-populate/:tournamentId", isAuthenticated, tournamentController.getTournamentInfoWithoutPopulate);

module.exports = router;