//import { setDefaultResultOrder } from "dns";

const information = document.getElementById('info');
const streamProductsButton = document.getElementById('streamProducts');
const streamOrganisationsButton = document.getElementById('streamOrganisations');
const sendButton = document.getElementById('send');
const inputElement = window.document.getElementById('input')
const timerDisplayElement = window.document.getElementById('myTimer');

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
    const message = inputElement.value;
    window.electronAPI.sendCustomMessage(message);
};       

function runLogStream() {
    window.electronAPI.streamProducts(
        chunk => {
            information.innerHTML += `<br/>${JSON.stringify(chunk)}`;
        },
        () => console.log('Product stream finished.'),
        error => console.error('Product stream failed:', error)
    );
};


window.setTimeout(async () => {
    console.log(`window.electronAPI.getTime() being called: it's a ${typeof window.electronAPI.getTime} and window.electronAPI is a ${typeof window.electronAPI}`);
    console.log(`window.electronAPI.getTime() is ${window.electronAPI.getTime === undefined ? 'undefined' : 'defined'}`);

    const result = await window.electronAPI.getTime();
 
    console.log(`window.electronAPI.getTime() returned: ${result}`);
    info += `<br/>MyService - ${result || 'no time found'}`;
    information.innerHTML = info;


    streamProductsButton.addEventListener('click', 
        ()=> {
            window.electronAPI.streamProducts(
                product => {
                    console.log("Product:", product);
                    info += `<br/>${JSON.stringify(product)}`;
                },
                () => {
                    console.log("Stream complete")
                    information.innerHTML = info;
                },
                error => console.error("Stream failed:", error)
                );
        }
        )
    }
, 1000);

window.electronAPI.onMyTimer((time) => {
    timerDisplayElement.value = `Clock Time - ${time}`;
});

information.innerHTML = info;