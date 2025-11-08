const {Router} = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const adminRoutes = require("./admin.routes");
const tournamentRoutes = require("./tournament.routes");
const forgorateRoutes = require("./forgorate.routes");
const venueRoutes = require("./venue.routes");
const timeZoneRoutes  = require("./timezone.routes");
const moduleModel = require("../models/module.model");
const subModuleModel = require("../models/subModule.model");
const permissionModel = require("../models/permission.model");
const newsRoutes = require("./news.routes");
const path = require("path");
const pdf = require("../routes/pdf.routes");

const router = new Router();

router.use("/auth",authRoutes);
router.use("/user",userRoutes);
router.use('/admin', adminRoutes);
router.use('/tournament',tournamentRoutes);
router.use('/venue',venueRoutes );
router.use("/timezone", timeZoneRoutes);
router.use("/news",newsRoutes);
router.use("/forgorate", forgorateRoutes);
router.use("/",pdf);

router.get("/flyer/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "..", "uploads", filename);

  console.log(filePath);
  res.sendFile(filePath, err => {
    if (err) {
      return res.status(404).json({ message: "Image not found" });
    }
  });
});

// async function setupTournamentManagerPermissions() {
//   try {
    
//     // Step 1: Create Tournament Manager Module
//     const tournamentManagerModule = await moduleModel.create({ name: 'Tournament Manager' });

//     // Step 2: Create SubModules
//     const tournamentSubModule = await subModuleModel.create({ name: 'Tournament' });
//     const venueSubModule = await subModuleModel.create({ name: 'Venue' });

//     // Step 3: Link SubModules to the Module
//     tournamentManagerModule.subModules = [tournamentSubModule._id, venueSubModule._id];
//     await tournamentManagerModule.save();

//     console.log("Module and SubModules created successfully");

//     // Step 4: Define Role IDs (Replace with actual DB values if different)
//     const roles = [
//       { id: "67e1423dfae3ce71f4a553da", name: "Admin", canCRUD: true },  // Admin
//       { id: "67e1423dfae3ce71f4a553dc", name: "Manager", canCRUD: true }, // Manager
//       { id: "67e1423dfae3ce71f4a553db", name: "Player", canCRUD: false }  // Player
//     ];

//     // Step 5: Assign Permissions for Every Role on Every Module/SubModule
//     const permissions = [];

//     for (const role of roles) {
//       // Permissions for Tournament Manager Module (subModuleId = null)
//       permissions.push({
//         moduleId: tournamentManagerModule._id,
//         subModuleId: null,
//         roleId: role.id,
//         create: role.canCRUD,
//         read: role.canCRUD,
//         update: role.canCRUD,
//         delete: role.canCRUD
//       });

//       // Permissions for Tournament SubModule
//       permissions.push({
//         moduleId: tournamentManagerModule._id,
//         subModuleId: tournamentSubModule._id,
//         roleId: role.id,
//         create: role.canCRUD,
//         read: role.canCRUD,
//         update: role.canCRUD,
//         delete: role.canCRUD
//       });

//       // Permissions for Venue SubModule
//       permissions.push({
//         moduleId: tournamentManagerModule._id,
//         subModuleId: venueSubModule._id,
//         roleId: role.id,
//         create: role.canCRUD,
//         read: role.canCRUD,
//         update: role.canCRUD,
//         delete: role.canCRUD
//       });
//     }

//     // Insert all permissions in bulk
//     await permissionModel.insertMany(permissions);
//     console.log("Permissions assigned successfully");

//     // Disconnect from DB
//     // await mongoose.disconnect();
//   } catch (error) {
//     console.error("Error setting up permissions:", error);
//   }
// }

// Run the function

// router.post("/insert-data-permission-modules", async (req, res) =>{
//     try{

//             await setupTournamentManagerPermissions();

//             return res.status(200).json(
//                 {
//                     status: true,
//                     message:"Data inserted successfully",
//                 }
//             );

//     } catch(error){

//         return res.status(500).json(
//             {
//                 status: false,
//                 message: ""
//             }
//         )
//     }
// } );

module.exports = router;
