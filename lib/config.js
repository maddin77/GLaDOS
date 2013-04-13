module.exports = {
    _file: "./config/config.json",
    fs: require('fs'),
    _config: {},

    load: function() {
        var data = this.fs.readFileSync(this._file, {encoding: "utf8"});
        this._config = JSON.parse(data);
        return this;
    },
    save: function(callback) {
        this.fs.writeFile(this._file, JSON.stringify(this._config, null, 4), callback);
    },
    get: function(key) {
        var parts = key.split(":"), tObj = this._config;
        for(var i=0; i<parts.length; i++) {
            if(tObj.hasOwnProperty(parts[i])) {
                tObj = tObj[parts[i]];
            }
        }
        return tObj;
    },
    set: function(key, value) {
        var parts = key.split(":"),config = this._config;
        switch(parts.length) {
            case 10: config[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]][parts[8]][parts[9]] = value;break;
            case 9: config[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]][parts[8]] = value;break;
            case 8: config[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]][parts[7]] = value;break;
            case 7: config[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]][parts[6]] = value;break;
            case 6: config[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]][parts[5]] = value;break;
            case 5: config[parts[0]][parts[1]][parts[2]][parts[3]][parts[4]] = value;break;
            case 4: config[parts[0]][parts[1]][parts[2]][parts[3]] = value;break;
            case 3: config[parts[0]][parts[1]][parts[2]] = value;break;
            case 2: config[parts[0]][parts[1]] = value;break;
            case 1: config[parts[0]] = value;break;
            case 0: break;
            default: break;
        }
        this._config = config;
        this.save(function(err) {
            if(err) {
                console.log(err);
                QUIT(1);
            }
        });
    },
    del: function(key) {
        var config = this._config;
        delete config[key];
        this._config = config;
    },
    has: function(key) {
        return this._config[key] ? true : false;
    }
};