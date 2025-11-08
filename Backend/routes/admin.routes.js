const {Router} = require("express");
const { isAuthenticated } = require("../middlewares/auth.middleware");
const checkPermission = require("../middlewares/permission.middleware");
const adminController = require("../controllers/admin.controller");
const subModuleModel = require("../models/subModule.model");

const router = Router();


router.get("/get-allUser"  , isAuthenticated , adminController.getAllUsers);
router.get("/get-all-player"  , isAuthenticated , adminController.getAllPlayer);
// router.post('/create-new-role', isAuthenticated, checkPermission({moduleName:"Admin Panel", subModuleName:"Role"},"create"), adminController.createNewRole);
// router.delete('/delete-role-by-ID',isAuthenticated, checkPermission({moduleName:"Admin Panel", subModuleName:"Role"},"delete"), adminController.createNewRole);
// router.get('/get-all-roles', isAuthenticated, checkPermission({moduleName:"Admin Panel", subModuleName:"Role"},"read"), adminController.getAllRoles);
router.put("/edit-user/:userId" , isAuthenticated , adminController.editUser);
router.delete("/delete-player/:userId", isAuthenticated, adminController.deletePlayer);
module.exports = router;