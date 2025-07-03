
// import multer from 'multer';
const multer = require("multer");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/temp');
  },
 
});

const upload = multer({ 
  storage: storage,
  
});
module.exports =  upload ;
