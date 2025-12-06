# 🚀 Command Manager

<p align="center">
  <strong>A powerful desktop and cloud-based SSH command management system</strong><br>
  Manage your SSH profiles and commands from anywhere - desktop app or web dashboard
</p>

<p align="center">
  <a href="https://github.com/eaeoz/command-manager-windows/releases/download/1.0.1/CommandManager_1.0.1_Setup.exe">
    <img src="https://img.shields.io/badge/Download-Windows%20Setup-blue?style=for-the-badge&logo=windows" alt="Download Windows Setup">
  </a>
  <a href="https://github.com/eaeoz/command-manager-windows/releases/download/1.0.1/Command-Manager-1.0.1-Portable.exe">
    <img src="https://img.shields.io/badge/Download-Portable%20Version-orange?style=for-the-badge&logo=windows" alt="Download Portable">
  </a>
  <a href="http://comm.zeabur.app/">
    <img src="https://img.shields.io/badge/Web%20Dashboard-Login%20Here-success?style=for-the-badge&logo=google-chrome" alt="Web Dashboard">
  </a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Getting Started](#-getting-started)
  - [Desktop Application](#desktop-application)
  - [Web Dashboard](#web-dashboard)
- [Key Features Explained](#-key-features-explained)
- [Tech Stack](#-tech-stack)
- [Installation Options](#-installation-options)
- [Configuration & Backup](#-configuration--backup)
- [Security](#-security)
- [Docker Deployment](#-docker-deployment)

---

## 🎯 Overview

**Command Manager** is a comprehensive SSH command management solution that bridges the gap between desktop and cloud. Whether you're a developer, system administrator, or DevOps engineer, Command Manager provides:

- 🖥️ **Desktop Application** - Native Windows app with full SSH profile and command management
- ☁️ **Cloud Dashboard** - Web-based interface to manage your configurations from anywhere
- 🔄 **Seamless Sync** - Push your cloud configuration to desktop devices instantly
- 🔐 **Secure Authentication** - JWT-based authentication with email verification
- 📱 **Multi-Device Support** - Manage commands across multiple desktop installations

---

## ✨ Features

### 🔐 User Management & Authentication
- **Secure Registration** - Create your account with email verification
- **Password Reset** - 4-digit code system for password recovery
- **Email Change** - Update your email with verification
- **Session Management** - JWT-based secure authentication
- **Account Security** - Password hashing with bcrypt
- **reCAPTCHA Protection** - Google reCAPTCHA v3 for contact forms

### 💾 SSH Profile Management
- **Create Profiles** - Store SSH connection details (host, port, username, password)
- **Edit & Delete** - Manage profiles with full CRUD operations
- **Bulk Operations** - Export/import profiles for backup
- **Cloud Sync** - Access profiles from web dashboard or desktop app
- **Search & Filter** - Quickly find profiles by title, host, or username

### ⌨️ Command Management
- **Link Commands** - Associate commands with specific SSH profiles
- **Quick Execution** - Run commands with a single click
- **Command Organization** - Search and filter by title or command text
- **URL Integration** - Attach URLs to commands for quick reference
- **Drag & Drop** - Reorder commands visually (desktop app)
- **Profile Switching** - Change the SSH profile for any command

### 🔄 Cloud Synchronization
- **Device Management** - View and manage connected desktop devices
- **Push to Devices** - Send cloud configuration to selected devices
- **Real-time Updates** - Instant sync across all your devices
- **Selective Sync** - Choose which devices to update
- **Sync Status** - Track last sync time for each device

### 🎨 User Experience
- **Dark/Light Mode** - Toggle theme preference
- **Responsive Design** - Mobile-friendly web dashboard
- **Search Functionality** - Find profiles and commands instantly
- **Toast Notifications** - Clear feedback for all actions
- **Statistics Dashboard** - Overview of profiles, commands, and sync status
- **Modern UI** - Clean, intuitive interface

### 👤 Account Management
- **Profile Settings** - Update username and email
- **Password Change** - Change password securely
- **Account Information** - View account status, role, and member since date
- **Account Deletion** - Permanent account removal option

### 📧 Contact System
- **Contact Form** - Built-in contact system with subject categorization
- **Email Notifications** - Automatic email delivery via Gmail
- **Spam Protection** - reCAPTCHA v3 integration
- **Admin Notifications** - Contact messages sent to administrator

---

## 🚀 Getting Started

### Desktop Application

#### 📥 Installation

1. **Download your preferred version**:
   - [Windows Setup v1.0.1](https://github.com/eaeoz/command-manager-windows/releases/download/1.0.1/CommandManager_1.0.1_Setup.exe) - Recommended, includes installer
   - [Portable v1.0.1](https://github.com/eaeoz/command-manager-windows/releases/download/1.0.1/Command-Manager-1.0.1-Portable.exe) - No installation required

2. **Installation (Setup version)**:
   - Double-click `CommandManager_1.0.1_Setup.exe`
   - Follow the installation wizard
   - The app will be installed to: `C:\Users\%USERNAME%\AppData\Local\CommandManager`
   - Desktop and Start Menu shortcuts will be created automatically

   **OR**

2. **Portable version**:
   - Download `Command-Manager-1.0.1-Portable.exe`
   - Run directly from any location
   - No installation or admin rights required

3. **Launch the app**:
   - Use Desktop shortcut (Setup version)
   - Or find it in Start Menu (Setup version)
   - Or double-click the portable executable

#### 💻 Usage

1. **Create SSH Profiles**:
   - Click "Profiles" in the sidebar
   - Click "+ Add Profile"
   - Enter SSH connection details (host, username, password, port)
   - Save the profile

2. **Add Commands**:
   - Click "Commands" in the sidebar
   - Click "+ Add Command"
   - Enter command title and command text
   - Select the SSH profile to use
   - Optionally add a URL for reference
   - Save the command

3. **Execute Commands**:
   - Click the "Run" button next to any command
   - Command will be executed on the linked SSH server
   - View results in the output panel

4. **Organize Commands**:
   - Drag and drop commands to reorder them
   - Edit or delete commands as needed
   - Switch profiles for commands anytime

### Web Dashboard

#### 🌐 Access

Visit: **[http://comm.zeabur.app/](http://comm.zeabur.app/)**

#### 👤 Registration

1. Click "Create one" on the login page
2. Enter username, email, and password
3. Check your email for verification link
4. Click the verification link
5. Log in with your credentials

#### 📊 Dashboard Features

1. **Overview Page**:
   - View statistics (total profiles, commands, last sync)
   - Quick action buttons
   - Welcome message with username

2. **My Profiles**:
   - View all your SSH profiles
   - Add, edit, or delete profiles
   - Search profiles by title, host, or username

3. **My Commands**:
   - View all your commands
   - Add, edit, or delete commands
   - Search commands by title or text
   - Assign commands to profiles

4. **Sync Management**:
   - View connected desktop devices
   - See cloud vs local statistics
   - Push configuration to selected devices
   - Track sync history

5. **My Account**:
   - Update personal information
   - Change password
   - View account details
   - Delete account (if needed)

---

## 🎯 Key Features Explained

### Device Synchronization

The sync system allows you to:
1. Create and manage profiles/commands in the web dashboard
2. Install desktop app on multiple computers
3. Push your cloud configuration to any desktop device
4. Keep all devices in sync with your latest configuration

**How it works**:
- Desktop devices register with the cloud when first run
- Cloud dashboard shows all connected devices
- Select devices and click "Push to Selected Devices"
- Desktop apps receive and apply the configuration instantly

### Security Features

- **Password Hashing**: All passwords stored with bcrypt (10 rounds)
- **JWT Authentication**: Secure token-based sessions (24-hour expiry)
- **Email Verification**: Confirm email addresses before activation
- **Rate Limiting**: API protection against brute force attacks
- **Content Security Policy**: XSS and injection attack prevention
- **MongoDB Sanitization**: NoSQL injection prevention
- **HTTPS Ready**: SSL/TLS support for production
- **Helmet.js**: Multiple security headers enabled

### Email System

- **Welcome Emails**: Sent on successful registration
- **Verification Emails**: Email confirmation with clickable links
- **Password Reset**: 4-digit code delivery (5 attempts max)
- **Email Change**: Verification for new email addresses
- **Contact Notifications**: Admin receives contact form submissions

---

## 🛠️ Tech Stack

### Desktop Application
- **Electron.js** - Cross-platform desktop framework
- **Node.js** - JavaScript runtime
- **SSH2** - SSH client for remote command execution
- **Sortable.js** - Drag and drop functionality
- **JSON Storage** - Local configuration management

### Web Application (Server)
- **Node.js & Express.js** - Backend server framework
- **MongoDB & Mongoose** - Database and ODM
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email delivery system
- **Helmet.js** - Security middleware
- **Express-rate-limit** - API rate limiting
- **Google reCAPTCHA v3** - Bot protection

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with CSS variables
- **Responsive Design** - Mobile-first approach
- **Dark/Light Themes** - User preference support

---

## 💿 Installation Options

### Option 1: Windows Installer (Recommended)
Download and run the setup executable from the releases page.

**Features**:
- Automatic installation
- Desktop and Start Menu shortcuts
- Uninstaller included
- Windows registry integration

### Option 2: Portable Build
Build a portable version that doesn't require installation:

```bash
npm install
npm run build-portable
```

The portable executable will be in `dist/` folder.

### Option 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/eaeoz/command-manager-windows.git
cd command-manager-windows

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build
```

---

## 📁 Configuration & Backup

### Desktop App Configuration

Configuration files are stored at:
```
C:\Users\%USERNAME%\AppData\Local\CommandManager\resources\app\config\
```

**Files**:
- `profiles.json` - SSH profile definitions
- `commands.json` - Command definitions
- `config.json` - Application settings

### Backup Your Configuration

1. Navigate to the config folder
2. Copy the entire `config` folder
3. Store it safely (USB drive, cloud storage, etc.)
4. Restore by replacing the config folder in a new installation

### Server Configuration

The web server uses environment variables. Create a `.env` file:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=command_manager

# JWT Secret
JWT_SECRET=your-secret-key-here

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Admin Email
ADMIN_EMAIL=admin@example.com

# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# Server
PORT=5000
NODE_ENV=production
```

---

## 🔒 Security

### Best Practices

1. **Strong Passwords**: Use complex passwords for SSH profiles
2. **Regular Updates**: Keep the application updated
3. **Backup Regularly**: Backup your configuration files
4. **Secure Storage**: Don't share configuration files (they contain passwords)
5. **HTTPS**: Use HTTPS in production for web dashboard
6. **Environment Variables**: Never commit sensitive data to Git

### Security Features Enabled

- ✅ Helmet.js security headers
- ✅ Content Security Policy (CSP)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ NoSQL injection prevention
- ✅ Rate limiting
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Email verification
- ✅ reCAPTCHA protection

---

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Pull the image
docker pull eaeoz/command-manager-docker

# Run the container
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-secret \
  --name command-manager \
  eaeoz/command-manager-docker
```

### Resources

- **Docker Hub**: [eaeoz/command-manager-docker](https://hub.docker.com/r/eaeoz/command-manager-docker)
- **Docker Repository**: [GitHub - command-manager-docker](https://github.com/eaeoz/command-manager-docker)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

- **Web Dashboard**: [http://comm.zeabur.app/](http://comm.zeabur.app/)
- **Issues**: [GitHub Issues](https://github.com/eaeoz/command-manager-windows/issues)
- **Contact**: Use the contact form in the web dashboard

---

## 🎉 Credits

Developed with ❤️ by **Sedat ERGOZ**

---

<p align="center">
  <strong>⭐ Star this repository if you find it helpful!</strong>
</p>
