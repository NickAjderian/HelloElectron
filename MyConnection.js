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

const connection = new Connection(connectionConfig);

export default connection;
