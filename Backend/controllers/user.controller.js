const User = require("../models/user.model");
const permissionService = require("../services/permission.service");
const logger = require("../utils/logger");
const contactSchema = require("../schemas/ContactUsSchema");
const emailService = require("../services/mail.service");
const {ZodError} = require("zod");
const {formatError} = require("../utils/FormatZodError");

const getAllModuleData = async (req, res) => {
  try {
    const user = req.user;

    //get the user from the db
    const userInDB = await User.findById(user.id).populate("role").exec();

    if (!userInDB) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    //get their permissions

    const response = await permissionService.getPermissionsForRole(
      userInDB?.role?._id
    );

    return res.status(200).json({
      status: true,
      message: "module data fetched successfully",
      response,
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

const submitContactForm = async (req, res) => {
  try {
    const parsedData = contactSchema.parse(req.body);
    const { name, email, subject, message } = parsedData;

    emailService.sendContactEmailService({
      ...parsedData,
      contactReciever: process.env.CONTACT_RECEIVER_EMAIL,
    });

    return res
      .status(200)
      .json({ success: true, message: "Message sent successfully!" });

  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        status: false,
        message: "Invalid Data",
        errors: errors,
      });
    }

    console.error("Email sending failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  getAllModuleData,
  submitContactForm,
};
