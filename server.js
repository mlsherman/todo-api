require("dotenv").config();
const auth = require("./auth");
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
  id: { type: Number, unique: true }, // This is for Appian primary key
  task: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to User model
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
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Auth routes
app.use("/auth", auth.routes);

// ✅ AUTHENTICATION REDIRECT MIDDLEWARE
// Add this middleware before your route handlers but after the basic middleware
// In the authentication middleware
app.use((req, res, next) => {
  console.log(
    `Request path: ${req.path}, Auth header: ${
      req.headers.authorization ? "Present" : "Missing"
    }`
  );

  // Skip auth check for auth routes and static files
  if (
    req.path.startsWith("/auth/") ||
    req.path.endsWith(".html") ||
    req.path.endsWith(".js") ||
    req.path.endsWith(".css")
  ) {
    console.log(`Skipping auth check for: ${req.path}`);
    return next();
  }

  // For the root path (/) without authentication, redirect to login
  if (req.path === "/" || req.path === "/index.html") {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log(`Redirecting to login from path: ${req.path}`);
      return res.redirect("/auth-login.html");
    }
    console.log(`Auth header found for ${req.path}, proceeding`);
  }

  next();
});

// Get auth middleware for protected routes
const authMiddleware = auth.middleware;

// ✅ Routes

// Home
app.get("/", (req, res) => {
  // This will now only be called if the user has an auth header
  // Otherwise, they will be redirected to login by the middleware above
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all todos with pagination (for Appian Record sync)
app.get("/todos", authMiddleware, async (req, res) => {
  try {
    const batchNumber = parseInt(req.query.batch || "1"); // Appian sends batch=1, 2, 3...
    const batchSize = parseInt(req.query.batchSize || "50"); // Default to 50
    const skip = (batchNumber - 1) * batchSize;

    const todos = await Todo.find({ user: req.userId })
      .sort({ id: 1 }) // Important: sort by numeric id
      .skip(skip)
      .limit(batchSize);

    if (todos.length === 0) {
      return res.json([]); // Appian will stop requesting more batches
    }

    res.json(todos);
  } catch (err) {
    console.error("Error fetching todos:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create new todo
app.post("/todos", authMiddleware, async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "Task is required" });

  try {
    const newTodo = new Todo({
      task,
      user: req.userId, // Associate todo with current user
    });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    console.error("Error creating todo:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Delete todo by MongoDB _id (not numeric `id`)
app.delete("/todos/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.userId, // Only delete todos owned by this user
    });

    if (!deleted)
      return res.status(404).json({ error: "Todo not found or unauthorized" });
    res.json(deleted);
  } catch (err) {
    console.error("Error deleting todo:", err);
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API routes available at http://localhost:${PORT}/todos`);
  console.log(`🔐 Authentication routes: /auth/register and /auth/login`);
});
