# 🎯 Habit Tracker - Backend API

RESTful API backend for the Habit Tracker application built with Node.js, Express, and MongoDB. Handles authentication, habit management, and social features.

## 🛠️ Tech Stack

- **Runtime:** Node.js 20.14.0
- **Framework:** Express 4.19.2
- **Database:** MongoDB (Mongoose 8.5.1)
- **Authentication:** JWT + Google OAuth2Client 9.14.0
- **Validation:** Zod 3.23.8
- **Security:** Helmet, CORS, express-validator

## 📋 Prerequisites

- **Node.js** (v20.x or higher)
- **npm** or **yarn**
- **MongoDB** (Local instance or MongoDB Atlas account)
- **Google Cloud Console** account (for OAuth credentials)

## 🚀 Installation

```bash
npm install
```

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/habit-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Environment Variables Explained:

| Variable | Description |
|----------|-------------|
| `PORT` | Port number for the server (default: 4000) |
| `MONGODB_URI` | MongoDB connection string with database name |
| `JWT_SECRET` | Secret key for signing JWT tokens (use a strong random string) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console |
| `CLIENT_ORIGIN` | Frontend URL for CORS configuration |
| `NODE_ENV` | Environment mode (development/production) |

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - Your production frontend URL
7. Copy the **Client ID** to your `.env` file

## 🏃‍♂️ Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will start on `http://localhost:4000`

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── habitController.js # Habit CRUD operations
│   │   └── socialController.js# Follow/feed logic
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Habit.js           # Habit schema
│   │   ├── CheckIn.js         # CheckIn schema
│   │   └── Follow.js          # Follow relationship schema
│   ├── routes/
│   │   ├── auth.js            # Auth routes
│   │   ├── habits.js          # Habit routes
│   │   └── social.js          # Social routes
│   ├── utils/
│   │   ├── period.js          # Date/streak utilities
│   │   └── token.js           # JWT utilities
│   └── index.js               # Server entry point
├── .env                       # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/google` | Authenticate with Google OAuth token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Habits
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/habits` | List all user habits with stats | Yes |
| POST | `/api/habits` | Create a new habit | Yes |
| PUT | `/api/habits/:id` | Update habit details | Yes |
| DELETE | `/api/habits/:id` | Delete a habit | Yes |
| POST | `/api/habits/:id/checkin` | Mark habit as completed today | Yes |
| DELETE | `/api/habits/:id/checkin` | Undo today's check-in | Yes |

### Social
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/search?q=name` | Search users by name | Yes |
| POST | `/api/follow/:userId` | Follow a user | Yes |
| DELETE | `/api/follow/:userId` | Unfollow a user | Yes |
| GET | `/api/following` | Get list of followed users | Yes |
| GET | `/api/feed` | Get friends' activity feed | Yes |

## 🧪 API Testing

You can test the API using tools like Postman or curl:

```bash
# Health check
curl http://localhost:4000/api/health

# Get habits (requires JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:4000/api/habits
```
## 📝 Scripts

```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
```
