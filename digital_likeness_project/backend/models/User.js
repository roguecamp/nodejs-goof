const fs = require('fs');
const path = require('path');

const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');

// Helper function to read users from the JSON file
const readUsersFromFile = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, or other read error
    console.error('Error reading users file:', error);
    return []; // Return an empty array or handle error as appropriate
  }
};

// Helper function to write users to the JSON file
const writeUsersToFile = (users) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing users file:', error);
    // Handle error as appropriate
  }
};

const findByUsername = (username) => {
  const users = readUsersFromFile();
  return users.find(user => user.username === username);
};

const findById = (id) => {
  const users = readUsersFromFile();
  return users.find(user => user.id === id);
};

const createUser = (newUser) => {
  const users = readUsersFromFile();
  // Simple ID generation for this example
  const userWithId = { ...newUser, id: Date.now().toString() };
  users.push(userWithId);
  writeUsersToFile(users);
  return userWithId;
};

module.exports = {
  findByUsername,
  findById,
  createUser,
  // Expose for potential direct use if needed, though controller should use above
  _readUsersFromFile: readUsersFromFile,
  _writeUsersToFile: writeUsersToFile
};
