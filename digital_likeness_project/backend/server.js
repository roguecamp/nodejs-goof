const express = require('express');
const bodyParser = require('body-parser'); // Or use express.json() directly

// Route imports
const authRoutes = require('./routes/authRoutes');
const ingestionRoutes = require('./routes/ingestionRoutes');
const conversationRoutes = require('./routes/conversationRoutes'); // Added conversation routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(express.json()); // Preferred for Express 4.16+
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Digital Likeness Backend is running!');
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/conversation', conversationRoutes); // Mount conversation routes

// Basic Error Handling Middleware
// This should be defined after all other app.use() and routes calls
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || res.statusCode || 500; // Prefer err.statusCode if available
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode: statusCode,
    message: message,
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
