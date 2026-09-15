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

    async streamProducts(event){

        event.sender.send('products-received', 'a product');
        event.sender.send('products-received', 'a product');
        event.sender.send('products-received', 'a product');
        event.sender.send('products-received', 'a product');
        event.sender.send('products-received', 'a product');
        event.sender.send('products-complete');

        return;

        const connection = MyConnection();

        const query = `select top 50 ProductID, ProductCode, ProductName from Chilli_PEx.dbo.tblProduct where IsInternal=1 order by ProductID desc`;

        let settled = false;

        const finish = (error, result) => {
            if (settled) {
                event.sender.send('products-complete');
                return;
            }

            settled = true;
            connection.close();

            if (error) {
                event.sender.send('products-complete');
                reject(error);
            } else {
                event.sender.send('products-complete');
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
            event.sender.send('products-received', product);
        });

        request.on('doneInProc', () =>{
            event.sender.send('products-complete');
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