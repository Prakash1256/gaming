const {Router} = require("express");
// const authController = require("../controllers/auth.controller");
// const { isAuthenticated } = require("../middlewares/auth.middleware");
const newsController = require("../controllers/news.controller");

const router = Router();


router.post("/subscribe", newsController.createNews);

module.exports = router;