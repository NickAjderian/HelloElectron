const MyService = require('./myservice.js');
var srv = new MyService.constructor();
console.log("Hello, World! time is " + srv.GetTime());
