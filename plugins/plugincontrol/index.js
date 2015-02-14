var PluginControlPlugin = function() {};
PluginControlPlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "plugin") {
        if(!user.hasPermissions()) return user.notice("You don't have the permissions to use this command.");
        if(params.length === 0) return user.notice("!plugin <enable/disable/load/unload/reload/list/listenabled>");
        if(params[0].toLowerCase() == "load") {
            if(params.length == 1) return user.notice("!plugin LOAD <Pluginname>");
            var pl = this.pluginManager.loadPlugin(params[1]);
            if(pl) return user.notice("Plugin \"" + params[1] + "\" has been loaded.");
            else return user.notice("Could not load plugin \"" + params[1] + "\".");
        }
        else if(params[0].toLowerCase() == "unload") {
            if(params.length == 1) return user.notice("!plugin UNLOAD <Pluginname>");
            var _pl = this.pluginManager.unloadPlugin(params[1]);
            if(_pl) return user.notice("Plugin \"" + params[1] + "\" has been unloaded.");
            else return user.notice("Could not unload plugin \"" + params[1] + "\".");
        }
        else if(params[0].toLowerCase() == "reload") {
            if(params.length == 1) return user.notice("!plugin RELOAD <Pluginname>");
            var __pl = this.pluginManager.unloadPlugin(params[1]);
            if(__pl) {
                __pl = this.pluginManager.loadPlugin(params[1]);
                if(__pl) return user.notice("Plugin \"" + params[1] + "\" has been reloaded.");
                else return user.notice("Could not reload plugin \"" + params[1] + "\".");
            }
            else return user.notice("Could not reload Plugin \"" + params[1] + "\".");
        }
        else if(params[0].toLowerCase() == "list") {
            return user.notice("Loaded plugins: " + this.pluginManager.getAllAsString(", "));
        }
        else if(params[0].toLowerCase() == "enable") {
            if(params.length == 1) return user.notice("!plugin ENABLE <Pluginname>");
            if(!this.pluginManager.isDisabled(params[1], channel.getName())) {
                return user.notice("Plugin \"" + params[1] + "\" is already enabled in this channel.");
            }
            else {
                this.pluginManager.enablePlugin(params[1], channel.getName());
                return user.notice("Plugin \"" + params[1] + "\" has been enabled in this channel.");
            }
        }
        else if(params[0].toLowerCase() == "disable") {
            if(params.length == 1) return user.notice("!plugin DISABLE <Pluginname>");
            if(!this.pluginManager.isDisabled(params[1], channel.getName())) {
                this.pluginManager.disablePLugin(params[1], channel.getName());
                return user.notice("Plugin \"" + params[1] + "\" has been disabled in this channel.");
            }
            else {
                return user.notice("Plugin \"" + params[1] + "\" is already disbled in this channel.");
            }
        }
        else if(params[0].toLowerCase() == "listenabled") {
            var pNames = [];
            for(var pName in this.pluginManager.plugins) {
                if(!this.pluginManager.isDisabled(pName, channel.getName())) {
                    pNames.push(pName);
                }
            }
            return user.notice("Aktive Plugins in diesem Channel: " + pNames.join(", "));
        }
        else return user.notice("!plugin <enable/disable/load/unload/reload/list/listenabled>");
    }
};
PluginControlPlugin.prototype.onHelp = function(server, user, text) {
    user.say("Control Plugins.");
    user.say("Commands: !plugin <enable/disable/load/unload/reload/list/listenabled>");
};
module.exports = new PluginControlPlugin();