const {Router} = require("express");
const authController = require("../controllers/auth.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");
const forgorateController = require("../controllers/forgorate.controller");

const router = Router();

//add authentication and authorization
router.get("/get-forgorate-players", isAuthenticated,  forgorateController.searchFargoRate);
router.post("/finalize/:tournamentId",isAuthenticated, forgorateController.finalizeTournament);

module.exports = router;