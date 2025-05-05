const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MongoDB connection string
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

// ✅ Counter schema for auto-incrementing id
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

// ✅ Todo schema with short numeric `id`
const todoSchema = new mongoose.Schema({
  id: Number, // This is for Appian primary key
  task: { type: String, required: true },
});

// ✅ Pre-save hook to auto-increment `id`
todoSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "todoId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Todo = mongoose.model("Todo", todoSchema);

// ✅ Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// ✅ Routes

// Home
app.get("/", (req, res) => {
  res.send("Hello from your Node.js To-Do API!");
});

// Get all todos with pagination (for Appian Record sync)
app.get("/todos", async (req, res) => {
  try {
    const startIndex = parseInt(req.query.startIndex || "0");
    const batchSize = parseInt(req.query.batchSize || "50");

    const todos = await Todo.find()
      .sort({ id: 1 }) // sort by short numeric id
      .skip(startIndex)
      .limit(batchSize);

    res.json(todos);
  } catch (err) {
    console.error("Error fetching todos:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create new todo
app.post("/todos", async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "Task is required" });

  try {
    const newTodo = new Todo({ task }); // `id` auto-set
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Delete todo by MongoDB _id (not numeric `id`)
app.delete("/todos/:id", async (req, res) => {
  try {
    const deleted = await Todo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Todo not found" });
    res.json(deleted);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// ✅ TEMP ROUTE: Backfill missing `id` fields for existing todos
app.post("/backfill-ids", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ _id: 1 });
    let counter = 1;

    for (const todo of todos) {
      if (!todo.id) {
        todo.id = counter++;
        await todo.save();
      }
    }

    // Update counter so future todos get the next number
    await Counter.findByIdAndUpdate(
      { _id: "todoId" },
      { $set: { seq: counter - 1 } },
      { upsert: true }
    );

    res.json({ message: "Backfill complete", total: counter - 1 });
  } catch (err) {
    console.error("Error during backfill:", err);
    res.status(500).json({ error: "Backfill failed" });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
