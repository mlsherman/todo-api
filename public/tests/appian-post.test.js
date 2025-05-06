const request = require("supertest");
const mongoose = require("mongoose");
const dbHandler = require("./db-handler");
const app = require("../../index"); // Make sure this matches your main file name

// Setup connection to the database
beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Appian API - Creating Todos", () => {
  // Set environment variable for testing
  process.env.APPIAN_API_KEY = "test-api-key";

  test("POST /appian/todos creates a new todo", async () => {
    // Create a new todo
    const response = await request(app)
      .post("/appian/todos")
      .set("APPIAN_API_KEY", "test-api-key")
      .send({ task: "Test todo from Jest" });

    // Check that the todo was created successfully
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("task", "Test todo from Jest");
    expect(response.body).toHaveProperty("_id");

    // Get all todos to verify it was added
    const getResponse = await request(app)
      .get("/appian/todos")
      .set("APPIAN_API_KEY", "test-api-key");

    // Find the todo we just created
    const createdTodo = getResponse.body.find(
      (todo) => todo.task === "Test todo from Jest"
    );

    // Verify it exists in the database
    expect(createdTodo).toBeDefined();
    expect(createdTodo.task).toBe("Test todo from Jest");
  });

  test("POST /appian/todos returns 400 if task is missing", async () => {
    // Try to create a todo without a task
    const response = await request(app)
      .post("/appian/todos")
      .set("APPIAN_API_KEY", "test-api-key")
      .send({});

    // Check that we get a 400 Bad Request error
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
