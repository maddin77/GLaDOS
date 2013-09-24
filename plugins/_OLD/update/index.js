module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Updated James auf den neuesten Stand.",
        commands: ["{C}update"]
    },
    /*==========[ -INFO- ]==========*/

    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "update") {
            if(!user.hasPermissions()) return client.notice(user.getNick(), "Du hast nicht die nötigen Rechte dazu.");
            var child_process = require('child_process');
            var changes = false;
            try {
                child_process.exec("git stash", function(error, stdout, stderr) {
                    if(error) {
                        client.say(channel.getName(), "git stash failed: " + stderr);
                    }
                });
                client.say(channel.getName(), "git pull...");
                child_process.exec("git pull", function(error, stdout, stderr) {
                    if(error) {
                        client.say(channel.getName(), "git pull failed: " + stderr);
                    }
                    else {
                        var output = stdout+'';
                        if(!/Already up\-to\-date/.test(output)) {
                            //client.say(channel.getName(), "my source code changed:\n"+output);
                            client.say(channel.getName(), "my source code changed");
                            changes = true;
                        }
                        else {
                            client.say(channel.getName(), "my source code is up-to-date");
                        }
                    }
                    try {
                        client.say(channel.getName(), "npm update...");
                        child_process.exec("npm update", function(error, stdout, stderr) {
                            if(error) {
                                client.say(channel.getName(), "npm update failed: " + stderr);
                            }
                            else {
                                var output = stdout+'';
                                if(/node_modules/.test(output)) {
                                    //client.say(channel.getName(), "some dependencies updated:\n"+output);
                                    client.say(channel.getName(), "some dependencies updated");
                                    changes = true;
                                }
                                else {
                                    client.say(channel.getName(), "all dependencies are up-to-date");
                                }
                            }
                            if(changes) {
                                client.say(channel.getName(), "I have some pending updates, KILL ME PLEASE! (!exit, !restart)");
                            }
                            else {
                                client.say(channel.getName(), "I'm up-to-date!");
                            }
                        });
                    }
                    catch(err) {
                        client.say(channel.getName(), "npm update failed: " + err);
                    }
                });
            }
            catch(error) {
                client.say(channel.getName(), "git pull failed: " + error);
            }
            return true;
        }
    }
};