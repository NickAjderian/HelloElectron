const information = document.getElementById('info');
//alert('hello from renderer.js');

let info = '';
if (typeof myUserInfo === 'undefined') {
    info = `Hello, undefined User!`;
} else {
    info = `Hello, ${myUserInfo?.username || 'blank user'}!`;
}


if(typeof versions === 'undefined') {
    info += `versions - undefined`;
}else{
    info += `<br/>This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`
}

if(typeof curses === 'undefined') {
    info += `<br/>curses - undefined`;
}else{
    info += `<br/>curses - ${curses?.curse1 || 'no curse found'}`;
}

// if(typeof GetTime === 'undefined') {
//     info += `<br/>MyService - undefined`;
// }else{
//     info += `<br/>MyService - ${GetTime() || 'no time found'}`;
// }   

window.setTimeout(() => {
    console.log(`window.electronAPI.getTime() being called: it's a ${typeof window.electronAPI.getTime} and window.electronAPI is a ${typeof window.electronAPI}`);
    console.log(`window.electronAPI.getTime() is ${window.electronAPI.getTime === undefined ? 'undefined' : 'defined'}`);
    window.electronAPI.getTime().then(result => {
        info += `<br/>MyService - ${result || 'no time found'}`;
        information.innerHTML = info;
    });
    // var myTime = await window.electronAPI.getTime();
    // info += `<br/>MyService - ${result || 'no time found'}`;
    // information.innerHTML = info;
    }
, 10000);

information.innerHTML = info;