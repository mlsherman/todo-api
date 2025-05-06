const request = require("supertest");
const app = require("../index"); // Import your Express app

// Reset tasks before each test
beforeEach(() => {
  app.resetTasks();
});

describe("Tasks API", () => {
  test("GET /tasks returns all tasks", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2); // Since we reset to 2 tasks
  });

  test("POST /tasks creates a new task", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "Test task" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("title", "Test task");
    expect(response.body).toHaveProperty("id", 3); // Should be the third task
    expect(response.body).toHaveProperty("completed", false);
  });

  test("POST /tasks returns 400 if title is missing", async () => {
    const response = await request(app).post("/tasks").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  // New DELETE tests
  test("DELETE /tasks/:id deletes a task", async () => {
    const response = await request(app).delete("/tasks/1");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Task 1 deleted");

    // Verify the task was deleted
    const getResponse = await request(app).get("/tasks");
    expect(getResponse.body.length).toBe(1);
    expect(getResponse.body.find((task) => task.id === 1)).toBeUndefined();
  });

  test("DELETE /tasks/:id returns 404 for non-existent task", async () => {
    const response = await request(app).delete("/tasks/999");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  // New PUT tests
  test("PUT /tasks/:id updates a task", async () => {
    const response = await request(app)
      .put("/tasks/2")
      .send({ title: "Updated task", completed: true });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("title", "Updated task");
    expect(response.body).toHaveProperty("completed", true);
    expect(response.body).toHaveProperty("id", 2);

    // Verify the task was updated
    const getResponse = await request(app).get("/tasks");
    const updatedTask = getResponse.body.find((task) => task.id === 2);
    expect(updatedTask.title).toBe("Updated task");
    expect(updatedTask.completed).toBe(true);
  });

  test("PUT /tasks/:id returns 404 for non-existent task", async () => {
    const response = await request(app)
      .put("/tasks/999")
      .send({ title: "This will fail" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  test("PUT /tasks/:id returns 400 if title is missing", async () => {
    const response = await request(app)
      .put("/tasks/2")
      .send({ completed: true });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
