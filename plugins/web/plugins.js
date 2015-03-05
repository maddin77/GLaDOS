var path    = require('path');
var _       = require('lodash');

exports.register = function (server, options, next) {
    server.route({
        path: '/plugins',
        method: 'GET',
        handler: function (request, reply) {
            return reply.view('plugins', {
                mainnav: '/plugins',
                plugins: _.map(require(path.join(__dirname, '..', '..', 'lib', 'plugins')).getPlugins(), function (p) {
                    p.id = p.name.replace(/\W/g, '').toLowerCase();
                    return p;
                })
            });
        }
    });

    return next();
};
exports.register.attributes = {
    name: 'web-plugins',
    version: '1.0.0'
};