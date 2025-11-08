const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
      moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },  // Reference to Module
      subModuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubModule', default: null },  // Reference to SubModule (nullable)
      roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true }, 
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
});

module.exports = mongoose.model('Permission', permissionSchema);