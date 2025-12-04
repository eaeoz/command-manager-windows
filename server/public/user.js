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
    refreshBtn.addEventListener('click', () => {
      const activePage = document.querySelector('.nav-item.active')?.dataset.page;
      if (activePage) loadPageData(activePage);
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
    const response = await fetchAPI('/config');
    
    if (response.success) {
      userConfig = response.data;
      document.getElementById('profileCount').textContent = response.data.profileCount;
      document.getElementById('commandCount').textContent = response.data.commandCount;
      
      const lastSync = response.data.lastSyncedAt ? 
        new Date(response.data.lastSyncedAt).toLocaleString() : 'Never';
      document.getElementById('lastSync').textContent = lastSync;
    }
  } catch (error) {
    showToast('Failed to load overview data', 'error');
  }
}

// Profiles Page
async function loadProfilesData() {
  try {
    const response = await fetchAPI('/config');
    
    if (response.success) {
      userConfig = response.data;
      renderProfiles(response.data.profiles);
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
    <div class="profile-card">
      <div class="profile-card-header">
        <div>
          <div class="profile-card-title">${escapeHtml(profile.title)}</div>
          <div class="profile-card-host">${escapeHtml(profile.username)}@${escapeHtml(profile.host)}:${profile.port}</div>
        </div>
      </div>
      <div class="profile-card-actions">
        <button class="btn btn-small btn-danger" onclick="deleteProfile(${index})">Delete</button>
      </div>
    </div>
  `).join('');
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
    <div class="command-card">
      <div class="command-card-header">
        <div class="command-card-title">${escapeHtml(cmd.title)}</div>
      </div>
      <div class="command-card-command">${escapeHtml(cmd.command)}</div>
      <div class="command-card-meta">
        <span>Profile: ${escapeHtml(cmd.profile)}</span>
        ${cmd.url ? `<a href="${escapeHtml(cmd.url)}" target="_blank" style="color: var(--primary);">Open URL</a>` : ''}
      </div>
      <div class="command-card-actions">
        <button class="btn btn-small btn-danger" onclick="deleteCommand(${index})">Delete</button>
      </div>
    </div>
  `).join('');
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
    
    // Set local counts
    document.getElementById('localProfiles').textContent = userConfig.profiles?.length || 0;
    document.getElementById('localCommands').textContent = userConfig.commands?.length || 0;
  } catch (error) {
    showToast('Failed to load sync data', 'error');
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

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions global
window.showRegister = showRegister;
window.showLogin = showLogin;
window.switchPage = switchPage;
window.showAddProfileModal = showAddProfileModal;
window.showAddCommandModal = showAddCommandModal;
window.deleteProfile = deleteProfile;
window.deleteCommand = deleteCommand;
window.closeModal = closeModal;
window.deleteAccount = deleteAccount;
