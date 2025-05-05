// Todo App with Authentication
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("new-todo");
  const list = document.getElementById("todo-list");

  // Check if user is logged in
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "auth-login.html";
    return;
  }

  // Add logout button
  addLogoutButton();

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
        window.location.href = "auth-login.html";
        return;
      }

      const todos = await res.json();
      list.innerHTML = "";
      todos.forEach((todo) => {
        const li = document.createElement("li");
        li.textContent = todo.task;
        li.dataset.id = todo._id;
        li.addEventListener("click", async () => {
          await fetch(`/todos/${todo._id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          loadTodos();
        });
        list.appendChild(li);
      });
    } catch (error) {
      console.error("Error loading todos:", error);
    }
  }

  // Add new todo with authentication
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const task = input.value.trim();
    if (task) {
      try {
        await fetch("/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ task }),
        });
        input.value = "";
        loadTodos();
      } catch (error) {
        console.error("Error adding todo:", error);
      }
    }
  });

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
