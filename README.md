# 📝 TODO API with JWT Auth & Google Calendar Integration

A secure, RESTful TODO API built with Node.js and Express. Includes JWT-based authentication and Google Calendar API integration to sync tasks as events. Designed for real-world backend development and practice with third-party API integration.

---

## 🔗 Live App

🌐 [https://todo-api-5w32.onrender.com/auth-login.html](https://todo-api-5w32.onrender.com/auth-login.html)

> Includes a basic HTML login/register interface for testing the API.

---

## 💻 Source Code

📦 [https://github.com/mlsherman/todo-api](https://github.com/mlsherman/todo-api)

---

## 🧰 Tech Stack

- Node.js
- Express.js
- MongoDB (via Mongoose)
- JWT (JSON Web Tokens)
- Google Calendar API
- Render (Deployment)

---

## 🔐 Authentication

- Users must register and log in to receive a JWT token.
- Include the token in the `Authorization` header for all protected endpoints.

Example:

```http
Authorization: Bearer eyJhbGciOi...
POST    /auth-register        Register a new user
POST    /auth-login           Authenticate and receive JWT
POST    /task                 Create a new task (requires JWT)
GET     /task                 Retrieve all tasks for logged-in user
PUT     /task/:id             Update a task
DELETE  /task/:id             Delete a task

When a task is created via POST /task, it is also added to the authenticated user's Google Calendar via OAuth2 integration.

git clone https://github.com/mlsherman/todo-api.git
cd todo-api
npm install

MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

![image](https://github.com/user-attachments/assets/f1a519f7-7cf5-4053-b99e-28590bdcd36e)

🚧 Known Issues / Improvements
Google Calendar access requires manual OAuth login (no refresh token support yet)

Input validation and error handling could be expanded

Future versions may include a React Native frontend or dashboard

🙌 Contributions
Pull requests, ideas, or issues welcome. Let's improve it together!

📄 License
This project is licensed under the MIT License.
![TODO API thumbnail](./assets/todo-thumbnail.png)



