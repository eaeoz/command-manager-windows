const fs = require('fs');
const path = require('path');

// Define the .env file path
const envPath = path.resolve(__dirname, 'config', '.env');

// Default .env content
const defaultEnvContent = `
COMMAND_TIMEOUT=10000
`;

// Check if the .env file exists
if (!fs.existsSync(envPath)) {
    // Create the .env file with default content
    fs.writeFileSync(envPath, defaultEnvContent.trim());
    console.log('.env file created with default values.');
} else {
    console.log('.env file already exists.');
}

// Load environment variables from .env file
require('dotenv').config({ path: './config/.env' });


const { app, BrowserWindow, ipcMain, dialog } = require('electron');

let store; // Declare store variable

async function loadStore() {
    const { default: Store } = await import('electron-store');
    // Get the userData directory and define the config folder path
    const configFolderPath = path.join(__dirname, 'config');
    // Log the path to make sure it's correct
    console.log('Config folder path:', configFolderPath);
    store = new Store({
        cwd: configFolderPath // Specify custom directory for electron-store
    });
}

const logPath = path.join(__dirname, 'error.log');
const log = require('electron-log');

const express = require('express');
const expressApp = express();
const bodyParser = require('body-parser');
const { Client } = require('ssh2');

const PORT = process.env.PORT || 3000;
const commandsFile = path.join(__dirname, 'config', 'commands.json');
const profilesFile = path.join(__dirname, 'config', 'profiles.json');

// Configure electron-log to write to the same log file
log.transports.file.file = logPath;
// Middleware

expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use(express.static('public'));
expressApp.use('/data', express.static(path.join(__dirname, 'data')));

// Check if file exists, if not create it with an empty array
const ensureFileExists = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([])); // Create file with an empty array
    }
};

// Load commands from file
const loadCommands = () => {
    ensureFileExists(commandsFile);  // Check or create commands.json
    const data = fs.readFileSync(commandsFile);
    return JSON.parse(data);
};

// Save commands to file
const saveCommands = (commands) => {
    fs.writeFileSync(commandsFile, JSON.stringify(commands, null, 2));
};

// Load profiles from file
const loadProfiles = () => {
    ensureFileExists(profilesFile);  // Check or create profiles.json
    const data = fs.readFileSync(profilesFile);
    return JSON.parse(data);
};

// Save profiles to file
const saveProfiles = (profiles) => {
    fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2)); // Correctly named function
};

// Update commands based on profile name change
function updateCommandsForProfileChange(oldTitle, newTitle) {
    const commands = loadCommands();
    let updated = false;

    commands.forEach(command => {
        if (command.profile === oldTitle) {
            command.profile = newTitle; // Update the profile name
            updated = true;
        }
    });

    if (updated) {
        saveCommands(commands); // Save the updated commands
    }
}

// Routes
expressApp.get('/', (req, res) => {
    const commands = loadCommands();
    const profiles = loadProfiles();
    res.send(`
    <style>
    body {
        font-family: Arial, sans-serif;
        height: 100vh;
        margin: 0;
        background-color: #000000;
        overflow: hidden;
    }

    h2 {
        text-shadow: 4px 4px 4px rgba(255,255,255, 0.5);
        color: white;
        margin-bottom: 10px;
        text-align: center;
    }

    /* Styling the quarter-circle button */
    .quarter-circle-button {
        position: fixed;
        top: 0;
        right: 0;
        width: 60px;
        height: 46px;
        background-color: #F44336;
        border-radius: 0 0 0 80px;
        cursor: pointer;
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        z-index: 1000;
    }

    /* Hamburger icon */
    .hamburger-icon {
        width: 25px;
        height: 3px;
        background-color: white;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        left: 6px;
        bottom: 6px;
    }

    .hamburger-icon::before,
    .hamburger-icon::after {
        content: "";
        width: 25px;
        height: 3px;
        background-color: white;
        position: absolute;
    }

    .hamburger-icon::before {
        top: -10px;
        border-radius: 10px 10px 0 0;
    }

    .hamburger-icon::after {
        bottom: -10px;
        border-radius: 0 0 10px 10px;
    }

    /* Profile Modal Styles */
    .modal {
        display: none;
        position: fixed;
        z-index: 1001;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0, 0, 0, 0.7);
    }

    .modal-content {
        background-color: #f4f4f4;
        margin: 10% auto;
        padding: 20px;
        border: 1px solid #888;
        width: 33%;
        max-width: 600px;
        border-radius: 10px;
        max-height: 80vh;
        overflow-y: auto; 
    }

    .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    }

    .close:hover,
    .close:focus {
        color: black;
        text-decoration: none;
        cursor: pointer;
    }

    .profile-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px;
    }

    .profile-list-container {
        max-height: 400px; /* Set the desired maximum height of the profile list */
        overflow-y: auto; /* Add vertical scrollbar if the list exceeds the height */
    }

    .profile-item {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        background-color: #ddd;
        border-radius: 5px;
        margin-bottom: 10px;
        background-color: #f1f1f1;
    }

    .profile-item button {
        background-color: #f44336;
        color: white;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 3px;
        width: 100px;
    }

    .profile-item button:hover {
        background-color: #d32f2f;
    }

    .profile-item button:active {
        transform: scale(0.95);
    }

    .profile-item button.edit-profile {
        background-color: #2196F3;
        
    }

    .add-profile-form {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .add-profile-form input {
        padding: 10px;
        width: 100%;
        border-radius: 5px;
        border: 1px solid #ccc;
    }

    .add-profile-form button {
        padding: 10px;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        border-radius: 5px;
    }

    .add-profile-form button:hover {
        background-color: #45a049;
    }

    .command-container {
        flex: 1;
        display: flex; 
        justify-content: center;
        flex-wrap: wrap;
        align-content: flex-start;
        flex-direction: row;   
        gap: 15px;
        overflow-y: auto; /* Allow scrolling for overflow */
        padding: 1px
    }

    .command-card {
        box-shadow: 10px 5px 10px 5px rgba(0, 0, 0, 0.5) inset;
        border-radius: 50px 50px;
        border: 1px solid #ccc;
        margin: 10px;
        padding: 0;
        width: 200px;
        height: 220px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background-color: #e2e2e2;
        position: relative;
        text-align: center;
        transform: scale(1.1);
    }

    .command-title-button {
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.5);
        transform: scale(0.9) translateY(2px);
        border-radius: 50px 50px;
        background: radial-gradient(ellipse at top, #e66465, transparent),
        radial-gradient(ellipse at bottom, #9198e5, transparent);
        color: white;
        border: none;
        width: 100%;
        height: 90%;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        text-transform: uppercase;
    }

    .command-title-button:hover {
        background-color: #45a049;
    }

    .command-title-button:active {
        transform: scale(0.85) translateY(2px);
        transition: transform 0.1s ease-in-out;
    }

    .command-actions {
        display: none; /* Hidden initially */
        height: 50%;
        justify-content: space-between;
    }

    .command-actions button {
        width: 60%;
        background-color: #f44336;
        color: white;
        border: none;
        cursor: pointer;
        height: 100%;
    }

    .command-actions button.edit {
        background-color: #2196F3;
    }

    button.edit {
        transform: scale(0.8) translateX(10px);
    }

    button.delete {
        transform: scale(0.8) translateX(-10px);
    }

    .command-actions button:hover {
        opacity: 0.8;
    }

    /* Tabs */
.tab {
overflow: hidden;
border-bottom: 1px solid #ccc;
margin-bottom: 20px;
}

.tab button {
background-color: inherit;
border: none;
outline: none;
cursor: pointer;
padding: 14px 16px;
transition: 0.3s;
font-size: 17px;
}

.tab button:hover {
background-color: #ddd;
}

.tab button.active {
background-color: #ccc;
}

.tabcontent {
display: none;
padding: 6px 12px;
border-top: none;
}


    .gear-icon, .url-icon {
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 15%;
        cursor: pointer;
        padding-bottom: 5px;
        padding-top: 5px;
    }

    .url-icon:hover {
        translate: 0 6px;
        transition: translate 0.2s ease-in-out;
    }

    .gear-icon:hover {
        opacity: 0.5;
        transition: opacity 0.1s ease-in-out;
    }

    .gear-icon:active {
        translate: 0 2px;
    }

    .gear-icon img, .url-icon img {
        width: 25px;
        height: 25px;
    }

    .edit-form {
        display: none; /* Initially hidden */
        flex-direction: column;
        padding: 4px;
        gap: 5px;
    }

    .edit-form input {
        padding: 3px;
        width: 100%;
    }

    .edit-form button {
        padding: 5px;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
    }

    .edit-form button:hover {
        background-color: #45a049;
    }

    #accordion {
        flex: 0 0 10px;
        margin-top: 6px;
        width: 250px;
        text-align: center;
        margin-bottom: 5px;
    }

    #accordion button {
        width: 100%;
        padding: 5px;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 16px;
        text-transform: uppercase;
    }

    #accordion button:hover {
        background-color: #45a049;
    }

    #accordion button#toggleButton {
        background-color: #f44336;
        margin-bottom: 3px;
    }

    #commandForm {
        border-radius: 20px;
        background-color: #e7f3fe;
        display: none;
        flex-direction: column;
        align-items: center;
        margin-top: 10px;
    }

    #commandForm input {
        border-radius: 10px;
        width: 90%;
        margin: 5px;
        padding: 8px;
    }

    #commandForm button {
        border-radius: 15px;
        width: 90%;
        padding: 10px 15px;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        transform: scale(0.8);
    }

    #commandForm button:hover {
        background-color: #45a049;
    }

    #toggleButton {
        border-radius: 50px 50px;
    }
    .edit {
        padding-left: 12px;
        padding-bottom: 5px;
        border-bottom-left-radius: 50px;
        border-top-left-radius: 7px;
    }
    .delete {
        padding-right: 12px;
        padding-bottom: 5px;
        border-bottom-right-radius: 50px;
        border-top-right-radius: 7px;
    }

    .edit:active, .delete:active {
        scale: 0.9;
        translate: 0 2px;
    }
    .submitButton {
        border-bottom-left-radius: 50px;
        border-bottom-right-radius: 50px;
    }
    .loading-text {
        font-size: 50px;
        color: #fff;
    }
    .nav {
        flex: 0 0 15%;
        background-color: #222;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        jcustify-content: space-between;
        width: 100%;
        transition: all 0.3s ease-in-out;
    }

    .nav .container {
        width: 98%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-left: 20px;
        padding-bottom: 1px;
        margin-bottom: 1px;
        transition: all 0.3s ease-in-out;
    }

    #output {
        box-shadow: 5px 5px 5px 0 rgba(0, 0, 0, 0.6) inset;
        border-radius: 5px;
        max-height: 160px;
        overflow-y: scroll;
        white-space: pre-wrap; /* Ensures that line breaks are respected */
        border: 1px solid #ccc;
        padding: 10px;
        width: 100%;
        background-color: #e7f3fe;
        display: flex;
        list-style-type: none;
        align-items: center;
        justify-content: center;
        -webkit-app-region: drag;
    }

    .containerx {
        position: relative;
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow-x: hidden;
        transition: all 0.3s ease-in-out;
        transform-origin: top left;
        transition: transform 0.5s linear;

    }

    .containerx.show-nav {
        transform: rotate(-20deg);
      }

    .circle-container {
        position: fixed;
        top: -100px;
        left: -100px;
      }
      
      .circle {
        background-color: #F44336;
        height: 155px;
        width: 165px;
        border-radius: 50%;
        position: relative;
        transition: transform 0.5s linear;
      }
      
      .containerx.show-nav .circle {
        transform: rotate(-90deg);
      }
      
      .circle button {
        cursor: pointer;
        position: absolute;
        top: 47%;
        left: 50%;
        height: 100px;
        background: transparent;
        border: 0;
        font-size: 22px;
        color: #fff;
      }
      
      .circle button:focus{
        outline: none;
      }
      
      .circle button#open {
        left: 60%;
      }
      
      .circle button#close {
        top: 60%;
        transform: rotate(90deg);
        transform-origin: top left;
      }

      .containerx.show-nav + navx li {
        transform: translateX(0);
        transition-delay: 0.3s;
      }

      navx {
        position: fixed;
        bottom: 40px;
        left: 0;
        z-index: 100;
      }
      
      navx ul {
        list-style-type: none;
        padding-left: 30px;
      }
      
      navx ul li {
        text-transform: uppercase;
        color: #fff;
        margin: 40px 0;
        transform: translateX(-100%);
        transition: transform 0.4s ease-in;
      }
      
      navx ul li i {
        font-size: 20px;
        margin-right: 10px;
      }
      
      navx ul li + li {
        margin-left: 15px;
        transform: translateX(-150%);
      }
      
      navx ul li + li + li {
        margin-left: 30px;
        transform: translateX(-200px);
      }
      
      navx a{
        color: #fafafa;
        text-decoration: none;
        transition: all 0.5s;
      }
      
      navx a:hover {
        color: #ff7979;
        font-weight: bold;
      }
      .close-button {
        position: fixed; /* Fixed position to stay in view */
        bottom: 10px; /* Distance from the bottom */
        right: 10px; /* Distance from the right */
        background-color: red; /* Red background color */
        border: none; /* No border */
        border-radius: 50%; /* Make it circular */
        width: 60px; /* Increased width of the button */
        height: 60px; /* Increased height of the button */
        cursor: pointer; /* Pointer cursor on hover */
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5); /* Optional shadow effect */
        transition: background-color 0.3s, transform 0.2s; /* Smooth transitions */
    }
    
    .close-button i {
        font-size: 30px; /* Larger icon size */
        color: white; /* White icon color */
    }
    
    .close-button:hover {
        background-color: darkred; /* Change background color on hover */
        transform: scale(1.1); /* Scale up slightly on hover */
    }
    
    .close-button:active {
        transform: scale(0.95); /* Scale down when active (clicked) */
    }
</style>
<link rel="stylesheet" type="text/css" href="/data/css/all.min.css">
<div class="containerx">
<div id="profileModal" class="modal">
        <div class="modal-content">
            <span class="close" id="closeProfileModal">&times;</span>
            <h2>Manage Profiles</h2>
            
            <!-- Tabs -->
            <div class="tab">
                <button class="tablinks" onclick="openTab(event, 'AddProfile')">Add Profile</button>
                <button class="tablinks" onclick="openTab(event, 'EditProfile')">Edit Profile</button>
            </div>
    
            <!-- Tab content -->
            <div id="AddProfile" class="tabcontent">
                <form class="add-profile-form" id="addProfileForm">
                    <h3>Add New Profile</h3>
                    <input type="text" id="newProfileTitle" placeholder="Profile Title" required />
                    <input type="text" id="newProfileUsername" placeholder="Username" required />
                    <input type="password" id="newProfilePassword" placeholder="Password" required />
                    <input type="text" id="newProfileHost" placeholder="Host" required />
                    <input type="number" id="newProfilePort" placeholder="Port" value="22" required />
                    <button type="submit">Add Profile</button>
                </form>
            </div>
    
            <div id="EditProfile" class="tabcontent" style="display:none;">
            <h3>Edit Profile</h3>
            <form class="edit-profile-form" id="editProfileForm" style="display:none;">
                <input type="hidden" id="editProfileIndex">
                <input type="text" id="editProfileTitle" placeholder="Profile Title" required />
                <input type="text" id="editProfileUsername" placeholder="Username" required />
                <input type="password" id="editProfilePassword" placeholder="Password" required />
                <input type="text" id="editProfileHost" placeholder="Host" required />
                <input type="number" id="editProfilePort" placeholder="Port" value="22" required />
                <button type="submit">Update Profile</button>
            </form>
                <div class="profile-list-container">
                    <div class="profile-list">
                        <!-- Profiles will be dynamically added here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="circle-container">
    <div class="circle">
      <button id="close">
        <i class="fas fa-times"></i>
      </button>
      <button id="open">
        <i class="fa-solid fa-paper-plane"></i>
      </button>
    </div>
  </div>
        <!-- Quarter-circle button -->
        <div class="quarter-circle-button" id="openFormButton">
            <div class="hamburger-icon"></div>
        </div>
        <div class="nav">
        <div class="container">
            <h2>Command Manager</h2>
            <div id="output"></div>
            <div class="loading-text">0%</div>
        </div>
        <button class="close-button" onclick="window.close()"> Close 
        <i class="fas fa-times"></i>
    </button>
        </div>


        <div class="command-container" id="draggable-command-list">
            ${commands.map(cmd => `
                <div class="command-card" data-line-number="${cmd.lineNumber}">
                ${cmd.url ? `
                <div class="url-icon" id="url-${cmd.title}" onclick="openExternalURL('${cmd.url}')">
                    <img src="/data/url.png" alt="Link Icon">
                </div>
                ` : ''}
                    <button class="command-title-button" id="title-${cmd.title}" onclick="runCommand('${cmd.command}', '${cmd.profile}')">
                        ${cmd.title}
                    </button>
                    <div class="gear-icon" onclick="toggleActions('${cmd.title}')">
                        <img src="/data/gear.png" alt="Gear Icon">
                    </div>
                    <div class="command-actions" id="actions-${cmd.title}">
                        <button class="edit" id="edit-${cmd.title}" onclick="toggleEditForm('${cmd.title}', '${cmd.command}')">Edit</button>
                        <button class="delete" id="delete-${cmd.title}" onclick="deleteCommand('${cmd.title}')">Delete</button>
                    </div>
                    <form class="edit-form" id="editForm-${cmd.title}" onsubmit="submitEditForm(event, '${cmd.title}')">
                    <input type="text" id="editTitle-${cmd.title}" value="${cmd.title}" placeholder="Edit Title" required />
                    <input type="text" id="editCommand-${cmd.title}" value="${cmd.command}" placeholder="Edit Command" required />
                    <input type="text" id="editUrl-${cmd.title}" value="${cmd.url || ''}" placeholder="Edit URL" />
                    <select id="editProfile-${cmd.title}" required>
                        ${profiles.map(profile => `
                            <option value="${profile.title}" ${profile.title === cmd.profile ? 'selected' : ''}>${profile.title}</option>
                        `).join('')}
                    </select>
                    <button class="submitButton" type="submit">Save</button>
                </form>
                </div>
            `).join('')}
        </div>

        <div id="accordion">
            <button id="toggleButton" onclick="toggleAccordion()">Add Command</button>
            <form id="commandForm">
            <input type="text" name="title" placeholder="Command Title" required>
            <input type="text" name="command" placeholder="Command" required>
            <input type="text" name="url" placeholder="URL (optional)">
            <select name="profile" id="profileSelect" required>
                ${profiles.map(profile => `
                    <option value="${profile.title}">${profile.title}</option>
                `).join('')}
            </select>
            <button type="submit">Add Command</button>
        </form>
        </div>
        </div>
        <navx>
        <ul>
        
          <li onclick="openExternalURL('https://github.com/eaeoz/command-manager-docker')"><i class="fa-brands fa-github"></i> Github</li>
          <li onclick="openExternalURL('https://hub.docker.com/r/eaeoz/command-manager')"><i class="fa-brands fa-docker"></i> DockerHub</li>
          <li onclick="openExternalURL('mailto:sedatergoz@gmail.com')"><i class="fas fa-envelope"></i> Contact</li>
        </ul>
      </navx>
      

      <script src="/data/js/all.min.js"></script>
      <script src="/data/js/Sortable.min.js"></script>
                <script>
                const open = document.querySelector("#open")
                const close = document.querySelector("#close");
                const container = document.querySelector(".containerx");
                
                open.addEventListener('click', ()=>{
                    container.classList.add("show-nav");
                })
                
                close.addEventListener('click', ()=>{
                    container.classList.remove("show-nav")
                })
                const {ipcRenderer} = require('electron');
                document.getElementById('addProfileForm').addEventListener('submit', function(event) {
                    event.preventDefault(); // Prevent the default form submission
                
                    // Gather input values
                    const newProfile = {
                        title: document.getElementById('newProfileTitle').value,
                        username: document.getElementById('newProfileUsername').value,
                        password: document.getElementById('newProfilePassword').value,
                        host: document.getElementById('newProfileHost').value,
                        port: document.getElementById('newProfilePort').value
                    };
                
                    // Send a POST request to add the new profile
                    fetch('/profiles', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newProfile)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            ipcRenderer.send('show-alert', 'Profile added successfully!');
                            loadProfilesList(); // Refresh the profile list
                            // document.getElementById('addProfileForm').reset(); // Reset the form
                            location.reload();
                        } else {
                            ipcRenderer.send('show-alert', 'Failed to add profile: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error adding profile:', error);
                        ipcRenderer.send('show-alert', 'An error occurred while adding profile: ' + error.message);
                    });
                });
                
                function openTab(evt, tabName) {
                    // Declare all variables
                    var i, tabcontent, tablinks;
                
                    // Get all elements with class="tabcontent" and hide them
                    tabcontent = document.getElementsByClassName("tabcontent");
                    for (i = 0; i < tabcontent.length; i++) {
                        tabcontent[i].style.display = "none";
                    }
                
                    // Get all elements with class="tablinks" and remove the class "active"
                    tablinks = document.getElementsByClassName("tablinks");
                    for (i = 0; i < tablinks.length; i++) {
                        tablinks[i].className = tablinks[i].className.replace(" active", "");
                    }
                
                    // Show the current tab, and add an "active" class to the button that opened the tab
                    document.getElementById(tabName).style.display = "block";
                    evt.currentTarget.className += " active";
                }
                
                // Set default tab
                document.addEventListener('DOMContentLoaded', function() {
                    document.querySelector('.tab button:first-child').click();
                });
                
                // Modal functionality
                const profileModal = document.getElementById('profileModal');
                const openProfileButton = document.getElementById('openFormButton');
                const closeProfileModal = document.getElementById('closeProfileModal');
                
                // Open the modal and load profiles
                openProfileButton.addEventListener('click', () => {
                    loadProfilesList(); // Load profiles when opening the modal
                    profileModal.style.display = 'block';
                });
                
                // Close the modal
                closeProfileModal.addEventListener('click', () => {
                    profileModal.style.display = 'none';
                });
                
                // Close the modal when clicking outside of it
                window.onclick = (event) => {
                    if (event.target === profileModal) {
                        profileModal.style.display = 'none';
                    }
                };
                
                // Function to load profiles and display them
                function loadProfilesList() {
                    fetch('/profiles')
                        .then(response => response.json())
                        .then(data => {
                            const profileList = document.querySelector('.profile-list');
                            profileList.innerHTML = '';
                            data.forEach((profile, index) => {
                                const profileItem = document.createElement('div');
                                profileItem.className = 'profile-item';
                                profileItem.innerHTML = \`
                                    <span>\${profile.title}</span>
                                    <div>
                                    <button class="edit-profile" data-index="\${index}" onclick="editProfile(this)">Edit</button>
                                        <button class="delete-profile" data-title="\${profile.title}" onclick="deleteProfile('\${profile.title}')">Delete</button>
                                    </div>
                                \`;
                                profileList.appendChild(profileItem);
                            });
                        })
                        .catch(error => {
                            console.error('Error loading profiles:', error);
                        });
                }
                
                // Updated editProfile function to accept the button element
                function editProfile(button) {
                    const index = button.getAttribute('data-index');
                    console.log(\`Editing profile: \${index}\`);
                    fetch(\`/profiles/\${index}\`)
                        .then(response => response.json())
                        .then(profile => {
                            document.getElementById('editProfileTitle').value = profile.title;
                            document.getElementById('editProfileUsername').value = profile.username;
                            document.getElementById('editProfilePassword').value = profile.password;
                            document.getElementById('editProfileHost').value = profile.host;
                            document.getElementById('editProfilePort').value = profile.port;
                
                            // Store the index in the hidden field
                            document.getElementById('editProfileIndex').value = index;
        
                            // Show the edit form
                            document.getElementById('editProfileForm').style.display = 'block';
                        })
                        .catch(error => {
                            console.error('Error fetching profile:', error);
                        });
                }
                
                document.getElementById('editProfileForm').addEventListener('submit', function(event) {
                    event.preventDefault(); // Prevent the default form submission
                
                    const index = document.getElementById('editProfileIndex').value; // Get the index from the hidden input
                    console.log(\`Edited Profile: \${index}\`);
                    const updatedProfile = {
                        title: document.getElementById('editProfileTitle').value,
                        username: document.getElementById('editProfileUsername').value,
                        password: document.getElementById('editProfilePassword').value,
                        host: document.getElementById('editProfileHost').value,
                        port: document.getElementById('editProfilePort').value
                    };
                
                    // Send a PUT request to update the profile
                    fetch(\`/profiles/\${index}\`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedProfile)
                    })
                    .then(response => response.json())
                    .then(data => {
                        // console.log('Update response:', data); // Log the response
                        if (data.success) {
                            ipcRenderer.send('show-alert', 'Profile updated successfully!');
                            loadProfilesList(); // Refresh the profile list
                            this.reset(); // Reset the form fields
                            this.style.display = 'none'; // Hide the form
                            location.reload();
                        } else {
                            ipcRenderer.send('show-alert', 'Failed to update profile: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error updating profile:', error);
                        ipcRenderer.send('show-alert', 'An error occurred while updating the profile: ' + error.message);
                    });
                });
                
                
                
                // Function to delete a profile
                function deleteProfile(title) {
                    // Send a message to the main process to show the confirmation dialog
                    ipcRenderer.invoke('show-confirmation', \`Are you sure you want to delete the profile "\${title}"?\`)
                        .then(confirmation => {
                            if (!confirmation) {
                                return; // If the user cancels, exit the function
                            }
                
                            // Proceed to delete the profile if confirmed
                            fetch(\`/profiles/\${encodeURIComponent(title)}\`, {
                                method: 'DELETE',
                            })
                            .then(response => {
                                if (!response.ok) {
                                    return response.json().then(err => {
                                        throw new Error(err.error || 'Error deleting profile, please try again.');
                                    });
                                }
                                return response.json();
                            })
                            .then(data => {
                                ipcRenderer.send('show-alert', 'Profile deleted successfully!');
                                loadProfilesList(); // Refresh the list in the modal
                                location.reload();
                            })
                            .catch(error => {
                                ipcRenderer.send('show-alert', 'An error occurred while deleting the profile: ' + error.message);
                            });
                        })
                        .catch(error => {
                            ipcRenderer.send('show-alert', 'An error occurred while showing the confirmation dialog: ' + error.message);
                        });
                }
                
                const nav = document.querySelector('.nav')
                window.addEventListener('scroll', fixNav)
                
                function fixNav() {
                    if (window.scrollY > nav.offsetHeight + 150) {
                        nav.classList.add('active')
                    } else {
                        nav.classList.remove('active')
                    }
                }
                        const loadText = document.querySelector('.loading-text')
                const bg=document.querySelector('.command-container')
                
                // default load starts (percentage) 0
                let load = 0
                
                // repeat blurring function every 30ms
                let int = setInterval(blurring, 2)
                
                function blurring(){
                    // loadi arttir 100 olana kadar ve setInterval dongusunu sifirla
                    load++
                    if(load>99){
                        clearInterval(int)
                    }
                
                    // text icerisindeki 0 dan 100 e icerigi yaz
                    loadText.innerText = load + '%';
                    // icerigin opacityssini yukselt
                    loadText.style.opacity = scale(load,0,100,1,0) // opacity decrase from 1 to 0 and  becomes text unvisible with opacity 0
                    // opacityi yukselt
                    bg.style.filter = 'blur(' + scale(load, 0, 100, 30, 0) + 'px)';
                    // console.log(scale(load,0,100,30,0)) // blur decrase from 30 to 0 and  becomes image without blurness
                }
                
                // background image blurness change function
                const scale = (num, in_min, in_max, out_min, out_max) => {
                    return ((num-in_min) * (out_max-out_min)) / (in_max-in_min) + out_min
                }
                        const draggableList = document.getElementById('draggable-command-list');
                        new Sortable(draggableList, {
                            animation: 150,
                            onEnd: function(evt) {
                                const items = Array.from(draggableList.querySelectorAll('.command-card'));
                                const newOrder = items.map(item => item.dataset.lineNumber);
                                fetch('/reorder', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ newOrder })
                                }).then(() => window.location.reload());
                            }
                        });
                        function toggleAccordion() {
                            const form = document.getElementById('commandForm');
                            const button = document.getElementById('toggleButton');
                            if (form.style.display === 'none' || form.style.display === '') {
                                form.style.display = 'flex';
                                button.textContent = 'Close';
                            } else {
                                form.style.display = 'none';
                                button.textContent = 'Add Command';
                            }
                        }
                
                            function toggleActions(title) {
                                const actions = document.getElementById('actions-' + title);
                                actions.style.display = (actions.style.display === 'none' || actions.style.display === '') ? 'flex' : 'none';
                            }
                
                            function toggleEditForm(title, command, url) {
                                const form = document.getElementById('editForm-' + title);
                                const actions = document.getElementById('actions-' + title);
                                const comTitle = document.getElementById('title-' + title);
                                const editButton = document.getElementById('edit-' + title);
                                const deleteButton = document.getElementById('delete-' + title);
                                const urlTitle = document.getElementById('url-' + title);
                                if (form.style.display === 'none' || form.style.display === '') {
                                    form.style.display = 'flex';
                                    actions.style.display = 'none'; // Hide the actions while editing
                                    comTitle.style.display = 'none';
                                    editButton.textContent = 'return';
                                    deleteButton.style.display = 'none';
                                    urlTitle.style.display = 'none';
                                } else {
                                    form.style.display = 'none';
                                    actions.style.display = 'flex'; // Show actions if form is hidden
                                    comTitle.style.display = 'flex';
                                    editButton.textContent = 'Edit';
                                    deleteButton.style.display = 'block';
                                    urlTitle.style.display = 'flex';
                                }
                            }
                
                            function submitEditForm(event, oldTitle) {
                                event.preventDefault();
                                const newTitle = document.getElementById('editTitle-' + oldTitle).value;
                                const newCommand = document.getElementById('editCommand-' + oldTitle).value;
                                const newUrl = document.getElementById('editUrl-' + oldTitle).value;
                                const newProfile = document.getElementById('editProfile-' + oldTitle).value; // Get selected profile
                            
                                fetch('/edit', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ oldTitle, newTitle, newCommand, newUrl, newProfile }) // Include newProfile
                                }).then(() => {
                                    location.reload();
                                });
                            }
                            
                            
                            // Add event listener for form submission
                            document.getElementById('commandForm').addEventListener('submit', function (event) {
                                event.preventDefault();
                                console.log("Form submitted"); // Add this line to monitor submissions
                                const formData = new FormData(this);
                                const commandData = {
                                    title: formData.get('title'),
                                    command: formData.get('command'),
                                    url: formData.get('url') || '',
                                    profile: formData.get('profile') // Selected profile
                                };
                        
                                const submitButton = this.querySelector('button[type="submit"]');
                                submitButton.disabled = true; // Disable the submit button
                        
                                fetch('/commands', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(commandData)
                                })
                                .then(response => response.json())
                                .then(data => {
                                    submitButton.disabled = false; // Re-enable the button after response
                        
                                    if (data.success) {
                                        // Use ipcRenderer to send alert to main process
                                        ipcRenderer.send('show-alert', 'Command added successfully!');
                                        window.location.reload();
                                    } else {
                                        ipcRenderer.send('show-alert', 'Failed to add command: ' + data.error);
                                    }
                                })
                                .catch(error => {
                                    submitButton.disabled = false; // Re-enable the button on error
                                    ipcRenderer.send('show-alert', 'An error occurred: ' + error.message);
                                });
                            });
                
                
                            function runCommand(command, profileTitle) {
                                // Fetch the profiles to check if the selected profile exists
                                fetch('/profiles')
                                    .then(response => response.json())
                                    .then(profiles => {
                                        const selectedProfile = profiles.find(profile => profile.title === profileTitle);
                            
                                        if (!selectedProfile) {
                                            // Show an alert if the profile is missing
                                            ipcRenderer.send('show-alert', 'Profile not found');
                                            return; // Abort the command execution if profile is not found
                                        }
                            
                                        // Proceed with command execution if profile exists
                                        fetch('/run', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ command, profileTitle })
                                        })
                                        .then(response => {
                                            if (!response.ok) {
                                                throw new Error(response.statusText);
                                            }
                                            return response.json();
                                        })
                                        .then(data => {
                                            const outputBox = document.getElementById('output');
                                            outputBox.innerText = data.output || '';
                                            outputBox.scrollTop = outputBox.scrollHeight;
                                            if (data.error) {
                                                showError(data.error);
                                            }
                                        })
                                        .catch(error => {
                                            showError(error.message);
                                        });
                                    })
                                    .catch(error => {
                                        console.error('Error fetching profiles:', error);
                                    });
                            }
                            
                            function showError(message) {
                                const outputDiv = document.getElementById('output');
                            
                                // Hide the output box
                                outputDiv.style.display = 'none';
                            
                                // Create a new error message element
                                const errorMessage = document.createElement('h2');
                                errorMessage.textContent = message;
                                errorMessage.style.color = 'red'; // Style the error message
                                errorMessage.style.textAlign = 'center'; // Center align the message
                                errorMessage.style.margin = '20px 0'; // Add some margin for spacing
                            
                                // Insert the error message above the output box
                                outputDiv.parentNode.insertBefore(errorMessage, outputDiv);
                            
                                // Remove the error message after 3 seconds
                                setTimeout(() => {
                                    // Remove the error message
                                    if (errorMessage.parentNode) {
                                        errorMessage.parentNode.removeChild(errorMessage);
                                    }
                            
                                    // Show the output box again with original styles
                                    outputDiv.style.display = ''; // Reset display to default to retain original styles
                                }, 3000);
                            }
                            
                            
                
                            function deleteCommand(title) {
                                fetch('/delete', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ title })
                                }).then(() => location.reload());
                            }
                            function openExternalURL(url) {
                                // Use the shell from the main process to open the URL
                                const {shell} = require('electron');
                                            shell.openExternal(url);
                            }
                </script>
                `);
});


// Function to log errors
function logError(message) {
    const logMessage = `${new Date().toISOString()} - ERROR: ${message}\n`;

    // If the message is an Error object, include the stack trace
    if (message instanceof Error) {
        logMessage += `Stack Trace: ${message.stack}\n`;
    }

    // Log to electron-log
    log.error(logMessage);

    // Append the log message to error.log
    fs.appendFile(logPath, logMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

// Log unhandled exceptions
process.on('uncaughtException', (error) => {
    logError(error);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

app.on('ready', () => {
    // Your app initialization code
});


expressApp.post('/reorder', (req, res) => {
    const newOrder = req.body.newOrder;
    const commands = loadCommands();

    const reorderedCommands = newOrder.map(lineNumber =>
        commands.find(cmd => cmd.lineNumber === parseInt(lineNumber))
    );

    // Update the line numbers to reflect new order
    reorderedCommands.forEach((cmd, index) => {
        cmd.lineNumber = index + 1;
    });

    saveCommands(reorderedCommands);
    res.sendStatus(200);
});

// API endpoints for profiles
expressApp.get('/profiles', (req, res) => {
    try {
        const profiles = loadProfiles(); // Load profiles from the file
        res.json(profiles); // Send the profiles as a JSON response
    } catch (error) {
        console.error('Error loading profiles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single profile
expressApp.get('/profiles/:index', (req, res) => {
    const profiles = loadProfiles();
    const index = parseInt(req.params.index);
    if (profiles[index]) {
        res.json(profiles[index]);
    } else {
        res.status(404).json({ error: 'Profile not found' });
    }
});

// Route to add a new profile
expressApp.post('/profiles', (req, res) => {
    const profiles = loadProfiles();
    profiles.push(req.body);
    saveProfiles(profiles);
    res.json({ success: true });
});

// Edit single profile
expressApp.put('/profiles/:index', (req, res) => {
    const profiles = loadProfiles();
    const index = parseInt(req.params.index);
    const oldTitle = profiles[index].title; // Store the old title

    if (profiles[index]) {
        profiles[index] = req.body;
        saveProfiles(profiles);

        // Check if the title has changed
        if (oldTitle !== req.body.title) {
            updateCommandsForProfileChange(oldTitle, req.body.title); // Update commands
        }

        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Profile not found' });
    }
});

expressApp.delete('/profiles/:title', (req, res) => {
    const profiles = loadProfiles();
    const title = req.params.title;

    console.log(`Trying to delete profile: ${title}`); // Log the title being deleted

    const index = profiles.findIndex(profile => profile.title === title);

    if (index !== -1) {
        profiles.splice(index, 1); // Remove the profile
        saveProfiles(profiles); // Save updated profiles
        console.log('Profile deleted successfully'); // Log success
        return res.json({ success: true });
    } else {
        console.error('Profile not found'); // Log not found
        return res.status(404).json({ error: 'Profile not found' });
    }
});

expressApp.post('/commands', (req, res) => {
    const { title, command, url, profile } = req.body;

    if (!title || !command || !profile) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const commands = loadCommands();

    // Check if the command title already exists
    const existingCommand = commands.find(cmd => cmd.title === title);
    if (existingCommand) {
        return res.status(400).json({ error: 'Command title already exists.' });
    }

    const newLineNumber = commands.length ? commands[commands.length - 1].lineNumber + 1 : 1;
    const newCommand = { lineNumber: newLineNumber, title, command, url, profile };

    commands.push(newCommand);
    saveCommands(commands);

    res.json({ success: true });
});

expressApp.post('/edit', (req, res) => {
    const { oldTitle, newTitle, newCommand, newUrl, newProfile } = req.body;
    // Load the current commands from commands.json
    fs.readFile(commandsFile, 'utf8', (err, data) => {
        if (err) {
            logError('Failed to read commands file: ' + err);
            return res.status(500).json({ error: 'Failed to read commands file' });
        }
        let commands = JSON.parse(data);

        // Find the index of the command to edit
        const commandIndex = commands.findIndex(cmd => cmd.title === oldTitle);
        if (commandIndex !== -1) {
            // Update the command with new data
            commands[commandIndex] = {
                ...commands[commandIndex],
                title: newTitle,
                command: newCommand,
                url: newUrl,
                profile: newProfile // Update profile
            };

            // Save the updated commands back to the file
            fs.writeFile(commandsFile, JSON.stringify(commands, null, 2), err => {
                if (err) {
                    logError('Failed to save commands file: ' + err);
                    return res.status(500).json({ error: 'Failed to save commands file' });
                }
                res.json({ success: true });
            });
        } else {
            res.status(404).json({ error: 'Command not found' });
        }
    });
});

expressApp.post('/delete', (req, res) => {
    let commands = loadCommands();
    commands = commands.filter(cmd => cmd.title !== req.body.title);
    saveCommands(commands);
    res.sendStatus(200);
});

expressApp.post('/run', (req, res) => {
    const { command, profileTitle } = req.body;
    const profiles = loadProfiles();
    const selectedProfile = profiles.find(profile => profile.title === profileTitle);

    if (!selectedProfile) {
        return res.status(400).json({ error: 'Invalid profile selected' });
    }

    const conn = new Client();
    const timeoutDuration = parseInt(process.env.COMMAND_TIMEOUT, 10) || 5000;

    conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
            if (err) {
                logError('Command execution failed: ' + err.message);
                return res.status(500).json({ error: 'Command execution failed: ' + err.message });
            }

            let output = '';
            let isTimedOut = false;

            const timeout = setTimeout(() => {
                isTimedOut = true;
                stream.close();
                conn.end();
                res.json({ output: 'Command timed out' });
            }, timeoutDuration);

            stream.on('close', (code, signal) => {
                clearTimeout(timeout);
                if (!isTimedOut) {
                    conn.end();
                    res.json({ output });
                }
            }).on('data', (data) => {
                if (!isTimedOut) output += data.toString();
            }).stderr.on('data', (data) => {
                if (!isTimedOut) output += data.toString();
            });
        });
    }).connect({
        host: selectedProfile.host,
        port: selectedProfile.port,
        username: selectedProfile.username,
        password: selectedProfile.password
    }).on('error', (err) => {
        res.status(500).json({ error: 'SSH connection failed: ' + err.message });
    });
});

expressApp.get('/redirect', (req, res) => {
    const { url } = req.query;
    if (url) {
        return res.redirect(url); // Redirect to the specified URL
    }
    return res.status(400).send('URL parameter is missing');
});



// Start the Express server
expressApp.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});


const createWindow = async () => {
    await loadStore(); // Ensure the store is loaded before creating the window

    const savedBounds = store.get('windowBounds', { width: 1920, height: 1080 });

    const win = new BrowserWindow({
        width: savedBounds.width,
        height: savedBounds.height,
        transparent: true,   // Makes the window background transparent
        frame: false,        // Removes the default window frame (title bar, close buttons)
        hasShadow: false,    // Prevents the window from having a shadow (better for transparency)
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadURL(`http://localhost:${process.env.PORT || 3000}`);

    // Save window size and position when closed
    win.on('close', () => {
        store.set('windowBounds', win.getBounds());
    });
};


ipcMain.on('show-alert', (event, message) => {
    dialog.showMessageBox({
        type: 'info',
        message: message
    });
});

ipcMain.handle('show-confirmation', async (event, message) => {
    const response = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Cancel', 'OK'],
        title: 'Confirmation',
        message: message,
    });
    return response.response === 1; // 1 means OK was clicked
});

// Make sure to call createWindow after app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
