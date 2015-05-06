exports.register = function (glados, next) {
    /*glados.web().route({
        path: '/',
        method: 'GET',
        handler: function (request, reply) {
            return reply.view('help', {
                mainnav: '/'
            });
        }
    });*/
    return next();
};
exports.info = {
    name: 'help',
    version: '1.0.0',
    list: false
};