var express = require('express')
var app = express();
var Joi = require('joi');
var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync(__dirname +'/cert/server.key', 'utf8');
var certificate = fs.readFileSync(__dirname +'/cert/server.crt', 'utf8');
const bcrypt = require('bcrypt');


var credentials = {key: privateKey, cert: certificate};

var dynamo = require('dynamodb');
dynamo.AWS.config.update({accessKeyId: 'AKIAIFMRXFSV63UFW5SA', secretAccessKey: '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', region: "us-west-2"});

Sessions = [];

function validToken(token){
    Sess = Sessions.filter(sess =>{
        return sess.token==token;
    });
    return Sess.length != 1 ? undefined : Sess[0];
}

app.get('/', function (req, res) {
    res.sendFile(__dirname +'/html/index.html')
})

app.get('/crosshair.png', function (req, res) {
    res.sendFile(__dirname +'/images/crosshair.png')
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


var Accounts = dynamo.define('Account', {
    hashKey : 'Username',
    timestamps : true,
    schema : { 
        Username    : Joi.string(),
        Password    : Joi.string(),
    }
  });

var Places = dynamo.define('Places', {
    hashKey : 'Name',
    timestamps : true,
    schema : { 
        Name : Joi.string(),
        Username : Joi.string(),
        Lat : Joi.number(),
        Lng : Joi.number(),
        ShopList : Joi.string(),
    }
});

Places.config({tableName: 'Places'});
Accounts.config({tableName: 'Accounts'});

app.post('/endsession', function(req, res) {
    var Sess = validToken(req.query['token']);
    if(Sess)
        Sessions.splice(Sessions.indexOf(Sess),1);
    res.send('');
});

app.get('/getplaces', function(req, res) {
    var Sess = validToken(req.query['token']);
    if(Sess){
        Places.scan().loadAll().exec(
            function(err,result){
                if(err){
                    res.status=401;
                    res.json({});
                }
                else{
                    res.json(result.Items.map(el=>{
                        if(el.attrs.Username==Sess.Username)
                            return {
                                Name: el.attrs.Name,
                                LatLng: [el.attrs.Lat,el.attrs.Lng],
                                ShopList: el.attrs.ShopList,
                            };
                    }).filter(el=>{return el!=null}));
                }
            }
        );
    }
    else{
        res.status(401);
        res.send('');
    }
});
app.post('/newplace', function(req, res) {
    var Sess = validToken(req.query['token']);
    if(Sess){
        Places.create({       
            Name : req.query['Name'],
            Username : Sess.Username,
            Lat : req.query['Lat'],
            Lng : req.query['Lng'],
            ShopList :'Empty',
        },{overwrite : false},function(err,plc){
            if(err)
                res.status(409);
            res.send('');
        });
        
    }
    else{
        res.status(401);
        res.send('');
    }
});
app.post('/updateplace', function(req, res) {
    var Sess = validToken(req.query['token']);
    if(Sess){
        Places.update({        
            Name : req.query['Name'],
            Username : Sess.Username,
            Lat : req.query['Lat'],
            Lng : req.query['Lng'],
            ShopList :req.query['ShopList'],
        });
        res.send('');
    }
    else{
        res.status(401);
        res.send('');
    }
});
app.post('/removeplace', function(req, res) {
    var Sess = validToken(req.query['token']);
    if(Sess){
        Places.destroy(req.query['Name'],function (err) {
            console.log('Place deleted');
        });
        res.send('');
    }
    else{
        res.status(401);
        res.send('');
    }
});

app.post('/login/credentials', function(req, res) {

    Accounts.get(req.query['usr'],function(err,model){
        if(err){
            console.log(err);
            res.status(401);
            res.send('');
        }
        else{
            if((req.query['new'] && model) || (!req.query['new'] && !model)){
                res.status(401);
                res.send('');
                return;
            }
            if(req.query['new']){
                bcrypt.hash(req.query['pass'],10,function(err,hash){
                    Accounts.create({       
                        Username : req.query['usr'],
                        Password : hash,
                    },{overwrite : false},function(err,plc){
                        if(err)
                            res.status(409);
                        res.send('');
                    });
                })
            }
            else
            bcrypt.compare(req.query['pass'], model.attrs['Password'], function(err, result) {
                if(err || !result){
                    console.log(err);
                    res.status(401);
                    res.send('');
                }
                else{
                    bcrypt.hash(new Date().getTime() + model.attrs['Password'],10,function(err,encrypted){
                        if(err){
                            console.log(err);
                            res.status(401);
                            res.send('');
                            return;
                        }
                        Sessions.push({Username:model.attrs['Username'],token:encrypted});
                        res.send(encrypted);
                    });
                }
            });
        }
    });
    
});



var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);