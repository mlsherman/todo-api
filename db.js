// db.js
const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://mshermandev01:J0Avk6LkMG9siRTL@cluster0.xxxxx.mongodb.net/todos-db?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));
