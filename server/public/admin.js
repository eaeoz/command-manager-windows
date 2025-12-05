// API Base URL
const API_URL = window.location.origin + '/api';

// State
let currentUser = null;
let authToken = null;
let currentTheme = localStorage.getItem('theme') || 'light';

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
  if (currentTheme === 'dark') {
    btn.innerHTML = '<span class="icon">☀️</span><span>Light Mode</span>';
  } else {
    btn.innerHTML = '<span class="icon">🌙</span><span>Dark Mode</span>';
  }
}

// Event Listeners
function setupEventListeners() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      switchPage(page);
    });
  });
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    const activePage = document.querySelector('.nav-item.active').dataset.page;
    loadPageData(activePage);
  });
  
  // Edit user form
  document.getElementById('editUserForm').addEventListener('submit', handleUpdateUser);
}

// Authentication
function checkAuth() {
  authToken = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');
  
  if (authToken && user) {
    currentUser = JSON.parse(user);
    showDashboard();
  } else {
    showLogin();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.getElementById('loginBtn');
  const errorDiv = document.getElementById('loginError');
  
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span>Logging in...</span>';
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
      
      // Check if user is admin
      if (currentUser.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      showDashboard();
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add('show');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Login</span>';
  }
}

function handleLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  authToken = null;
  currentUser = null;
  showLogin();
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  document.getElementById('currentUser').textContent = currentUser.username;
  loadPageData('overview');
}

// Page Navigation
function switchPage(pageName) {
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });
  
  // Update pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(`${pageName}Page`).classList.add('active');
  
  // Update title
  const titles = {
    overview: 'Overview',
    users: 'User Management',
    configurations: 'Configuration Management'
  };
  document.getElementById('pageTitle').textContent = titles[pageName];
  
  // Load data
  loadPageData(pageName);
}

async function loadPageData(page) {
  switch(page) {
    case 'overview':
      await loadOverviewData();
      break;
    case 'users':
      await loadUsersData();
      break;
    case 'configurations':
      await loadConfigurationsData();
      break;
  }
}

// Overview Page
async function loadOverviewData() {
  try {
    const response = await fetchAPI('/admin/stats');
    
    if (response.success) {
      const { users, configurations } = response.data;
      
      document.getElementById('totalUsers').textContent = users.total;
      document.getElementById('activeUsers').textContent = users.active;
      document.getElementById('adminUsers').textContent = users.admins;
      document.getElementById('totalProfiles').textContent = configurations.totalProfiles;
      document.getElementById('totalCommands').textContent = configurations.totalCommands;
    }
  } catch (error) {
    showToast('Failed to load overview data', 'error');
  }
}

// Users Page
async function loadUsersData() {
  try {
    const response = await fetchAPI('/admin/users');
    
    if (response.success) {
      renderUsersTable(response.data);
    }
  } catch (error) {
    showToast('Failed to load users', 'error');
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No users found</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${escapeHtml(user.username)}</td>
      <td>
        ${escapeHtml(user.email)}
        <br>
        <span style="font-size: 11px; color: ${user.isEmailVerified ? 'var(--success)' : 'var(--warning)'};">
          ${user.isEmailVerified ? '✓ Verified' : '⚠ Not Verified'}
        </span>
      </td>
      <td><span class="role-badge role-${user.role}">${user.role}</span></td>
      <td><span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
      <td class="table-actions">
        <button class="btn btn-small btn-secondary" onclick="editUser('${user._id}')">Edit</button>
        <button class="btn btn-small btn-danger" onclick="deleteUser('${user._id}', '${escapeHtml(user.username)}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function editUser(userId) {
  try {
    const response = await fetchAPI(`/admin/users/${userId}`);
    
    if (response.success) {
      const user = response.data.user;
      
      document.getElementById('editUserId').value = user._id;
      document.getElementById('editUsername').value = user.username;
      document.getElementById('editEmail').value = user.email;
      document.getElementById('editRole').value = user.role;
      document.getElementById('editIsActive').checked = user.isActive;
      document.getElementById('editIsEmailVerified').checked = user.isEmailVerified;
      document.getElementById('editPassword').value = ''; // Clear password field
      
      openModal('editUserModal');
    }
  } catch (error) {
    showToast('Failed to load user', 'error');
  }
}

async function handleUpdateUser(e) {
  e.preventDefault();
  
  const userId = document.getElementById('editUserId').value;
  const password = document.getElementById('editPassword').value;
  
  const userData = {
    username: document.getElementById('editUsername').value,
    email: document.getElementById('editEmail').value,
    role: document.getElementById('editRole').value,
    isActive: document.getElementById('editIsActive').checked,
    isEmailVerified: document.getElementById('editIsEmailVerified').checked
  };
  
  // Only include password if it's provided
  if (password && password.trim() !== '') {
    userData.password = password;
  }
  
  try {
    const response = await fetchAPI(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    
    if (response.success) {
      showToast('User updated successfully', 'success');
      closeModal('editUserModal');
      loadUsersData();
    }
  } catch (error) {
    showToast(error.message || 'Failed to update user', 'error');
  }
}

async function deleteUser(userId, username) {
  if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    const response = await fetchAPI(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      showToast('User deleted successfully', 'success');
      loadUsersData();
    }
  } catch (error) {
    showToast(error.message || 'Failed to delete user', 'error');
  }
}

// Configurations Page
async function loadConfigurationsData() {
  try {
    const response = await fetchAPI('/admin/configurations');
    
    if (response.success) {
      renderConfigurationsGrid(response.data);
    }
  } catch (error) {
    showToast('Failed to load configurations', 'error');
  }
}

function renderConfigurationsGrid(configurations) {
  const grid = document.getElementById('configGrid');
  
  if (configurations.length === 0) {
    grid.innerHTML = '<p class="empty-state">No configurations found</p>';
    return;
  }
  
  grid.innerHTML = configurations.map(config => `
    <div class="config-card">
      <div class="config-card-header">
        <h3>${escapeHtml(config.userId.username)}</h3>
        <button class="btn btn-small btn-secondary" onclick="viewConfiguration('${config._id}')">View</button>
      </div>
      <div class="config-stats">
        <div class="config-stat">
          <span class="config-stat-value">${config.profiles.length}</span>
          <span class="config-stat-label">Profiles</span>
        </div>
        <div class="config-stat">
          <span class="config-stat-value">${config.commands.length}</span>
          <span class="config-stat-label">Commands</span>
        </div>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
        Last synced: ${new Date(config.lastSyncedAt).toLocaleString()}
      </p>
    </div>
  `).join('');
}

async function viewConfiguration(configId) {
  try {
    const response = await fetchAPI('/admin/configurations');
    
    if (response.success) {
      const config = response.data.find(c => c._id === configId);
      
      if (config) {
        const detailsHtml = `
          <div style="margin-bottom: 24px;">
            <h4 style="margin-bottom: 12px;">User: ${escapeHtml(config.userId.username)}</h4>
            <p style="color: var(--text-secondary); font-size: 14px;">Email: ${escapeHtml(config.userId.email)}</p>
          </div>
          
          <div style="margin-bottom: 24px;">
            <h4 style="margin-bottom: 12px;">Profiles (${config.profiles.length})</h4>
            ${config.profiles.length > 0 ? `
              <div style="max-height: 200px; overflow-y: auto;">
                ${config.profiles.map(p => `
                  <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;">
                    <strong>${escapeHtml(p.title)}</strong><br>
                    <span style="font-size: 12px; color: var(--text-secondary);">
                      ${escapeHtml(p.username)}@${escapeHtml(p.host)}:${p.port}
                    </span>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: var(--text-secondary);">No profiles</p>'}
          </div>
          
          <div>
            <h4 style="margin-bottom: 12px;">Commands (${config.commands.length})</h4>
            ${config.commands.length > 0 ? `
              <div style="max-height: 200px; overflow-y: auto;">
                ${config.commands.map(c => `
                  <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;">
                    <strong>${escapeHtml(c.title)}</strong><br>
                    <code style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(c.command)}</code><br>
                    <span style="font-size: 12px; color: var(--text-secondary);">Profile: ${escapeHtml(c.profile)}</span>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: var(--text-secondary);">No commands</p>'}
          </div>
        `;
        
        document.getElementById('configDetails').innerHTML = detailsHtml;
        openModal('viewConfigModal');
      }
    }
  } catch (error) {
    showToast('Failed to load configuration details', 'error');
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

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions global
window.editUser = editUser;
window.deleteUser = deleteUser;
window.viewConfiguration = viewConfiguration;
window.closeModal = closeModal;
