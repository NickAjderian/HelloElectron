import { contextBridge, ipcRenderer } from 'electron';
import os from 'os';


let userInfo = os.userInfo();
//let appVersion = app.getVersion();

//console.log(`we are in preload.js`);

//alert('hello from preload.js');


let myUserInfo =  {
  username: userInfo.username,
  homedir: userInfo.homedir,
  shell: userInfo.shell
};

contextBridge.exposeInMainWorld('myUserInfo', myUserInfo);

contextBridge.exposeInMainWorld('versions', {
  appVersion: () => appVersion,
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

    streamData: (dataType, filter, onChunk, onComplete, onError ) => {
      const channelGuid = String(crypto.randomUUID());
      console.log(`set channelGuid ${channelGuid}`);
      const listener = (event, result, guid) => {
        if((!result?.guid) || (result?.guid === channelGuid)){ //only handle this if it's YOUR guid
          if(result.error){
            onError?.(result.error);
            ipcRenderer.off('api:stream-data', listener);
          }else if (result.done) {
            onComplete?.();
            ipcRenderer.off('api:stream-data', listener);
          }else{
              onChunk?.(result.data);
          }
        }else{
          console.log(`GUID invalid: ${result?.guid} != ${guid}`)
        }
      }
      ipcRenderer.on('api:stream-data', listener);
      ipcRenderer.send('api:stream-data', dataType, filter, channelGuid);
    },

    onMyTimer: (callback) => { ipcRenderer.on('api:myClockTime', (event, time) => {
        callback(time);
    })}



}
);

