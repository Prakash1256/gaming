const roleModel = require("../models/role.model");
const Role = require("../models/role.model");
const userModel = require("../models/user.model");
// const logger = require("../utils/logger");
const { userSchemaEdit } = require("../schemas/AdminEditScherma");
const {ZodError} = require("zod");


const mongoose = require("mongoose");
// const { formatError } = require("../utils/FormatZodError");
const { v4: uuid } = require("uuid");
const bcrypt = require("bcrypt");
const { formatError } = require("../utils/FormatZodError");
const jwt = require("jsonwebtoken");
const TokenBlacklist = require("../models/tokenBlackList.model");
const logger = require("../utils/logger");
const sendEmail = require("../services/mail.service");

const createNewRole = async (req, res) => {
  try {
    // work in progress

    //create a new Role

    //create a permissions for module and submodules

    // save everthing in db

    return res.status(200).json({
      status: true,
      message: "New Role created",
    });
  } catch (error) {
    logger.error(error);
    console.log("Something went wrong", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const allroles = await Role.find({});

    return res.status(200).json({
      status: true,
      message: "All Roles fetched successfully",
      Roles: allroles,
    });
  } catch (error) {
    logger.error(error);
    console.log("Something went wrong", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Id is required",
      });
    }

    // probelms when deleting a role

    const usersWithRoleId = await userModel.findOne({ role: id });

    if (usersWithRoleId) {
      return res.status(400).json({
        status: true,
        message: "Cannot delete role as already assigned to a user",
      });
    }

    const deletedRole = await Role.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: "Role Deleted successfully",
    });

    // there may be users assigned to the role

    // we cascade and delete them (not recommended)

    // we assign them a new Role then delete the role
  } catch (error) {
    logger.error(error);
    console.log("Something went wrong", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

// const getAllUsers = async (req, res) => {
//   try {
//     console.log("this is the user", req.user);
//     if (!req.user || req.user.roleId !== "67e1423dfae3ce71f4a553da") {
//       return res.status(403).json({ message: "Access denied. Admins only." });
//     }

//     const allUsers = await userModel.find({});
//     res.status(200).json({
//       message: "All users fetched successfully",
//       users: allUsers
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch users",
//       error: error.message
//     });
//   }
// };

// const getAllUsers = async (req, res) => {
//   try {
//     console.log("this is the user", req.user);
//     if (!req.user || req.user.roleId !== "67e1423dfae3ce71f4a553da") {
//       return res.status(403).json({ message: "Access denied. Admins only." });
//     }

//     const allUsers = await userModel
//       .find({})
//       .select(
//         "-passwordHash -activationToken -activationTokenExpireAt -forgetPasswordToken -forgetPasswordExpireAt -__v"
//       )
//       .populate("role", "name -_id");

//     res.status(200).json({
//       message: "All users fetched successfully",
//       users: allUsers,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch users",
//       error: error.message,
//     });
//   }
// };


const getAllUsers = async (req, res) => {
  try {
    // Ensure req.user exists
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({ message: "Access denied. No role assigned." });
    }

    // Fetch role by ID
    const userRole = await Role.findById(req.user.roleId);

    if (!userRole || userRole.name !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Fetch all users and exclude sensitive fields
    const allUsers = await userModel
      .find({})
      .select(
        "-passwordHash -activationToken -activationTokenExpireAt -forgetPasswordToken -forgetPasswordExpireAt -__v"
      )
      .populate("role", "name -_id");

    res.status(200).json({
      message: "All users fetched successfully",
      users: allUsers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const getAllPlayer = async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user || req.user.roleId !== "67e1423dfae3ce71f4a553da") {
      return res.status(403).json({ message: "You are not authorized" });
    }

    const AllPlayer = await userModel.find({
      role: new mongoose.Types.ObjectId("67e1423dfae3ce71f4a553dc"),
    });

    return res.status(200).json({
      message: "All Player Fetched Successfully",
      users: AllPlayer,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to fetch players",
      error,
    });
  }
};

// const editPlayer = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const updatedData = req.body;

//     // Find the player by userId and update with new data
//     const updatedPlayer = await userModel.findOneAndUpdate(
//       { _id: userId },
//       updatedData,
//       { new: true }
//     );

//     if (!updatedPlayer) {
//       return res.status(404).json({ message: 'Player not found' });
//     }

//     res.status(200).json(updatedPlayer);
//   } catch (error) {
//     console.error("Error editing player:", error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

const deletePlayer = async (req, res) => {
  try {
    const { userId } = req.params;
    // const currentUserId = req.user.id;

    const userRole = await roleModel.findById(req.user.roleId);

    if (userRole.name != "Admin") {
      return res.status(401).json({
        status: false,
        message: "Your are not authorized to delete this player",
      });
    }

    const deletedPlayer = await userModel.findByIdAndDelete(userId);

    return res.status(200).json({
      status: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error editing player:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// const editUser = async (req, res) => {
//   try {
//     //we will allow admin to edit the firstName lastName emailId

//     const body = userSchemaEdit.parse(req.body);
//     const { userId } = req.params;

//     const userInDB = await userModel.findById(userId);

//     if (!userInDB) {
//       return res.status(400).json({
//         status: false,
//         message: "user does not exists",
//       });
//     }

//     userInDB.firstName = body.firstName;
//     userInDB.lastName = body.lastName;

//     if (userInDB.email !== body.email) {

//       userInDB.email = boby.email;
//       userInDB.active = false;
//     }

//     if (body.resendActivation === true) {
//       if (userInDB.active === true) {
//         return res.status(400).json({
//           status: false,
//           message: "Account already activated",
//         });
//       } else {
//         const activationToken = uuid();
//         const activationTokenExpireAt = Date.now() + 10 * 60 * 1000;

//         userInDB.activationToken = activationToken;
//         userInDB.activationTokenExpireAt = activationTokenExpireAt;

//         await userInDB.save();

//         //send email

//         sendEmail.sendVerificationMail(
//           userInDB?.displayName,
//           userInDB?.email,
//           `${process.env.FRONTEND_URL}/#/emailactivation/${userInDB?._id}/${userInDB?.activationToken}`
//         );
//       }
//     }

//     if (body.passwordReset === true) {
//       //send the password reset link in mail

//       //generate forget-password token

//       const forgetpasswordToken = uuid();
//       const forgetPasswordExpireAt = Date.now() + 10 * 60 * 1000;

//       userInDB.forgetPasswordToken = forgetpasswordToken;
//       userInDB.forgetPasswordExpireAt = forgetPasswordExpireAt;

//       await userInDB.save();

//       //send email to resetforgetpassword

//       sendEmail.sendForgetPasswordMail(
//         userInDB.firstName,
//         userInDB?.email,
//         `${process.env.FRONTEND_URL}#/auth/reset-password/${userInDB?._id}/${userInDB?.forgetPasswordToken}`
//       );
//     }


//     await userInDB.save();
//     // send password reset link

//     // resend activation link

//     return res.status(200).json(
//       {
//         status: false,
//         message: "User updated successfully",
//       }
//     );
  
//   } catch (error) {
//     if (error instanceof ZodError) {
//       // console.log(error);
//       const errors = formatError(error);

//       return res.status(422).json({
//         status: false,
//         message: "Invalid Data",
//         errors: errors,
//       });
//     }

//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong please try again",
//       error: error.message,
//     });
//   }
// };

const editUser = async (req, res) => {
  try {
    const body = userSchemaEdit.parse(req.body);
    const { userId } = req.params;

    const userInDB = await userModel.findById(userId);

    if (!userInDB) {
      return res.status(400).json({
        status: false,
        message: "User does not exist",
      });
    }

    userInDB.firstName = body.firstName;
    userInDB.lastName = body.lastName;

    if (userInDB.email !== body.email) {
      // Check if the new email is already used by someone else
      const emailExists = await userModel.findOne({
        email: body.email,
        _id: { $ne: userId }, // Exclude the current user
      });

      if (emailExists) {
        return res.status(400).json({
          status: false,
          message: "This email is already in use by another account",
        });
      }

      userInDB.email = body.email;
      userInDB.active = false;

      const activationToken = uuid();
        const activationTokenExpireAt = Date.now() + 10 * 60 * 1000;

        userInDB.activationToken = activationToken;
        userInDB.activationTokenExpireAt = activationTokenExpireAt;

        await userInDB.save();

        // Send activation email
        sendEmail.sendVerificationMail(
          userInDB?.displayName,
          userInDB?.email,
          `${process.env.FRONTEND_URL}/#/emailactivation/${userInDB?._id}/${userInDB?.activationToken}`
        );

        body.resendActivation = false;
      }  

    if (body.resendActivation === true) {
      if (userInDB.active === true) {
        return res.status(400).json({
          status: false,
          message: "Account already activated",
        });
      } else {
        const activationToken = uuid();
        const activationTokenExpireAt = Date.now() + 10 * 60 * 1000;

        userInDB.activationToken = activationToken;
        userInDB.activationTokenExpireAt = activationTokenExpireAt;

        await userInDB.save();

        // Send activation email
        sendEmail.sendVerificationMail(
          userInDB?.displayName,
          userInDB?.email,
          `${process.env.FRONTEND_URL}/#/emailactivation/${userInDB?._id}/${userInDB?.activationToken}`
        );
      }
    }

    if (body.passwordReset === true) {
      const forgetpasswordToken = uuid();
      const forgetPasswordExpireAt = Date.now() + 10 * 60 * 1000;

      userInDB.forgetPasswordToken = forgetpasswordToken;
      userInDB.forgetPasswordExpireAt = forgetPasswordExpireAt;

      await userInDB.save();

      // Send password reset email
      sendEmail.sendForgetPasswordMail(
        userInDB.firstName,
        userInDB?.email,
        `${process.env.FRONTEND_URL}#/auth/reset-password/${userInDB?._id}/${userInDB?.forgetPasswordToken}`
      );
    }

    await userInDB.save();

    return res.status(200).json({
      status: true,
      message: "User updated successfully",
    });

  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors,
      });
    }

    return res.status(500).json({
      status: false,
      message: "Something went wrong. Please try again.",
      error: error.message,
    });
  }
};

module.exports = {
  createNewRole,
  getAllRoles,
  deleteRole,
  getAllUsers,
  getAllPlayer,
  editUser,
  deletePlayer,
};
