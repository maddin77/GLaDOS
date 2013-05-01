module.exports = {

    plugins: {},

    pluginsPath: require('path').resolve('./plugins') + '/',

    getPlugin: function(name) {
        var cleanName = this.getCleanName(name);
        return this.plugins[cleanName];
    },
    loadPlugin: function(name) {
        if(this.plugins.hasOwnProperty(name)) return false;
        var fullName = this.pluginsPath + name + "/index.js";
        var pl = null;
        try {
            pl = require(require.resolve(fullName));
        }
        catch(e) {
            LOG.error("Could not load Plugin \"" + name + "\".\n"+e);
            return false;
        }
        try {
            if(typeof pl.onLoad !== 'undefined') {
                pl.onLoad();
            }
        }
        catch(e) {
            LOG.error("Error in Plugin \"" + name + "\".\nShutting down.");
            console.log(e);
            QUIT();
        }
        this.plugins[name] = pl;
        if(CONFIG.get('plugins:disabled:'+name) === undefined) {
            CONFIG.set('plugins:disabled:'+name, []);
        }
        LOG.debug('Plugin loaded: %s', name);
        return true;
    },
    unloadPlugin: function(name) {
        if(!this.plugins.hasOwnProperty(name)) return false;
        var fullName = this.pluginsPath + name + "/index.js";
        var pl = require.cache[require.resolve(fullName)];
        if(pl) {
            if(typeof this.plugins[name].onUnload !== 'undefined') {
                this.plugins[name].onUnload();
            }
            delete require.cache[require.resolve(fullName)];
            delete this.plugins[name];
            LOG.debug('Plugin unloaded: %s', name);
            return true;
        }
        else return false;
    },
    unloadAll: function() {
        for(var p in this.plugins) {
            this.unloadPlugin(p);
        }
    },
    disablePLugin: function(name, chan) {
        //console.log("disable", name, chan, this.disable);
        if(CONFIG.get('plugins:disabled:'+name) !== undefined) {
            var _tmp = CONFIG.get('plugins:disabled:'+name);
            var index = _tmp.indexOf(chan);
            if(index == -1) {
                _tmp.push(chan);
                CONFIG.set('plugins:disabled:'+name, _tmp);
                CONFIG.save();
                LOG.debug('Plugin disabled: %s in %s', name, chan);
            }
        }
    },
    enablePlugin: function(name, chan) {
        //console.log("enable", name, chan, this.disable);
        if(CONFIG.get('plugins:disabled:'+name) !== undefined) {
            var _tmp = CONFIG.get('plugins:disabled:'+name);
            var index = _tmp.indexOf(chan);
            if(index !== -1) {
                _tmp.splice(index,1);
                CONFIG.set('plugins:disabled:'+name, _tmp);
                CONFIG.save();
                LOG.debug('Plugin enabled: %s in %s', name, chan);
            }
        }
    },
    isDisabled: function(name, chan) {
        return CONFIG.get('plugins:disabled:'+name) !== undefined && CONFIG.get('plugins:disabled:'+name).indexOf(chan) !== -1;
    },
    exist: function(name) {
        return this.plugins.hasOwnProperty(name);
    },
    getAllAsString: function(delim) {
        var ret = [];
        for(var p in this.plugins) {
            ret.push(p);
        }
        return ret.join(delim);
    }
};