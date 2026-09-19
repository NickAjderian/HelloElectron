// MyService.js
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { log } from './logger.js';

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
    log('INFO', `Loading database settings from ${settingsPath}`);
    var dbConfig = JSON.parse(readFileSync(settingsPath, 'utf8'));    
    return dbConfig;
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
      log('INFO', `Connecting to SQL Server instance at ${this.poolConfig.server}/${this.poolConfig.database}`);
      
      // Instantiate and connect the global database connection pool
      this.pool = await sql.connect(this.poolConfig);
      
      log('INFO', 'SQL Server database connection established and ready.');
      return this;
    } catch (error) {
      log('ERROR', 'SQL Server connection failed.', error);
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

  async executeScalar(sqlText, params = [], chunk, finish, error) {

    if(sqlText=='APP_VERSION'){
      return 'some version';
    }

    const rows = await this.executeSql(sqlText, params, chunk, finish, error);
    const firstRow = rows[0];

    if (!firstRow) {
      if(chunk) chunk('undefined');
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
        log('ERROR', `Database query failed: ${sqlText}`, queryError);
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

}

export default new MyService();
