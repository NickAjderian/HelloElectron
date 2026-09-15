import { Connection, Request } from 'tedious';
import MyConnection from './MyConnection.js';



class MyService{
    constructor(){
        if(MyService.instance){
            return MyService.instance;
        }
        MyService.instance = this;
        return this;
    }

        // Instance async generator method
    async *dataStreamGenerator() {
        const steps = ['Initialising', 'Processing', 'Cleaning up', 'Done!'];
        for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        yield `${this.prefix} -> ${step}`; // Accessing instance state
        }
    }

    async getTime(){
        return new Date().toLocaleTimeString();
    }

    async streamProducts(chunk, finished, error){
        return this.streamData(chunk, finished, error, `select top 5 ProductID, ProductCode from Chilli_PEx.dbo.tblProduct where IsInternal=1 order by ProductID desc`)
    }
    async streamOrganisations(chunk, finished, error){
        return this.streamData(chunk,finished,error,'select top 5 organisationid, organisation from tblOrganisation');
    }

    async streamData(chunk, finished, error, query){

        // for(var i = 1; i<5; ++i){
        //     chunk({name: 'product', id: i});
        //     await new Promise(resolve => setTimeout(resolve, 500));
        // }
        // await new Promise(resolve => setTimeout(resolve, 500));
        // finished('complete');

        //return;

        const connection = MyConnection();

        let settled = false;

        const finish = (error, result) => {
            if (settled) {
                finished('complete');
            }else{
                error(error);
            }

            settled = true;
            connection.close();

            if (error) {
                finshed('complete');
                reject(error);
            } else {
                finished('complete');
                resolve(result);
            }
        };

        connection.on('connect', (error) => {
            if (error) {
                finished(error);
                return;
            }

        const request = new Request(query, (requestError) => {
            finished(requestError);
        });

        request.on('row', (columns) => {
            const product = {};
            columns.forEach((column) => {
                product[column.metadata.colName] = column.value;
            });
            chunk(product);
        });

        request.on('doneInProc', () =>{
            finished('complete');
        })

        connection.execSql(request);
        });

        connection.connect();
        
    }

    async getProducts(){

        const connection = MyConnection();

        const query = `select top 10 ProductID, ProductCode, ProductName from Chilli_PEx.dbo.tblProduct where IsInternal=1 order by ProductID desc`;

        return new Promise((resolve, reject) => {
            const products = [];
            let settled = false;

            const finish = (error, result) => {
                if (settled) {
                    return;
                }

                settled = true;
                connection.close();

                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            };

            connection.on('connect', (error) => {
                if (error) {
                    finish(error);
                    return;
                }

                const request = new Request(query, (requestError) => {
                    finish(requestError, products);
                });

                request.on('row', (columns) => {
                    const product = {};
                    columns.forEach((column) => {
                        product[column.metadata.colName] = column.value;
                    });
                    products.push(product);
                });

                connection.execSql(request);
            });

            connection.connect();
        });
    }
}
export default new MyService();