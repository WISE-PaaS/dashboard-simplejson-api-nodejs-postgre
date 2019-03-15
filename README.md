API 開發範例 --- 使用 Node.js 與 PostgreSQL Database
=============
## 範例說明

WISE-PaaS 提供 API 開發平台，客戶可以依照所熟悉的語言進行開發，同時我們也提供不同語言的範例。

本範例主要提供一系列的步驟與程式碼，讓客戶可以依照步驟在 WISE-PaaS 平台開發 API ，
並且讓 WISE-PaaS/Dashboard 透過這個 API 取得 PostgreSQLDB 的資料並且顯示在 Dashbaord 中。

## 開發環境建立

#### 1. Node.js 安裝
- 請 [下載](https://nodejs.org/en/) 並安裝 v8.12.0 (以上) LTS 的版本

#### 2. Cloud Foundry CLI 安裝
- 請 [下載](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html) 並安裝 v6.3 (以上) 的版本

#### 3. PostgreSQLDB Client 安裝 (非必要)
- 推薦 [下載](https://www.heidisql.com/) HeidiSQL v9.5 版本

#### 4. JS 開發 IDE
- 推薦 Microsoft Visual Studio Code

## STEP 1. 建立 Node.js 初始目錄

請先使用 `npm init` 如下命令，初始化開發目錄。
並且所在目錄會建立一個檔案 Package.json

```json
{
  "name": "api-postgresql",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node .",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "michelle.tsai",
  "license": "ISC",
  "dependencies": {
    "body-parser": "^1.18.3",
    "express": "^4.16.3",
    "pg": "^7.5.0"
  },
  "description": "PostgreSQL exampel backend",
  "devDependencies": {}
}

```

## STEP 2. 安裝 API Server 模組 --- Express

Node.js 社群提供一個非常好用的 API server 模組 Express 方便開發者快速建立 RESTful API Server

請先使用 `npm install express --save` 如下命令，安裝並且更新設定到 Package.json 檔案。


## STEP 3. 安裝 PostgreSQLDB 存取模組 --- pg

請先使用 `npm install pg --save` 如下命令，安裝並且更新設定到 Package.json 檔案。


## STEP 4. 安裝 URL 解析模組 --- Body Parser

請先使用 `npm install body-parser --save` 如下命令，安裝並且更新設定到 Package.json 檔案。


## STEP 5. 建立 index.js 並且引入相關模組

```javascript
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
```

## STEP 6. 啟動 express server

```javascript
var app = express();
app.use(bodyParser.json());
```

## STEP 7. 依照 PostgreSQLDB 資料格式，建立 Data Schema

利用 HeidiSQL UI 可以看到 PostgreSQLDB 的表格定義如下
所以依照上述定義，建立 SQL 命令

```javascript
var sqlcmd = "SELECT area FROM ems.ec_usage_trend";
```

## STEP 8. 在 API 端加上 Cross Site AJAX Query 支援

```javascript
function setCORSHeaders (res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'accept, content-type');
}
```

## STEP 9. 建立 WISE-PaaS/Dashboard 必要 API Call

由於 WISE-PaaS/Dashboard 中使用 SimpleJSON plugin 時，它會要求 API 提供幾個必要的 API

- / : 需要回傳 200 ok
- /search : 需要回傳 metric 選項
- /query : 需要回傳 metric 的數值

可以參考 [Plugin 詳細說明](https://grafana.com/plugins/grafana-simple-json-datasource/installation)
因此我們建立三個 API 框架如下:

```javascript
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
        else {  //set up data
            var maxSize = 1000;
            var from = '2018-09-20T00:00:00Z';
            var to = '2018-09-21T00:00:00Z';
            if(req && req.body && req.body.range){
                //console.log(req.body);
                maxSize = req.body.maxDataPoints;
                from = req.body.range.from;
                to = req.body.range.to;
            }
            //var resultT = Date.now();
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
```

## STEP 10. 定義 API 的 port

在本機(local)端測試時為3344(為使用者自定義)
上傳至wise-paas時需要由server端安排port
所以要使用環境的```env.port ```

```javascript
let port = process.env.port || 3344;
app.listen(port);//tell server to listen port
console.log('Server is listening to port '+ port);
```

## STEP 11. 取得 PostgreSQLDB 資料，並且回傳 JSON 內容

依據 SimpleJSON 所要求的格式範例

```json
[
{
"target":"upper_75", // The field being queried for
"datapoints":[
[622,1450754160000],  // Metric value as a float , unixtimestamp in milliseconds
[365,1450754220000]
]
},
{
"target":"upper_90",
"datapoints":[
[861,1450754160000],
[767,1450754220000]
]
}
]
```

回傳內容

```javascript
app.all('/query',function(req,res){
setCORSHeaders(res);
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
//var resultT = Date.now();
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
```

## STEP 12. 完整 index.js 程式碼

```javascript
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
            //var resultT = Date.now();
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
let port = process.env.port || 3344;
app.listen(port);//tell server to listen port
console.log('Server is listening to port '+ port);
```

## STEP 13. 定義 WISE-PaaS 所需要的 App 定義檔

WISE-PaaS 是一個讓使用者在這雲端平台上開發自己的 App ，但是每個 App 需要有一個定義檔，讓 WISE-PaaS 知道如何分配系統資源 (例如: 記憶體大小，App 名稱，網址名稱等) 給這個 App

所以每個 App 需要創建一個檔案 `manifest.yml` 檔案，內容如下，其中 host 名稱
`api-postgresqldb-example-1-0-0-xxx` 需要為 WISE-PaaS 網域裡的唯一名稱，建議可以使用公司名稱，作為唯一區別。

```yml
---
applications:
- name: api-developer-guide-nodejs-postgresql-1.0.0
  memory: 64M
  instances: 1
  health-check-type: process
  version: 1.0.0
  host: api-postgresql-1-0-0
  buildpack: nodejs_buildpack_1620
```

## STEP 14. 登入 WISE-PaaS

要部署 App 到 WISE-PaaS 需要先登入，可使用先前下載的 CF Command 工具，再命令模式下達登入指令，格式如下
```
cf login –skip-ssl-validation -a api.wise-paas.com -u [user] - p [pwd] [org] -s [space]
```
例如:
```
cf login --skip-ssl-validation -a api.wise-paas.com -u a9625@aaa.com.tw -p 123456 -o ems -s default_space
```
登入結果如下圖:


## STEP 15. 佈署 App 到  WISE-PaaS

登入後執行指令:
```
cf push
```

## STEP 16. 使用 WISE-PaaS/Dashboard 觀察

1. 開啟 Dashbaord
2. 建立 SimpleJSON datasource
3. 連線到 API
4. 顯示資料
