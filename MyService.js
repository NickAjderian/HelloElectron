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
    async GetTime(){
        return new Date().toLocaleTimeString();
    }

    async GetProductsIPC(win, streamName) {
        const connection = MyConnection();

        const query = `select top 10 ProductID, ProductCode, ProductName from Chilli_PEx.dbo.tblProduct where IsInternal=1 order by ProductID desc`;

        const products = [];
        let settled = false;

        const finish = (error, result) => {
            if (settled) {
                return;
            }

            settled = true;
            connection.close();

            if (error) {
                //reject(error);
            } else {
                //resolve(result);
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
                win.webContents.send(streamName, product);
            });

            connection.execSql(request);
        });

        connection.connect();

    }

    async GetProducts(){

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