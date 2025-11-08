// middleware/checkTournamentFinalized.js
const Tournament = require("../models/tournament.model"); // Adjust path to your model

const checkTournamentFinalized = async (req, res, next) => {
  try {
    const { tournamentId } = req.params; // or req.body or req.query based on your usage

    if (!tournamentId) {
      return res.status(400).json({ message: "Tournament ID is required." });
    }

    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found." });
    }

    if (tournament.status === "finalized") {
      return res.status(400).json({ message: "Tournament already finalized." });
    }

    next();
  } catch (error) {
    console.error("Error in checkTournamentFinalized middleware:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {checkTournamentFinalized};