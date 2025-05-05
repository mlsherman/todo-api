/**
 * Authentication module
 * Use this file to import the authentication components into your main server.js
 */

// Export the main components
module.exports = {
  // Authentication routes (register, login)
  routes: require("./routes"),

  // Authentication middleware for protecting routes
  middleware: require("./middleware"),

  // User model
  User: require("./models/User"),

  // Configuration
  config: require("./config"),
};
