# CommandManager App

### Download Windows Desktop Executable Setup

[Latest Release](https://github.com/eaeoz/command-manager-windows/releases/download/1.0.0/CommandManager_1.0.0.exe)

---

# ⚙️ CommandManager

**CommandManager** is a smart and lightweight desktop tool for managing and executing commands via **SSH connections**.  
It lets you easily **create, edit, delete, and organize SSH profiles** — then link your commands to those profiles for quick remote execution.  
With **drag & drop** sorting, **profile-based execution**, and a smooth interface, it’s perfect for developers and sysadmins alike.

---

## ✨ Features

- 🔑 **SSH Profile Management** – create, edit, and delete multiple SSH profiles with host, port, username, and password.  
- ⚙️ **Command Linking** – attach any command to a specific SSH profile and execute it remotely with one click.  
- 🖱️ **Drag & Drop Commands** – reorder or organize commands visually.  
- 🧩 **Profile Switching** – change the profile linked to each command at any time.  
- 🧠 **Local Data Storage** – commands and profiles stored in local JSON files.  
- 🪶 **Simple, Fast, and Secure** – all SSH operations handled locally; no external services or cloud required.

---

## 🖼️ Preview

<p align="center">
  <img src="https://github.com/eaeoz/command-manager-windows/blob/main/sample.gif" alt="CommandManager Demo" width="700">
</p>

---

## 🚀 Usage Overview

1. **Create an SSH Profile** – enter host, username, password, and port information.  
2. **Add a Command** – link it to one of your profiles and save it for execution.  
3. **Edit or Delete** – update profiles or commands anytime from the UI.  
4. **Drag & Drop** – reorder your commands easily to keep your list organized.  
5. **Run Commands** – execute any command instantly through the selected SSH profile.

---

### 🛠️ Tech Stack

- **Electron.js** – desktop UI  
- **Express.js** – backend routing  
- **Node.js** – SSH connection handling (via `ssh2` library)  
- **Sortable.js** – drag & drop functionality  
- **JSON Storage** – lightweight local data management  

---

> 💡 *CommandManager centralizes your SSH profiles and commands into one elegant, fast, and secure desktop tool.*

---

Backup your configuration files for installation to the another system:

`C:\Users\%UserProfile%\AppData\Local\CommandManager\resources\app\config`

---

### Docker Instruction

[Instruction](https://hub.docker.com/r/eaeoz/command-manager-docker)

[Github Repo for Docker](https://github.com/eaeoz/command-manager-docker)
