const {
  registerPayloadSchema,
  loginPayloadSchema,
  forgetPasswordPayloadSchema,
  forgetpasswordResetPayloadSchema,
  changePasswordSchema,
  updateCredentialsSchema,
} = require("../schemas/AuthSchema");
const { ZodError } = require("zod");
const User = require("../models/user.model");
const { v4: uuid } = require("uuid");
const bcrypt = require("bcrypt");
const { formatError } = require("../utils/FormatZodError");
const jwt = require("jsonwebtoken");
const TokenBlacklist = require("../models/tokenBlackList.model");
const logger = require("../utils/logger");
const sendEmail = require("../services/mail.service");
const Role = require("../models/role.model");
const { sendMail } = require("../config/mail");


const authRegisterController = async (req, res) => {
  try {
    let body = req.body;

    // Validate payload
    body = registerPayloadSchema.parse(body);

    // Check if username exists
    const userWithUserName = await User.findOne({ username: body.username });
    if (userWithUserName) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Check if email exists
    const userWithEmail = await User.findOne({ email: body.email });
    if (userWithEmail) {
      return res.status(400).json({ message: "Email already taken" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 10);

    // Generate activation token
    const activationTokenExpireAt = Date.now() + 10 * 60 * 1000;
    const activationToken = uuid();

    // Fetch role by name (case-insensitive)
    const userRole = await Role.findOne({
      name: { $regex: new RegExp(`^${body.role}$`, "i") },
    });

    if (!userRole) {
      return res.status(400).json({
        status: false,
        message: "Invalid role, try again",
      });
    }

    // Create user
    const user = new User({
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName || null,
      email: body.email,
      passwordHash,
      activationToken,
      activationTokenExpireAt,
      role: userRole._id,
    });

    await user.save();


     sendEmail.sendWelcomeEmail(
      user.firstName,
      user.email,
    )

    // Send activation email
    sendEmail.sendVerificationMail(
      user?.firstName,
      user?.email,
      `${process.env.FRONTEND_URL}#/emailactivation/${user?._id}/${user?.activationToken}`
    );

    return res.status(200).json({
      status: true,
      message: "User registered successfully",
    });
  } catch (error) {
    // Handle Zod validation error
    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        message: "Invalid data",
        errors: errors,
      });
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already taken`,
      });
    }

    // Other unexpected errors
    logger.error(error);
    console.log("Something went wrong while registering user:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again",
      error: error.message,
    });
  }
};

const getAllRolesController = async (req, res) => {
  try {
    const roles = await Role.find({});
    res.status(200).json({
      status: true,
      message: "Roles fetched successfully",
      roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const activateAccountController = async (req, res) => {
  try {
    const { id, token } = req.params;

    if (!token) {
      return res.status(400).json({
        status: false,
        message: "Activation token is missing",
      });
    }

    //from the userId get the user details

    const userInDB = await User.findById(id);

    if (!userInDB) {
      return res.status(400).json({
        status: false,
        message: "Inavlid userId",
      });
    }

    if (!userInDB.activationToken || !userInDB.activationTokenExpireAt) {
      return res.status(400).json({
        status: false,
        message: "Link Expired",
      });
    }

    //check if the token is expired

    if (Date.now() >= userInDB.activationTokenExpireAt) {
      // console.log(Date.now() >= userInDB.activationTokenExpireAt, " token expired")

      userInDB.activationTokenExpireAt = null;
      userInDB.activationToken = null;
      await userInDB.save();

      return res.status(400).json({
        status: false,
        message: "Activation Token expired",
      });
    }

    if (userInDB.activationToken !== token) {
      return res.status(401).json({
        status: false,
        message: "Token is incorrect",
      });
    }

    userInDB.active = true;
    userInDB.activationToken = null;
    userInDB.activationTokenExpireAt = null;

    await userInDB.save();

    return res.status(200).json({
      status: true,
      message: "User account activated successfully",
    });
  } catch (error) {
    logger.error(error);
    console.log("Something went wrong while registered user", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const authloginController = async (req, res) => {
  try {
    const body = req.body;

    // console.log("testing123");

    loginPayloadSchema.parse(body);

    const userInDB = await User.findOne({
      $or: [
        { email: body.emailOrUsername },
        { username: body.emailOrUsername },
      ],
    })
      .populate("role")
      .exec();

    console.log(body);
    console.log(userInDB);

    if (!userInDB) {
      return res.status(404).json({
        status: false,
        message: "Account does not exists",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      body.password,
      userInDB.passwordHash
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: false,
        message: "Invalid Credentails",
      });
    }

    const payload = {
      id: userInDB._id,
      email: userInDB.email,
      username: userInDB.username,
      firstName: userInDB.firstName,
      active: userInDB.active,
      roleId: userInDB.role?._id.toString(), // Correct way to get roleId
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    //saving the latest signIn Time Stamp
    userInDB.lastSignInStamp = Date.now();

    await userInDB.save();


   

    // return res.status(200).json({
    //   status: true,
    //   message: "Login successfull",
    //   token,
    //   accountActive: payload.active,
    //   role: payload.role,
    // });
    return res.status(200).json({
      status: true,
      message: "Login successfull",
      token,
      accountActive: payload.active,
      user: {
        id: userInDB._id,
        email: userInDB.email,
        username: userInDB.username,
        firstName: userInDB.firstName,
        active: userInDB.active,
        roleId: userInDB.role?._id.toString(),
        role: userInDB.role, // if you want to include full role details
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    logger.error(error);
    console.log("Something went wrong", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const authLogoutController = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        status: false,
        message: "No token provided",
      });
    }

    const blacklistedToken = new TokenBlacklist({ userId: req.user.id, token });

    await blacklistedToken.save();

    return res.status(200).json({
      status: true,
      message: "Logged out successfully",
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

const resendActivationController = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User Id not found",
      });
    }

    const userInDB = await User.findById(userId);

    if (!userInDB) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (userInDB.active) {
      return res.status(400).json({
        status: false,
        message: "Account already activated",
      });
    }

    //generate a new activation token

    const activationToken = uuid();
    const activationTokenExpireAt = Date.now() + 10 * 60 * 1000;

    userInDB.activationToken = activationToken;
    userInDB.activationTokenExpireAt = activationTokenExpireAt;

    await userInDB.save();

    //send email

    sendEmail.sendVerificationMail(
      userInDB?.firstName,
      userInDB?.email,
      `${process.env.FRONTEND_URL}/#/emailactivation/${userInDB?._id}/${userInDB?.activationToken}`
    );

    return res.status(200).json({
      status: true,
      message: "Activation mail sent successfully",
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

const forgetPasswordController = async (req, res) => {
  try {
    const body = req.body;

    forgetPasswordPayloadSchema.parse(body);

    const userInDb = await User.findOne({ email: body.email });

    if (!userInDb) {
      return res.status(404).json({
        status: false,
        message: "No account associated with this email",
      });
    }

    //generate forget-password token

    const forgetpasswordToken = uuid();
    const forgetPasswordExpireAt = Date.now() + 10 * 60 * 1000;

    userInDb.forgetPasswordToken = forgetpasswordToken;
    userInDb.forgetPasswordExpireAt = forgetPasswordExpireAt;

    await userInDb.save();

    //send email to resetforgetpassword

    sendEmail.sendForgetPasswordMail(
      userInDb.firstName,
      userInDb?.email,
      `${process.env.FRONTEND_URL}#/auth/reset-password/${userInDb?._id}/${userInDb?.forgetPasswordToken}`
    );

    return res.status(200).json({
      status: true,
      message: "Reset password mail sent ",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const forgetPasswordResetController = async (req, res) => {
  try {
    const { userId, token } = req.params;

    const body = req.body;

    forgetpasswordResetPayloadSchema.parse(body);

    if (!token || !userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const userInDB = await User.findById(userId);

    if (!userInDB) {
      return res.status(404).json({
        status: false,
        message: "No user found for this email",
      });
    }

    if (!userInDB.forgetPasswordExpireAt || !userInDB.forgetPasswordToken) {
      return res.status(404).json({
        status: false,
        message: "Link Expired",
      });
    }

    if (Date.now() >= userInDB.forgetPasswordExpireAt) {
      return res.status(401).json({
        status: false,
        message: "Link expired",
      });
    }

    if (userInDB.forgetPasswordToken !== token) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    userInDB.passwordHash = passwordHash;
    userInDB.forgetPasswordToken = null;
    userInDB.forgetPasswordExpireAt = null;
    userInDB.active = true;

    await userInDB.save();

    return res.status(200).json({
      status: true,
      message: "Password reset was successfull",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // console.log(error);
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const changePasswordController = async (req, res) => {
  try {
    const { userId } = req.params;

    const body = changePasswordSchema.parse(req.body);

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "UserId is required",
      });
    }

    const userInDB = await User.findById(userId);

    if (!userInDB) {
      return res.status(404).json({
        status: false,
        message: "User does not exists",
      });
    }

    // match the password in db

    const isPasswordCorrect = await bcrypt.compare(
      body.oldPassword,
      userInDB.passwordHash
    );

    if (!isPasswordCorrect) {
      return res.status(403).json({
        status: false,
        message: "Incorrect Password",
      });
    }

    const newHashedPassword = await bcrypt.hash(body.oldPassword, 10);

    userInDB.passwordHash = newHashedPassword;

    await userInDB.save();

    return res.status(200).json({
      status: true,
      message: "password changed successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const updateUserCredentialController = async (req, res) => {
  try {
    const body = updateCredentialsSchema.parse(req.body);

    const userId = req.user.id;

    const userInDB = await User.findById(userId);

    if (!userInDB) {
      return res.status(404).json({
        status: false,
        message: "user does not exists",
      });
    }

    const isMatch = await bcrypt.compare(
      body.currentPassword,
      userInDB.passwordHash
    );

    if (!isMatch) {
      return res.status(403).json({
        status: false,
        message: "Incorrect password",
      });
    }

    if (body.email) {
      // console.log("Hii");

      //check if this email is already taken
      const userWithEmail = await User.find({ email: body.email });

      if (
        userWithEmail.length > 0 &&
        String(userWithEmail[0]?._id) != String(req.user.id)
      ) {
        return res.status(400).json({
          status: false,
          message: "Email already taken",
        });
      }

      if(body.email != userInDB.email){
        // return res.status(400).json({
        //   status: false,
        //   message: "Email already active in your account",
        // });

        userInDB.email = body.email;
      userInDB.active = false;

    const activationToken = uuid();
    const activationTokenExpireAt = Date.now() + 10 * 60 * 1000;

    userInDB.activationToken = activationToken;
    userInDB.activationTokenExpireAt = activationTokenExpireAt;

    await userInDB.save();

    //send email

    sendEmail.sendVerificationMail(
      userInDB?.firstName,
      userInDB?.email,
      `${process.env.FRONTEND_URL}/#/emailactivation/${userInDB?._id}/${userInDB?.activationToken}`
    );
      }

      // console.log("helllllo");
      
    }

    if (body.newPassword) {
      userInDB.passwordHash = await bcrypt.hash(body.newPassword, 10);
    }

    await userInDB.save();

    return res.status(200).json({
      message: "Credentials updated successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);

      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    return res.status(500).json({
      status: false,
      message: "Something went wrong please try again",
      error: error.message,
    });
  }
};

const meRouteController = async (req, res) => {
  try {
    const userInDB = await User.findById(req.user.id).populate("role").exec();

    return res.status(200).json({
      status: true,
      message: "session active",
      accountActive: userInDB.active,
      user: {
        id: userInDB._id,
        email: userInDB.email,
        username: userInDB.username,
        firstName: userInDB.firstName,
        active: userInDB.active,
        roleId: userInDB.role?._id.toString(),
        role: userInDB.role, // if you want to include full role details
      },
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

module.exports = {
  authRegisterController,
  activateAccountController,
  authloginController,
  authLogoutController,
  resendActivationController,
  forgetPasswordController,
  forgetPasswordResetController,
  changePasswordController,
  updateUserCredentialController,
  getAllRolesController,
  meRouteController
};
