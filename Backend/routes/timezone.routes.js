const { Router } = require("express");
const timezoneModel = require("../models/timezone.model");

const router = Router();

router.get("/get-all-timezone", async (req, res) => {
  try {

    const timeZones = await timezoneModel.find();

    return res.status(200).json(
        {
            status: true,
            timeZones
        }
    )

  } catch (error) {
    console.error("Error deleting tournament:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong. Please try again.",
      error: error.message,
    });
  }
});

module.exports = router;