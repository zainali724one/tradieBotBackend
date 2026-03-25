// middlewares/uploadConfig.js
const multer = require("multer");
const path = require("path");
const os = require("os");

// Configure storage to use the system's temporary directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // os.tmpdir() gets the default temp folder for the OS (works on Windows, Mac, Linux, and hosts like Vercel/Heroku)
    cb(null, os.tmpdir()); 
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to prevent accidental overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Optional: Limit file size to 10MB per image
});

module.exports = upload;