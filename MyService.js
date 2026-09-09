class MyService{
    constructor(){
        if(MyService.instance){
            return MyService.instance;
        }
        MyService.instance = this;
        return this;
    }
    GetTime(){
        return new Date().toLocaleTimeString();
    }
}
module.exports = new MyService();