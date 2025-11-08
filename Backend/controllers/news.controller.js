const News = require("../models/news.model");
const { NewsSchema } = require("../schemas/NewsSchema");
const {formatError} = require("../utils/FormatZodError");
const {logger} = require("../utils/logger");

const createNews = async (req, res) => {
  try {
    // const { email } = req.body;

    const {email} = NewsSchema.parse(req.body);


    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Email is required",
      });
    }

    const newLog = new News({ email });
    await newLog.save();

    return res.status(201).json({
      status: true,
      message: "Email log created successfully",
      data: newLog,
    });
  } catch (error) {


    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        message: "Invalid data",
        errors: errors,
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

module.exports = { createNews };