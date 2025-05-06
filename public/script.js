// Todo App with Authentication, Due Dates, and Calendar View
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("todo-form");
  const taskInput = document.getElementById("new-todo");
  const dateInput = document.getElementById("todo-date");
  const list = document.getElementById("todo-list");
  const statusFilter = document.getElementById("status-filter");
  const dateFilter = document.getElementById("date-filter");
  const clearDateFilterBtn = document.getElementById("clear-date-filter");
  const listViewBtn = document.getElementById("list-view-btn");
  const calendarViewBtn = document.getElementById("calendar-view-btn");
  const listView = document.getElementById("list-view");
  const calendarView = document.getElementById("calendar-view");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const currentMonthElement = document.getElementById("current-month");
  const calendarGrid = document.querySelector(".calendar-grid");

  let allTodos = [];
  let currentMonth = new Date();

  // Set default due date to today
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  dateInput.value = formattedDate;

  // Check if user is logged in
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/auth-login.html";
    return;
  }

  // Add logout button
  addLogoutButton();

  // Event listeners for view toggles
  listViewBtn.addEventListener("click", function () {
    setActiveView(listViewBtn, listView);
  });

  calendarViewBtn.addEventListener("click", function () {
    setActiveView(calendarViewBtn, calendarView);
    renderCalendar();
  });

  // Event listeners for calendar navigation
  prevMonthBtn.addEventListener("click", function () {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", function () {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
  });

  // Event listeners for filters
  statusFilter.addEventListener("change", filterTodos);
  dateFilter.addEventListener("change", filterTodos);
  clearDateFilterBtn.addEventListener("click", function () {
    dateFilter.value = "";
    filterTodos();
  });

  // Fetch and display todos with authentication
  async function loadTodos() {
    try {
      // Add authentication headers to the request
      const res = await fetch("/todos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If unauthorized, redirect to login
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/auth-login.html";
        return;
      }

      allTodos = await res.json();

      // Apply filters and render todos
      filterTodos();

      // If calendar view is active, render the calendar
      if (calendarView.classList.contains("active")) {
        renderCalendar();
      }
    } catch (error) {
      console.error("Error loading todos:", error);
    }
  }

  // Filter todos based on current filter settings
  function filterTodos() {
    const statusValue = statusFilter.value;
    const dateValue = dateFilter.value;

    let filteredTodos = [...allTodos];

    // Filter by status
    if (statusValue === "completed") {
      filteredTodos = filteredTodos.filter((todo) => todo.completed);
    } else if (statusValue === "incomplete") {
      filteredTodos = filteredTodos.filter((todo) => !todo.completed);
    }

    // Filter by date
    if (dateValue) {
      filteredTodos = filteredTodos.filter((todo) => {
        if (!todo.dueDate) return false;
        return todo.dueDate.split("T")[0] === dateValue;
      });
    }

    // Render filtered todos
    renderTodoList(filteredTodos);
  }

  // Render todo list
  function renderTodoList(todos) {
    list.innerHTML = "";

    if (todos.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No tasks to display";
      emptyMessage.style.textAlign = "center";
      emptyMessage.style.color = "#888";
      list.appendChild(emptyMessage);
      return;
    }

    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.dataset.id = todo._id;

      // Add completed class if todo is completed
      if (todo.completed) {
        li.classList.add("completed-task");
      }

      // Create task content div
      const taskContent = document.createElement("div");

      // Add task text
      const taskText = document.createElement("span");
      taskText.textContent = todo.task;
      taskContent.appendChild(taskText);

      // Add due date if exists
      if (todo.dueDate) {
        const dateElement = document.createElement("div");
        dateElement.className = "todo-date";
        const dueDate = new Date(todo.dueDate);
        dateElement.textContent = `Due: ${dueDate.toLocaleDateString()}`;
        taskContent.appendChild(dateElement);
      }

      // Create action buttons
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "todo-actions";

      // Complete/Incomplete button
      const completeBtn = document.createElement("button");
      completeBtn.className = "complete-btn";
      completeBtn.textContent = todo.completed ? "Undo" : "Complete";
      completeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await toggleTodoComplete(todo._id, !todo.completed);
      });
      actionsDiv.appendChild(completeBtn);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deleteTodo(todo._id);
      });
      actionsDiv.appendChild(deleteBtn);

      // Add content and actions to list item
      li.appendChild(taskContent);
      li.appendChild(actionsDiv);
      list.appendChild(li);
    });
  }

  // Toggle todo complete status
  async function toggleTodoComplete(id, completed) {
    try {
      await fetch(`/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      });
      loadTodos();
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  }

  // Delete todo
  async function deleteTodo(id) {
    try {
      await fetch(`/todos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      loadTodos();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  }

  // Add new todo with authentication
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const task = taskInput.value.trim();
    const dueDate = dateInput.value;

    if (task) {
      try {
        await fetch("/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task,
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          }),
        });
        taskInput.value = "";
        loadTodos();
      } catch (error) {
        console.error("Error adding todo:", error);
      }
    }
  });

  // Set active view
  function setActiveView(button, viewElement) {
    // Update button styles
    document.querySelectorAll(".view-toggle button").forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");

    // Update view containers
    document.querySelectorAll(".view-container").forEach((view) => {
      view.classList.remove("active");
    });
    viewElement.classList.add("active");
  }

  // Render calendar view
  function renderCalendar() {
    // Update current month display
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    currentMonthElement.textContent = `${
      monthNames[currentMonth.getMonth()]
    } ${currentMonth.getFullYear()}`;

    // Clear calendar days except weekday headers
    const weekdaysCount = document.querySelectorAll(".weekday").length;
    while (calendarGrid.children.length > weekdaysCount) {
      calendarGrid.removeChild(calendarGrid.lastChild);
    }

    // Get days for current month view
    const calendarDays = getCalendarDays(currentMonth);

    // Add days to calendar grid
    calendarDays.forEach((day) => {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";

      if (day.differentMonth) {
        dayElement.classList.add("different-month");
      }

      // Check if day is today
      const today = new Date();
      if (
        day.date.getDate() === today.getDate() &&
        day.date.getMonth() === today.getMonth() &&
        day.date.getFullYear() === today.getFullYear()
      ) {
        dayElement.classList.add("today");
      }

      // Add day number
      const dayNumber = document.createElement("div");
      dayNumber.className = "day-number";
      dayNumber.textContent = day.date.getDate();
      dayElement.appendChild(dayNumber);

      // Add tasks for this day
      const tasksContainer = document.createElement("div");
      tasksContainer.className = "day-tasks";

      // Filter todos for this day
      const todosForDay = allTodos.filter((todo) => {
        if (!todo.dueDate) return false;
        const todoDate = new Date(todo.dueDate);
        return (
          todoDate.getDate() === day.date.getDate() &&
          todoDate.getMonth() === day.date.getMonth() &&
          todoDate.getFullYear() === day.date.getFullYear()
        );
      });

      // Add tasks to day element
      todosForDay.forEach((todo) => {
        const taskElement = document.createElement("div");
        taskElement.className = "day-task";
        if (todo.completed) {
          taskElement.classList.add("completed-task");
        }
        taskElement.textContent = todo.task;
        taskElement.dataset.id = todo._id;
        taskElement.addEventListener("click", () => {
          // Show task details or allow editing
          alert(
            `Task: ${todo.task}\nStatus: ${
              todo.completed ? "Completed" : "Incomplete"
            }`
          );
        });
        tasksContainer.appendChild(taskElement);
      });

      dayElement.appendChild(tasksContainer);
      calendarGrid.appendChild(dayElement);
    });
  }

  // Get calendar days for month
  function getCalendarDays(date) {
    const days = [];

    // Get first day of month
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    // Get day of week (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // Get days from previous month
    const lastDayOfPrevMonth = new Date(date.getFullYear(), date.getMonth(), 0);
    const prevMonthDays = lastDayOfPrevMonth.getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        prevMonthDays - i
      );
      days.push({
        date: day,
        differentMonth: true,
      });
    }

    // Get days from current month
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthDays = lastDayOfMonth.getDate();

    for (let i = 1; i <= monthDays; i++) {
      const day = new Date(date.getFullYear(), date.getMonth(), i);
      days.push({
        date: day,
        differentMonth: false,
      });
    }

    // Get days from next month to fill out the grid
    const totalDaysSoFar = days.length;
    const daysToAdd = 42 - totalDaysSoFar; // 6 rows of 7 days

    for (let i = 1; i <= daysToAdd; i++) {
      const day = new Date(date.getFullYear(), date.getMonth() + 1, i);
      days.push({
        date: day,
        differentMonth: true,
      });
    }

    return days;
  }

  // Add logout button to the UI
  function addLogoutButton() {
    const container = document.querySelector(".container");

    // Create a wrapper for the logout button
    const logoutWrapper = document.createElement("div");
    logoutWrapper.style.textAlign = "right";
    logoutWrapper.style.marginBottom = "1rem";

    // Create the logout button
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Logout";
    logoutBtn.style.padding = "0.3rem 0.8rem";
    logoutBtn.style.fontSize = "0.9rem";

    // Add click event to logout
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "auth-login.html";
    });

    // Add to the DOM
    logoutWrapper.appendChild(logoutBtn);
    container.insertBefore(logoutWrapper, container.firstChild);
  }

  // Initialize app
  loadTodos();
});
