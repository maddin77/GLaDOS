var numeral = require('numeral');
var _       = require('lodash');
var os      = require('os');

exports.register = function (server, options, next) {
    server.route({
        path: '/sinfo',
        method: 'GET',
        handler: function (request, reply) {
            if (!request.state.admin) {
                return reply.redirect('/');
            }
            var mem = process.memoryUsage();
            return reply.view('sinfo', {
                mainnav: '/sinfo',
                process: {
                    platform: process.platform,
                    arch: process.arch,
                    uptime: numeral(process.uptime()).format('00:00:00'),
                    pid: process.pid,
                    gid: process.getgid(),
                    uid: process.getuid(),
                    versions: process.versions,
                    mem: {
                        rss: numeral(mem.rss).format('0.000 b'),
                        heapTotal: numeral(mem.heapTotal).format('0.000 b'),
                        heapUsed: numeral(mem.heapUsed).format('0.000 b')
                    },
                    cwd: process.cwd(),
                    argv: _.drop(process.argv, 2),
                    execPath: process.execPath,
                    execArgv: process.execArgv
                },
                os: {
                    hostname: os.hostname(),
                    type: os.type(),
                    release: os.release(),
                    uptime: numeral(os.uptime()).format('00:00:00'),
                    loadavg: os.loadavg(),
                    totalmem: numeral(os.totalmem()).format('0.000 b'),
                    freemem: numeral(os.freemem()).format('0.000 b'),
                    cpus: os.cpus()
                }
            });
        }
    });

    return next();
};
exports.register.attributes = {
    name: 'web-sinfo',
    version: '1.0.0'
};