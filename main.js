console.log('hello from nicks first electron app');
import MyService from './MyService.js';

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLogFile, log } from './logger.js';
import autoUpdater from 'electron-updater';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

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

var win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 1000,
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

function getTime(event, request) {
  return MyService.getTime();
}

// async function* dataStreamGenerator() {
//   const steps = ['Step 1: Initialising', 'Step 2: Processing', 'Step 3: Cleaning up', 'Done!'];
//   for (const step of steps) {
//     await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating delay
//     yield step;
//   }
// }



  // try {
  //   for await (const chunk of MyService.streamProducts()) {

  //     // Send each yielded value down to the renderer channel
  //     const safeChunk = typeof chunk === 'object' 
  //       ? JSON.parse(JSON.stringify(chunk)) 
  //       : chunk;
  //     console.log(safeChunk);

  //     event.reply('stream-chunk', { data: safeChunk, done: false });
  //   }
  //   // Signal completion
  //   event.reply('stream-chunk', { done: true });
  // } catch (error) {
  //   event.reply('stream-chunk', { error: error.message, done: true });
  // }
  //});

app.whenReady().then(() => {
    process.on('uncaughtException', error => log('ERROR', 'Uncaught exception.', error));
    process.on('unhandledRejection', error => log('ERROR', 'Unhandled promise rejection.', error));
    log('INFO', `Application started. Logs: ${getLogFile()}`);

    () =>{
      autoUpdater.checkForUpdatesAndNotify();
    }

    MyService.init().catch(error => {
      log('ERROR', 'Database initialization failed.', error);
    });

    ipcMain.handle('api:getTime', getTime); //getTime is an async function that returns a Promise, so ipcMain.handle will automatically handle the Promise resolution and rejection for you.
    // ipcMain.on('api:sendMessage', (event, message) => {
    //     console.log(`Received message from renderer: ${message}`);
    // });

    ipcMain.on('api:stream-data', (
        event
        , dataType
        , filter //array of parameters
        , guid
      )=>{
      console.log(`got a requiest to return rows flagged with guid ${guid || 'NOT SET'}`);
      let channelId = 'api:stream-data';
      let sql = '';
      switch(dataType){
        case 'products':
        case 'product':
          MyService.executeSql('select top 10 ProductID, ProductCode from tblProduct',
            [],
            (chunk) =>{
              console.log(`returning a chunk flagged with guid ${guid || 'NOT SET'}`)
              event.reply(channelId, { data: chunk, done: false, guid: guid })

            },
            (result)=>event.reply(channelId, { done: true, guid: guid }),
            (err)=>event.reply(channelId, { error: err.message, done: true, guid: guid })
          )
          break;
        case 'organisations':
        case 'organisation':
          MyService.executeSql('select top 10 OrganisationID, Organisation from tblOrganisation',
            [],
            (chunk) =>event.reply(channelId, { data: chunk, done: false, guid: guid }),
            (result)=>event.reply(channelId, { done: true, guid: guid }),
            (err)=>event.reply(channelId, { error: err.message, done: true, guid: guid })
          )
          break;
        case 'ingredients':
        case 'ingredient':
          sql=`select p.ProductID
            ,i.ProductID IngredientID, i.ProductCode, i.ProductName, rd.Percentage
            from tblProduct p
            inner join manRecipeDetail rd on p.ProductID=rd.ProductID
            inner join tblProduct i on rd.RawMaterialID=i.ProductID
            where i.IsDeleted = 0 and rd.IsDeleted = 0
            and (p.ProductID=@ProductID or @ProductID is null)
            order by rd.Sequence, i.ProductCode
            `;
          MyService.executeSql(sql,
            filter,
            (chunk) =>event.reply(channelId, { data: chunk, done: false, guid: guid }),
            (result)=>event.reply(channelId, { done: true }),
            (err)=>event.reply(channelId, { error: err.message, done: true, guid: guid })
          )
          break;
        case 'msds':
          sql=`select * from tblMSDS
            where (ProductID=@ProductID or @ProductID is null)
            `;
          MyService.executeSql(sql,
            filter,
            (chunk) =>event.reply(channelId, { data: chunk, done: false, guid: guid }),
            (result)=>event.reply(channelId, { done: true, guid: guid }),
            (err)=>event.reply(channelId, { error: err.message, done: true, guid: guid })
          )
          break;
      }
    })

    ipcMain.on('start-stream', async (event, dataType) => {
      await MyService.init();

      switch(dataType){
        case 'organisations':
          break;

        case 'products':
        default:
          MyService.streamProducts(
            chunk => event.reply('stream-chunk', { data: chunk, done: false }),
            () => event.reply('stream-chunk', { done: true }),
            err => event.reply('stream-chunk', { error: err.message, done: true })
          );
      }
    });

    ipcMain.on('api:getTime', getTime);
    createWindow()

    win.on('api:sendMessage', (event, message) => {
        console.log(`Received message from renderer: ${message}`);
    });

    setInterval(() => {
      win.webContents.send('api:myClockTime', new Date().toLocaleTimeString());
    }, 1000);




})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
