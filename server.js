var express = require('express');
var bodyParser = require('body-parser')


var fs =require('fs')
 var  app=express();

 /*app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });*/

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
//app.use(constent);


require('./routes/api_route')(app);
 app.listen('3031',function(){
     console.log(`http://localhost:3031/`);
 })