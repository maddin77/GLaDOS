/*jslint stupid: true */
"use strict";

var fs          = require('fs');
var extend      = require('extend');
var _           = require('underscore');
var CONFIG_DIR  = process.cwd() + '/data';

var Database = function (fileName) {
    //Hi
    this.getDBFilename = function () {
        return fileName;
    };
};

/*Database.prototype.setFilename = function (fileName) {
    this.__dbfileName = fileName;
};*/

Database.prototype.readFile = function (fileName) {
    var fileContent,
        stat,
        fullFilename = CONFIG_DIR + '/' + fileName + '.json',
        configObject;

    try {
        stat = fs.statSync(fullFilename);
        if (!stat || stat.size < 1) {
            return null;
        }
    } catch (e1) {
        return null;
    }

    try {
        fileContent = fs.readFileSync(fullFilename, 'UTF-8');
    } catch (e2) {
        throw new Error('Database file ' + fullFilename + ' cannot be read');
    }

    try {
        configObject = JSON.parse(fileContent);
    } catch (e3) {
        throw new Error("Cannot parse config file: '" + fullFilename + "': " + e3);
    }

    return configObject;
};

Database.prototype.save = function () {
    var params = _.keys(this), data;
    params.unshift(this);

    data = _.pick.apply(null, params);
    //delete data.__dbfileName;

    fs.writeFileSync(CONFIG_DIR + '/' + (this.getDBFilename() || process.env.NODE_ENV || 'development') + '.json', JSON.stringify(data, null, 4));
};

module.exports = function (dbname) {
    var db;
    if (!dbname) {
        dbname = 'config.' + (process.env.NODE_ENV || 'development');
        db = new Database(dbname);
        return extend(true, db, extend(true, db.readFile('config.default'), db.readFile(dbname)));
    }
    db = new Database(dbname);
    return extend(true, db, db.readFile(dbname));
};