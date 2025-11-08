const Permission = require('../models/permission.model');
const mongoose = require("mongoose");


async function getPermissionsForRole(roleId) {
  try {
    const permissions = await Permission.aggregate([
      // Step 1: Match permissions for the specific roleId
      {
        $match: { roleId: new mongoose.Types.ObjectId(roleId) }
      },

      // Step 2: Lookup the modules to get their names
      {
        $lookup: {
          from: 'modules',
          localField: 'moduleId',
          foreignField: '_id',
          as: 'moduleDetails'
        }
      },
      {
        $unwind: '$moduleDetails'
      },

      // Step 3: Lookup the submodules to get their names
      {
        $lookup: {
          from: 'submodules',
          localField: 'subModuleId',
          foreignField: '_id',
          as: 'subModuleDetails'
        }
      },

      // Step 4: Unwind the subModuleDetails, and preserve null values (submodules may not exist for some modules)
      {
        $unwind: {
          path: '$subModuleDetails',
          preserveNullAndEmptyArrays: true // Keep permissions with null subModuleId
        }
      },

      // Step 5: Group by moduleId, and push submodule permissions inside the submodules array
      {
        $group: {
          _id: '$moduleId', // Group by moduleId
          moduleName: { $first: '$moduleDetails.name' }, // Get moduleName
          moduleId: { $first: '$moduleId' }, // Include the moduleId
          permissions: { 
            $push: {
              subModuleName: { $ifNull: ['$subModuleDetails.name', null] }, // Handle null submodules
              subModuleId: { $ifNull: ['$subModuleDetails._id', null] }, // Include subModuleId
              create: '$create',
              read: '$read',
              update: '$update',
              delete: '$delete'
            }
          }
        }
      },

      // Step 6: Project the result to match the desired output format
      {
        $project: {
          moduleId: 1, // Include moduleId
          moduleName: 1,
          create: { $first: '$permissions.create' },
          read: { $first: '$permissions.read' },
          update: { $first: '$permissions.update' },
          delete: { $first: '$permissions.delete' },
          submodules: {
            $filter: {
              input: '$permissions',
              as: 'perm',
              cond: { $ne: ['$$perm.subModuleName', null] } // Only include non-null submodules
            }
          }
        }
      },

      // Step 7: Sort by module name if needed
      {
        $sort: { moduleName: 1 }
      }
    ]);

    // console.log('Permissions for Role:', permissions);
    return permissions;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
}

module.exports = {
  getPermissionsForRole
};
