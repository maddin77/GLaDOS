var backlog = [];

var http = require('http');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(backlog) + "\n");
}).listen(process.env.OPENSHIFT_NODEJS_PORT || 8080, process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');



GLaDOS.logger.on('logging', function(transport, level, msg, meta) {
    addToBacklog(level, msg, meta);
});
function addToBacklog(level, msg, meta) {
    if(backlog.length >= 1000) {
        backlog.splice(0, 1);
    }
    backlog.push({
        'level': level,
        'msg': msg,
        'meta': meta,
        'date': new Date()
    });
}
