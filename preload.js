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

contextBridge.exposeInMainWorld('electronAPI', {
    getTime: () => {
      console.log(`ipcRenderer.invoke('api:getTime') being called: it's a ${typeof ipcRenderer.invoke}`);
      return ipcRenderer.invoke('api:getTime'); // This returns a Promise that resolves with the result from the main process
    },
    getProducts: () => ipcRenderer.invoke('api:getProducts'),
    sendMessage: (message) => ipcRenderer.send('api:sendMessage', message)

}
);

