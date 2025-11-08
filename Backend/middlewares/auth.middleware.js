const BlacklistedToken = require("../models/tokenBlackList.model");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(403).json({
        status: false,
        message: "No token provided",
      });
    }

    //verifying the token if not blacklisted
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    //checking if the token is blacklisted

    const blacklistedToken = await BlacklistedToken.findOne({
      userId: decodedData.id,
      token,
    });

    if (blacklistedToken) {
      return res.status(403).json({
        status: false,
        message: "Session Expired",
      });
    }

    //add check for user.active if not dont allow

    const userInDB = await userModel.findById(decodedData.id);

    if (!userInDB) {
      return res.status(403).json({
        status: false,
        accountActive: false,
        message: "User account does not exists",
      });
    }

    if (
      !userInDB.active &&
      req.path != "/resend-activate-account-email" &&
      req.path != "/me"
    ) {
      return res.status(401).json({
        status: false,
        accountActive: false,
        message: "Account not activated",
      });
    }

    req.user = decodedData;

    next();
  } catch (error) {
    console.log(error);

    return res.status(403).json({
      status: false,
      message: "Unauthorized",
    });
  }
};

const OptionalAuth = async (req, res, next) => {
  try {
    const token = req.headers?.["authorization"]?.split(" ")?.[1];

    if (!token ||  token == null || token == "null" ) {
      next();
    } else {
      //verifying the token if not blacklisted
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);

      //checking if the token is blacklisted

      const blacklistedToken = await BlacklistedToken.findOne({
        userId: decodedData.id,
        token,
      });

      if (blacklistedToken) {
        return res.status(403).json({
          status: false,
          message: "Session Expired",
        });
      }

      //add check for user.active if not dont allow

      const userInDB = await userModel.findById(decodedData.id);

      if (!userInDB) {
        next();
      }

      if (
        !userInDB.active &&
        req.path != "/resend-activate-account-email" &&
        req.path != "/me" &&
        req.path != "/getall-tournament-basedonStatus"
      ) {
        return res.status(401).json({
          status: false,
          accountActive: false,
          message: "Account not activated",
        });
      }

      req.user = decodedData;

      next();
    }
  } catch (error) {

    next();
  }
};
module.exports = {
  isAuthenticated,
  OptionalAuth
};
