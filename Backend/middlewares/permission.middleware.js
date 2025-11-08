const Permission = require('../models/permission.model'); 
const subModuleModel = require('../models/subModule.model');
const User = require('../models/user.model');  
const moduleModel = require('../models/module.model');

const checkPermission = (requiredModule, requiredAction) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id; 

      // Fetch User and its Role
      const user = await User.findById(userId).populate('role');
      if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
      }

      if(!user?.role){
        return res.status(404).json({ status: false, message: 'Permission denied' });
      }

      // Fetch Module
      const module = await moduleModel.findOne({ name: requiredModule?.moduleName });
      if (!module) {
        return res.status(404).json({ status: false, message: 'Module not found' });
      }

      // Fetch SubModule (if exists)
      let subModule = null;
      if (requiredModule?.subModuleName) {
        subModule = await subModuleModel.findOne({ name: requiredModule.subModuleName });
      }

      // Fetch Permissions for the Role
      const permissions = await Permission.findOne({
        roleId: user.role._id,
        moduleId: module._id,
        subModuleId: subModule ? subModule._id : null 
      });

      // Check if user has required action permission
      if (!permissions || !permissions[requiredAction]) {
        return res.status(403).json({ 
          status: false,
          message: `Permission denied`
        });
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
  };
};

module.exports = checkPermission;