var fs      = require('fs');
var extend  = require('extend');
var _       = require('underscore');
var path    = require('path');

var Database = function (dbPath, fileName) {
    this.fileName = function () {
        return dbPath + path.sep + fileName;
    };
};

Database.prototype.readFile = function () {
    var fileContent,
        stat,
        configObject;

    try {
        stat = fs.statSync(this.fileName());
        if (!stat || stat.size < 1) {
            return null;
        }
    } catch (e1) {
        return null;
    }

    try {
        fileContent = fs.readFileSync(this.fileName(), {encoding: 'utf8'});
    } catch (e2) {
        throw new Error('Database file ' + this.fileName() + ' cannot be read');
    }

    try {
        configObject = JSON.parse(fileContent);
    } catch (e3) {
        throw new Error('Cannot parse config file: "' + this.fileName() + '": ' + e3);
    }

    return configObject;
};

Database.prototype.save = function () {
    var params = _.keys(this), data;
    params.unshift(this);

    data = _.pick.apply(null, params);

    fs.writeFileSync(this.fileName(), JSON.stringify(data, null, 4));
};

module.exports = function (dbPath, dbName) {
    if (!dbName) {
        dbName = dbPath;
        dbPath = path.join(__dirname, '..', 'data');
    }
    if (path.extname(dbName).length === 0) {
        dbName += '.json';
    }
    var db = new Database(dbPath, dbName);
    return extend(true, db, db.readFile());
};