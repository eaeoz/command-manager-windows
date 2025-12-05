// Modern Command Manager - Client-side JavaScript
const { ipcRenderer } = require('electron');
const { shell } = require('electron');

// State Management
const state = {
    commands: [],
    profiles: [],
    filteredCommands: [],
    authToken: null,
    userEmail: null,
    lastSync: null,
    syncRefreshInterval: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setupSortable();
});

async function initializeApp() {
    await loadProfiles();
    await loadCommands();
    updateStats();
}

// Event Listeners
function setupEventListeners() {
    // Window controls
    document.getElementById('minimizeBtn').addEventListener('click', () => {
        ipcRenderer.send('window-minimize');
    });
    
    document.getElementById('maximizeBtn').addEventListener('click', () => {
        ipcRenderer.send('window-maximize');
    });
    
    document.getElementById('closeBtn').addEventListener('click', () => {
        ipcRenderer.send('window-close');
    });
    
    // Header buttons
    document.getElementById('profilesBtn').addEventListener('click', () => openModal('profileModal'));
    document.getElementById('addCommandBtn').addEventListener('click', () => openCommandModal('add'));
    document.getElementById('syncBtn').addEventListener('click', () => openSyncModal());
    
    // Modal close buttons
    document.getElementById('closeProfileModal').addEventListener('click', () => closeModal('profileModal'));
    document.getElementById('closeCommandModal').addEventListener('click', () => closeModal('commandModal'));
    document.getElementById('closeSyncModal').addEventListener('click', () => closeModal('syncModal'));
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Forms
    document.getElementById('addProfileForm').addEventListener('submit', handleAddProfile);
    document.getElementById('editProfileForm').addEventListener('submit', handleEditProfile);
    document.getElementById('commandForm').addEventListener('submit', handleCommandSubmit);
    
    // Console
    document.getElementById('clearConsole').addEventListener('click', clearConsole);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Profile edit cancel
    document.getElementById('cancelEdit').addEventListener('click', () => {
        document.getElementById('editProfileForm').style.display = 'none';
        loadProfilesList();
    });
    
    // Sync functions
    document.getElementById('syncLoginForm').addEventListener('submit', handleSyncLogin);
    document.getElementById('syncPushBtn').addEventListener('click', handleSyncPush);
    document.getElementById('syncPullBtn').addEventListener('click', handleSyncPull);
    document.getElementById('syncLogoutBtn').addEventListener('click', handleSyncLogout);
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    
    if (modalId === 'profileModal') {
        loadProfilesList();
        populateProfileSelect();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    
    // Stop auto-refresh when sync modal closes
    if (modalId === 'syncModal' && state.syncRefreshInterval) {
        clearInterval(state.syncRefreshInterval);
        state.syncRefreshInterval = null;
    }
    
    // Reset forms
    if (modalId === 'profileModal') {
        document.getElementById('addProfileForm').reset();
        document.getElementById('editProfileForm').reset();
        document.getElementById('editProfileForm').style.display = 'none';
    }
    if (modalId === 'commandModal') {
        document.getElementById('commandForm').reset();
        document.getElementById('commandMode').value = 'add';
        document.getElementById('oldCommandTitle').value = '';
        document.getElementById('commandModalTitle').textContent = 'Add Command';
        document.getElementById('commandSubmitBtn').innerHTML = '<i class="fas fa-plus"></i> Add Command';
    }
}

function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
    
    if (tabId === 'editProfile') {
        loadProfilesList();
    }
}

// Load Data
async function loadCommands() {
    try {
        const response = await fetch('/api/commands');
        state.commands = await response.json();
        state.filteredCommands = [...state.commands];
        renderCommands();
    } catch (error) {
        console.error('Error loading commands:', error);
        showNotification('Failed to load commands', 'error');
    }
}

async function loadProfiles() {
    try {
        const response = await fetch('/profiles');
        state.profiles = await response.json();
    } catch (error) {
        console.error('Error loading profiles:', error);
        showNotification('Failed to load profiles', 'error');
    }
}

// Render Functions
function renderCommands() {
    const grid = document.getElementById('commandsGrid');
    
    if (state.filteredCommands.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <p>No commands found. Click "Add Command" to get started!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = state.filteredCommands.map(cmd => `
        <div class="command-card" data-line-number="${cmd.lineNumber}">
            <div class="command-header">
                <div class="command-title-wrapper">
                    <div class="command-title">${escapeHtml(cmd.title)}</div>
                    <div class="command-profile">
                        <i class="fas fa-circle"></i>
                        ${escapeHtml(cmd.profile)}
                    </div>
                </div>
                <div class="command-actions">
                    ${cmd.url ? `
                        <button class="btn-icon" onclick="openExternalURL('${escapeHtml(cmd.url)}')" title="Open URL">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon btn-secondary" onclick="editCommand('${escapeHtml(cmd.title)}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteCommand('${escapeHtml(cmd.title)}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="command-text">${escapeHtml(cmd.command)}</div>
            <div class="command-footer">
                <button class="btn-success btn-run-full" onclick="runCommand('${escapeHtml(cmd.command)}', '${escapeHtml(cmd.profile)}')">
                    <i class="fas fa-play"></i>
                    Run Command
                </button>
            </div>
        </div>
    `).join('');
    
    updateStats();
}

function loadProfilesList() {
    const list = document.getElementById('profileList');
    
    if (state.profiles.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-server" style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem;"></i>
                <p>No profiles yet. Add one to get started!</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = state.profiles.map((profile, index) => `
        <div class="profile-item">
            <div class="profile-info">
                <h3>${escapeHtml(profile.title)}</h3>
                <p>${escapeHtml(profile.username)}@${escapeHtml(profile.host)}:${profile.port}</p>
            </div>
            <div class="profile-actions">
                <button class="btn-secondary" onclick="editProfile(${index})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn-danger" onclick="deleteProfile('${escapeHtml(profile.title)}')">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

function populateProfileSelect() {
    const select = document.getElementById('commandProfile');
    select.innerHTML = '<option value="">Select a profile</option>' +
        state.profiles.map(p => `<option value="${escapeHtml(p.title)}">${escapeHtml(p.title)}</option>`).join('');
}

// Command Operations
function openCommandModal(mode, commandTitle = '') {
    document.getElementById('commandMode').value = mode;
    document.getElementById('oldCommandTitle').value = commandTitle;
    
    populateProfileSelect();
    
    if (mode === 'edit' && commandTitle) {
        const command = state.commands.find(c => c.title === commandTitle);
        if (command) {
            document.getElementById('commandModalTitle').textContent = 'Edit Command';
            document.getElementById('commandTitle').value = command.title;
            document.getElementById('commandText').value = command.command;
            document.getElementById('commandProfile').value = command.profile;
            document.getElementById('commandUrl').value = command.url || '';
            document.getElementById('commandSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Save Changes';
        }
    } else {
        document.getElementById('commandModalTitle').textContent = 'Add Command';
        document.getElementById('commandSubmitBtn').innerHTML = '<i class="fas fa-plus"></i> Add Command';
    }
    
    openModal('commandModal');
}

function editCommand(title) {
    openCommandModal('edit', title);
}

async function handleCommandSubmit(e) {
    e.preventDefault();
    
    const mode = document.getElementById('commandMode').value;
    const oldTitle = document.getElementById('oldCommandTitle').value;
    const title = document.getElementById('commandTitle').value;
    const command = document.getElementById('commandText').value;
    const profile = document.getElementById('commandProfile').value;
    const url = document.getElementById('commandUrl').value;
    
    try {
        if (mode === 'edit') {
            const response = await fetch('/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldTitle,
                    newTitle: title,
                    newCommand: command,
                    newProfile: profile,
                    newUrl: url
                })
            });
            
            if (response.ok) {
                showNotification('Command updated successfully!', 'success');
                await loadCommands();
                closeModal('commandModal');
            } else {
                showNotification('Failed to update command', 'error');
            }
        } else {
            const response = await fetch('/commands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, command, profile, url })
            });
            
            const data = await response.json();
            if (data.success) {
                showNotification('Command added successfully!', 'success');
                await loadCommands();
                closeModal('commandModal');
            } else {
                showNotification(data.error || 'Failed to add command', 'error');
            }
        }
    } catch (error) {
        console.error('Error saving command:', error);
        showNotification('An error occurred', 'error');
    }
}

async function deleteCommand(title) {
    const confirmed = await ipcRenderer.invoke('show-confirmation', 
        `Are you sure you want to delete the command "${title}"?`);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch('/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        
        if (response.ok) {
            showNotification('Command deleted successfully!', 'success');
            await loadCommands();
        } else {
            showNotification('Failed to delete command', 'error');
        }
    } catch (error) {
        console.error('Error deleting command:', error);
        showNotification('An error occurred', 'error');
    }
}

async function runCommand(command, profileTitle) {
    const profile = state.profiles.find(p => p.title === profileTitle);
    
    if (!profile) {
        showNotification('Profile not found', 'error');
        return;
    }
    
    showConsoleOutput('Executing command...\n', false);
    
    try {
        const response = await fetch('/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, profileTitle })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showConsoleOutput(`Error: ${data.error}`, false);
            showNotification('Command execution failed', 'error');
        } else {
            showConsoleOutput(data.output || 'Command executed successfully', false);
            showNotification('Command executed', 'success');
        }
    } catch (error) {
        console.error('Error running command:', error);
        showConsoleOutput(`Error: ${error.message}`, false);
        showNotification('An error occurred', 'error');
    }
}

// Profile Operations
async function handleAddProfile(e) {
    e.preventDefault();
    
    const profile = {
        title: document.getElementById('newProfileTitle').value,
        username: document.getElementById('newProfileUsername').value,
        password: document.getElementById('newProfilePassword').value,
        host: document.getElementById('newProfileHost').value,
        port: document.getElementById('newProfilePort').value
    };
    
    try {
        const response = await fetch('/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Profile added successfully!', 'success');
            document.getElementById('addProfileForm').reset();
            await loadProfiles();
            loadProfilesList();
            populateProfileSelect();
        } else {
            showNotification(data.error || 'Failed to add profile', 'error');
        }
    } catch (error) {
        console.error('Error adding profile:', error);
        showNotification('An error occurred', 'error');
    }
}

async function editProfile(index) {
    try {
        const response = await fetch(`/profiles/${index}`);
        const profile = await response.json();
        
        document.getElementById('editProfileIndex').value = index;
        document.getElementById('editProfileTitle').value = profile.title;
        document.getElementById('editProfileUsername').value = profile.username;
        document.getElementById('editProfilePassword').value = profile.password;
        document.getElementById('editProfileHost').value = profile.host;
        document.getElementById('editProfilePort').value = profile.port;
        
        document.getElementById('editProfileForm').style.display = 'block';
        document.getElementById('profileList').style.display = 'none';
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile', 'error');
    }
}

async function handleEditProfile(e) {
    e.preventDefault();
    
    const index = document.getElementById('editProfileIndex').value;
    const profile = {
        title: document.getElementById('editProfileTitle').value,
        username: document.getElementById('editProfileUsername').value,
        password: document.getElementById('editProfilePassword').value,
        host: document.getElementById('editProfileHost').value,
        port: document.getElementById('editProfilePort').value
    };
    
    try {
        const response = await fetch(`/profiles/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Profile updated successfully!', 'success');
            document.getElementById('editProfileForm').style.display = 'none';
            document.getElementById('profileList').style.display = 'block';
            await loadProfiles();
            await loadCommands();
            loadProfilesList();
            populateProfileSelect();
        } else {
            showNotification(data.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('An error occurred', 'error');
    }
}

async function deleteProfile(title) {
    const confirmed = await ipcRenderer.invoke('show-confirmation', 
        `Are you sure you want to delete the profile "${title}"?`);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/profiles/${encodeURIComponent(title)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Profile deleted successfully!', 'success');
            await loadProfiles();
            await loadCommands();
            loadProfilesList();
            populateProfileSelect();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Failed to delete profile', 'error');
        }
    } catch (error) {
        console.error('Error deleting profile:', error);
        showNotification('An error occurred', 'error');
    }
}

// Sortable
function setupSortable() {
    const grid = document.getElementById('commandsGrid');
    new Sortable(grid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: async function(evt) {
            const items = Array.from(grid.querySelectorAll('.command-card'));
            const newOrder = items.map(item => item.dataset.lineNumber);
            
            try {
                await fetch('/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newOrder })
                });
                await loadCommands();
            } catch (error) {
                console.error('Error reordering commands:', error);
                showNotification('Failed to reorder commands', 'error');
            }
        }
    });
}

// Dashboard Integration
function openDashboard() {
    ipcRenderer.send('open-dashboard');
}

// Utility Functions
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    state.filteredCommands = state.commands.filter(cmd => 
        cmd.title.toLowerCase().includes(query) || 
        cmd.command.toLowerCase().includes(query) ||
        cmd.profile.toLowerCase().includes(query)
    );
    renderCommands();
}

function updateStats() {
    document.getElementById('profileCount').textContent = state.profiles.length;
    document.getElementById('commandCount').textContent = state.commands.length;
}

function showConsoleOutput(text, append = true) {
    const console = document.getElementById('consoleOutput');
    if (!append) {
        console.innerHTML = '';
    }
    const placeholder = console.querySelector('.console-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    const line = document.createElement('div');
    line.textContent = text;
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
}

function clearConsole() {
    document.getElementById('consoleOutput').innerHTML = `
        <div class="console-placeholder">
            <i class="fas fa-info-circle"></i>
            <p>Command output will appear here</p>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    ipcRenderer.send('show-alert', message);
}

function openExternalURL(url) {
    shell.openExternal(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sync Functions
async function openSyncModal() {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    
    // Check if already logged in
    if (state.authToken) {
        showSyncSection();
        await loadCloudData();
        
        // Start auto-refresh every 10 seconds
        startSyncRefresh();
    } else {
        showLoginSection();
    }
    
    openModal('syncModal');
}

function startSyncRefresh() {
    // Clear any existing interval
    if (state.syncRefreshInterval) {
        clearInterval(state.syncRefreshInterval);
    }
    
    // Refresh cloud data every 10 seconds
    state.syncRefreshInterval = setInterval(async () => {
        if (state.authToken) {
            await loadCloudData();
            console.log('Auto-refreshed cloud data');
        }
    }, 10000); // 10 seconds
}

function showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('syncSection').style.display = 'none';
}

function showSyncSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('syncSection').style.display = 'block';
    
    // Update local stats
    document.getElementById('localProfiles').textContent = state.profiles.length;
    document.getElementById('localCommands').textContent = state.commands.length;
    document.getElementById('loggedInUser').textContent = state.userEmail || 'Unknown';
    document.getElementById('lastSyncTime').textContent = state.lastSync || 'Never';
}

async function handleSyncLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('syncEmail').value;
    const password = document.getElementById('syncPassword').value;
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    
    try {
        const response = await fetch(`${serverUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            state.authToken = data.token;
            state.userEmail = email;
            showNotification('Login successful!', 'success');
            
            // Register this device
            await registerDevice();
            
            // Start heartbeat to keep device online
            startHeartbeat();
            
            // Check for pending pushes from cloud
            startPendingPushCheck();
            
            showSyncSection();
            await loadCloudData();
            
            // Start auto-refresh after login
            startSyncRefresh();
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Failed to connect to server', 'error');
    }
}

// Device Registration
async function registerDevice() {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const os = require('os');
    
    // Create a unique device ID based on hostname and network
    // Generate a consistent device ID based on machine info (without timestamp)
    // This ensures the same device gets the same ID across sessions
    const machineId = `${os.hostname()}-${os.platform()}-${os.arch()}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    const deviceId = `dev-${machineId}`;
    
    // Create a friendly device name
    const deviceName = `${os.hostname()} (${os.platform()} ${os.arch()})`;
    
    // Store device ID for future use
    state.deviceId = deviceId;
    
    console.log('Device Info:', { deviceId, deviceName });
    
    try {
        const response = await fetch(`${serverUrl}/api/auth/register-device`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify({ deviceId, deviceName })
        });
        
        if (response.ok) {
            console.log('Device registered successfully');
        }
    } catch (error) {
        console.error('Device registration error:', error);
    }
}

// Heartbeat to keep device online
function startHeartbeat() {
    // Clear any existing heartbeat
    if (state.heartbeatInterval) {
        clearInterval(state.heartbeatInterval);
    }
    
    // Send heartbeat every 2 minutes
    state.heartbeatInterval = setInterval(async () => {
        if (state.authToken && state.deviceId) {
            const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
            
            try {
                await fetch(`${serverUrl}/api/auth/heartbeat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.authToken}`
                    },
                    body: JSON.stringify({ deviceId: state.deviceId })
                });
                console.log('Heartbeat sent');
            } catch (error) {
                console.error('Heartbeat error:', error);
            }
        }
    }, 120000); // 2 minutes
}

// Check for pending pushes from cloud
function startPendingPushCheck() {
    // Clear any existing check
    if (state.pendingPushInterval) {
        clearInterval(state.pendingPushInterval);
    }
    
    // Check every 30 seconds
    state.pendingPushInterval = setInterval(async () => {
        if (state.authToken && state.deviceId) {
            await checkPendingPush();
        }
    }, 30000); // 30 seconds
}

async function checkPendingPush() {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    
    try {
        const response = await fetch(`${serverUrl}/api/auth/devices`, {
            headers: { 'Authorization': `Bearer ${state.authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const myDevice = data.devices.find(d => d.deviceId === state.deviceId);
                
                if (myDevice && myDevice.pendingPush && myDevice.pushData) {
                    console.log('Pending push detected, applying configuration...');
                    await applyPushedConfiguration(myDevice.pushData);
                }
            }
        }
    } catch (error) {
        console.error('Pending push check error:', error);
    }
}

async function applyPushedConfiguration(pushData) {
    try {
        const { profiles, commands } = pushData;
        
        // Apply to local storage
        await fetch('/profiles/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profiles })
        });
        
        await fetch('/commands/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands })
        });
        
        // Reload local data
        await loadProfiles();
        await loadCommands();
        renderCommands();
        updateStats();
        
        showNotification('Configuration updated from cloud!', 'success');
        console.log('Configuration applied successfully');
    } catch (error) {
        console.error('Apply configuration error:', error);
    }
}

async function loadCloudData() {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    
    try {
        // Get full config from single endpoint
        const response = await fetch(`${serverUrl}/api/config`, {
            headers: { 'Authorization': `Bearer ${state.authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Cloud data loaded:', data);
            if (data.success && data.data) {
                document.getElementById('cloudProfiles').textContent = data.data.profileCount || 0;
                document.getElementById('cloudCommands').textContent = data.data.commandCount || 0;
            }
        }
    } catch (error) {
        console.error('Error loading cloud data:', error);
        showNotification('Failed to load cloud data', 'error');
    }
}

async function handleSyncPush() {
    const confirmed = await ipcRenderer.invoke('show-confirmation', 
        `This will REPLACE all cloud data with your local data. Continue?`);
    
    if (!confirmed) return;
    
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const syncBtn = document.getElementById('syncPushBtn');
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pushing...';
    
    console.log('Pushing data:', { profiles: state.profiles, commands: state.commands });
    
    try {
        // Use the sync endpoint with proper format
        const syncResponse = await fetch(`${serverUrl}/api/config/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify({
                profiles: state.profiles,
                commands: state.commands
            })
        });
        
        const data = await syncResponse.json();
        console.log('Push response:', data);
        
        if (syncResponse.ok && data.success) {
            state.lastSync = new Date().toLocaleString();
            showNotification('Successfully pushed to cloud!', 'success');
            await loadCloudData();
            document.getElementById('lastSyncTime').textContent = state.lastSync;
        } else {
            showNotification(data.message || 'Failed to push data', 'error');
            console.error('Push error:', data);
        }
    } catch (error) {
        console.error('Sync push error:', error);
        showNotification('Sync failed: ' + error.message, 'error');
    } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Push to Cloud (Local → Cloud)';
    }
}

async function handleSyncPull() {
    const confirmed = await ipcRenderer.invoke('show-confirmation', 
        `This will REPLACE all local data with cloud data. Continue?`);
    
    if (!confirmed) return;
    
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const syncBtn = document.getElementById('syncPullBtn');
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pulling...';
    
    try {
        // Get cloud data from config endpoint
        const response = await fetch(`${serverUrl}/api/config`, {
            headers: { 'Authorization': `Bearer ${state.authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Pull data:', data);
            
            if (data.success && data.data) {
                const cloudProfiles = data.data.profiles || [];
                const cloudCommands = data.data.commands || [];
                
                // Save to local using sync endpoints
                await fetch('/profiles/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profiles: cloudProfiles })
                });
                
                await fetch('/commands/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ commands: cloudCommands })
                });
                
                state.lastSync = new Date().toLocaleString();
                showNotification('Successfully pulled from cloud!', 'success');
                document.getElementById('lastSyncTime').textContent = state.lastSync;
                
                // Reload local data to update state
                await loadProfiles();
                await loadCommands();
                
                // Update the UI with new local counts
                document.getElementById('localProfiles').textContent = state.profiles.length;
                document.getElementById('localCommands').textContent = state.commands.length;
                
                // Reload cloud data
                await loadCloudData();
                
                // Re-render the main UI
                renderCommands();
                updateStats();
            }
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Failed to pull data', 'error');
        }
    } catch (error) {
        console.error('Sync pull error:', error);
        showNotification('Sync failed: ' + error.message, 'error');
    } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Pull from Cloud (Cloud → Local)';
    }
}

async function handleSyncLogout() {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    
    // Mark device as offline before logging out
    if (state.authToken && state.deviceId) {
        try {
            await fetch(`${serverUrl}/api/auth/device-logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.authToken}`
                },
                body: JSON.stringify({ deviceId: state.deviceId })
            });
            console.log('Device marked as offline');
        } catch (error) {
            console.error('Device logout error:', error);
        }
    }
    
    // Stop all intervals
    if (state.syncRefreshInterval) {
        clearInterval(state.syncRefreshInterval);
        state.syncRefreshInterval = null;
    }
    
    if (state.heartbeatInterval) {
        clearInterval(state.heartbeatInterval);
        state.heartbeatInterval = null;
    }
    
    if (state.pendingPushInterval) {
        clearInterval(state.pendingPushInterval);
        state.pendingPushInterval = null;
    }
    
    state.authToken = null;
    state.userEmail = null;
    state.deviceId = null;
    document.getElementById('syncEmail').value = '';
    document.getElementById('syncPassword').value = '';
    showLoginSection();
    showNotification('Logged out successfully', 'success');
}

// Make functions global for onclick handlers
window.editCommand = editCommand;
window.deleteCommand = deleteCommand;
window.runCommand = runCommand;
window.editProfile = editProfile;
window.deleteProfile = deleteProfile;
window.openExternalURL = openExternalURL;
window.openDashboard = openDashboard;
