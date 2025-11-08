const {Router} = require("express");
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");

const router = Router();


//player routes (common routes)
router.get("/get-all-modules",isAuthenticated, userController.getAllModuleData);
router.post("/submit-contact-form",userController.submitContactForm);
//manager routes


module.exports = router;