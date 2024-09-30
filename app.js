const fs = require('fs');
const path = require('path');

// Define the .env file path
const envPath = path.resolve(__dirname, 'config', '.env');

// Default .env content
const defaultEnvContent = `
WINDOW_WIDTH=1280
WINDOW_HEIGHT=720
COMMAND_TIMEOUT=10000
COMMANDS_FILE=commands.json
PROFILES_FILE=profiles.json
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
const logPath = path.join(__dirname, 'error.log');
const log = require('electron-log');

const express = require('express');
const expressApp = express();
const bodyParser = require('body-parser');
const { Client } = require('ssh2');

const PORT = process.env.PORT || 3000;
const commandsFile = path.join(__dirname, 'config', process.env.COMMANDS_FILE || 'commands.json');
const profilesFile = path.join(__dirname, 'config', process.env.PROFILES_FILE || 'profiles.json');

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

// Routes
expressApp.get('/', (req, res) => {
    const commands = loadCommands();
    const profiles = loadProfiles();
    res.send(`
    <style>
    body {
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        background-color: #000000;
    }

    h1 {
        text-shadow: 4px 4px 4px rgba(255,255,255, 0.5);
        color: white;
        margin-bottom: 10px;
        text-align: center;
    }

    .command-container {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
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
        background-color: #4CAF50;
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
        border-bottom-left-radius: 50px;
    }
    .delete {
        border-bottom-right-radius: 50px;
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
    }
</style>

<div class="nav">
<div class="container">
    <h1>Command Manager</h1>
    <div id="output"></div>
    <div class="loading-text">0%</div>
</div>
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
                <script src="/data/Sortable.min.js"></script>
                <script>
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
                            
                            const {ipcRenderer} = require('electron');
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
                            }
                            
                            function showError(message) {
                                const outputDiv = document.getElementById('output');
                            
                                // Hide the output box
                                outputDiv.style.display = 'none';
                            
                                // Create a new error message element
                                const errorMessage = document.createElement('h1');
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

// Function to create the Electron window
const createWindow = () => {
    const win = new BrowserWindow({
        width: parseInt(process.env.WINDOW_WIDTH, 10) || 1920,
        height: parseInt(process.env.WINDOW_HEIGHT, 10) || 1080,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Allow use of Node.js APIs in the renderer process
        }
    });

    // Load the Express app in the Electron window
    win.loadURL(`http://localhost:${PORT}`);
};

// Start Electron when ready
app.whenReady().then(createWindow);

ipcMain.on('show-alert', (event, message) => {
    dialog.showMessageBox({
        type: 'info',
        message: message
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// On macOS, recreate a window in the app when the dock icon is clicked and no other windows are open
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
