exports.register = function (server, options, next) {
    server.route({
        path: '/',
        method: 'GET',
        handler: function (request, reply) {
            return reply.view('help', {
                mainnav: '/'
            });
        }
    });

    return next();
};
exports.register.attributes = {
    name: 'web-help',
    version: '1.0.0'
};