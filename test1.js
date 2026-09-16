// import MyService from './MyService.js';
// console.log("Hello, World! time is " + MyService.GetTime());

// import config from './local.settings.js';

// console.log(`config.servername is ${config.servername}`);

// import ConnectionConfig from './MyConnection.js';

// console.log(`ConnectionConfig is ${JSON.stringify(ConnectionConfig)}`);

// dbService.GetProducts().then(products => {
//     console.log(`Products: ${JSON.stringify(products)}`);
// }).catch(error => {
//     console.error(`Error fetching products: ${error}`);
// }   
// );

// const win = {
//     webContents: {
//         send: (streamName, product) => {
//             console.log(`Received product on stream '${streamName}': ${JSON.stringify(product)}`);
//         }
//     }
// }

//dbService.GetProductsIPC(win, 'productStream');

// test.js
import assert from 'assert';
import myService from './MyService';

async function run() {
  try {
    // 1. Explicitly initialize and await the connection pool setup
    await myService.init();

    // 2. Safely call the service queries now that the database environment is live
    const products = await myService.GetProducts();
    console.log('Real DB Products:', products);
    assert.ok(Array.isArray(products));
    
    console.log('🎉 Integration tests complete.');
  } catch (error) {
    console.error('❌ Test runner caught an exception:', error.message);
    process.exit(1);
  } finally {
    // 3. Make sure to tear down connection resources so Node exits gracefully
    await myService.close();
  }
}

run();
