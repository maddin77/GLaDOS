module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "exit" && user.hasPermissions()) {
            QUIT(65786974);
        }
        if(name == "restart" && user.hasPermissions()) {
            QUIT(0);
        }
    }
};