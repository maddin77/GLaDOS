var PluginManager = module.exports = function(glados, client, logger, redis) {
    this.glados = glados;
    this.client = client;
    this.logger = logger;
    this.redis = redis;
    this.plugins = {};
    this.disabled = {};
    this.pluginsPath = require('path').resolve('./plugins') + '/';
};
PluginManager.prototype.loadPlugin = function(name) {
    if(this.plugins.hasOwnProperty(name)) return false;
    var fullName = this.pluginsPath + name + "/index.js";
    var pl = null;
    try {
        pl = require(require.resolve(fullName));
        pl.glados = this.glados;
        pl.logger = this.logger;
        pl.redis = this.redis;
        pl.client = this.client;
        pl.pluginManager = this;
        if(typeof pl.onLoad !== 'undefined') {
            pl.onLoad();
        }
    }
    catch(e) {
        this.logger.error("Could not load Plugin \"" + name + "\".");
        this.logger.error(e);
        throw e;
        this.glados.shutdown();
        return false;
    }
    this.plugins[name] = pl;
    this.logger.info('Plugin loaded: %s', name);
    return true;
};
PluginManager.prototype.unloadPlugin = function(name) {
    if(!this.plugins.hasOwnProperty(name)) return false;
    var fullName = this.pluginsPath + name + "/index.js";
    var pl = require.cache[require.resolve(fullName)];
    if(pl) {
        if(typeof this.plugins[name].onUnload !== 'undefined') {
            this.plugins[name].onUnload();
        }
        delete require.cache[require.resolve(fullName)];
        delete this.plugins[name];
        this.logger.info('Plugin unloaded: %s', name);
        return true;
    }
    else return false;
};
PluginManager.prototype.unloadAll = function() {
    for(var p in this.plugins) {
        this.unloadPlugin(p);
    }
};
PluginManager.prototype.disablePLugin = function(name, chan) {
    if(this.disabled[chan] === undefined) {
        this.disabled[chan] = [];
    }
    if(this.disabled[chan].indexOf(name) == -1) {
        this.disabled[chan].push(name);
        this.logger.info('Plugin disabled: %s in %s', name, chan);
        this.redis.hset("autojoin", chan, this.disabled[chan].join(","));
    }
};
PluginManager.prototype.enablePlugin = function(name, chan) {
    if(this.disabled[chan] === undefined) {
        this.disabled[chan] = [];
        return 0;
    }
    var index = this.disabled[chan].indexOf(name);
    if(index > -1) {
        this.disabled[chan].splice(index, 1);
        this.logger.info('Plugin enabled: %s in %s', name, chan);
        this.redis.hset("autojoin", chan, this.disabled[chan].join(","));
    }
};
PluginManager.prototype.isDisabled = function(name, chan) {
    return this.disabled[chan] !== undefined && this.disabled[chan].indexOf(name) !== -1;
};
PluginManager.prototype.exist = function(name) {
    return this.plugins.hasOwnProperty(name);
};
PluginManager.prototype.getAllAsString = function(delim) {
    var ret = [];
    for(var p in this.plugins) {
        ret.push(p);
    }
    return ret.join(delim);
};