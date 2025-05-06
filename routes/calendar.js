const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/middleware"); // Corrected path to your auth middleware
const mongoose = require("mongoose");
const User = mongoose.model("User"); // Reference your User model
const Todo = mongoose.model("Todo"); // Reference your Todo model
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

// OAuth callback route
router.get("/auth/google/callback", authMiddleware, async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    // Exchange code for tokens
    const tokens = await googleCalendar.getTokens(code);

    // Store tokens in user document
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

// Create calendar event from a task
router.post("/events/task/:id", authMiddleware, async (req, res) => {
  try {
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
    todo.calendarEventId = event.id;
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
