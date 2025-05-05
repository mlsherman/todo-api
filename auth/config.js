// Configuration for authentication
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Secret from environment variables or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';

// Token expiration (24 hours)
const TOKEN_EXPIRY = '24h';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  JWT_SECRET,
  TOKEN_EXPIRY,
  generateToken,
  verifyToken
};