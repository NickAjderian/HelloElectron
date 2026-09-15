import { readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, Request } from 'tedious';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsPath = path.join(__dirname, 'local.settings.json');
const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));

const authentication = settings.authentication ?? {};

const connectionConfig1 = {
    server: settings.server,
    authentication: {
        type: authentication.type ?? 'ntlm',
        options: {
            domain: authentication.domain || os.hostname(),
            userName: authentication.userName,
            password: authentication.password
        }
    },
    options: {
        database: settings.database,
        encrypt: settings.options?.encrypt ?? false,
        trustServerCertificate: settings.options?.trustServerCertificate ?? true
    }
};

const connectionConfig2 = {
    server: 'localhost',
    authentication: {
        type: 'default',
        options: {
            //domain: os.hostname(),
            "userName": "ChilliBarcodeUK",
            "password": "StrawberryFieldsForever123!"
        }
    },
    options: {
        port: 1433,
        database: "Plant_Ex",
        //appName: 'HelloElectron',
        //encrypt: settings.options?.encrypt ?? false,
        trustServerCertificate: true
    }
};

const connectionConfig = {
  "server": "localhost",
  "database": "Chilli_PEx",
  "authentication": {
    "type": "default",
    "options": {
      "userName": "ChilliBarcodeUK",
      "password": "StrawberryFieldsForever123!"
    }
  },
  "options": {
    "encrypt": false,
    "trustServerCertificate": true
  }
};

var theConnection = new Connection(connectionConfig);

export default function getConnection() {
    if (!theConnection) theConnection = new Connection(connectionConfig);
    if (theConnection.state.name === 'Initialized')
        return theConnection;
    switch (theConnection.state) {
        case 'connecting':
            console.log('Connection is currently connecting...');
            return theConnection;
            break;
        case 'connected':
            console.log('Connection is already established.');
            return theConnection;
            break;
        case 'disconnected':
            console.log('Connection is disconnected. Attempting to reconnect...');
            theConnection.connect();
            return theConnection;
            break;
        case 'disconnecting':
            console.log('Connection is currently disconnecting...');
            theConnection = new Connection(connectionConfig);
            return theConnection;
            break;
        case 'fatal':
            console.log('Connection is in a fatal state. Attempting to reconnect...');
            //close the existing connection and create a new one
            theConnection.close();
            theConnection = new Connection(connectionConfig);
            return theConnection;
            break;
        default:
            console.log(`Connection is in an unknown state: ${theConnection.state}. Attempting to reconnect...`);
            //close the existing connection and create a new one
            theConnection.close();
            theConnection = new Connection(connectionConfig);
            return theConnection;
            break;  
    }
};
        

