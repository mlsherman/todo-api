document.addEventListener('DOMContentLoaded', () => {
    const todoList = document.getElementById('todo-list');
    const newTodoInput = document.getElementById('new-todo');
    const addButton = document.getElementById('add-btn');
  
    // Function to render the todos on the page
    function renderTodos(todos) {
      todoList.innerHTML = ''; // Clear the current list
      todos.forEach(todo => {
        const li = document.createElement('li');
        li.innerHTML = `
          ${todo.task}
          <button onclick="deleteTodo(${todo.id})">Delete</button>
        `;
        todoList.appendChild(li);
      });
    }
  
    // Function to fetch all todos from the API
    async function fetchTodos() {
      const response = await fetch('/todos');
      const todos = await response.json();
      renderTodos(todos);
    }
  
    // Function to add a new todo
    async function addTodo() {
      const task = newTodoInput.value.trim();
      if (task) {
        const response = await fetch('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task }),
        });
        const newTodo = await response.json();
        fetchTodos(); // Refresh the list after adding a new todo
      }
    }
  
    // Function to delete a todo
    async function deleteTodo(id) {
      await fetch(`/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos(); // Refresh the list after deletion
    }
  
    // Event listeners
    addButton.addEventListener('click', addTodo);
  
    // Fetch todos when the page loads
    fetchTodos();
  });
  