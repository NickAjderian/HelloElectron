// MyService.js
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadConnectionConfig() {
  const settingsPath = process.env.LOCAL_SETTINGS_PATH || [
    path.join(process.cwd(), 'local.settings.json'),
    path.join(moduleDirectory, 'local.settings.json'),
    process.resourcesPath && path.join(process.resourcesPath, 'local.settings.json'),
    !process.defaultApp && path.join(path.dirname(process.execPath), 'local.settings.json')
  ].find(candidate => candidate && existsSync(candidate));

  if (!settingsPath) {
    throw new Error(
      'Cannot find local.settings.json. Set LOCAL_SETTINGS_PATH or place it next to the application resources.'
    );
  }

  try {
    return JSON.parse(readFileSync(settingsPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot load ${settingsPath}: ${error.message}`);
  }
}

class MyService {
  constructor() {
    this.pool = null; // Holds the active connection pool reference
    this.poolConfig = null;

  }

  /**
   * Safe asynchronous initialization method.
   * Resolves once the connection pool to SQL Server is fully established.
   */
  async init() {
    // Prevent re-initialization if a pool is already running
    if (this.pool) return this; 

    try {
      this.poolConfig = loadConnectionConfig();
      console.log('⏳ Connecting to SQL Server instance...');
      
      // Instantiate and connect the global database connection pool
      this.pool = await sql.connect(this.poolConfig);
      
      console.log('✅ SQL Server database connection established and ready.');
      return this;
    } catch (error) {
      console.error('❌ SQL Server connection failed:', error.message);
      this.pool = null;
      throw error;
    }
  }

  getTime(){}

  /**
   * Guarded method to fetch products from the real database.
   */
//   async GetProducts() {
//     // Safety Guard: Fail early if the user called this method before init()
//     if (!this.pool) {
//       throw new Error(
//         'Database connection not initialized! You must run and await MyService.init() before calling GetProducts().'
//       );
//     }

//     try {
//       // Execute the query safely using the active connection pool
//       const result = await this.pool.request().query('SELECT top 10 productname FROM tblProduct');
//       return result.recordset.map(row => row.name);
//     } catch (error) {
//       console.error('Database query error in GetProducts:', error.message);
//       throw error;
//     }
//   }

  /**
   * Helper to clean up connections after your test runner completes
   */
  async close() {
    if (this.pool) {
      await sql.close();
      this.pool = null;
      console.log('🔌 SQL Server pool connections closed cleanly.');
    }
  }

//   async streamProducts(chunk, finish, error) {
//     return this.executeSql(
//       'SELECT TOP 10 ProductID, ProductCode, ProductName FROM tblProduct WHERE IsInternal = 1 ORDER BY ProductID DESC',
//       [],
//       chunk,
//       finish,
//       error
//     );
//   }

  async executeScalar(sqlText, params = []) {
    const rows = await this.executeSql(sqlText, params);
    const firstRow = rows[0];

    if (!firstRow) {
      return undefined;
    }

    return Object.values(firstRow)[0];
  }

  /**
   * Executes an arbitrary SQL statement safely with parameters.
   * @param {string} sqlText - The SQL statement with parameters (e.g., @userId).
   * @param {Array<object>} [params=[]] - Optional array of parameter objects [{ name, type, value }]
   * @returns {Promise<Array<object>>} Resolves with rows as objects.
   * @chunk is a callback that returns one row
   * @finish is a callback to indicate that the sql has finished
   * @error is a callback carrying an error object
   * @resolve is a callback that returns all rows
   * @reject is a callback that returns a suitable error message
   */
  executeSql(sqlText, params = [], chunk, finish, error) {
    if (!this.pool) {
      return Promise.reject(
        new Error('Database connection not initialized! You must run and await MyService.init() first.')
      );
    }

    return (async () => {
      try {
        // Each request leases its own connection from the pool. Concurrent calls
        // are isolated; excess calls wait until a pooled connection is returned.
        const request = this.pool.request();
        request.stream = Boolean(chunk);

        if (chunk) {
          request.on('row', chunk);
        }

        for (const param of params) {
          if (param.type === undefined) {
            request.input(param.name, param.value);
          } else {
            request.input(param.name, param.type, param.value);
          }
        }

        const result = await request.query(sqlText);
        const rows = result.recordset ?? [];

        if (finish) {
          finish(result);
        }

        return rows;
      } catch (queryError) {
        if (error) {
          error(queryError);
        }
        throw queryError;
      }
    })();
  }

//   // Expose Tedious Types so you can use them easily when building queries
//   get TYPES() {
//     return TYPES;
//   }

//   /**
//    * Initializes the singleton with database configurations.
//    */
//   init(config) {
//     if (this.connection) return;
//     this.config = config;
//     this.connect();
//   }

//     async getTime(){
//         return new Date().toLocaleTimeString();
//     }

//     async streamProducts(chunk, finished, error){
//         return this.executeSql(`select top 5 ProductID, ProductCode from Chilli_PEx.dbo.tblProduct where IsInternal=1 order by ProductID desc`, [], chunk, finished, error )
//     }
//     async streamOrganisations(chunk, finished, error){
//         return this.streamData('select top 5 organisationid, organisation from tblOrganisation', [], chunk,finished,error);
//     }

// initSync() {
//     if (this.isInitialized) {
//       return this; // Already initialized
//     }

//     console.log('Connecting to service resources synchronously...');
    
//     // Simulate establishing a synchronous connection (e.g., SQLite, local file, mock)
//     this.connection = connectionConfig;

//     this.isInitialized = true;
//     return this; 
//   }



//   /**
//    * Internal method to establish the Tedious connection
//    */
//   connect() {
//     console.log('🔌 Initialising Tedious database connection...');
//     this.connection = new Connection(this.config);

//     this.connection.on('connect', (err) => {
//       if (err) {
//         console.error('❌ Database connection failed:', err.message);
//         setTimeout(() => this.connect(), 5000);
//       } else {
//         console.log('✅ Database connection established successfully.');
//         this.processQueue();
//       }
//     });

//     this.connection.on('end', () => {
//       console.log('🔌 Connection closed. Reconnecting...');
//       this.connection = null;
//       this.connect();
//     });
//   }

//   /**
//    * Executes an arbitrary SQL statement safely with parameters.
//    * @param {string} sqlText - The SQL statement with parameters (e.g., @userId).
//    * @param {Array<object>} [params=[]] - Optional array of parameter objects [{ name, type, value }]
//    * @returns {Promise<Array<object>>} Resolves with rows as objects.
//    */
//   executeSql(sqlText, params = [], chunk, finish, error) {
//     return new Promise((resolve, reject) => {
//       // Add parameters to the queued execution task
//       this.queryQueue.push({ sqlText, params, resolve, reject, chunk, finish, error });
//       this.processQueue();
//     });
//   }

//   /**
//    * Internal queue processor managing sequential execution and connecting states
//    */
//   async processQueue() {
//     if (this.isProcessingQueue) return;
//     this.isProcessingQueue = true;

//     if (!this?.connection?.state)
//       this.init();

//     while (this.queryQueue.length > 0) {
//       const stateName = this.connection?.state?.name;

//       // Tedious v20+ check
//       if (stateName !== 'LoggedIn') {
//         console.log(`⏳ Connection state is '${stateName}'. Waiting to drain queue...`);
//         break;
//       }

//       const { sqlText, params, resolve, reject , chunk, finish, error} = this.queryQueue.shift();

//       try {
//         const rows = await this._runQueryOnSocket(sqlText, params, chunk, finish, error);
//         resolve(rows);
//       } catch (error) {
//         reject(error);
//       }
//     }

//     this.isProcessingQueue = false;
//   }

//   /**
//    * Low-level method wrapping Tedious event lifecycle in a promise
//    */
//   _runQueryOnSocket(sqlText, params, chunk, finished, error) {
//     return new Promise((resolve, reject) => {
//       const request = new Request(sqlText, (err) => {
//         if (err) {
//             error(err);
//             return reject(err);
//         }
//       });

//       // Inject the parameters safely into the request object
//       params.forEach(param => {
//         request.addParameter(param.name, param.type, param.value);
//       });

//       const resultRows = [];

//       request.on('row', (columns) => {
//         const rowData = {};
//         columns.forEach((column) => {
//           rowData[column.metadata.colName] = column.value;
//         });
//         chunk(rowData);
//         resultRows.push(rowData);
//       });

//       request.on('requestCompleted', () => {
//         finished(resultRows);
//         resolve(resultRows);
//       });

//       this.connection.execSql(request);
//     });
//   }
}

export default new MyService();
