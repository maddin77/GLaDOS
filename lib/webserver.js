var backlog = [];

var app = require('http').createServer();
var io = require('socket.io').listen(app);
io.set('transports', ['xhr-polling']);
//io.set('log level', 1);


GLaDOS.logger.on('logging', function(transport, level, msg, meta) {
    io.sockets.emit('logging', level, msg, meta, new Date());
    addToBacklog(level, msg, meta);
});
io.sockets.on('connection', function(socket) {
    var address = socket.handshake.address;
    addToBacklog('warn', 'New connection from ' + address.address + ':' + address.port, socket.handshake);
    backlog.forEach(function(bl) {
        io.sockets.emit('logging', bl.level, bl.msg, bl.meta, bl.date);
    });
});
app.listen(13357);

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
