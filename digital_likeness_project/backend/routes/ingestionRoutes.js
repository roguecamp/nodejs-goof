const express = require('express');
const router = express.Router();
const ingestionController = require('../ingestion/ingestionController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   POST api/ingestion/upload/text
// @desc    Upload a text file for ingestion
// @access  Private (requires token)
router.post(
  '/upload/text',
  verifyToken, // JWT authentication middleware
  ingestionController.uploadTextFile // Multer and actual logic are handled within this controller function
);

module.exports = router;
