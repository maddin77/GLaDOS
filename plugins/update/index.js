var child_process = require('child_process');
var UpdatePlugin = function() {};
UpdatePlugin.prototype.onCommand = function(server, channel, cmdName, params, user, msg, text) {
    if(cmdName == "update") {
        if(!user.hasPermissions()) return client.notice(user.getNick(), 'You don\'t have the permissions to use this command.');
        var changes = false;
        try {
            child_process.exec("git stash", function(error, stdout, stderr) {
                if(error) {
                    channel.say("git stash failed: " + stderr);
                }
            });
            channel.say("git pull...");
            child_process.exec("git pull", function(error, stdout, stderr) {
                if(error) {
                    channel.say("git pull failed: " + stderr);
                }
                else {
                    var output = stdout+'';
                    if(!/Already up\-to\-date/.test(output)) {
                        channel.say("my source code changed");
                        changes = true;
                    }
                    else {
                        channel.say("my source code is up-to-date");
                    }
                }
                try {
                    channel.say("npm update...");
                    child_process.exec("npm update", function(error, stdout, stderr) {
                        if(error) {
                            channel.say("npm update failed: " + stderr);
                        }
                        else {
                            var output = stdout+'';
                            if(/node_modules/.test(output)) {
                                channel.say("some dependencies updated");
                                changes = true;
                            }
                            else {
                                channel.say("all dependencies are up-to-date");
                            }
                        }
                        if(changes) {
                            channel.say("I have some pending updates, KILL ME PLEASE!");
                        }
                        else {
                            channel.say("I'm up-to-date!");
                        }
                    });
                }
                catch(err) {
                    channel.say("npm update failed: " + err);
                }
            });
        }
        catch(error) {
            channel.say("git pull failed: " + error);
        }
    }
};
UpdatePlugin.prototype.onHelp = function(server, user, text) {
    user.say("Allows GLaDOS to update itself using git pull and npm update.");
    user.say("Commands: !update");
};
module.exports = new UpdatePlugin();