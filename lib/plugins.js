module.exports = {

    plugins: {},
    disable: {},

    pluginsPath: require('path').resolve('./plugins') + '/',

    getPlugin: function(name) {
        var cleanName = this.getCleanName(name);
        return this.plugins[cleanName];
    },
    loadPlugin: function(name) {
        if(this.plugins.hasOwnProperty(name)) return false;
        var fullName = this.pluginsPath + name;
        var pl = require(require.resolve(fullName));
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
        if(!this.disable.hasOwnProperty(name)) {
            this.disable[name] = [];
        }
        LOG.debug('Plugin loaded: %s', name);
        return true;
    },
    unloadPlugin: function(name) {
        if(!this.plugins.hasOwnProperty(name)) return false;
        var fullName = this.pluginsPath + name;
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
        console.log("disable", name, chan, this.disable);
        if(this.disable.hasOwnProperty(name)) {
            if(this.disable[name].indexOf(chan) == -1) {
                this.disable[name].push(chan);
                LOG.debug('Plugin disabled: %s in %s', name, chan);
            }
        }
    },
    enablePlugin: function(name, chan) {
        console.log("enable", name, chan, this.disable);
        if(this.disable.hasOwnProperty(name)) {
            var index = this.disable[name].indexOf(chan);
            if(index !== -1) {
                this.disable[name].splice(index,1);
                LOG.debug('Plugin enabled: %s in %s', name, chan);
            }
        }
    },
    isDisabled: function(name, chan) {
        return this.disable.hasOwnProperty(name) && this.disable[name].indexOf(chan) !== -1;
    },
    exist: function(name) {
        return this.plugins.hasOwnProperty(name);
    },
    getAllAsString: function(delim, extension) {
        var ret = [];
        for(var p in this.plugins) {
            ret.push(extension ? p : p.slice(0, -3));
        }
        return ret.join(delim);
    }
};