const express = require('express');
const router = express.Router();
const conversationController = require('../conversation/conversationController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   POST api/conversation/message
// @desc    Submit a message from the user and get a bot response
// @access  Private (requires token)
router.post(
  '/message',
  verifyToken,
  conversationController.submitMessage
);

// @route   GET api/conversation/history
// @desc    Get conversation history for the logged-in user
// @access  Private (requires token)
router.get(
  '/history',
  verifyToken,
  conversationController.getConversationHistory
);

// @route   DELETE api/conversation/history
// @desc    Delete conversation history for the logged-in user
// @access  Private (requires token)
router.delete(
  '/history',
  verifyToken,
  conversationController.deleteConversationHistory
);

module.exports = router;
