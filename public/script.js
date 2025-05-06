// Todo App with Enhanced User Experience
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("todo-form");
  const taskInput = document.getElementById("new-todo");
  const dateInput = document.getElementById("todo-date");
  const prioritySelect = document.getElementById("todo-priority");
  const list = document.getElementById("todo-list");
  const statusFilter = document.getElementById("status-filter");
  const priorityFilter = document.getElementById("priority-filter");
  const dateFilter = document.getElementById("date-filter");
  const clearDateFilterBtn = document.getElementById("clear-date-filter");
  const focusModeBtn = document.getElementById("focus-mode-btn");
  const normalModeBtn = document.getElementById("normal-mode-btn");
  const listViewBtn = document.getElementById("list-view-btn");
  const calendarViewBtn = document.getElementById("calendar-view-btn");
  const listView = document.getElementById("list-view");
  const calendarView = document.getElementById("calendar-view");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const currentMonthElement = document.getElementById("current-month");
  const calendarGrid = document.querySelector(".calendar-grid");

  // Modal elements
  const taskModal = document.getElementById("task-modal");
  const closeModal = document.querySelector(".close-modal");
  const modalTaskContent = document.getElementById("modal-task-content");
  const subtaskList = document.getElementById("subtask-list");
  const addSubtaskForm = document.getElementById("add-subtask-form");
  const newSubtaskInput = document.getElementById("new-subtask");
  const subtaskProgressFill = document.getElementById("subtask-progress-fill");
  const subtaskProgressText = document.getElementById("subtask-progress-text");

  let allTodos = [];
  let currentMonth = new Date();
  let currentTodoId = null; // Used for the modal

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

  // Initialize drag and drop
  initDragAndDrop();

  // Event listeners for modes
  focusModeBtn.addEventListener("click", function () {
    setActiveMode(focusModeBtn);
    list.classList.add("focus-mode-active");
    filterTodos(); // Reapply filters
  });

  normalModeBtn.addEventListener("click", function () {
    setActiveMode(normalModeBtn);
    list.classList.remove("focus-mode-active");
    filterTodos(); // Reapply filters
  });

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
  priorityFilter.addEventListener("change", filterTodos);
  dateFilter.addEventListener("change", filterTodos);
  clearDateFilterBtn.addEventListener("click", function () {
    dateFilter.value = "";
    filterTodos();
  });

  // Modal event listeners
  closeModal.addEventListener("click", closeTaskModal);
  window.addEventListener("click", function (event) {
    if (event.target === taskModal) {
      closeTaskModal();
    }
  });

  // Subtask form submission
  addSubtaskForm.addEventListener("submit", function (event) {
    event.preventDefault();
    addSubtask();
  });

  // Initialize drag and drop functionality
  function initDragAndDrop() {
    new Sortable(list, {
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      onEnd: function (evt) {
        updateTaskOrder(evt);
      },
    });
  }

  // Update the order of tasks after drag and drop
  async function updateTaskOrder(evt) {
    const tasks = Array.from(list.children);
    const newOrder = tasks.map((task, index) => ({
      id: task.dataset.id,
      order: index,
    }));

    try {
      // Send the new order to the server
      await fetch("/todos/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tasks: newOrder }),
      });
    } catch (error) {
      console.error("Error updating task order:", error);
      // If error, reload todos to restore original order
      loadTodos();
    }
  }

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

      // Sort todos by order if available
      allTodos.sort((a, b) => (a.order || 0) - (b.order || 0));

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
    const priorityValue = priorityFilter.value;
    const dateValue = dateFilter.value;
    const focusModeActive = focusModeBtn.classList.contains("active");

    let filteredTodos = [...allTodos];

    // Filter by status
    if (statusValue === "completed") {
      filteredTodos = filteredTodos.filter((todo) => todo.completed);
    } else if (statusValue === "incomplete") {
      filteredTodos = filteredTodos.filter((todo) => !todo.completed);
    }

    // Filter by priority
    if (priorityValue !== "all") {
      filteredTodos = filteredTodos.filter(
        (todo) => todo.priority === priorityValue
      );
    }

    // Filter by date
    if (dateValue) {
      filteredTodos = filteredTodos.filter((todo) => {
        if (!todo.dueDate) return false;
        return todo.dueDate.split("T")[0] === dateValue;
      });
    }

    // Apply focus mode (show only today's tasks)
    if (focusModeActive) {
      const todayStr = new Date().toISOString().split("T")[0];
      filteredTodos = filteredTodos.filter((todo) => {
        if (!todo.dueDate) return false;
        return todo.dueDate.split("T")[0] === todayStr;
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

    const today = new Date().toISOString().split("T")[0];

    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.dataset.id = todo._id;

      // Check if task is due today for focus mode highlighting
      if (todo.dueDate && todo.dueDate.split("T")[0] === today) {
        li.classList.add("today-task");
      }

      // Add completed class if todo is completed
      if (todo.completed) {
        li.classList.add("completed-task");
      }

      // Create drag handle
      const dragHandle = document.createElement("span");
      dragHandle.className = "drag-handle";
      dragHandle.innerHTML = "☰";
      li.appendChild(dragHandle);

      // Create priority indicator
      const priorityIndicator = document.createElement("span");
      priorityIndicator.className = `priority-indicator priority-${
        todo.priority || "medium"
      }`;
      li.appendChild(priorityIndicator);

      // Create task content div
      const taskContent = document.createElement("div");
      taskContent.className = "task-content";

      // Add task text
      const taskText = document.createElement("span");
      taskText.textContent = todo.task;
      taskContent.appendChild(taskText);

      // Add priority badge
      const priorityBadge = document.createElement("span");
      priorityBadge.className = `task-priority priority-${
        todo.priority || "medium"
      }-badge`;
      priorityBadge.textContent = todo.priority
        ? todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)
        : "Medium";
      taskContent.appendChild(priorityBadge);

      // Add subtask indicator if any
      if (todo.subtasks && todo.subtasks.length > 0) {
        const subtaskCount = todo.subtasks.length;
        const completedCount = todo.subtasks.filter(
          (subtask) => subtask.completed
        ).length;
        const subtaskIndicator = document.createElement("div");
        subtaskIndicator.className = "subtask-indicator";

        // Add progress bar
        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";
        const progressFill = document.createElement("div");
        progressFill.className = "progress-fill";
        progressFill.style.width = `${(completedCount / subtaskCount) * 100}%`;
        progressBar.appendChild(progressFill);
        subtaskIndicator.appendChild(progressBar);

        // Add count text
        const countText = document.createElement("span");
        countText.className = "subtask-count";
        countText.textContent = `${completedCount}/${subtaskCount}`;
        subtaskIndicator.appendChild(countText);

        taskContent.appendChild(subtaskIndicator);
      }

      // Add due date if exists
      if (todo.dueDate) {
        const dateElement = document.createElement("div");
        dateElement.className = "todo-date";
        const dueDate = new Date(todo.dueDate);
        dateElement.textContent = `Due: ${dueDate.toLocaleDateString()}`;
        taskContent.appendChild(dateElement);
      }

      // Add click event to open details modal
      taskContent.addEventListener("click", () => {
        openTaskModal(todo);
      });

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

  // Open task details modal
  function openTaskModal(todo) {
    currentTodoId = todo._id;

    // Set task details in modal
    modalTaskContent.innerHTML = `
      <h3>${todo.task}</h3>
      <div class="modal-task-meta">
        <p><strong>Priority:</strong> <span class="priority-${
          todo.priority || "medium"
        }-badge">${
      todo.priority
        ? todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)
        : "Medium"
    }</span></p>
        ${
          todo.dueDate
            ? `<p><strong>Due Date:</strong> ${new Date(
                todo.dueDate
              ).toLocaleDateString()}</p>`
            : ""
        }
        <p><strong>Status:</strong> ${
          todo.completed ? "Completed" : "Incomplete"
        }</p>
      </div>
    `;

    // Render subtasks
    renderSubtasks(todo);

    // Show modal
    taskModal.style.display = "block";
  }

  // Close task modal
  function closeTaskModal() {
    taskModal.style.display = "none";
    currentTodoId = null;
  }

  // Render subtasks in modal
  function renderSubtasks(todo) {
    subtaskList.innerHTML = "";

    if (!todo.subtasks || todo.subtasks.length === 0) {
      subtaskList.innerHTML = "<li>No subtasks yet. Add one below!</li>";
      subtaskProgressFill.style.width = "0%";
      subtaskProgressText.textContent = "0/0 completed";
      return;
    }

    const subtasks = todo.subtasks;
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(
      (subtask) => subtask.completed
    ).length;
    const completionPercentage =
      totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    // Update progress bar
    subtaskProgressFill.style.width = `${completionPercentage}%`;
    subtaskProgressText.textContent = `${completedSubtasks}/${totalSubtasks} completed`;

    // Render each subtask
    subtasks.forEach((subtask, index) => {
      const subtaskItem = document.createElement("li");
      subtaskItem.className = "subtask-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "subtask-checkbox";
      checkbox.checked = subtask.completed;
      checkbox.addEventListener("change", () => {
        toggleSubtaskComplete(index, checkbox.checked);
      });

      const subtaskText = document.createElement("span");
      subtaskText.className = `subtask-text ${
        subtask.completed ? "completed" : ""
      }`;
      subtaskText.textContent = subtask.text;

      const deleteButton = document.createElement("span");
      deleteButton.className = "delete-subtask";
      deleteButton.textContent = "✕";
      deleteButton.addEventListener("click", () => {
        deleteSubtask(index);
      });

      subtaskItem.appendChild(checkbox);
      subtaskItem.appendChild(subtaskText);
      subtaskItem.appendChild(deleteButton);
      subtaskList.appendChild(subtaskItem);
    });
  }

  // Add a new subtask
  async function addSubtask() {
    if (!currentTodoId) return;

    const subtaskText = newSubtaskInput.value.trim();
    if (!subtaskText) return;

    try {
      await fetch(`/todos/${currentTodoId}/subtasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: subtaskText }),
      });

      // Clear input
      newSubtaskInput.value = "";

      // Reload todos and update modal
      const res = await fetch(`/todos/${currentTodoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const todo = await res.json();
      renderSubtasks(todo);

      // Also refresh the main todo list
      loadTodos();
    } catch (error) {
      console.error("Error adding subtask:", error);
    }
  }

  // Toggle subtask completed status
  async function toggleSubtaskComplete(index, completed) {
    if (!currentTodoId) return;

    try {
      await fetch(`/todos/${currentTodoId}/subtasks/${index}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      });

      // Reload todos and update modal
      const res = await fetch(`/todos/${currentTodoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const todo = await res.json();
      renderSubtasks(todo);

      // Also refresh the main todo list
      loadTodos();
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  }

  // Delete a subtask
  async function deleteSubtask(index) {
    if (!currentTodoId) return;

    try {
      await fetch(`/todos/${currentTodoId}/subtasks/${index}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Reload todos and update modal
      const res = await fetch(`/todos/${currentTodoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const todo = await res.json();
      renderSubtasks(todo);

      // Also refresh the main todo list
      loadTodos();
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  }

  // Add new todo with authentication
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const task = taskInput.value.trim();
    const dueDate = dateInput.value;
    const priority = prioritySelect.value;

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
            priority,
            subtasks: [],
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
    viewElement.classList.add("active"); //
  }

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

  // Set active mode
  function setActiveMode(button) {
    document.querySelectorAll(".app-modes button").forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");
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

      // Sort tasks by priority (high to low)
      todosForDay.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (
          (priorityOrder[a.priority || "medium"] || 1) -
          (priorityOrder[b.priority || "medium"] || 1)
        );
      });

      // Add tasks to day element
      todosForDay.forEach((todo) => {
        const taskElement = document.createElement("div");
        taskElement.className = "day-task";

        // Add priority indicator
        const priorityDot = document.createElement("span");
        priorityDot.className = `priority-indicator priority-${
          todo.priority || "medium"
        }`;
        taskElement.appendChild(priorityDot);

        if (todo.completed) {
          taskElement.classList.add("completed-task");
        }

        const taskText = document.createElement("span");
        taskText.textContent = todo.task;
        taskElement.appendChild(taskText);

        taskElement.dataset.id = todo._id;
        taskElement.addEventListener("click", () => {
          openTaskModal(todo);
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
