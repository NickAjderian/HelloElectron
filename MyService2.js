// MyService.js
const { Connection, Request, TYPES } = require('tedious');

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

class MyService {
  constructor() {
    this.connection = null;
    this.config = connectionConfig;
    this.queryQueue = [];
    this.isProcessingQueue = false;
  }

  // Expose Tedious Types so you can use them easily when building queries
  get TYPES() {
    return TYPES;
  }

  /**
   * Initializes the singleton with database configurations.
   */
  init(config) {
    if (this.connection) return;
    this.config = config;
    this.connect();
  }

    async getTime(){
        return new Date().toLocaleTimeString();
    }

    async streamProducts(chunk, finished, error){
        return this.executeSql(`select top 5 ProductID, ProductCode from Chilli_PEx.dbo.tblProduct where IsInternal=1 order by ProductID desc`, [], chunk, finished, error )
    }
    async streamOrganisations(chunk, finished, error){
        return this.streamData('select top 5 organisationid, organisation from tblOrganisation', [], chunk,finished,error);
    }


  /**
   * Internal method to establish the Tedious connection
   */
  connect() {
    console.log('🔌 Initialising Tedious database connection...');
    this.connection = new Connection(this.config);

    this.connection.on('connect', (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        setTimeout(() => this.connect(), 5000);
      } else {
        console.log('✅ Database connection established successfully.');
        this.processQueue();
      }
    });

    this.connection.on('end', () => {
      console.log('🔌 Connection closed. Reconnecting...');
      this.connection = null;
      this.connect();
    });
  }

  /**
   * Executes an arbitrary SQL statement safely with parameters.
   * @param {string} sqlText - The SQL statement with parameters (e.g., @userId).
   * @param {Array<object>} [params=[]] - Optional array of parameter objects [{ name, type, value }]
   * @returns {Promise<Array<object>>} Resolves with rows as objects.
   */
  executeSql(sqlText, params = []) {
    return new Promise((resolve, reject) => {
      // Add parameters to the queued execution task
      this.queryQueue.push({ sqlText, params, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Internal queue processor managing sequential execution and connecting states
   */
  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queryQueue.length > 0) {
      const stateName = this.connection?.state?.name;

      // Tedious v20+ check
      if (stateName !== 'LoggedIn') {
        console.log(`⏳ Connection state is '${stateName}'. Waiting to drain queue...`);
        break;
      }

      const { sqlText, params, resolve, reject } = this.queryQueue.shift();

      try {
        const rows = await this._runQueryOnSocket(sqlText, params);
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Low-level method wrapping Tedious event lifecycle in a promise
   */
  _runQueryOnSocket(sqlText, params, chunk, finished, error) {
    return new Promise((resolve, reject) => {
      const request = new Request(sqlText, (err) => {
        if (err) {
            error(err);
            return reject(err);
        }
      });

      // Inject the parameters safely into the request object
      params.forEach(param => {
        request.addParameter(param.name, param.type, param.value);
      });

      const resultRows = [];

      request.on('row', (columns) => {
        const rowData = {};
        columns.forEach((column) => {
          rowData[column.metadata.colName] = column.value;
        });
        chunk(rowData);
        resultRows.push(rowData);
      });

      request.on('requestCompleted', () => {
        finished(resultRows);
        resolve(resultRows);
      });

      this.connection.execSql(request);
    });
  }
}

module.exports = new MyService();
