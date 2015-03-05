var _           = require('lodash');

exports.register = function (server, options, next) {

    server.state('admin', {
        ttl: null,
        encoding: 'base64json',
        clearInvalid: true,
        path: '/'
    });

    var _SESSION_DB = [];

    options.glados.register('generateSession', function (nick) {
        var ts = Date.now();
        var sid = require('crypto').createHash('md5').update(ts + _.uniqueId(nick)).digest('hex');
        var s = {
            ts: ts,
            sid: sid,
            nick: nick
        };
        server.log(['info', 'generateSession'], s);
        _SESSION_DB.push(s);
        return s;
    });

    server.ext('onPreAuth', function (request, reply) {
        server.log(['info', 'onRequest'], !!request.query.sid);
        if (request.query.sid) {
            var valid = _.find(_SESSION_DB, {sid: request.query.sid});
            server.log(['info', 'onRequest', 'valid'], valid);
            if (valid && _.has(valid, 'ts') && valid.ts >= (Date.now() - 60000)) {
                server.log(['info', 'onRequest'], 'request.auth.session.set');

                _SESSION_DB = _.remove(_SESSION_DB, function (s) {
                    return s.sid === valid.sid;
                });

                reply.state('admin', valid);
                return reply.redirect(request.path);
            } else {
                delete request.state.admin;
            }
        }
        return reply.continue();
    });
    server.ext('onPreResponse', function (request, reply) {
        if (request.response.variety === 'view') {
            request.response.source.context.__admin = request.state.admin;
        }
        return reply.continue();
    });

    return next();
};
exports.register.attributes = {
    name: 'web-auth',
    version: '1.0.0'
};