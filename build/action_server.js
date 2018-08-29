"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var path = require("path");
var ws_1 = require("ws");
var app = express(); //声明app，app用来声明服务器端所能提供的http服务。
var Comment = (function () {
    function Comment(id, productId, timestamp, user, rating, content) {
        this.id = id;
        this.productId = productId;
        this.timestamp = timestamp;
        this.user = user;
        this.rating = rating;
        this.content = content;
    }
    return Comment;
}());
exports.Comment = Comment;
var Product = (function () {
    function Product(id, title, price, rating, desc, categories) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.rating = rating;
        this.desc = desc;
        this.categories = categories;
    }
    return Product;
}());
exports.Product = Product;
var products = [
    new Product(1, "第一个商品", 1.99, 3.5, "这是第一个商品，是我在学习慕课网创建的", ["电子产品", "硬件设备"]),
    new Product(2, "第二个商品", 2.99, 2.5, "这是第二个商品，是我在学习慕课网创建的", ["图书"]),
    new Product(3, "第三个商品", 3.99, 4.5, "这是第三个商品，是我在学习慕课网创建的", ["电子产品", "硬件设备"]),
    new Product(4, "第四个商品", 4.99, 1.5, "这是第四个商品，是我在学习慕课网创建的", ["电子产品", "硬件设备"]),
    new Product(5, "第五个商品", 5.99, 4.5, "这是第五个商品，是我在学习慕课网创建的", ["电子产品"]),
    new Product(6, "第六个商品", 6.99, 2.5, "这是第六个商品，是我在学习慕课网创建的", ["图书"])
];
var comments = [
    new Comment(1, 1, "2017-02-02 22:22:22", "张三", 3, "东西不错"),
    new Comment(2, 1, "2017-03-03 23:22:22", "李四", 4, "东西不错"),
    new Comment(3, 1, "2017-04-04 21:22:22", "王五", 5, "东西蛮不错"),
    new Comment(4, 2, "2017-05-05 20:22:22", "赵六", 2, "东西不错"),
];
app.use('/', express.static(path.join(__dirname, '..', 'client')));
/*app.get('/',(req,res)=>{   //get方法用来处理一些get请求的服务。
    res.send("hellp express");  //表示服务器启动后，若根目录接收到了一个get请求，服务器便会返回此字段。
});*/
app.get('/api/products', function (req, res) {
    var result = products;
    var params = req.query;
    if (params.title) {
        result = result.filter(function (p) { return p.title.indexOf(params.title) !== -1; });
    }
    if (params.price && result.length > 0) {
        result = result.filter(function (p) { return p.price <= parseInt(params.price); });
    }
    if (params.category !== "-1" && result.length > 0) {
        result = result.filter(function (p) { return p.categories.indexOf(params.categories) !== -1; });
    }
    res.json(products);
});
app.get('/api/product/:id', function (req, res) {
    res.json(products.find(function (product) { return product.id == req.params.id; }));
});
app.get('/api/product/:id/comments', function (req, res) {
    res.json(comments.filter(function (comment) { return comment.productId == req.params.id; }));
});
var server = app.listen(8000, "localhost", function () {
    console.log("服务器已经启动，地址是：");
}); //启动服务器，监听8000端口，服务器域名是localhost，启动后打印一段话。
var subscriptions = new Map();
//在机器的8085端口上创建一个WebSocket服务器，当有任何的客户端连接到服务器的时候，给客户端推送一个消息，消息是一个字符串
var wsServer = new ws_1.Server({ port: 8085 });
wsServer.on("connection", function (websocket) {
    websocket.send("这个消息是服务器主动推送的");
    websocket.on("message", function (message) {
        var messageObj = JSON.parse(message);
        var productIds = subscriptions.get(websocket) || [];
        subscriptions.set(websocket, productIds.concat([messageObj.productId]));
    });
});
var currentBids = new Map();
//当有客户端连接时定时推送
setInterval(function () {
    products.forEach(function (p) {
        var currentBid = currentBids.get(p.id) || p.price;
        var newBid = currentBid + Math.random() * 5;
        currentBids.set(p.id, newBid);
    });
    subscriptions.forEach(function (productIds, ws) {
        if (ws.readyState === 1) {
            var newBids = productIds.map(function (pid) { return ({
                productId: pid,
                bid: currentBids.get(pid)
            }); });
            ws.send(JSON.stringify(newBids));
        }
        else {
            subscriptions.delete(ws);
        }
    });
}, 200);
