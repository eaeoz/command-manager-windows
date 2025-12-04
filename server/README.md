# Command Manager - Backend Server & Admin Panel

A secure Node.js backend with MongoDB for managing Command Manager profiles and commands with a modern admin panel featuring dark/light themes.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Management**: Admin panel to manage users and their configurations
- **Configuration Sync**: API endpoints for Electron app to sync profiles and commands
- **Security**: Rate limiting, input validation, MongoDB sanitization, and helmet.js
- **Modern Admin Panel**: Responsive UI with dark/light theme support
- **REST API**: Complete API for all CRUD operations

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=command-manager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important**: Change `JWT_SECRET` to a strong random string in production!

### 3. Setup MongoDB

#### Option A: Local MongoDB

Make sure MongoDB is installed and running:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongodb
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   ```

### 4. Create Initial Admin User

Run the seed script to create the default admin account:

```bash
npm run seed
```

This will create:
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: admin

⚠️ **IMPORTANT**: Change this password immediately after first login!

### 5. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 🎨 Admin Panel

Access the admin panel at: **http://localhost:5000/admin**

### Features

- **📊 Overview Dashboard**: View system statistics
- **👥 User Management**: Create, edit, delete users
- **⚙️ Configuration Management**: View and manage user configurations
- **🌓 Dark/Light Theme**: Toggle between themes
- **🔒 Secure Access**: Admin-only access with JWT authentication

### Default Admin Credentials

```
Email: admin@example.com
Password: admin123
```

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
POST   /api/auth/logout      - Logout user
```

### Configuration (Protected)

```
GET    /api/config           - Get user's configuration
GET    /api/config/stats     - Get configuration statistics
POST   /api/config/sync      - Sync profiles and commands
PUT    /api/config/profiles  - Update profiles
PUT    /api/config/commands  - Update commands
```

### Admin (Admin Only)

```
GET    /api/admin/users              - Get all users
GET    /api/admin/users/:id          - Get user details
PUT    /api/admin/users/:id          - Update user
DELETE /api/admin/users/:id          - Delete user
GET    /api/admin/configurations     - Get all configurations
PUT    /api/admin/configurations/:id - Update configuration
GET    /api/admin/stats              - Get system statistics
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Express-validator for all inputs
- **MongoDB Sanitization**: Prevents NoSQL injection
- **Helmet.js**: Sets security HTTP headers
- **Account Locking**: After 5 failed login attempts (2-hour lockout)

## 🔧 Development

### Project Structure

```
server/
├── models/              # Mongoose models
│   ├── User.js
│   └── Configuration.js
├── routes/              # Express routes
│   ├── auth.js
│   ├── config.js
│   └── admin.js
├── middleware/          # Custom middleware
│   ├── auth.js
│   └── rateLimiter.js
├── public/              # Admin panel static files
│   ├── admin.html
│   ├── admin.css
│   └── admin.js
├── scripts/             # Utility scripts
│   └── seed.js
├── .env.example         # Environment template
├── package.json
└── server.js            # Main server file
```

### Available Scripts

```bash
npm start       # Start server in production mode
npm run dev     # Start server with nodemon (auto-reload)
npm run seed    # Create initial admin user
```

## 🔗 Integrating with Electron App

### 1. Update Electron App Configuration

In your Electron app, set the API base URL:

```javascript
const API_URL = 'http://localhost:5000/api';
```

### 2. Authentication Flow

```javascript
// Login
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { token, user } = await response.json();
// Store token for subsequent requests
```

### 3. Sync Configuration

```javascript
// Sync profiles and commands
const response = await fetch(`${API_URL}/config/sync`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ profiles, commands })
});
```

### 4. Get Configuration

```javascript
// Get synced configuration
const response = await fetch(`${API_URL}/config`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { profiles, commands } = await response.json();
```

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Make sure MongoDB is running:
- Windows: `net start MongoDB`
- macOS/Linux: `sudo systemctl start mongodb`

### Port Already in Use

```bash
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**: Change the PORT in `.env` or kill the process using port 5000:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Admin Panel Not Loading

**Solution**: Make sure:
1. Server is running
2. Navigate to `http://localhost:5000/admin` (not `/admin.html`)
3. Check browser console for errors

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/` |
| `DATABASE_NAME` | Database name | `command-manager` |
| `JWT_SECRET` | JWT signing secret | (must be set) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🚢 Deployment

### Deploying to Heroku

1. Create a Heroku app:
```bash
heroku create your-app-name
```

2. Add MongoDB Atlas addon or use existing MongoDB:
```bash
heroku addons:create mongolab:sandbox
```

3. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
```

4. Deploy:
```bash
git push heroku main
```

5. Seed admin user:
```bash
heroku run npm run seed
```

### Deploying to VPS (Ubuntu)

1. Install Node.js and MongoDB
2. Clone repository
3. Create `.env` file with production values
4. Install dependencies: `npm install --production`
5. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name command-manager-api
pm2 startup
pm2 save
```

## 📄 License

MIT

## 👨‍💻 Support

For issues or questions, please create an issue in the repository.
