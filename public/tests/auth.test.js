const request = require("supertest");
const mongoose = require("mongoose");
const dbHandler = require("./db-handler");
const app = require("../index"); // Make sure this matches your main file name

// Setup connection to the database
beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe("Authentication Endpoints", () => {
  // Set JWT secret for testing
  process.env.JWT_SECRET = "test-jwt-secret";

  test("POST /auth/register creates a new user", async () => {
    // Register a new user
    const response = await request(app).post("/auth/register").send({
      username: "testuser",
      password: "password123",
    });

    // Check that registration was successful
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message");
  });

  test("POST /auth/login returns a token for valid credentials", async () => {
    // First register a user
    await request(app).post("/auth/register").send({
      username: "logintest",
      password: "password123",
    });

    // Then try to login
    const response = await request(app).post("/auth/login").send({
      username: "logintest",
      password: "password123",
    });

    // Check that login was successful and returned a token
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
    expect(response.body.token.length).toBeGreaterThan(0);
  });

  test("POST /auth/login returns 401 for invalid credentials", async () => {
    // Try to login with invalid credentials
    const response = await request(app).post("/auth/login").send({
      username: "nonexistentuser",
      password: "wrongpassword",
    });

    // Check that we get a 401 Unauthorized error
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});
