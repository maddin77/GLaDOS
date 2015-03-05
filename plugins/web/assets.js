var path = require('path');

exports.register = function (server, options, next) {
    server.route({
        path: '/{path*}',
        method: 'GET',
        handler: {
            directory: {
                path: path.join(__dirname, 'assets')
            }
        }
    });

    return next();
};
exports.register.attributes = {
    name: 'web-assets',
    version: '1.0.0'
};