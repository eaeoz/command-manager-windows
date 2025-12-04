# Complete Setup Guide - Command Manager

This guide will help you set up and run both the Electron desktop app and the backend server with admin panel.

## 📦 What's Included

1. **Electron Desktop App** - SSH command manager with GUI
2. **Node.js Backend Server** - REST API for configuration sync
3. **Admin Panel** - Modern web dashboard for user management

## 🚀 Quick Start

### Option 1: Run Electron App Only (Local Mode)

If you just want to use the app without remote sync:

```bash
# Install dependencies
npm install

# Run the app
npm start
```

The app will work with local JSON files in the `config/` directory.

### Option 2: Full Setup (With Backend & Sync)

#### Step 1: Set Up Backend Server

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your MongoDB settings
# (Use MongoDB Atlas for cloud or local MongoDB)
notepad .env  # or use your preferred editor

# Create initial admin user
npm run seed

# Start the server
npm run dev
```

Server will run at: `http://localhost:5000`
Admin panel at: `http://localhost:5000/admin`

**Default Admin Login:**
- Email: `admin@example.com`
- Password: `admin123`

#### Step 2: Run Electron App

```bash
# Go back to root directory
cd ..

# Install dependencies (if not done)
npm install

# Run the app
npm start
```

## 🎯 Running the Electron App

### Method 1: Development Mode

```bash
npm start
```

This runs the app with developer tools enabled.

### Method 2: Build Executable

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

The executable will be in the `dist/` folder.

### Method 3: Direct Execution

```bash
# Using Electron directly
npx electron .

# Or if electron is globally installed
electron .
```

## 📋 System Requirements

### Electron App
- Windows 10/11, macOS 10.13+, or Linux
- Node.js 14 or higher
- 100 MB disk space

### Backend Server
- Node.js 14 or higher
- MongoDB (local or cloud)
- 200 MB disk space

## 🔧 Configuration

### Electron App Configuration

The app stores data in these files:
- `config/profiles.json` - SSH profiles
- `config/commands.json` - Saved commands
- `config/.env` - Environment variables (optional)

### Backend Server Configuration

Edit `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=command-manager
JWT_SECRET=your-secret-key-here
```

## 🌐 Using Remote Sync

To enable cloud sync between multiple devices:

1. **Set up the backend server** (see above)
2. **Deploy server** to a cloud provider (Heroku, DigitalOcean, etc.)
3. **Register an account** via the admin panel or API
4. **Add sync feature** to Electron app (requires code modification)

Example sync implementation:

```javascript
// In your Electron app
const API_URL = 'http://your-server.com/api';

// Login
async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token } = await response.json();
  return token;
}

// Sync to remote
async function syncToRemote(token, profiles, commands) {
  await fetch(`${API_URL}/config/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ profiles, commands })
  });
}

// Get from remote
async function syncFromRemote(token) {
  const response = await fetch(`${API_URL}/config`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { profiles, commands } = await response.json();
  return { profiles, commands };
}
```

## 🎨 Admin Panel Features

Access at `http://localhost:5000/admin`

- **Dashboard**: View statistics (users, profiles, commands)
- **User Management**: Create, edit, delete users
- **Configuration Viewer**: See all user configurations
- **Dark/Light Theme**: Toggle theme preference
- **Secure Access**: Admin-only with JWT authentication

## 🐛 Troubleshooting

### Electron App Won't Start

**Issue**: App shows error or blank screen

**Solutions**:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```
2. Check if port 22 (SSH) is available
3. Run with developer tools: `npm start` and check console

### Backend Server Issues

**Issue**: Cannot connect to MongoDB

**Solution**:
```bash
# Windows - Start MongoDB
net start MongoDB

# Mac - Install MongoDB
brew install mongodb-community
brew services start mongodb-community

# Linux - Install MongoDB
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Issue**: Port 5000 already in use

**Solution**: Change port in `server/.env`
```env
PORT=5001
```

### Build Issues

**Issue**: Build fails with electron-builder

**Solution**:
```bash
# Clear cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install

# Try building again
npm run build:win
```

## 📁 Project Structure

```
command-manager-windows/
├── app.js                  # Main Electron process
├── package.json            # App dependencies
├── config/                 # Local configuration files
│   ├── profiles.json
│   └── commands.json
├── data/                   # UI assets
│   ├── css/
│   └── js/
├── server/                 # Backend server
│   ├── server.js          # Main server file
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication, etc.
│   ├── public/            # Admin panel
│   └── scripts/           # Utility scripts
└── SETUP_GUIDE.md         # This file
```

## 🔐 Security Notes

1. **Change default admin password** after first login
2. **Use strong JWT_SECRET** in production
3. **Enable HTTPS** for production deployment
4. **Keep dependencies updated**: `npm audit fix`
5. **Don't commit `.env` files** to version control

## 📚 Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Free cloud MongoDB
- [Heroku](https://www.heroku.com/) - Free hosting for backend
- [Express.js Guide](https://expressjs.com/)

## 🆘 Getting Help

If you encounter issues:

1. Check the console for error messages
2. Review the README files in root and `server/` directory
3. Ensure all dependencies are installed
4. Verify MongoDB is running (for backend)
5. Check that ports are not in use

## 📝 Quick Reference Commands

```bash
# Electron App
npm install                 # Install dependencies
npm start                   # Run in development
npm run build:win          # Build Windows executable

# Backend Server
cd server
npm install                # Install dependencies
npm run seed              # Create admin user
npm run dev               # Run with auto-reload
npm start                 # Run in production

# MongoDB
net start MongoDB         # Windows - Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongodb          # Linux
```

## ✅ Next Steps

1. ✅ Run the Electron app: `npm start`
2. ⚙️ (Optional) Set up backend server
3. 🎨 (Optional) Access admin panel
4. 📦 (Optional) Build executable for distribution

Enjoy using Command Manager! 🚀
