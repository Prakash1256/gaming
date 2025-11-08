const mongoose = require("mongoose");
const Role = require("../models/role.model");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    firstName:{
      type: String,
      required:true
    },
    lastName: {
      type: String,
      required: false
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    forgetPasswordToken : {
      required:false,
      type: String,
      unique: false,
    },
    forgetPasswordExpireAt:  {
      type: Date,
      required: false,
      unique: false,
    },
    rank :{
      type: Number,
      required: false,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    linkedAccounts: {
      lps_playerid: Number,
      fr_playerid: Number,
    },
    credits: {
      type: Number,
      default: 0,
    },
    signUpStamp: {
      type: Date,
      default: Date.now,
    },
    lastSignInStamp: Date,
    active: {
      type: Boolean,
      default: false,
    },
    activationToken: String,
    activationTokenExpireAt: {
      type: Date,
      required: false,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    }
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
    const adminRole = await Role.findOne({ name: "Admin" });

    if (adminRole && this.role.toString() === adminRole._id.toString()) {
      console.error("Unauthorized attempt to assign admin role.");
      return next(new Error("You are not authorized to assign this role."));
    }
  next();
});

module.exports = mongoose.model("User", userSchema);
