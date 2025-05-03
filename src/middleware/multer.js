
import multer from 'multer';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/temp');
  },
 
});

const upload = multer({ 
  storage: storage,
  
});
export default upload;
