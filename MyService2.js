// MyService.js
import sql from 'mssql';

class MyService {
  constructor() {
    this.pool = null; // Holds the active connection pool reference
    this.poolConfig = {
        "server": "localhost",
        "database": "Chilli_PEx",
        "authentication": {
          "type": "default",
          "options": {
            "userName0": "sa", //process.env.DB_USER || "sa",
            "password0": "Password123!", // || "YOUR_SQL_PASSWORD"
            "userName": "ChilliBarcodeUK", //process.env.DB_USER || "sa",
            "password": "StrawberryFieldsForever123!" // || "YOUR_SQL_PASSWORD"
          }
        },
        "options": {
            "encrypt": false,
            "trustServerCertificate": true
        }
        };
  }

  /**
   * Safe asynchronous initialization method.
   * Resolves once the connection pool to SQL Server is fully established.
   */
  async init() {
    // Prevent re-initialization if a pool is already running
    if (this.pool) return this; 

    try {
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

  /**
   * Guarded method to fetch products from the real database.
   */
  async GetProducts() {
    // Safety Guard: Fail early if the user called this method before init()
    if (!this.pool) {
      throw new Error(
        'Database connection not initialized! You must run and await MyService.init() before calling GetProducts().'
      );
    }

    try {
      // Execute the query safely using the active connection pool
      const result = await this.pool.request().query('SELECT top 5 productname FROM tblProduct');
      return result.recordset.map(row => row.productname);
    } catch (error) {
      console.error('Database query error in GetProducts:', error.message);
      throw error;
    }
  }

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
}

// Export a single managed instance
export default new MyService();
