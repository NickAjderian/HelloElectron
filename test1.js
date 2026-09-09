// import MyService from './MyService.js';
// console.log("Hello, World! time is " + MyService.GetTime());

// import config from './local.settings.js';

// console.log(`config.servername is ${config.servername}`);

import ConnectionConfig from './MyConnection.js';

console.log(`ConnectionConfig is ${JSON.stringify(ConnectionConfig)}`);

import MyService from './MyService.js';

MyService.GetProducts().then(products => {
    console.log(`Products: ${JSON.stringify(products)}`);
}).catch(error => {
    console.error(`Error fetching products: ${error}`);
}   
);

