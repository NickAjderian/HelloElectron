const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
let userInfo = os.userInfo();

// const MyService = require('./myservice.js');
// var myService = new MyService.constructor();

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
//contextBridge.exposeInMainWorld('GetTime', myService.GetTime.bind(myService));

contextBridge.exposeInMainWorld('electronAPI', {
    getTime: () => {
      try{
        console.log(`ipcRenderer.invoke('api:getTime') being called: it's a ${typeof ipcRenderer.invoke}`);
        ipcRenderer.invoke('api:getTime')
      }catch(err){
        console.log(`ipcRenderer.invoke('api:getTime') error: ${err}`);
      }
}
}
);

