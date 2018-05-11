var express = require('express');
var fs = require('fs');
var elastic = require('elasticsearch');
var cors = require('cors');
var eq = require('./util/elastic-cgt-es6');
var bodyParser = require('body-parser');

var app = express();

var server = app.listen(3333, function(){
    console.log("Server has started")
});

var ec = new elastic.Client({  
    hosts: [
        'http://127.0.0.1:1200'
    ]
});
// use it before all route definitions
app.use(cors({origin: '*'}));
// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var router = require('./router/request')(app, fs);
var ecRouter = require('./router/elastic')(app, ec, eq);