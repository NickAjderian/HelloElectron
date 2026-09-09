console.log('hello from nicks first electron app');
const MyService = require('./myservice.js');

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

//monkey patch ipcMain.emit to log all incoming events

// // Save the original emit function
// const originalEmit = ipcMain.emit;

// // Override emit to intercept all incoming events
// ipcMain.emit = function (channel, event, ...args) {
//   // Filter out internal or noisy system events if needed
//   if (!channel.startsWith('ELECTRON_') && !channel.startsWith('CHROME_')) {
//     console.log(`[IPC Catch-All] Channel: ${channel}`, {
//       sender: event.sender ? event.sender.id : 'unknown',
//       args: args
//     });
//   }

//   // Call the original emit so normal listeners still work
//   return originalEmit.apply(ipcMain, [channel, event, ...args]);
// };

// // monkey patch ipcMain.handle to log all incoming invoke events and their return values
// // Save the original handler registration method
// const originalHandle = ipcMain.handle;

// // Override handle to wrap all future registered handlers
// ipcMain.handle = function (channel, listener) {
  
//   // Create a wrapped version of the user's listener
//   const wrappedListener = async (event, ...args) => {
//     console.log(`[IPC Invoke Capture] Channel: ${channel}`, {
//       senderId: event.sender ? event.sender.id : 'unknown',
//       arguments: args
//     });

//     try {
//       // Execute the original handler and capture its return value
//       const result = await listener(event, ...args);
      
//       console.log(`[IPC Invoke Return] Channel: ${channel} -> Success`, { result });
//       return result;
//     } catch (error) {
//       console.error(`[IPC Invoke Return] Channel: ${channel} -> Failed`, { error });
//       throw error; // Rethrow so the renderer catches the rejection properly
//     }
//   };

//   // Register the wrapped listener using the original method
//   return originalHandle.call(ipcMain, channel, wrappedListener);
// };


const createWindow = () => {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
        sandbox: false,
        contextIsolation: true,
        nodeIntegrationInWorker: true,
      preload: path.join(__dirname, './preload.js')
    }
  })

  win.loadFile('index.html')
}

async function getTime(event, request) {
  console.log(`getTime() called with request: ${request}`);
    return await MyService.GetTime();
}

app.whenReady().then(() => {
    ipcMain.handle('api:getTime', getTime);
    ipcMain.on('api:getTime', getTime);
    createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
