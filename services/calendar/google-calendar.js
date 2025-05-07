const { google } = require("googleapis");

// Configuration object using environment variables
const GOOGLE_CALENDAR_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/auth/google/callback",
};

/**
 * Create a new OAuth2 client with the configuration
 */
function createOAuth2Client() {
  console.log("Creating OAuth2 client with config:", {
    clientId: GOOGLE_CALENDAR_CONFIG.clientId ? "PRESENT" : "MISSING",
    clientSecret: GOOGLE_CALENDAR_CONFIG.clientSecret ? "PRESENT" : "MISSING",
    redirectUri: GOOGLE_CALENDAR_CONFIG.redirectUri,
  });

  return new google.auth.OAuth2(
    GOOGLE_CALENDAR_CONFIG.clientId,
    GOOGLE_CALENDAR_CONFIG.clientSecret,
    GOOGLE_CALENDAR_CONFIG.redirectUri
  );
}

/**
 * Generate a URL that asks for permission to access the user's calendar
 */
function getAuthUrl() {
  const oauth2Client = createOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Will return a refresh token
    scope: scopes,
    prompt: "consent", // Forces to approve the consent again
  });
}

/**
 * Get tokens using the authorization code
 */
async function getTokens(code) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Create a Google Calendar client with user's tokens
 */
function createCalendarClient(tokens) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  return google.calendar({
    version: "v3",
    auth: oauth2Client,
  });
}

/**
 * List the user's calendar events
 */
async function listEvents(tokens, timeMin, timeMax, maxResults = 10) {
  const calendar = createCalendarClient(tokens);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin || new Date().toISOString(),
    timeMax:
      timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // One week ahead
    maxResults: maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items;
}

/**
 * Create a calendar event from a todo task
 */
async function createEventFromTask(tokens, task) {
  const calendar = createCalendarClient(tokens);

  // Set default time if not provided (1 hour from now)
  const startTime =
    task.dueDate || new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const endTime = new Date(
    new Date(startTime).getTime() + 60 * 60 * 1000
  ).toISOString();

  const event = {
    summary: task.task, // Use task name as event summary
    description: `Todo task from your Todo App. ${task.description || ""}`,
    start: {
      dateTime: startTime,
      timeZone: "America/New_York", // Default timezone - should be customizable
    },
    end: {
      dateTime: endTime,
      timeZone: "America/New_York", // Default timezone - should be customizable
    },
    reminders: {
      useDefault: true,
    },
    // Add a source to identify this event was created by your app
    source: {
      title: "Todo App",
      url: process.env.APP_URL || "https://todo-api-5w32.onrender.com",
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    return response.data;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}

/**
 * Sync tasks with calendar events
 * This function can be called periodically to keep calendars in sync
 */
async function syncTasksWithCalendar(tokens, tasks) {
  // Implementation would depend on your data structure and requirements
  // The basic idea is to:
  // 1. Get existing events from Google Calendar
  // 2. Compare with your tasks
  // 3. Create, update or delete events as needed

  // This is a simplified example
  const results = {
    created: [],
    updated: [],
    errors: [],
  };

  for (const task of tasks) {
    try {
      // In a real implementation, you'd check if the task already exists as an event
      // and update it instead of creating a new one
      const event = await createEventFromTask(tokens, task);
      results.created.push(event);
    } catch (error) {
      results.errors.push({ task, error: error.message });
    }
  }

  return results;
}

module.exports = {
  getAuthUrl,
  getTokens,
  listEvents,
  createEventFromTask,
  syncTasksWithCalendar,
};
