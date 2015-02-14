module.exports = {
    /*==========[ +INFO+ ]==========*/
    info: {
        description: "Erstellt eine Umfrage im Channel.",
        commands: ["{C}vote", "{C}poll <OPEN / CLOSE / RESET / RESULTS>"]
    },
    /*==========[ -INFO- ]==========*/

    _poll: {
        options: [],
        votes: [],
        hasvoted: [],
        open: false
    },
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
        if(name == "poll") {
            if( !channel.userHasMinMode(user.getNick(), "%") ) return client.notice(user.getNick(), "Du hast nicht die nötigen rechte dazu.");
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <OPEN / CLOSE / RESET / RESULTS>");
            if(params[0].toLowerCase() == "open") {
                if( this._poll.open ) return client.notice(user.getNick(), "Es läuft z.Z. bereits eine Umfrage.");
                if( params.length === 1 ) return client.notice(user.getNick(), commandChar + name + " OPEN <option | option | etc.>");
                var options = text.substr(5).split("|");
                this._poll.options = options;
                this._poll.open = true;
                this._poll.votes = [];
                this._poll.hasvoted = [];
                var _opts = "";
                for(var i=0; i<options.length; i++) {
                    _opts += (i+1)+": "+options[i]+", ";
                    this._poll.votes[i] = 0;
                }
                _opts = _opts.slice(0, -2);
                client.say(channel.getName(), user.getNick() + " hat eine Umfrage gestartet. Optionen: " + _opts + ". Nutze \"" + commandChar + "vote <Nummer>\" um deine Stimme abzugeben.");
            }
            else if(params[0].toLowerCase() == "close") {
                if( !this._poll.open ) return client.notice(user.getNick(), "Es gibt z.Z. keine Umfrage.");
                this._poll.open = false;
                var _opts2 = "";
                for(var j=0; j<this._poll.options.length; j++) {
                    _opts2 += this._poll.options[j]+": "+this._poll.votes[j]+", ";
                }
                _opts2 = _opts2.slice(0, -2);
                client.say(channel.getName(), "Die Umfrage wurde beendet. Ergebniss: " + _opts2);
            }
            else if(params[0].toLowerCase() == "reset") {
                if( !this._poll.open ) return client.notice(user.getNick(), "Es gibt z.Z. keine Umfrage.");
                this._poll.open = true;
                this._poll.votes = [];
                this._poll.hasvoted = [];
                var _opts3 = "";
                for(var k=0; k<this._poll.options.length; k++) {
                    _opts3 += (k+1)+": "+this._poll.options[k]+", ";
                    this._poll.votes[k] = 0;
                }
                _opts3 = _opts3.slice(0, -2);
                client.say(channel.getName(), user.getNick() + " hat eine Umfrage erneut gestartet. Optionen: " + _opts3 + ". Nutze \"" + commandChar + "vote <Nummer>\" um deine Stimme abzugeben.");
            }
            else if(params[0].toLowerCase() == "results") {
                if( !this._poll.options.length ) return client.notice(user.getNick(), "Es wurde bisher noch keine Umfrage erstellt.");
                var _opts4 = "";
                for(var l=0; l<this._poll.options.length; l++) {
                    _opts4 += this._poll.options[l]+": "+this._poll.votes[l]+", ";
                }
                _opts4 = _opts4.slice(0, -2);
                client.say(channel.getName(), "Ergebniss: " + _opts4);
            }
            return true;
        }
        if(name == "vote") {
            if( params.length === 0 ) return client.notice(user.getNick(), commandChar + name + " <Nummer>");
            if( !this._poll.open ) return client.notice(user.getNick(), "Es gibt z.Z. keine Umfrage.");
            var option = parseInt(params[0],10);
            if(option > this._poll.options.length) return client.notice(user.getNick(), "Es gibt keine Antwort mit der Nummmer " + params[0] + ".");
            if(this._poll.hasvoted.indexOf(user.getNick()) !== -1) return client.notice(user.getNick(), "Du hast bereits abgestimmt.");
            this._poll.votes[option-1]++;
            this._poll.hasvoted.push(user.getNick());
            client.say(channel.getName(), user.getNick() + ": Deine Stimme für \"" + this._poll.options[option-1] + "\" wurde gezählt.");
            return true;
        }
    },
    onUnload: function() {
        this._poll = null;
    },
    onHelpRequest: function(client, server, user, message, parts) {
        client.say(user.getNick(), "# Beschreibung:");
        client.say(user.getNick(), "#   Erstellt eine Umfrage im Channel.");
        client.say(user.getNick(), "# Verwendung:");
        client.say(user.getNick(), "#   !vote");
        client.say(user.getNick(), "#   !poll <OPEN / CLOSE / RESET / RESULTS>");
    }
};