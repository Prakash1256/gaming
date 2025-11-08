const axios = require("axios");
const forgorateService = require("../services/forgorate.service");
const Tournament = require("../models/tournament.model");
const roleModel = require("../models/role.model");
const bookingModel = require("../models/booking.model");

const searchFargoRate = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || typeof search !== "string") {
      return res.status(400).json({ message: "Search query is required." });
    }

    const userRole = await roleModel.findById(req.user.roleId);

    if (
      String(userRole.name) != "Manager" && String(userRole.name) != "Admin"
    ) {
      
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      
    }

    const trimmed = search.trim();

    // Split by comma to check for state
    const [mainSearch, state] = trimmed.split(",").map((s) => s.trim());
    let query = "";
    const isNumeric = /^\d+$/.test(mainSearch);
    const words = mainSearch.split(/\s+/);

    if (isNumeric) {
      query = `readableId:${mainSearch}*`;
    } else if (words.length === 1) {
      query = `firstName:${words[0]}*`;
    } else if (words.length >= 2) {
      const firstName = words[0];
      const lastName = words.slice(1).join(" ");
      query = `(firstName:${firstName}* AND lastName:${lastName}*)`;
    }

    // If state is provided, append it to the query
    if (state) {
      query = `(${query} AND state:${state})`;
    }

    const apiUrl = `${
      process.env.FORGORATE_URL
    }search?search=${encodeURIComponent(query)}&orderby=lastName`;

    const response = await axios.get(apiUrl, {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.FORGORATE_KEY,
      },
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error searching FargoRate:", error.message);
    return res.status(500).json({ message: "Failed to fetch search results." });
  }
};

const finalizeTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(200).json({
        status: false,
        message: "Tournament Id is required",
      });
    }

    

    const tournamentInDB = await Tournament.findOne({
      _id: tournamentId,
      status: "completed",
    });

    if (!tournamentInDB) {
      return res.status(400).json({
        status: false,
        message: "Cannot finalize this tournament",
      });
    }

    const userRole = await roleModel.findById(req.user.roleId);

    if (
      String(tournamentInDB?.managerId) !=
      String(req.user?.id)
    ) {
      if (userRole.name != "Admin") {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
    }

    await bookingModel.deleteMany({tournamentId:tournamentId});
    
    if (tournamentInDB.ratingSystem == "none") {
      tournamentInDB.status = "finalized" 
      await tournamentInDB.save();

      return res.status(200).json({
        status: true,
        message: "Tournament finalized",
      });
    }
    const result = await forgorateService.submitMatchesToFargoRate(
      tournamentId
    );

    

    if (!result.success) {
      return res.status(400).json({
        status: false,
        message: result.message,
      });
    }

    return res.status(200).json(
      {
        status:true,
        message:"Tournament finalized",
      }
    )
  } catch (error) {
    console.error("Error searching FargoRate:", error.message);
    return res.status(500).json({ message: "Failed to fetch search results." });
  }
};

module.exports = {
  searchFargoRate,
  finalizeTournament,
};
