const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Using the refined User model

// Configuration (consider moving to a config file or env variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-and-long-secret-key-12345'; // IMPORTANT: Use environment variable in production
const JWT_EXPIRES_IN = '1h'; // Token expiration time

exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const existingUser = User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = User.createUser({
      username,
      hashedPassword,
    });

    // Exclude password from the response
    const userResponse = { ...newUser };
    delete userResponse.hashedPassword;

    res.status(201).json({
      message: 'User registered successfully.',
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Pass error to the error handling middleware
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials (user not found).' });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (password mismatch).' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
      },
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'Login successful.',
      token: token,
      user: { id: user.id, username: user.username } // Send back some user info
    });
  } catch (error) {
    console.error('Login error:', error);
    // Pass error to the error handling middleware
    next(error);
  }
};
