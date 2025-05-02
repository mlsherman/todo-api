const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

let tasks = [
  { id: 1, title: "Learn Node.js", completed: false },
  { id: 2, title: "Create an API", completed: false },
];

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    title: req.body.title,
    completed: false,
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
