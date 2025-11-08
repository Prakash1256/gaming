const Tournament = require("../models/tournament.model");
const Match = require("../models/match.model");
const tournamentModel = require("../models/tournament.model");

async function submitMatchesToFargoRate(tournamentId) {
  try {
    const tournament = await Tournament.findOne({
      _id: tournamentId,
      ratingSystem: "fargorate",
      status:"completed"
    });
    if (!tournament) {
      console.error(
        `Tournament ${tournamentId} not found for FargoRate submission.`
      );
      return { success: false, message: "Tournament not found." };
    }


    tournament.status = "finalized";
    await tournament.save();

    const matches = await Match.find({
      tournamentId: tournament._id,
      status: "Completed",
    }).populate([{ path: "player1" }, { path: "player2" }]);

    let allSubmissionsSuccessful = true;
    let submissionResults = [];

    console.log(matches);

    for (const match of matches) {
      console.log("1");
      // Your existing filtering logic for valid matches
      // if (($v1['p1id'] <> 99999) && ($v1['p2id'] <> 99999) && ($v1['winnerid'] > 0) && ($v1['loserid'] > 0) && $v1['state'] == 'complete')
      if (
        match.player1?.forgorateData?.readableId !== 99999 &&
        match.player2?.forgorateData?.readableId !== 99999 &&
        match.winner != null  &&
        match.loser != null &&
        match.player1?.forgorateData &&
        match.player2?.forgorateData
      ) {
        // Fetch player info (replace with your actual player fetching)
        // const p1info = await yourPlayerModel.findById(match.player1Id);
        // const p2info = await yourPlayerModel.findById(match.player2Id);

        if (
        //   !p1info ||
        //   !p2info ||
        //   !p1info.fargoRatePlayerId ||
        //   !p2info.fargoRatePlayerId
        !match.player1?.forgorateData ||
        !match.player2?.forgorateData
        ) {
          console.warn(
            `Skipping match ${match._id}: Missing player info or FargoRate IDs.`
          );
          submissionResults.push({
            matchId: match._id,
            status: "skipped",
            message: "Missing player or FargoRate ID",
          });
          continue; // Skip this match
        }

        const payload = {
          PlayerOneId: match.player1?.forgorateData?.readableId, 
          PlayerTwoId: match.player2?.forgorateData?.readableId,
          PlayerOneScore: match.score.player1Score,
          PlayerTwoScore: match.score.player2Score,
          DatePlayed: new Date(match.endTime).toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }), // Format as "MM-DD-YYYY, HH:MM:SS"
          Event: tournament.name,
          TableSize: "",
          GameType: tournament.gameType,
        };

        try {

        console.log("Sending request to forgorate...")
        //   const response = await axios.post(
        //     `${process.env.FORGORATE_DAHBOARD_URL}`,
        //     payload,
        //     {
        //       headers: {
        //         "Content-Type": "application/json",
        //         // IMPORTANT: Add your FargoRate Authentication Header here!
        //         // e.g., 'Authorization': `Bearer ${FARGO_RATE_AUTH_TOKEN}`,
        //         // or 'X-Api-Key': FARGO_RATE_API_KEY
        //       },
        //     }
        //   );
        console.log("Match inserted in forgorate...");

          submissionResults.push({
            matchId: match._id,
            status: "success",
            httpCode: response.status,
            response: response.data,
          });
          console.log(
            `Match ${match._id} submitted successfully. Response:`,
            response.data
          );
        } catch (error) {
          allSubmissionsSuccessful = false;
          const errorResponse = error.response
            ? error.response.data
            : error.message;
          const httpCode = error.response ? error.response.status : null;

          submissionResults.push({
            matchId: match._id,
            status: "failed",
            httpCode: httpCode,
            response: errorResponse,
            message: `FargoRate API error: ${error.message}`,
          });
          console.error(
            `Error submitting match ${match._id} to FargoRate:`,
            errorResponse
          );
        }
      }
    }

    return { success: true, results: submissionResults };
  } catch (error) {
    console.error("Error in submitMatchesToFargoRate function:", error);
    return {
      success: false,
      message: "Internal server error during submission.",
    };
  }
}

module.exports = { submitMatchesToFargoRate };
