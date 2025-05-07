// Simple MongoDB connection test
const mongoose = require('mongoose');

// Your connection string
const dbURI = "mongodb+srv://mshermandev01:J0Avk6LkMG9siRTL@cluster0.yu6ogsh.mongodb.net/todoDB?retryWrites=true&w=majority";

console.log('Attempting to connect to MongoDB...');
mongoose.connect(dbURI, {
  // Remove deprecated options
  // Add these options for troubleshooting
  serverSelectionTimeoutMS: 5000, // Wait 5 seconds for server selection before timing out
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    mongoose.disconnect().then(() => console.log('Disconnected successfully'));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    if (err.name === 'MongoNetworkError') {
      console.log('This appears to be a network connectivity issue. Check your internet connection and firewall settings.');
    }
    if (err.message.includes('authentication failed')) {
      console.log('This appears to be an authentication issue. Check your username and password.');
    }
    if (err.message.includes('connection timed out')) {
      console.log('The connection timed out. Check if your IP is correctly whitelisted in MongoDB Atlas.');
    }
  });