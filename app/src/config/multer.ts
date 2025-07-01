import multer from 'multer';
import constants from './constants/drivefitt-constants';

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  const isImageUpload = file.mimetype.startsWith('image/');
  const isSvgUpload = constants.SVG_PROCESSING.ALLOWED_TYPES.includes(file.mimetype);
  const isRegularImageUpload = constants.S3.ALLOWED_TYPES.includes(file.mimetype);
  
  if (isImageUpload && (isSvgUpload || isRegularImageUpload)) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type. Only images are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: Math.max(constants.S3.MAX_FILE_SIZE, constants.SVG_PROCESSING.MAX_FILE_SIZE),
  },
  fileFilter,
});

export default upload; 