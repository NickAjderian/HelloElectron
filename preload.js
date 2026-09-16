import { contextBridge, ipcRenderer } from 'electron';
import os from 'os';

let userInfo = os.userInfo();

//console.log(`we are in preload.js`);

//alert('hello from preload.js');

let myUserInfo =  {
  username: userInfo.username,
  homedir: userInfo.homedir,
  shell: userInfo.shell
};

contextBridge.exposeInMainWorld('myUserInfo', myUserInfo);

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
});

contextBridge.exposeInMainWorld('curses', {curse1: 'damn and blast'});

contextBridge.exposeInMainWorld(
  'electronAPI', 
  {
    getTime: () => {
      console.log(`ipcRenderer.invoke('api:getTime') being called: it's a ${typeof ipcRenderer.invoke}`);
      return ipcRenderer.invoke('api:getTime'); // This returns a Promise that resolves with the result from the main process
    },
    streamProducts: (onChunk, onComplete, onError) => {
        const listener = (event, result) => {
          if (result.error) {
            onError?.(result.error);
            ipcRenderer.off('stream-chunk', listener);
          } else if (result.done) {
            onComplete?.();
            ipcRenderer.off('stream-chunk', listener);
          } else {
            onChunk?.(result.data);
          }
        };

        ipcRenderer.on('api:stream-products', listener);
        ipcRenderer.send('api:stream-products', 'products');
    },
    streamData: (onChunk, onComplete, onError, dataType) => {
      const listener = (event, result) => {
        if(result.error){
          onError?.(result.error);
          ipcRenderer.off('api:stream-data', listener);
        }else if (result.done) {
          onComplete?.();
          ipcRenderer.off('api:stream-data', listener);
        }else{
          onChunk?.(result.data);
        }
      }
      ipcRenderer.on('api:stream-data', listener);
      ipcRenderer.send('api:stream-data', 'dataType');
    },

// Pass a standard callback function instead of using an async generator here
  onStreamUpdate: (onChunk, onComplete, onError, dataType) => {
    // Create a listener function
    const listener = (event, result) => {
      if (result.error) {
        onError(result.error);
        ipcRenderer.off('stream-chunk', listener); // Clean up listener
      } else if (result.done) {
        onComplete();
        ipcRenderer.off('stream-chunk', listener); // Clean up listener
      } else {
        let data = typeof result.data === 'object' ? JSON.stringify(result.data): result.data ;
        onChunk(data);
      }
    };
      ipcRenderer.on('stream-chunk', listener);
      ipcRenderer.send('start-stream', dataType);      
    },

    startStreamUpdate: () => {
      ipcRenderer.send('start-stream');    
    },

    sendCustomMessage: (message) => {
      ipcRenderer.send('api:sendMessage', message);
    },

    sendTimer: (callback) => {
      ipcRenderer.on('api:clockTime', (event, time) => {
        callback(time);
      });
    },

    onMyTimer: (callback) => { ipcRenderer.on('api:myClockTime', (event, time) => {
        callback(time);
    })}



}
);

