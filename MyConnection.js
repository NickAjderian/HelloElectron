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

    const currentState = theConnection?.state?.name;

    // 1. Check if it's currently establishing a connection
    if (currentState === 'Connecting' || currentState?.startsWith('SentLogin')) {
        console.log('⚠️ Connection is busy establishing. Please queue this request.');
    }

    // 2. Check if it's ready to run a query
    if (currentState !== 'LoggedIn') {
        console.error(`❌ Cannot execute query. Connection is in state: ${currentState}. Opening a new connection`);
        theConnection = new Connection(connectionConfig);
    }

    // 3. Safe to proceed
    console.log('🚀 Connection is ready. Executing query...');
    // connection.execSql(new Request(...));


    return theConnection;
};
        

