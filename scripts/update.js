var exec    = require('child_process').exec;
var async   = require('async');
var ircC    = require('irc-colors');

module.exports = function (scriptLoader) {

    scriptLoader.on('command', 'update', function (event) {
        if (!event.user.isAdmin()) {
            return event.user.notice('You don\'t have the permissions to use this command.');
        }
        async.series({
            gitStash: function (callback) {
                event.user.say(ircC.bold('git stash...'));
                return exec('git stash', function (error, stdout, stderr) {
                    if (error) {
                        event.user.say(ircC.bold('git stash failed: ' + stderr));
                        return callback(error);
                    }
                    event.user.say(stdout);
                    return callback(null);
                });
            },
            gitPull: function (callback) {
                event.user.say(ircC.bold('git pull...'));
                return exec('git pull', function (error, stdout, stderr) {
                    if (error) {
                        event.user.say(ircC.bold('git pull failed: '));
                        event.user.say(stderr);
                        return callback(error, false);
                    }
                    var output = stdout+'', changes = false;
                    if(!/Already up\-to\-date/.test(output)) {
                        event.user.say(ircC.bold('my source code changed:'));
                        event.user.say(output);
                        changes = true;
                    } else {
                        event.user.say(ircC.bold('my source code is up-to-date'));
                    }
                    return callback(null, changes);
                });
            },
            npmUpdate: function (callback) {
                event.user.say(ircC.bold('npm update...'));
                return exec('npm update', function (error, stdout, stderr) {
                    if (error) {
                        event.user.say(ircC.bold('npm update failed:'));
                        event.user.say(stderr);
                        return callback(error);
                    }
                    var output = stdout+'', changes = false;
                    if(/node_modules/.test(output)) {
                        event.user.say(ircC.bold('some dependencies updated:'));
                        event.user.say(output);
                        changes = true;
                    } else {
                        event.user.say(ircC.bold('all dependencies are up-to-date'));
                    }
                    return callback(null, changes);
                });
            }
        }, function (err, results) {
            if (results.gitPull || results.npmUpdate) {
                event.user.say(ircC.bold('I have some pending updates, KILL ME PLEASE! (!exit, or !script reload)'));
            } else {
                event.user.say(ircC.bold('I\'m up-to-date!'));
            }
        });
    });
};
