const express = require("express");
const router = express.Router();
const auth = require("../auth"); // Import your auth module
const authMiddleware = auth.middleware; // Get your auth middleware

// Import the google calendar service
const googleCalendar = require("../services/calendar/google-calendar");

// Route to initiate Google OAuth flow
router.get("/auth/google", authMiddleware, (req, res) => {
  try {
    const authUrl = googleCalendar.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: "Failed to generate auth URL" });
  }
});

// Add this near the top of your routes/calendar.js file
router.get('/test-auth', (req, res) => {
    res.json({
      message: 'Calendar test route works!',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?test=1'
    });
  });

// OAuth callback route
router.get("/auth/google/callback", authMiddleware, async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    // Exchange code for tokens
    const tokens = await googleCalendar.getTokens(code);

    // Import mongoose here since we need the model
    const mongoose = require("mongoose");
    // Get User model - this will only work after the model has been registered
    const User = mongoose.model("User");

    await User.findByIdAndUpdate(req.userId, {
      "googleCalendar.tokens": tokens,
      "googleCalendar.connected": true,
    });

    // Redirect to a success page or send success response
    res.redirect("/calendar-connected.html");
  } catch (error) {
    console.error("Error during Google callback:", error);
    res.status(500).json({ error: "Failed to connect Google Calendar" });
  }
});

// Get user's calendar events
router.get("/events", authMiddleware, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const User = mongoose.model("User");
    const user = await User.findById(req.userId);

    if (!user.googleCalendar || !user.googleCalendar.connected) {
      return res.status(400).json({ error: "Google Calendar not connected" });
    }

    const { timeMin, timeMax } = req.query;
    const events = await googleCalendar.listEvents(
      user.googleCalendar.tokens,
      timeMin,
      timeMax
    );

    res.json(events);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

// Add this route to your existing routes/calendar.js file

// Route to check if user has connected Google Calendar
router.get('/status', authMiddleware, async (req, res) => {
    try {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user has connected Google Calendar
      const isConnected = user.googleCalendar && 
                          user.googleCalendar.connected && 
                          user.googleCalendar.tokens && 
                          user.googleCalendar.tokens.access_token;
      
      res.json({ 
        connected: !!isConnected,
        // Only send additional info if connected
        lastSync: isConnected ? user.googleCalendar.lastSync : null
      });
    } catch (error) {
      console.error('Error checking calendar status:', error);
      res.status(500).json({ error: 'Failed to check calendar status' });
    }
  });

// Create calendar event from a task
router.post("/events/task/:id", authMiddleware, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const User = mongoose.model("User");
    const Todo = mongoose.model("Todo");

    const user = await User.findById(req.userId);

    if (!user.googleCalendar || !user.googleCalendar.connected) {
      return res.status(400).json({ error: "Google Calendar not connected" });
    }

    const todo = await Todo.findOne({ _id: req.params.id, user: req.userId });

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    const event = await googleCalendar.createEventFromTask(
      user.googleCalendar.tokens,
      todo
    );

    // Optionally, update the todo with the event ID
    // First check if calendarEventId exists in the schema
    if (!todo.calendarEventId) {
      todo.set("calendarEventId", event.id);
    } else {
      todo.calendarEventId = event.id;
    }
    await todo.save();

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

// Sync all user's tasks with calendar
router.post("/sync", authMiddleware, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const User = mongoose.model("User");
    const Todo = mongoose.model("Todo");

    const user = await User.findById(req.userId);

    if (!user.googleCalendar || !user.googleCalendar.connected) {
      return res.status(400).json({ error: "Google Calendar not connected" });
    }

    // Get all user's tasks with due dates
    const todos = await Todo.find({
      user: req.userId,
      dueDate: { $exists: true, $ne: null },
    });

    const syncResults = await googleCalendar.syncTasksWithCalendar(
      user.googleCalendar.tokens,
      todos
    );

    res.json(syncResults);
  } catch (error) {
    console.error("Error syncing with calendar:", error);
    res.status(500).json({ error: "Failed to sync with calendar" });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();

// // Very simple test route with no dependencies
// router.get("/test", (req, res) => {
//   console.log("Calendar test route accessed");
//   res.json({ message: "Calendar test route is working!" });
// });

// // Simple route for Google auth (fixed)
// router.get("/auth/google", (req, res) => {
//   console.log("Calendar auth/google route accessed");
//   res.json({ message: "Google auth route is working!" });
// });

// // Simple callback route (fixed)
// router.get("/auth/google/callback", (req, res) => {
//   console.log("Google auth callback route accessed");
//   res.json({ message: "Google auth callback is working!" });
// });

// // Log when this file is loaded
// console.log("Calendar routes file loaded");

// module.exports = router;
