/**
 * Cloudinary upload helper using the v2 SDK directly.
 * Handles image-only enforcement and 5MB size cap at the middleware level.
 */
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure Cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer: use memory storage, validate in fileFilter
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} folder - Cloudinary folder name
 * @param {boolean} isPrivate - If true, uses authenticated (private) delivery
 * @returns {Promise<{ url: string, publicId: string }>}
 */
async function uploadToCloudinary(buffer, folder, isPrivate = false) {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image',
      type: isPrivate ? 'authenticated' : 'upload',
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    stream.end(buffer);
  });
}

module.exports = { upload, uploadToCloudinary, cloudinary };
