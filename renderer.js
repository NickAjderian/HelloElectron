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

const sendCustomMessage = () => {
    const inputElement = document.getElementById('input');
    const message = inputElement.value;
    window.electronAPI.sendMessage(message);
};       


window.setTimeout(async () => {
    console.log(`window.electronAPI.getTime() being called: it's a ${typeof window.electronAPI.getTime} and window.electronAPI is a ${typeof window.electronAPI}`);
    console.log(`window.electronAPI.getTime() is ${window.electronAPI.getTime === undefined ? 'undefined' : 'defined'}`);

    const result = await window.electronAPI.getTime();

    console.log(`window.electronAPI.getTime() returned: ${result}`);
    info += `<br/>MyService - ${result || 'no time found'}`;
    information.innerHTML = info;

    var myProducts = await window.electronAPI.getProducts();
    info += `<br/>MyProducts - ${JSON.stringify(myProducts) || 'no products found'}`;
    information.innerHTML = info;
    }
, 10000);



information.innerHTML = info;