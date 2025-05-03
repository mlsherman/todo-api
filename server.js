const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Parse JSON body

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// In-memory todo store
let todos = [
  { id: 1, task: "Learn Node.js" },
  { id: 2, task: "Build a REST API" },
];

// Home route
app.get("/", (req, res) => {
  res.send("Hello from your Node.js To-Do API!");
});

// GET all todos
app.get("/todos", (req, res) => {
  res.json(todos);
});

// POST a new todo
app.post("/todos", (req, res) => {
  const { task } = req.body;
  if (!task) {
    return res.status(400).json({ error: "Task is required" });
  }
  const newTodo = {
    id: todos.length + 1,
    task,
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// DELETE a todo by ID
app.delete("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }
  const deleted = todos.splice(index, 1);
  res.json(deleted[0]);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
