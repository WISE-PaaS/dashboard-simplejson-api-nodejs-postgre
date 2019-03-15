const express = require('express');
const pg = require('pg'); // PostgreSQL client for node.js(require npm install pg command)
const bodyParser = require('body-parser');
var app = express(); //built Express server(require npm install express --save command)
app.use(bodyParser.json());

function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'accept, content-type ,authorization');
}

app.all('/',function(req,res){
    setCORSHeaders(res);
    res.send('Example for PostgreSQL database with Node.js');
    res.end();
});

app.all('/search',function(req,res){
    setCORSHeaders(res);
    var target = ['example-01','example-02'];
    res.json(target);
    res.end();
});

app.all('/annotations',function(req,res){
    setCORSHeaders(res);
    var annotations = [];
    res.json(annotations);
    res.end();
});

app.all('/query',function(req,res){
    setCORSHeaders(res);
    var config = { //host user database port information
        host: 'host',
        user: 'user',
        password: 'password',
        database: 'database',
        port: port,
        ssl: true
    };
    const client = new pg.Client(config);
    var sqlcmd = "SELECT area FROM ems.ec_usage_trend";
    client.connect(err => {
        var targetData = [];
        var dataList = [];
        var targetDataList = [];
        if (err) throw err;
        else {
            var maxSize = 1000;
            var from = '2018-09-20T00:00:00Z';
            var to = '2018-09-21T00:00:00Z';
            if(req && req.body && req.body.range){
                //console.log(req.body);
                maxSize = req.body.maxDataPoints;
                from = req.body.range.from;
                to = req.body.range.to;
            }
            client.query(sqlcmd).then(res => {
                for(let i=0; i<30; i++){
                    var pointData = [];
                    pointData.push(res.rows[i]["area"]);
                    var time = new Date(from);
                    time.setMinutes(time.getMinutes()+i);
                    pointData.push(time.getTime());
                    dataList.push(pointData);
                    //console.log("pointData:", pointData);
                }
                targetData = {
                    "target": "example-01",
                    "datapoints": dataList
                };
                targetDataList.push(targetData);
                sendjson();
            }).catch(err => {
                console.log(err);
            });
            function sendjson() {
                res.json(targetDataList);
                //console.log('targetDataList:', targetDataList);
                res.end();
            }
        }
    });
});
let port = process.env.PORT || 3344;
app.listen(port);//tell server to listen port
console.log('Server is listening to port '+ port);
