import * as express from 'express';
import * as path from 'path';
import {Server} from "ws";

const app=express();    //声明app，app用来声明服务器端所能提供的http服务。

export class Comment{
    constructor(public id:number,
                public productId:number,
                public timestamp:string,
                public user:string,
                public rating:number,
                public content:string){}
}

export class Product{
    constructor(
        public id:number,
        public title:string,
        public price:number,
        public rating:number,
        public desc:string,
        public categories:Array<string>
    ){

    }
}

const products: Product[]=[
    new Product(1,"第一个商品",1.99,3.5,"这是第一个商品，是我在学习慕课网创建的",["电子产品","硬件设备"]),
    new Product(2,"第二个商品",2.99,2.5,"这是第二个商品，是我在学习慕课网创建的",["图书"]),
    new Product(3,"第三个商品",3.99,4.5,"这是第三个商品，是我在学习慕课网创建的",["电子产品","硬件设备"]),
    new Product(4,"第四个商品",4.99,1.5,"这是第四个商品，是我在学习慕课网创建的",["电子产品","硬件设备"]),
    new Product(5,"第五个商品",5.99,4.5,"这是第五个商品，是我在学习慕课网创建的",["电子产品"]),
    new Product(6,"第六个商品",6.99,2.5,"这是第六个商品，是我在学习慕课网创建的",["图书"])
];

const comments:Comment[]=[
    new Comment(1,1,"2017-02-02 22:22:22","张三",3,"东西不错"),
    new Comment(2,1,"2017-03-03 23:22:22","李四",4,"东西不错"),
    new Comment(3,1,"2017-04-04 21:22:22","王五",5,"东西蛮不错"),
    new Comment(4,2,"2017-05-05 20:22:22","赵六",2,"东西不错"),

]

app.use('/',express.static(path.join(__dirname,'..','client')));

/*app.get('/',(req,res)=>{   //get方法用来处理一些get请求的服务。
    res.send("hellp express");  //表示服务器启动后，若根目录接收到了一个get请求，服务器便会返回此字段。
});*/

app.get('/api/products',(req,res)=>{
    let result=products;
    let params=req.query;
    if (params.title){
        result=result.filter((p)=>p.title.indexOf(params.title)!==-1);
    }
    if (params.price && result.length>0){
        result=result.filter((p)=>p.price<=parseInt(params.price));
    }
    if (params.category!=="-1" && result.length>0){
        result=result.filter((p)=>p.categories.indexOf(params.categories)!==-1);
    }
    res.json(products);
});

app.get('/api/product/:id',(req,res)=>{
    res.json(products.find((product)=>product.id==req.params.id));
});

app.get('/api/product/:id/comments',(req,res)=>{
    res.json(comments.filter((comment:Comment)=>comment.productId==req.params.id));
});

const server=app.listen(8000,"localhost",()=>{
    console.log("服务器已经启动，地址是：");
});   //启动服务器，监听8000端口，服务器域名是localhost，启动后打印一段话。

const subscriptions=new Map<any,number[]>();
//在机器的8085端口上创建一个WebSocket服务器，当有任何的客户端连接到服务器的时候，给客户端推送一个消息，消息是一个字符串
const wsServer=new Server({port:8085});
wsServer.on("connection",websocket=>{
    websocket.send("这个消息是服务器主动推送的");
    websocket.on("message",message=>{
        let messageObj=JSON.parse(message);
        let productIds=subscriptions.get(websocket) || [];
        subscriptions.set(websocket,[...productIds,messageObj.productId]);
    });
});

const currentBids=new Map<number,number>();

//当有客户端连接时定时推送
setInterval(()=>{
    products.forEach(p=>{
       let currentBid=currentBids.get(p.id) || p.price;
       let newBid=currentBid+Math.random()*5;
       currentBids.set(p.id,newBid);
    });

    subscriptions.forEach((productIds:number[],ws)=>{
        if(ws.readyState===1){
            let newBids=productIds.map(pid=>({
                productId:pid,
                bid:currentBids.get(pid)
            }));
            ws.send(JSON.stringify(newBids));
        }else {
            subscriptions.delete(ws);
        }
    });
},200)