var
    express = require('express'),
    fs = require('fs'),
    app = express()
;
app.get('/', function(req, res){
    res.sendfile("index.html");
});
app.get('/apache/script.js', function(req, res){
    res.sendfile("client/apache/script.js");
});

app.get('/style.css', function(req, res){
    res.sendfile("client/style.css");
});
app.listen(1337);