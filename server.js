const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MongoDB connection string (fixed)
const dbURI =
  "mongodb+srv://mshermandev01:J0Avk6LkMG9siRTL@cluster0.yu6ogsh.mongodb.net/todoDB?retryWrites=true&w=majority";

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

mongoose.connection.once("open", () => {
  console.log("✅ MongoDB connection is open!");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err);
});

// ✅ Mongoose schema and model
const todoSchema = new mongoose.Schema({
  task: { type: String, required: true },
});

const Todo = mongoose.model("Todo", todoSchema);

// ✅ Middleware
app.use(express.json()); // Parse JSON
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(cors());
// ✅ Routes

// Home
app.get("/", (req, res) => {
  res.send("Hello from your Node.js To-Do API!");
});

// Get all todos
app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create new todo
app.post("/todos", async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "Task is required" });

  try {
    const newTodo = new Todo({ task });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Delete todo by ID
app.delete("/todos/:id", async (req, res) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Todo not found" });
    res.json(deleted);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
