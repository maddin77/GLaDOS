module.exports = {

    plugins: {},

    pluginsPath: PATH.resolve('./plugins') + '/',

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
    }
};