# 🎓 ChatApp — College Project

A full-stack real-time chat application built with **React**, **Node.js**, **Socket.IO**, and **MongoDB**. This project was developed as a college assignment to demonstrate proficiency in building modern web applications, real-time data synchronization, and secure authentication.

---

## ✨ Features

- **Authentication** — Register, login, logout with secure JWT tokens
- **Real-time messaging** — Instant message delivery via WebSockets (Socket.IO)
- **Online presence** — See who's currently online in real time
- **Typing indicators** — Know when someone is typing
- **Read receipts** — Double-check marks appear when messages are read
- **Chat dashboard** — View all past conversations with a preview of the last message and unread badges
- **User search** — Find users by username or email easily
- **Responsive UI** — Modern, dark-themed, and responsive design

---

## 🗂️ Project Structure

The project is structured into a `client` (frontend) and `server` (backend):

```
ChatApp/
├── server/                  # Node.js + Express + Socket.IO backend
│   ├── models/              # Mongoose DB Schemas (User, Message)
│   ├── routes/              # Express API Routes (Auth, Users, Messages)
│   ├── middleware/          # JWT protect middleware
│   ├── index.js             # Express + Socket.IO server entry point
│   ├── .env.example         # Environment variables template
│   └── package.json
│
├── client/                  # React frontend
│   ├── src/
│   │   ├── context/         # AuthContext and SocketContext providers
│   │   ├── components/      # Sidebar and ChatWindow UI components
│   │   ├── pages/           # AuthPage and ChatPage layouts
│   │   ├── App.js           # Router and App structure
│   │   └── App.css          # Global CSS styling
│   └── package.json
│
├── .gitignore               # Ignored files (credentials, node_modules)
├── package.json             # Root scripts
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

- **Node.js** v18+ and npm installed
- **MongoDB** running locally (`mongodb://localhost:27017`) OR a valid MongoDB Atlas URI.

### 1. Clone & Install Dependencies

Open your terminal and run the following commands:

```bash
# Install root dependencies
npm install

# Install all backend (server) and frontend (client) dependencies
npm run install:all
```

### 2. Configure Environment Variables (.env)

You must set up your environment variables before running the server so it can connect to the database.

1. Navigate to the `server` directory.
2. Create a new file named `.env`.
3. Copy the contents of `server/.env.example` into your new `.env` file.
4. Update the values with your actual credentials. 

Example `.env` file setup:

```env
# server/.env
MONGODB_URI=mongodb+srv://<your_username>:<your_password>@cluster0.mongodb.net/chatapp
JWT_SECRET=your_long_random_secret_key_here
PORT=5000
CLIENT_URL=http://localhost:3000
```
> **Note:** Do NOT upload your `.env` file to GitHub. The included `.gitignore` file is already configured to hide credentials and `.env` files automatically.

### 3. Run the Application

From the root directory of the project, start both the backend server and frontend React app concurrently:

```bash
npm run dev
```

- **Backend API** will run at → http://localhost:5000
- **Frontend App** will run at → http://localhost:3000

Open your browser and navigate to `http://localhost:3000` to start chatting!

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login with email + password
- `POST /api/auth/logout` — Logout (requires token)
- `GET /api/auth/me` — Get current authenticated user

### Users
- `GET /api/users` — List all users
- `GET /api/users/search?q=` — Search users by username/email

### Messages
- `GET /api/messages/:userId` — Get full conversation history with a specific user
- `GET /api/messages/dashboard/conversations` — Get dashboard list of all active conversations

---

## 🛠️ Tech Stack

| Layer       | Technology                                   |
| ----------- | -------------------------------------------- |
| Frontend    | React 18, React Router v6                    |
| Real-time   | Socket.IO (client + server rooms)            |
| Backend     | Node.js, Express.js                          |
| Database    | MongoDB + Mongoose                           |
| Auth        | JWT (jsonwebtoken) + bcryptjs                |

---

## 📱 Screenshots

> **Note to student:** Place your screenshot images (e.g., `.png` or `.jpg` files) in an `assets/` or `screenshots/` folder in your repository, and link them here!

**Login Page:**
![Login Page](assets/login.png)

**Chat Dashboard:**
![Chat Dashboard](assets/chat-dashboard.png)

---

## 🔐 Security Notes

- User passwords are securely hashed using **bcrypt** before being saved to the database.
- Sessions are managed using **JSON Web Tokens (JWT)** which expire after 7 days.
- Private routes on the frontend and backend are thoroughly protected.
- Real-time socket connections require a valid JWT during the handshake.
- The repository includes a `.gitignore` to prevent accidental credential leaks.
