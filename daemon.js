function log() {console.log.apply(null, arguments);}
function spawn() {
    var CHILD_PROCESS = require('child_process').spawn("node", ["james.js"] );
    log('James started. PID = ' + CHILD_PROCESS.pid);
    CHILD_PROCESS.stdout.on('data', function(data) {
        data = data.toString().replace(/\n$/,"");
        log(data);
    });
    CHILD_PROCESS.stderr.on('data', function(data) {
        data = data.toString().replace(/\n$/,"");
        log(data);
    });
    return CHILD_PROCESS.on('exit', function(code, signal) {
        if(code === null && signal == "SIGTERM") {
            respawn();
        }
        else if(code == 1) {
            process.exit(1);
        }
        else {
             log('James exited with code ' + (code ? code.toString() : 0) + " and signal " + (signal ? signal.toString() : "null"));
             respawn();
        }
    });
}
function respawn() {
    setTimeout(function() {
        spawn();
    }, 1000);
}

spawn();