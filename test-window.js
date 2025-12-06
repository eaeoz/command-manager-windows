const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
    console.log('Creating window...');
    
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: true,
        backgroundColor: '#1a1a2e',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, 'favicon.ico'),
        title: 'Test Window'
    });

    console.log('Window created, loading content...');
    
    // Load a simple HTML string instead of localhost
    mainWindow.loadURL('data:text/html,<h1 style="color:white;text-align:center;margin-top:200px;">TEST WINDOW - If you see this, Electron is working!</h1>');
    
    mainWindow.on('ready-to-show', () => {
        console.log('Window is ready to show');
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Content loaded');
    });

    console.log('Window setup complete');
}

app.whenReady().then(() => {
    console.log('App is ready');
    createWindow();
});

app.on('window-all-closed', () => {
    console.log('All windows closed');
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
