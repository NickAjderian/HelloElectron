// test.js
import assert from 'assert';
import MyService from './MyService.js';

async function run() {
  try {
    // 1. Explicitly initialize and await the connection pool setup
    await MyService.init();

    // 2. Verify concurrent queries use separate pool-managed requests
    const [firstQuery, secondQuery] = await Promise.all([
      MyService.executeSql('SELECT 1 AS value'),
      MyService.executeSql('SELECT 2 AS value')
    ]);
    assert.deepStrictEqual(firstQuery, [{ value: 1 }]);
    assert.deepStrictEqual(secondQuery, [{ value: 2 }]);
    console.log('Concurrent pool queries completed independently.');

    // 3. Safely call the service queries now that the database environment is live
    const products = await MyService.GetProducts();
    console.log('Real DB Products:', products);
    assert.ok(Array.isArray(products));

    console.log(JSON.stringify(products));

    // 4. check execSQL: 

    let sql = "select top 5 OrganisationID, Organisation from tblOrganisation";
    let params = [];

    try {
      const rows = await MyService.executeSql(
        sql,
        params,
        row => console.log('chunk:', row),
        result => console.log('finish:', JSON.stringify(result)),
        error => console.error('error callback:', error.message)
      );

      // This is the Promise resolve value returned by executeSql().
      console.log('resolved rows:', JSON.stringify(rows));
    } catch (error) {
      // This is the Promise reject value from executeSql().
      console.error('rejected:', error.message);
      throw error;
    }
    
    try{
      const rows = await MyService.executeSql("SELECT * FROM table_that_does_not_exist");
      console.log('resolved rows', JSON.stringify(rows))
    } catch(error){
      console.error('rejected', error.message);

    }

    // check non-streaming mode (chunk not defined)

    params = [];

    try {
      const rows = await MyService.executeSql(
        sql,
        params
      );

      // This is the Promise resolve value returned by executeSql().
      console.log('resolved ALL rows:', JSON.stringify(rows));
    } catch (error) {
      // This is the Promise reject value from executeSql().
      console.error('rejected:', error.message);
      throw error;
    }

    // check with a parameter
    
    sql = `
      SELECT top 10 OrganisationID, Organisation
      FROM tblOrganisation
      WHERE OrganisationID > @organisationId
      ORDER BY OrganisationID
    `;
    const organisationsParams = [
      { name: 'organisationId', value: 700 }
    ];

    try{
      const rows = await MyService.executeSql(
        sql,
        organisationsParams,
        organisation => console.log('organisation:', organisation)
      );

    }catch(error){
      console.error(error);
    }

    sql = `
      SELECT count (*)
      FROM tblOrganisation
      WHERE OrganisationID > @organisationId
    `;

    try{
      const rows = await MyService.executeSql(
        sql,
        [{ name: 'organisationId', value: 700 }],
        organisation => console.log('organisation:', organisation)
      );

    }catch(error){
      console.error(error);
    }

    try{
      const val = await MyService.executeScalar(
        sql,
        [{ name: 'organisationId', value: 700 }]
      );
      console.log(`number of organisations: ${val}`)

    }catch(error){
      console.error(error);
    }



    console.log('🎉 Integration tests complete.');
  } catch (error) {
    console.error('❌ Test runner caught an exception:', error.message);
    process.exit(1);
  } finally {
    // 4. Make sure to tear down connection resources so Node exits gracefully
    await MyService.close();
  }
}

run();
