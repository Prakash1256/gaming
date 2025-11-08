
const {z} = require("zod");
const { validate } = require("../models/permission.model");

const matchResultSchema = z.object({
    // matchId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid match ID format."),
    winnerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Winner is required."),
    loosersId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Winner is required"),
    playerScores: z.record(
        z.string(),
        z.number("Score must be a number").int().min(0, "Score is required.")
    ).refine(scores => Object.keys(scores).length === 2, {
        message: "Exactly two player scores must be provided.",
    })
    
})

module.exports  = {
    matchResultSchema
}