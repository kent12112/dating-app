//multer: middleware to handle file uploads
//path: node.js module for safely wprking with file paths and extensions
const multer = require("multer");
const path = require("path");

//set storage engine
//destination: all files go to the uploads/ dir
//filename: each file name is made unique by appending a timestamp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); //save files in /uploads
  },
  filename: function (req, file, cb) {
    //generate unique filename
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

//Filter for image files only
//this ensures that only image files can be uploaded
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};
//storage: save files on local disk
//fileDilter: only alow image MIME tyypes
const upload = multer({storage, fileFilter});
module.exports = upload;