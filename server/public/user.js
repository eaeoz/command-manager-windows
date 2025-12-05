// API Base URL
const API_URL = window.location.origin + '/api';

// State
let currentUser = null;
let authToken = null;
let currentTheme = localStorage.getItem('theme') || 'light';
let userConfig = { profiles: [], commands: [] };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  checkAuth();
  setupEventListeners();
});

// Theme Management
function initializeTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeButton();
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById('themeToggle');
  if (btn) {
    if (currentTheme === 'dark') {
      btn.innerHTML = '<span class="icon">☀️</span><span>Light Mode</span>';
    } else {
      btn.innerHTML = '<span class="icon">🌙</span><span>Dark Mode</span>';
    }
  }
}

// Event Listeners
function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      switchPage(page);
    });
  });
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const activePage = document.querySelector('.nav-item.active')?.dataset.page;
      if (activePage) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '🔄 Refreshing...';
        
        try {
          await loadPageData(activePage);
          showToast('Data refreshed successfully!', 'success');
        } catch (error) {
          showToast('Failed to refresh data', 'error');
        } finally {
          refreshBtn.disabled = false;
          refreshBtn.textContent = '🔄 Refresh';
        }
      }
    });
  }
  
  // Add profile form
  const addProfileForm = document.getElementById('addProfileForm');
  if (addProfileForm) {
    addProfileForm.addEventListener('submit', handleAddProfile);
  }
  
  // Add command form
  const addCommandForm = document.getElementById('addCommandForm');
  if (addCommandForm) {
    addCommandForm.addEventListener('submit', handleAddCommand);
  }
  
  // Sync button
  const syncBtn = document.getElementById('syncNowBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', handleSync);
  }
  
  // Update profile form
  const updateProfileForm = document.getElementById('updateProfileForm');
  if (updateProfileForm) {
    updateProfileForm.addEventListener('submit', handleUpdateProfile);
  }
  
  // Change password form
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
  }
  
  // Edit profile form
  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', handleEditProfile);
  }
  
  // Edit command form
  const editCommandForm = document.getElementById('editCommandForm');
  if (editCommandForm) {
    editCommandForm.addEventListener('submit', handleEditCommand);
  }
  
  // Push to devices button
  const pushToDevicesBtn = document.getElementById('pushToDevicesBtn');
  if (pushToDevicesBtn) {
    pushToDevicesBtn.addEventListener('click', pushToDevices);
  }
  
  // Refresh devices button
  const refreshDevicesBtn = document.getElementById('refreshDevicesBtn');
  if (refreshDevicesBtn) {
    refreshDevicesBtn.addEventListener('click', refreshDevices);
  }
}

// Authentication
function checkAuth() {
  authToken = localStorage.getItem('userAuthToken');
  const user = localStorage.getItem('userCurrentUser');
  
  if (authToken && user) {
    currentUser = JSON.parse(user);
    showDashboard();
  } else {
    showAuth();
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  const errorDiv = document.getElementById('registerError');
  
  errorDiv.classList.remove('show');
  
  if (password !== passwordConfirm) {
    errorDiv.textContent = 'Passwords do not match';
    errorDiv.classList.add('show');
    return;
  }
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span>Creating account...</span>';
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      
      localStorage.setItem('userAuthToken', authToken);
      localStorage.setItem('userCurrentUser', JSON.stringify(currentUser));
      
      showToast('Account created successfully!', 'success');
      showDashboard();
    } else {
      throw new Error(data.message || 'Registration failed');
    }
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Create Account</span>';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span>Signing in...</span>';
  errorDiv.classList.remove('show');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      
      localStorage.setItem('userAuthToken', authToken);
      localStorage.setItem('userCurrentUser', JSON.stringify(currentUser));
      
      showDashboard();
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Sign In</span>';
  }
}

function handleLogout() {
  localStorage.removeItem('userAuthToken');
  localStorage.removeItem('userCurrentUser');
  authToken = null;
  currentUser = null;
  showAuth();
}

function showAuth() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  document.getElementById('currentUser').textContent = currentUser.username;
  document.getElementById('currentUserEmail').textContent = currentUser.email;
  document.getElementById('welcomeUser').textContent = currentUser.username;
  setupMobileMenuListeners();
  loadPageData('overview');
}

function showRegister() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('registerContainer').style.display = 'block';
}

function showLogin() {
  document.getElementById('registerContainer').style.display = 'none';
  document.getElementById('loginContainer').style.display = 'block';
}

// Page Navigation
function switchPage(pageName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });
  
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(`${pageName}Page`).classList.add('active');
  
  const titles = {
    overview: 'Overview',
    profiles: 'My Profiles',
    commands: 'My Commands',
    sync: 'Synchronization',
    profile: 'My Account'
  };
  document.getElementById('pageTitle').textContent = titles[pageName];
  
  // Show/hide refresh button based on page
  const refreshBtn = document.getElementById('refreshBtn');
  const pagesWithRefresh = ['overview', 'profiles', 'commands'];
  if (refreshBtn) {
    refreshBtn.style.display = pagesWithRefresh.includes(pageName) ? 'block' : 'none';
  }
  
  loadPageData(pageName);
}

async function loadPageData(page) {
  switch(page) {
    case 'overview':
      await loadOverviewData();
      break;
    case 'profiles':
      await loadProfilesData();
      break;
    case 'commands':
      await loadCommandsData();
      break;
    case 'sync':
      await loadSyncData();
      break;
    case 'profile':
      await loadProfileData();
      break;
  }
}

// Overview Page
async function loadOverviewData() {
  try {
    // Show loading state
    const profileCount = document.getElementById('profileCount');
    const commandCount = document.getElementById('commandCount');
    const lastSync = document.getElementById('lastSync');
    
    profileCount.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    commandCount.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    lastSync.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Fetch fresh data from API
    const response = await fetchAPI('/config');
    
    if (response.success) {
      userConfig = response.data;
      
      // Update statistics with animation
      setTimeout(() => {
        profileCount.textContent = response.data.profileCount || 0;
        commandCount.textContent = response.data.commandCount || 0;
        
        const lastSyncText = response.data.lastSyncedAt ? 
          new Date(response.data.lastSyncedAt).toLocaleString() : 'Never';
        lastSync.textContent = lastSyncText;
      }, 300);
    }
  } catch (error) {
    showToast('Failed to load overview data', 'error');
    // Reset to previous values on error
    document.getElementById('profileCount').textContent = userConfig.profileCount || '0';
    document.getElementById('commandCount').textContent = userConfig.commandCount || '0';
    document.getElementById('lastSync').textContent = 'Error loading';
  }
}

// Profiles Page
async function loadProfilesData() {
  try {
    const response = await fetchAPI('/config');
    
    if (response.success) {
      userConfig = response.data;
      renderProfiles(response.data.profiles);
      setupProfileSearch();
    }
  } catch (error) {
    showToast('Failed to load profiles', 'error');
  }
}

function renderProfiles(profiles) {
  const grid = document.getElementById('profilesGrid');
  
  if (profiles.length === 0) {
    grid.innerHTML = `
      <div class="empty-state-card">
        <div class="icon">💾</div>
        <h3>No Profiles Yet</h3>
        <p>Create your first SSH profile to get started</p>
        <button class="btn btn-primary" onclick="showAddProfileModal()">+ Add Profile</button>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = profiles.map((profile, index) => `
    <div class="profile-card" data-profile-title="${escapeHtml(profile.title).toLowerCase()}" data-profile-host="${escapeHtml(profile.host).toLowerCase()}" data-profile-username="${escapeHtml(profile.username).toLowerCase()}">
      <div class="profile-card-header">
        <div>
          <div class="profile-card-title">${escapeHtml(profile.title)}</div>
          <div class="profile-card-host">${escapeHtml(profile.username)}@${escapeHtml(profile.host)}:${profile.port}</div>
        </div>
      </div>
      <div class="profile-card-actions">
        <button class="btn btn-small btn-secondary" onclick="editProfile(${index})">Edit</button>
        <button class="btn btn-small btn-danger" onclick="deleteProfile(${index})">Delete</button>
      </div>
    </div>
  `).join('');
}

function setupProfileSearch() {
  const searchInput = document.getElementById('profileSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      const profileCards = document.querySelectorAll('.profile-card');
      
      let visibleCount = 0;
      profileCards.forEach(card => {
        const title = card.dataset.profileTitle || '';
        const host = card.dataset.profileHost || '';
        const username = card.dataset.profileUsername || '';
        
        const matches = title.includes(searchTerm) || 
                       host.includes(searchTerm) || 
                       username.includes(searchTerm);
        
        if (matches) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
      
      // Show "no results" message if needed
      const grid = document.getElementById('profilesGrid');
      let noResults = grid.querySelector('.no-results');
      
      if (visibleCount === 0 && searchTerm) {
        if (!noResults) {
          noResults = document.createElement('div');
          noResults.className = 'empty-state-card no-results';
          noResults.innerHTML = `
            <div class="icon">🔍</div>
            <h3>No profiles found</h3>
            <p>Try adjusting your search terms</p>
          `;
          grid.appendChild(noResults);
        }
      } else if (noResults) {
        noResults.remove();
      }
    });
  }
}

function showAddProfileModal() {
  document.getElementById('addProfileForm').reset();
  openModal('addProfileModal');
}

async function handleAddProfile(e) {
  e.preventDefault();
  
  const newProfile = {
    title: document.getElementById('profileTitle').value,
    host: document.getElementById('profileHost').value,
    username: document.getElementById('profileUsername').value,
    password: document.getElementById('profilePassword').value,
    port: parseInt(document.getElementById('profilePort').value)
  };
  
  userConfig.profiles.push(newProfile);
  
  try {
    await fetchAPI('/config/profiles', {
      method: 'PUT',
      body: JSON.stringify({ profiles: userConfig.profiles })
    });
    
    showToast('Profile added successfully', 'success');
    closeModal('addProfileModal');
    loadProfilesData();
  } catch (error) {
    showToast('Failed to add profile', 'error');
  }
}

async function deleteProfile(index) {
  if (!confirm('Are you sure you want to delete this profile?')) return;
  
  userConfig.profiles.splice(index, 1);
  
  try {
    await fetchAPI('/config/profiles', {
      method: 'PUT',
      body: JSON.stringify({ profiles: userConfig.profiles })
    });
    
    showToast('Profile deleted successfully', 'success');
    loadProfilesData();
  } catch (error) {
    showToast('Failed to delete profile', 'error');
  }
}

// Commands Page
async function loadCommandsData() {
  try {
    const response = await fetchAPI('/config');
    
    if (response.success) {
      userConfig = response.data;
      renderCommands(response.data.commands);
      updateCommandProfileSelect(response.data.profiles);
      setupCommandSearch();
    }
  } catch (error) {
    showToast('Failed to load commands', 'error');
  }
}

function renderCommands(commands) {
  const list = document.getElementById('commandsList');
  
  if (commands.length === 0) {
    list.innerHTML = `
      <div class="empty-state-card">
        <div class="icon">⌨️</div>
        <h3>No Commands Yet</h3>
        <p>Create your first command to get started</p>
        <button class="btn btn-primary" onclick="showAddCommandModal()">+ Add Command</button>
      </div>
    `;
    return;
  }
  
  list.innerHTML = commands.map((cmd, index) => `
    <div class="command-card" data-command-title="${escapeHtml(cmd.title).toLowerCase()}" data-command-text="${escapeHtml(cmd.command).toLowerCase()}" data-command-profile="${escapeHtml(cmd.profile).toLowerCase()}">
      <div class="command-card-header">
        <div class="command-card-title">${escapeHtml(cmd.title)}</div>
      </div>
      <div class="command-card-command">${escapeHtml(cmd.command)}</div>
      <div class="command-card-meta">
        <span>Profile: ${escapeHtml(cmd.profile)}</span>
        ${cmd.url ? `<a href="${escapeHtml(cmd.url)}" target="_blank" style="color: var(--primary);">Open URL</a>` : ''}
      </div>
      <div class="command-card-actions">
        <button class="btn btn-small btn-secondary" onclick="editCommand(${index})">Edit</button>
        <button class="btn btn-small btn-danger" onclick="deleteCommand(${index})">Delete</button>
      </div>
    </div>
  `).join('');
}

function setupCommandSearch() {
  const searchInput = document.getElementById('commandSearch');
  if (!searchInput) {
    console.error('Command search input not found!');
    return;
  }
  
  // Remove any existing listeners
  const newInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newInput, searchInput);
  
  newInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const commandCards = document.querySelectorAll('.command-card:not(.empty-state-card)');
    
    console.log('Command search term:', searchTerm);
    console.log('Found command cards:', commandCards.length);
    
    let visibleCount = 0;
    commandCards.forEach(card => {
      const title = card.dataset.commandTitle || '';
      const commandText = card.dataset.commandText || '';
      const profile = card.dataset.commandProfile || '';
      
      console.log('Checking card:', { title, commandText, profile });
      
      const matches = title.includes(searchTerm) || 
                     commandText.includes(searchTerm) || 
                     profile.includes(searchTerm);
      
      if (matches || searchTerm === '') {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    console.log('Visible count:', visibleCount);
    
    // Show "no results" message if needed
    const list = document.getElementById('commandsList');
    let noResults = list.querySelector('.no-results');
    
    if (visibleCount === 0 && searchTerm) {
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'empty-state-card no-results';
        noResults.innerHTML = `
          <div class="icon">🔍</div>
          <h3>No commands found</h3>
          <p>Try adjusting your search terms</p>
        `;
        list.appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
  });
  
  console.log('Command search listener attached successfully');
}

function updateCommandProfileSelect(profiles) {
  const select = document.getElementById('commandProfile');
  select.innerHTML = '<option value="">Select a profile</option>' +
    profiles.map(p => `<option value="${escapeHtml(p.title)}">${escapeHtml(p.title)}</option>`).join('');
}

function showAddCommandModal() {
  document.getElementById('addCommandForm').reset();
  openModal('addCommandModal');
}

async function handleAddCommand(e) {
  e.preventDefault();
  
  const newCommand = {
    lineNumber: userConfig.commands.length + 1,
    title: document.getElementById('commandTitle').value,
    command: document.getElementById('commandText').value,
    profile: document.getElementById('commandProfile').value,
    url: document.getElementById('commandUrl').value || ''
  };
  
  userConfig.commands.push(newCommand);
  
  try {
    await fetchAPI('/config/commands', {
      method: 'PUT',
      body: JSON.stringify({ commands: userConfig.commands })
    });
    
    showToast('Command added successfully', 'success');
    closeModal('addCommandModal');
    loadCommandsData();
  } catch (error) {
    showToast('Failed to add command', 'error');
  }
}

async function deleteCommand(index) {
  if (!confirm('Are you sure you want to delete this command?')) return;
  
  userConfig.commands.splice(index, 1);
  
  try {
    await fetchAPI('/config/commands', {
      method: 'PUT',
      body: JSON.stringify({ commands: userConfig.commands })
    });
    
    showToast('Command deleted successfully', 'success');
    loadCommandsData();
  } catch (error) {
    showToast('Failed to delete command', 'error');
  }
}

// Sync Page
async function loadSyncData() {
  try {
    const response = await fetchAPI('/config/stats');
    
    if (response.success) {
      document.getElementById('remoteProfiles').textContent = response.data.remote.profiles;
      document.getElementById('remoteCommands').textContent = response.data.remote.commands;
      
      const lastSync = response.data.lastSynced ? 
        new Date(response.data.lastSynced).toLocaleString() : 'Never';
      document.getElementById('lastSyncTime').textContent = lastSync;
    }
    
    // Load devices
    await loadDevices();
  } catch (error) {
    showToast('Failed to load sync data', 'error');
  }
}

async function loadDevices() {
  try {
    const response = await fetchAPI('/auth/devices');
    
    if (response.success) {
      renderDevices(response.devices);
    }
  } catch (error) {
    showToast('Failed to load devices', 'error');
  }
}

function renderDevices(devices) {
  const container = document.getElementById('devicesList');
  
  // Filter to show only online devices by default
  const onlineDevices = devices.filter(d => d.online);
  const offlineDevices = devices.filter(d => !d.online);
  
  if (!devices || devices.length === 0) {
    container.innerHTML = `
      <div class="empty-devices">
        <div class="icon">💻</div>
        <h4>No Devices Connected</h4>
        <p>No Electron apps are currently registered with your account.<br>Open the desktop app and login to see it here.</p>
      </div>
    `;
    document.getElementById('pushToDevicesBtn').disabled = true;
    return;
  }
  
  if (onlineDevices.length === 0) {
    container.innerHTML = `
      <div class="empty-devices">
        <div class="icon">💻</div>
        <h4>No Online Devices</h4>
        <p>No devices are currently online.<br>Open the desktop app and login to see it here.</p>
        ${offlineDevices.length > 0 ? `<p style="margin-top: 12px; font-size: 13px;">You have ${offlineDevices.length} offline device(s) that can be removed.</p>` : ''}
      </div>
    `;
    document.getElementById('pushToDevicesBtn').disabled = true;
    return;
  }
  
  container.innerHTML = onlineDevices.map(device => `
    <div class="device-item">
      <input type="checkbox" class="device-checkbox" value="${escapeHtml(device.deviceId)}" onchange="updatePushButton()">
      <div class="device-item-icon">💻</div>
      <div class="device-item-info">
        <div class="device-item-name">${escapeHtml(device.deviceName)}</div>
        <div class="device-item-details">
          <span style="margin-right: 12px;">💾 ${device.profileCount || 0} profiles</span>
          <span style="margin-right: 12px;">⌨️ ${device.commandCount || 0} commands</span>
        </div>
        <div class="device-item-details" style="margin-top: 4px; font-size: 12px;">
          Last seen: ${new Date(device.lastSeen).toLocaleString()}
        </div>
      </div>
      <div class="device-status ${device.online ? 'online' : 'offline'}">
        <span class="device-status-dot"></span>
        ${device.online ? 'Online' : 'Offline'}
      </div>
      <div class="device-item-actions">
        <button class="btn-icon" onclick="removeDevice('${escapeHtml(device.deviceId)}')" title="Remove device">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
  
  updatePushButton();
}

function updatePushButton() {
  const checkboxes = document.querySelectorAll('.device-checkbox:checked');
  const btn = document.getElementById('pushToDevicesBtn');
  btn.disabled = checkboxes.length === 0;
  
  if (checkboxes.length > 0) {
    btn.textContent = `⬇️ Push to ${checkboxes.length} Device(s)`;
  } else {
    btn.textContent = '⬇️ Push to Selected Devices';
  }
}

async function pushToDevices() {
  const checkboxes = document.querySelectorAll('.device-checkbox:checked');
  const deviceIds = Array.from(checkboxes).map(cb => cb.value);
  
  if (deviceIds.length === 0) {
    showToast('Please select at least one device', 'error');
    return;
  }
  
  const btn = document.getElementById('pushToDevicesBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⬇️ Pushing...';
  
  try {
    const response = await fetchAPI('/config/push-to-devices', {
      method: 'POST',
      body: JSON.stringify({ deviceIds })
    });
    
    if (response.success) {
      showToast(`Configuration pushed to ${deviceIds.length} device(s)!`, 'success');
      
      // Uncheck all boxes
      checkboxes.forEach(cb => cb.checked = false);
      updatePushButton();
    }
  } catch (error) {
    showToast('Failed to push to devices: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function removeDevice(deviceId) {
  if (!confirm('Are you sure you want to remove this device?')) return;
  
  try {
    await fetchAPI(`/auth/device/${deviceId}`, {
      method: 'DELETE'
    });
    
    showToast('Device removed successfully', 'success');
    loadDevices();
  } catch (error) {
    showToast('Failed to remove device', 'error');
  }
}

async function refreshDevices() {
  const btn = document.getElementById('refreshDevicesBtn');
  btn.disabled = true;
  btn.textContent = '🔄 Refreshing...';
  
  try {
    await loadDevices();
    showToast('Devices refreshed', 'success');
  } catch (error) {
    showToast('Failed to refresh devices', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 Refresh Devices';
  }
}

async function handleSync() {
  const btn = document.getElementById('syncNowBtn');
  btn.disabled = true;
  btn.innerHTML = '🔄 Syncing...';
  
  try {
    await fetchAPI('/config/sync', {
      method: 'POST',
      body: JSON.stringify({
        profiles: userConfig.profiles,
        commands: userConfig.commands
      })
    });
    
    showToast('Synchronized successfully!', 'success');
    loadSyncData();
  } catch (error) {
    showToast('Sync failed: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔄 Sync Now';
  }
}

// API Helper
async function fetchAPI(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  });
  
  if (response.status === 401) {
    handleLogout();
    throw new Error('Session expired. Please login again.');
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
}

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// Toast Notifications
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Profile/Account Settings Page
async function loadProfileData() {
  try {
    const response = await fetchAPI('/auth/me');
    
    if (response.success) {
      const user = response.user;
      
      // Fill in form fields
      document.getElementById('profileFormUsername').value = user.username;
      document.getElementById('profileFormEmail').value = user.email;
      
      // Fill in account info
      document.getElementById('accountRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      document.getElementById('memberSince').textContent = new Date(user.createdAt).toLocaleDateString();
      document.getElementById('lastLoginTime').textContent = user.lastLogin ? 
        new Date(user.lastLogin).toLocaleString() : 'N/A';
    }
  } catch (error) {
    showToast('Failed to load profile data', 'error');
  }
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  
  const username = document.getElementById('profileFormUsername').value;
  const email = document.getElementById('profileFormEmail').value;
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Updating...';
  
  try {
    const response = await fetchAPI('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify({ username, email })
    });
    
    if (response.success) {
      currentUser = response.user;
      localStorage.setItem('userCurrentUser', JSON.stringify(currentUser));
      
      // Update UI
      document.getElementById('currentUser').textContent = currentUser.username;
      document.getElementById('currentUserEmail').textContent = currentUser.email;
      document.getElementById('welcomeUser').textContent = currentUser.username;
      
      showToast('Profile updated successfully!', 'success');
    }
  } catch (error) {
    showToast('Failed to update profile: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Profile';
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  
  if (newPassword !== confirmNewPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Changing...';
  
  try {
    await fetchAPI('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    showToast('Password changed successfully!', 'success');
    e.target.reset();
  } catch (error) {
    showToast('Failed to change password: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Change Password';
  }
}

async function deleteAccount() {
  const confirmed = confirm(
    'Are you sure you want to delete your account? This action cannot be undone and will delete all your profiles and commands.'
  );
  
  if (!confirmed) return;
  
  const doubleConfirm = prompt('Type "DELETE" to confirm account deletion:');
  
  if (doubleConfirm !== 'DELETE') {
    showToast('Account deletion cancelled', 'info');
    return;
  }
  
  try {
    await fetchAPI('/auth/delete-account', {
      method: 'DELETE'
    });
    
    showToast('Account deleted successfully', 'success');
    setTimeout(() => {
      handleLogout();
    }, 2000);
  } catch (error) {
    showToast('Failed to delete account: ' + error.message, 'error');
  }
}

// Edit Profile Function
function editProfile(index) {
  const profile = userConfig.profiles[index];
  
  document.getElementById('editProfileIndex').value = index;
  document.getElementById('editProfileTitle').value = profile.title;
  document.getElementById('editProfileHost').value = profile.host;
  document.getElementById('editProfileUsername').value = profile.username;
  document.getElementById('editProfilePassword').value = profile.password;
  document.getElementById('editProfilePort').value = profile.port;
  
  openModal('editProfileModal');
}

async function handleEditProfile(e) {
  e.preventDefault();
  
  const index = parseInt(document.getElementById('editProfileIndex').value);
  
  userConfig.profiles[index] = {
    title: document.getElementById('editProfileTitle').value,
    host: document.getElementById('editProfileHost').value,
    username: document.getElementById('editProfileUsername').value,
    password: document.getElementById('editProfilePassword').value,
    port: parseInt(document.getElementById('editProfilePort').value)
  };
  
  try {
    await fetchAPI('/config/profiles', {
      method: 'PUT',
      body: JSON.stringify({ profiles: userConfig.profiles })
    });
    
    showToast('Profile updated successfully', 'success');
    closeModal('editProfileModal');
    loadProfilesData();
  } catch (error) {
    showToast('Failed to update profile', 'error');
  }
}

// Edit Command Function
function editCommand(index) {
  const command = userConfig.commands[index];
  
  document.getElementById('editCommandIndex').value = index;
  document.getElementById('editCommandTitle').value = command.title;
  document.getElementById('editCommandText').value = command.command;
  document.getElementById('editCommandProfile').value = command.profile;
  document.getElementById('editCommandUrl').value = command.url || '';
  
  // Update profile select in edit modal
  updateEditCommandProfileSelect(userConfig.profiles);
  
  openModal('editCommandModal');
}

function updateEditCommandProfileSelect(profiles) {
  const select = document.getElementById('editCommandProfile');
  if (select) {
    select.innerHTML = '<option value="">Select a profile</option>' +
      profiles.map(p => `<option value="${escapeHtml(p.title)}">${escapeHtml(p.title)}</option>`).join('');
  }
}

async function handleEditCommand(e) {
  e.preventDefault();
  
  const index = parseInt(document.getElementById('editCommandIndex').value);
  
  userConfig.commands[index] = {
    lineNumber: userConfig.commands[index].lineNumber,
    title: document.getElementById('editCommandTitle').value,
    command: document.getElementById('editCommandText').value,
    profile: document.getElementById('editCommandProfile').value,
    url: document.getElementById('editCommandUrl').value || ''
  };
  
  try {
    await fetchAPI('/config/commands', {
      method: 'PUT',
      body: JSON.stringify({ commands: userConfig.commands })
    });
    
    showToast('Command updated successfully', 'success');
    closeModal('editCommandModal');
    loadCommandsData();
  } catch (error) {
    showToast('Failed to update command', 'error');
  }
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Mobile Menu Functions
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

function closeMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// Setup mobile menu listeners
function setupMobileMenuListeners() {
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const overlay = document.getElementById('mobileOverlay');
    const navItems = document.querySelectorAll('.nav-item');
    
    console.log('Setting up mobile menu listeners');
    console.log('Menu toggle button:', menuToggle);
    console.log('Overlay:', overlay);
    
    if (menuToggle) {
      // Remove any existing listeners first
      const newButton = menuToggle.cloneNode(true);
      menuToggle.parentNode.replaceChild(newButton, menuToggle);
      
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Hamburger clicked!');
        toggleMobileMenu();
      });
      
      console.log('Mobile menu toggle listener added');
    } else {
      console.error('Mobile menu toggle button not found!');
    }
    
    if (overlay) {
      overlay.addEventListener('click', closeMobileMenu);
      console.log('Overlay listener added');
    }
    
    // Close menu when clicking nav items on mobile
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 968) {
          closeMobileMenu();
        }
      });
    });
  }, 100);
}


// Make functions global
window.showRegister = showRegister;
window.showLogin = showLogin;
window.switchPage = switchPage;
window.showAddProfileModal = showAddProfileModal;
window.showAddCommandModal = showAddCommandModal;
window.editProfile = editProfile;
window.editCommand = editCommand;
window.deleteProfile = deleteProfile;
window.deleteCommand = deleteCommand;
window.closeModal = closeModal;
window.deleteAccount = deleteAccount;
window.updatePushButton = updatePushButton;
window.removeDevice = removeDevice;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
