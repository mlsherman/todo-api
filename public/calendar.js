// Client-side JavaScript for calendar functionality
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM loaded - calendar.js running");
    
    // Check if calendar elements exist before setting up calendar functionality
    const connectButton = document.getElementById("connect-calendar-btn");
    const calendarStatus = document.getElementById("calendar-status");
    const calendarMessage = document.getElementById("calendar-message");
  
    if (!connectButton || !calendarStatus || !calendarMessage) {
      console.log("Calendar UI elements not found. Skipping calendar setup.");
      return;
    }
  
    console.log("Calendar UI elements found, continuing setup");
  
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("User not logged in. Hiding calendar section.");
      document.querySelector(".calendar-integration").style.display = "none";
      return;
    }
  
    // Function to check calendar connection status
    async function checkCalendarStatus() {
      try {
        const response = await fetch("/calendar/status", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });
  
        const data = await response.json();
  
        if (response.ok && data.connected) {
          calendarStatus.textContent = "Google Calendar is connected.";
          connectButton.textContent = "Refresh Google Calendar Connection";
          calendarMessage.textContent =
            "Your tasks with due dates will sync with Google Calendar.";
          calendarMessage.className = "calendar-message success";
          calendarMessage.style.display = "block";
        } else {
          calendarStatus.textContent = "Google Calendar is not connected.";
          connectButton.textContent = "Connect Google Calendar";
          calendarMessage.style.display = "none";
        }
      } catch (error) {
        console.error("Error checking calendar status:", error);
        calendarStatus.textContent =
          "Unable to check calendar connection status.";
      }
    }
  
    // Function to connect to Google Calendar
    async function connectGoogleCalendar() {
      try {
        console.log("Connect button clicked, making request to /calendar/auth/google");
        calendarStatus.textContent = "Connecting to Google Calendar...";
        connectButton.disabled = true;
  
        const response = await fetch("/calendar/auth/google", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });
  
        console.log("Response received:", response.status);
        const data = await response.json();
        console.log("Response data:", data);
  
        if (response.ok && data.authUrl) {
          // Open Google auth URL in a new window
          console.log("Redirecting to auth URL:", data.authUrl);
          window.location.href = data.authUrl;
        } else {
          calendarStatus.textContent = "Failed to connect to Google Calendar.";
          calendarMessage.textContent = data.error || "An error occurred.";
          calendarMessage.className = "calendar-message error";
          calendarMessage.style.display = "block";
          connectButton.disabled = false;
        }
      } catch (error) {
        console.error("Error connecting to Google Calendar:", error);
        calendarStatus.textContent = "Connection error.";
        calendarMessage.textContent =
          "Failed to connect to Google Calendar. Please try again.";
        calendarMessage.className = "calendar-message error";
        calendarMessage.style.display = "block";
        connectButton.disabled = false;
      }
    }
  
    // Add event listener to connect button
    console.log("Adding click event listener to connect button");
    connectButton.addEventListener("click", connectGoogleCalendar);
  
    // Check initial status
    checkCalendarStatus();
  });