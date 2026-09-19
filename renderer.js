//import { setDefaultResultOrder } from "dns";

const information = document.getElementById('info');
const streamProductsButton = document.getElementById('streamProducts');
const streamOrganisationsButton = document.getElementById('streamOrganisations');
const sendButton = document.getElementById('send');
const inputElement = window.document.getElementById('input')
const timerDisplayElement = window.document.getElementById('myTimer');
const selectProduct = window.document.getElementById('productDropdown')
const ingredientInfo = window.document.getElementById('ingredientInfo');

const msdsInfo = window.document.getElementById('msdsInfo');
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
    info += `<br/>This app is version v1.0.7 using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`
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

function onStreamProductsClick(){
    selectProduct.innerHTML = '';
    window.electronAPI.streamData( 'products',[],
        product => {
            // console.log("Product:", product);
            // info += `<br/>${JSON.stringify(product)}`;
            const newOption = new Option(product.ProductCode, product.ProductID)
            selectProduct.add(newOption);
        },
        () => {
            console.log("Stream complete")
            information.innerHTML = info;
        },
        error => console.error("Stream failed:", error)       
        );
}

function onSelectProduct(){
    const ProductID = selectProduct.value;
    console.log(`you chose ${ProductID}`);
    msdsInfo.innerHTML = '';
    let ingredientInfoString = '';
    let msdsInfoString = '';
    window.electronAPI.streamData('ingredients',
            [{name: 'ProductID', value: ProductID}],
        //onChunk
        ingredient => {
            console.log("Ingredient:", ingredient);
            ingredientInfoString += `<br/><strong>${ingredient.ProductCode}</strong>  ${ingredient.ProductName}  ${ingredient.Percentage}%`;
        },
        //onFinished
        () => {
            ingredientInfo.innerHTML = ingredientInfoString;
            console.log("Stream complete")

                window.electronAPI.streamData(
                    'msds',                    
                    [{name: 'ProductID', value: ProductID}],
                    msds => {
                        console.log("MSDS:", msds);
                        for(const [fieldName, fieldValue] of Object.entries(msds)){
                            msdsInfoString += `<br/><strong>${fieldName}</strong>`
                                + `<br/>${fieldValue}`;
                        }
                    },
                    () => {
                        console.log("Stream complete")
                        msdsInfo.innerHTML = msdsInfoString;
                    },
                    error => console.error("Stream failed:", error)
                );                    
        },
        //onError
        error => console.error("Stream failed:", error)            
    );

}

window.setTimeout(async () => {
    console.log(`window.electronAPI.getTime() being called: it's a ${typeof window.electronAPI.getTime} and window.electronAPI is a ${typeof window.electronAPI}`);
    console.log(`window.electronAPI.getTime() is ${window.electronAPI.getTime === undefined ? 'undefined' : 'defined'}`);

    const result = await window.electronAPI.getTime();
 
    console.log(`window.electronAPI.getTime() returned: ${result}`);
    info += `<br/>MyService - ${result || 'no time found'}`;
    information.innerHTML = info;


    streamProductsButton.addEventListener('click', 
        ()=> {
            onStreamProductsClick();
        }
        );
        
    streamOrganisationsButton.addEventListener('click', 
        ()=> {
            window.electronAPI.streamData('organisations',[],
            organisation => {
                console.log("Organisation:", organisation);
                info += `<br/>${JSON.stringify(organisation)}`;
            },
            () => {
                console.log("Stream complete")
                information.innerHTML = info;
            },
            error => console.error("Stream failed:", error),
            
            );
        }
        );
    selectProduct.addEventListener('change',()=>{
        onSelectProduct();
    });
    onStreamProductsClick();
    }
, 1000);

window.electronAPI.onMyTimer((time) => {
    timerDisplayElement.value = `Clock Time - ${time}`;
});

information.innerHTML = info;