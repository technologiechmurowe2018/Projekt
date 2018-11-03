var express = require('express')
var app = express()
 
var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync(__dirname +'/cert/server.key', 'utf8');
var certificate = fs.readFileSync(__dirname +'/cert/server.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

app.get('/', function (req, res) {
    console.log(req);
    res.sendFile(__dirname +'/html/index.html')
})

app.get('/index.css', function(_, res) {
    res.sendFile(__dirname + '/css/index.css');
});

app.get('/main.js', function(_, res) {
    res.sendFile(__dirname + '/main.js');
});



app.get('/login', function(_, res) {
    res.sendFile(__dirname + '/html/login.html');
});

app.get('/login.css', function(_, res) {
    res.sendFile(__dirname + '/css/login.css');
});

app.post('/login/credentials', function(req, res) {
    console.log(req);
    res.send('');
});

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);