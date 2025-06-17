const fs = require('fs');
const path = require('path');

const ingestedDataFilePath = path.join(__dirname, '..', 'data', 'ingested_data.json');

// Helper function to read ingested data from the JSON file
const readIngestedDataFromFile = () => {
  try {
    if (!fs.existsSync(ingestedDataFilePath)) {
      // If file doesn't exist, create it with an empty array
      fs.writeFileSync(ingestedDataFilePath, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const data = fs.readFileSync(ingestedDataFilePath, 'utf8');
    // Handle case where file might be empty or malformed
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading ingested data file:', error);
    // In case of error (e.g., permission issues), return empty or throw
    return [];
  }
};

// Helper function to write ingested data to the JSON file
const writeIngestedDataToFile = (dataEntries) => {
  try {
    fs.writeFileSync(ingestedDataFilePath, JSON.stringify(dataEntries, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing ingested data file:', error);
    // Handle error as appropriate
  }
};

const getAll = () => {
  return readIngestedDataFromFile();
};

const findByUserId = (userId) => {
  const entries = readIngestedDataFromFile();
  return entries.filter(entry => entry.userId === userId);
};

const findById = (id) => {
  const entries = readIngestedDataFromFile();
  return entries.find(entry => entry.id === id);
}

const create = (newEntryData) => {
  const entries = readIngestedDataFromFile();
  // Simple ID generation for this example
  const entryWithDetails = {
    ...newEntryData,
    id: Date.now().toString() + Math.random().toString(36).substring(2, 7), // More unique ID
    uploadedAt: new Date().toISOString()
  };
  entries.push(entryWithDetails);
  writeIngestedDataToFile(entries);
  return entryWithDetails;
};

module.exports = {
  getAll,
  findByUserId,
  findById,
  create,
};
