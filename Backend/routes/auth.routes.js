const {Router} = require("express");
const authController = require("../controllers/auth.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");

const router = Router();


router.post("/register",authController.authRegisterController);
router.post("/login",authController.authloginController);
router.post("/logout", isAuthenticated, authController.authLogoutController);
router.post('/activate/:id/:token',authController.activateAccountController);
router.post('/resend-activate-account-email', isAuthenticated, authController.resendActivationController);
router.post(`/forget-password`, authController.forgetPasswordController);
router.post(`/reset-password/:userId/:token`, authController.forgetPasswordResetController);
router.put(`/update-user-credentials`, isAuthenticated, authController.updateUserCredentialController);
router.get('/role' ,authController.getAllRolesController);
router.get('/me',isAuthenticated, authController.meRouteController);

module.exports = router;