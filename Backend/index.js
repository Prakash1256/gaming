const express = require("express");
const dotenv = require('dotenv');
const connectDB = require("./config/db");
const cors = require("cors");
const router = require("./routes");
const path = require("path");
const cron = require('node-cron');
const Tournament = require("./models/tournament.model");
const {submitMatchesToFargoRate} = require("./services/forgorate.service");
const bookingModel = require("./models/booking.model");
const fs = require('fs');
const puppeteer = require("puppeteer");
const { Console } = require("console");


dotenv.config();

PORT = process.env.PORT || 5000;
// PORT = 8016;

const app = express();

//using cors
app.use(cors());

// Middleware to parse JSON bodies

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// app.use(express.json());

// Middleware to parse URL-encoded bodies
// app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/',(req, res) => {
    return res.status(200).json(
        {
            "message":"Welcome"
        }
    )
});




// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PDF Generation Service' });
});

// Generate PDF from HTML content

app.use("/api",router);

// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/vrptech.com/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/vrptech.com/fullchain.pem')
// };

// // Start th:e HTTPS server and check the database connection
// const server = require('https').createServer(options, app);

// Start the server and check the database connection

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await connectDB();
});

cron.schedule('*/1 * * * *', async () => { // Runs every 1 minute
    console.log(`[Cron Job] Checking for tournaments to auto-finalize at ${new Date().toLocaleString()}`);
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // Calculate 30 minutes ago

        const tournamentsToFinalize = await Tournament.find({
            status: 'completed',
            completedAt: { $lte: thirtyMinutesAgo },
        });

        if (tournamentsToFinalize.length === 0) {
            console.log('[Cron Job] No tournaments found for auto-finalization.');
            return;
        }

        console.log(`[Cron Job] Found ${tournamentsToFinalize.length} tournaments to auto-finalize.`);

        for (const tournament of tournamentsToFinalize) {
            console.log(`[Cron Job] Auto-finalizing tournament: ${tournament._id}`);
            
            try {
                // Set temporary status to prevent other jobs from picking it up
                tournament.status = 'finalized';
                await tournament.save();
                console.log(`[Cron Job] Tournament ${tournament._id} auto-finalization successfull`);

                if(tournament.ratingSystem != "none"){
                    const submissionResult = await submitMatchesToFargoRate(tournament._id);
                    console.log(`[Cron Job] Tournament ${tournament._id} auto-finalization ${submissionResult.success ? 'succeeded' : 'failed'}.`);
                }
                await bookingModel.deleteMany({tournamentId:tournament._id});
                await tournament.save();           

            } catch (innerError) {
                console.error(`[Cron Job] Error during auto-finalization for tournament ${tournament._id}:`, innerError);
                
                if (tournament.status === 'finalized') { // Only if it hasn't been updated yet
                    tournament.status = "completed"; // Mark as handled, even if failed
                    await tournament.save();
               }
            }
        }
    } catch (error) {
        console.error('[Cron Job] Main auto-finalization job error:', error);
    }
}, {
    scheduled: true, // Start the cron job immediately when server starts
    timezone: "Asia/Kolkata" // Set your desired timezone for cron scheduling
});





