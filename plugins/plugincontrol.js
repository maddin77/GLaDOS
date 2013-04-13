module.exports = {
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "plugin") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen rechte dazu.");
            if(params.length === 0) return client.notice(user.getNick(), commandChar + name + " <ENABLE/DISABLE/LOAD/UNLOAD/RELOAD/LIST/LISTENABLED>");
            if(params[0].toLowerCase() == "load") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " LOAD <Pluginname>");
                var pluginName = params[1]+".js";
                var pl = PLUGINS.loadPlugin(pluginName);
                if(pl) return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" wurde geladen.");
                else return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" ist bereits geladen.");
            }
            else if(params[0].toLowerCase() == "unload") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " UNLOAD <Pluginname>");
                var _pluginName = params[1]+".js";
                var _pl = PLUGINS.unloadPlugin(_pluginName);
                if(_pl) return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" wurde aus dem Speicher entfernt.");
                else return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" ist nicht geladen.");
            }
            else if(params[0].toLowerCase() == "reload") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " RELOAD <Pluginname>");
                var __pluginName = params[1]+".js";
                var __pl = PLUGINS.unloadPlugin(__pluginName);
                if(__pl) {
                    __pl = PLUGINS.loadPlugin(__pluginName);
                    if(__pl) return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" wurde aktualisiert.");
                }
            }
            else if(params[0].toLowerCase() == "list") {
                var pNames = [];
                for(var pName in PLUGINS.plugins) {
                    pName = pName.slice(0,-3);
                    pNames.push(pName);
                }
                return client.notice(user.getNick(), "Geladene Plugins: " + pNames.join(", "));
            }
            else if(params[0].toLowerCase() == "enable") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " ENABLE <Pluginname>");
                var ___pluginName = params[1]+".js";
                if(!PLUGINS.isDisabled(___pluginName, channel.getName())) {
                    return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" ist in diesem Channel bereits aktiviert.");
                }
                else {
                    PLUGINS.enablePlugin(___pluginName, channel.getName());
                    return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" wurde in diesem Channel aktiviert.");
                }
            }
            else if(params[0].toLowerCase() == "disable") {
                if(params.length == 1) return client.notice(user.getNick(), commandChar + name + " DISABLE <Pluginname>");
                var ____pluginName = params[1]+".js";
                if(!PLUGINS.isDisabled(____pluginName, channel.getName())) {
                    PLUGINS.disablePLugin(____pluginName, channel.getName());
                    return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" wurde in diesem Channel deaktiviert.");
                }
                else {
                    return client.notice(user.getNick(), "Plugin \"" + params[1] + "\" ist in diesem Channel bereits deaktiviert.");
                }
            }
            else if(params[0].toLowerCase() == "listenabled") {
                var _pNames = [];
                for(var _pName in PLUGINS.plugins) {
                    if(!PLUGINS.isDisabled(_pName, channel.getName())) {
                        _pNames.push(_pName.slice(0,-3));
                    }
                }
                return client.notice(user.getNick(), "Aktive Plugins in diesem Channel: " + _pNames.join(", "));
            }
            else return client.notice(user.getNick(), commandChar + name + " <ENABLE/DISABLE/LOAD/UNLOAD/RELOAD/LIST/LISTENABLED>");
        }
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   -");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !plugin ENABLE <Pluginname> - Aktiviert das angegebene Plugin im Channel.");
        client.say(user.getNick(), "#   !plugin DISABLE <Pluginname> - Deaktiviert das angegebene Plugin im Channel.");
        client.say(user.getNick(), "#   !plugin LOAD <Pluginname> - Lädt das angegebene Plugin in den Speicher.");
        client.say(user.getNick(), "#   !plugin UNLOAD <Pluginname> - Entfernt das angegebene Plugin aus dem Speicher.");
        client.say(user.getNick(), "#   !plugin RELOAD <Pluginname> - Entfernt das angegebene Plugin aus dem Speicher und Lädt es erneut in den Speicher.");
        client.say(user.getNick(), "#   !plugin LIST - Listet alle geladenen Plugins auf.");
        client.say(user.getNick(), "#   !plugin LISTENABLED - Listet alle Plugins auf die in diesem Channel aktiviert sind.");
    }
};