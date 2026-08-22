const multer = require("multer");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — plenty for a profile photo, small enough to keep memoryStorage cheap.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// memoryStorage (a Buffer in req.file.buffer), not diskStorage — avatars are small and
// go straight to Firebase Storage, so there's no reason to round-trip through a temp
// file on this server's own disk first.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Photo must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`));
    }
    cb(null, true);
  },
});

/**
 * Wraps multer's single-file upload (multipart field name "photo") so its failures —
 * wrong file type, over the size cap, no file sent at all — come out through the app's
 * normal { status: "error", message } envelope via errorHandler.js as a clean 400,
 * instead of multer's own default error shape.
 */
function uploadAvatarPhoto(req, res, next) {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      err.statusCode = 400;
      return next(err);
    }
    if (!req.file) {
      const noFileErr = new Error('No photo file provided (expected a multipart field named "photo")');
      noFileErr.statusCode = 400;
      return next(noFileErr);
    }
    next();
  });
}

module.exports = uploadAvatarPhoto;
