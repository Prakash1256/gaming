// const multer = require('multer');
// const path = require('path');
// const {mimes} = require('./mime');
// const { v4: uuid } = require("uuid");

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
      
//       cb(null, uuid() + path.extname(file.originalname));
//     }
// });

// const fileFilter = (req, file, cb) => {
    
//     if (!allowedTypes.includes(mimes)) {
//       return cb(new Error('Only .jpeg or .jpg files are allowed'), false);
//     }
//     // Accept the file
//     cb(null, true);
// };

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 10 * 1024 * 1024 } // Optional: Limit file size (e.g., 10 MB)
// });


// module.exports = {
//   upload
// }


const multer = require("multer");
const path = require("path");
const { v4: uuid } = require("uuid");
const  {mimes} = require("../config/mime")

// Allowed MIME types
// const allowedMimes = ["image/jpeg", "image/jpg", "image/png"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // e.g., ".jpg"
    const uniqueName = uuid() + ext;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (mimes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = {
  upload,
};
