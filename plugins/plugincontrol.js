module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "plugin") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen rechte dazu.");
            if(params.length === 0) return client.notice(user.getNick(), commandChar + name + " <LOAD/UNLOAD/RELOAD/LIST>");
            if(params[0].toLowerCase() == "load") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " LOAD <Pluginname>");
                var pluginName = params[1]+".js";
                var pl = PLUGINS.loadPlugin(pluginName);
                if(pl) return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" wurde aktiviert.");
                else return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" ist bereits aktiviert.");
            }
            else if(params[0].toLowerCase() == "unload") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " UNLOAD <Pluginname>");
                var _pluginName = params[1]+".js";
                var _pl = PLUGINS.unloadPlugin(_pluginName);
                if(_pl) return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" wurde deaktiviert.");
                else return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" ist bereits deaktiviert.");
            }
            else if(params[0].toLowerCase() == "reload") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " RELOAD <Pluginname>");
                var __pluginName = params[1]+".js";
                var __pl = PLUGINS.unloadPlugin(__pluginName);
                if(__pl) {
                    __pl = PLUGINS.loadPlugin(__pluginName);
                    if(__pl) return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" wurde reaktiviert.");
                }
            }
            else if(params[0].toLowerCase() == "list") {
                var pNames = [];
                for(var pName in PLUGINS.plugins) {
                    pName = pName.slice(0,-3);
                    pNames.push(pName);
                }
                return client.notice(user.getNick(), "Aktive Plugins: " + pNames.join(", "));
            }
            else return client.notice(user.getNick(), commandChar + name + " <LOAD/UNLOAD/RELOAD/LIST>");
        }
    }
};