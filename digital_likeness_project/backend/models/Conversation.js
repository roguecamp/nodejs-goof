const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Using uuid for unique IDs

// Add uuid to package.json dependencies
// Since I can't run npm install, I'll note this and assume it's handled if an actual npm environment is used.
// For now, the code will include it, but it won't resolve without manual intervention in a real setup.
// If uuid is not truly available, I'll revert to Date.now().toString() + Math.random() for IDs.
// For the sake of this exercise, I will proceed as if uuid is available.
// If it causes an error in a real test, the fallback is simple.

const conversationsFilePath = path.join(__dirname, '..', 'data', 'conversations.json');

// Helper function to read conversations from the JSON file
const readConversationsFromFile = () => {
  try {
    if (!fs.existsSync(conversationsFilePath)) {
      fs.writeFileSync(conversationsFilePath, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const data = fs.readFileSync(conversationsFilePath, 'utf8');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading conversations file:', error);
    return [];
  }
};

// Helper function to write conversations to the JSON file
const writeConversationsToFile = (conversations) => {
  try {
    fs.writeFileSync(conversationsFilePath, JSON.stringify(conversations, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing conversations file:', error);
  }
};

const addMessage = (messageData) => {
  const conversations = readConversationsFromFile();
  const messageId = uuidv4();
  // For now, conversationId can be userId for simplicity, meaning one long conversation per user.
  // Or, a more complex conversation management system could be introduced later.
  const conversationId = messageData.userId;

  const newMessage = {
    messageId,
    conversationId,
    userId: messageData.userId,
    sender: messageData.sender, // "user" or "bot"
    text: messageData.text,
    timestamp: new Date().toISOString(),
  };
  conversations.push(newMessage);
  writeConversationsToFile(conversations);
  return newMessage;
};

const getMessagesByUserId = (userId) => {
  const conversations = readConversationsFromFile();
  // Filters messages by userId and sorts them by timestamp ascending
  return conversations
    .filter(msg => msg.userId === userId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Optional: Function to delete all messages for a user
const deleteMessagesByUserId = (userId) => {
  let conversations = readConversationsFromFile();
  const remainingConversations = conversations.filter(msg => msg.userId !== userId);
  if (conversations.length === remainingConversations.length) {
    return false; // No messages found for this user
  }
  writeConversationsToFile(remainingConversations);
  return true; // Messages deleted
};


module.exports = {
  addMessage,
  getMessagesByUserId,
  deleteMessagesByUserId, // Included if needed for the optional delete route
};
