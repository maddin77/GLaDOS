## Example
============
```javascript
module.exports = {
    /**
     * Wird aufgerufen, wenn ein Befehl in einem Channel gesendet wird.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.Channel} channel Eine instanz der Channel Klasse, repräsentiert den Channel in dem der Befehl gesendet wurde.
     * @param {String} commandChar Der String der zum erkennen von Befehlen verwendet wird. Z.b "!".
     * @param {String} name Der name des Befehls, ohne führenden {commandChar}.
     * @param {Array.String} params Der Text nach dem Befehl, gesplittet durch Leerzeichen.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der den Befehl gesendet hat.
     * @param {String} text Der Text nach dem Befehl.
     * @param {String} message Die komplette Nachricht des Benutzers, inklusive {commandChar} und {name}.
     */
    onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {},

    /**
     * Wird aufgerufen, wenn ein Benutzer den Bot im Channel direkt anspricht.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.Channel} channel Eine instanz der Channel Klasse, repräsentiert den Channel in dem die Nachricht gesendet wurde.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der die Nachricht gesendet hat.
     * @param {String} message Der Text des Benutzers.
     */
    onResponseMessage: function(client, server, channel, user, message) {},

    /**
     * Wird aufgerufen, wenn eine Nachricht in einem Channel gesendet wird.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.Channel} channel Eine instanz der Channel Klasse, repräsentiert den Channel in dem die Nachricht gesendet wurde.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der die Nachricht gesendet hat.
     * @param {String} message Der komplette Text des Benutzers.
     */
    onChannelMessage: function(client, server, channel, user, message) {},

    /**
     * Wird aufgerufen, wenn eine Private Nachricht von einem benutzer empfangen wird.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der die Private Nachricht gesendet hat.
     * @param {String} message Der Text des Benutzers.
     */
    onPrivateMessage: function(client, server, user, message) {},

    /**
     * Wird aufgerufen, wenn ein Topidc empfangen wurde. Entweder, weil es gerade verändert wurde, oder weil gerade ein Channel betreten wurde.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.Channel} channel Eine instanz der Channel Klasse, repräsentiert den Channel in dem das Topic geändert wurde.
     * @param {String} topic Das Topic.
     * @param {String} nick Der Nick der das Topic gesetzt hat.
     * @param {Object.Date} date Eine instanz der Date Klasse, repräsentiert das Datum wann das Topic gesetzt wurde.
     */
    onTopic: function(client, server, channel, topic, nick, date) {},

    /**
     * Wird aufgerufen, wenn ein Benutzer (möglicherweise wir) einen Channel betritt. Bitte beachte, das dieses Event unmittelbar nach dem Betreten aufgerufen wird, und möglicherweise noch nicht alle Informationen des Benutzers durch eine WHOIS-Abfrage aktualisiert wurden.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.Channel} channel Eine instanz der Channel Klasse, repräsentiert den Channel den der Benutzer betreten hat..
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der den Channel Betreten hat.
     */
    onJoin: function(client, server, channel, user) {},

    /**
     * Wird aufgerufen, wenn ein Benutzer (möglicherweise wir) einen Channel verlassen.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.Channel} channel Eine instanz der Channel Klasse, repräsentiert den Channel den der Benutzer verlassen hat.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der den Channel verlassen hat.
     * @param {String} reason Der Grund, warum der Benutzer den Channel verlassen hat. Wurde kein Grund angegeben, so ist {reasonj} vom typ undefined.
     */
    onPart: function(client, server, channel, user, reason) {},

    /**
     * Wird aufgerufen, wenn ein Benutzer den IRC-Server verlässt.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der den Server verlassen hat.
     * @param {String} reason Der Grund, warum der Benutzer den Channel verlassen hat.
     */
    onQuit: function(client, server, user, reason) {},

    /**
     * Wird aufgerufen, wenn ein Benutzer aus einem Channel gekickt wird.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.Channel} channel Eine instanz der Channel Klasse, repräsentiert den Channel aus dem der Benutzer gekickt wurde.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der aus dem Channel gekickt wurde.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der {user} aus dem Channel gekickt hat.
     * @param {String} reason Der Grund, warum der Benutzer aus dem Channel gekickt wurde.
     */
    onKick: function(client, server, channel, user, by, reason) {},

    /**
     * Wird aufgerufen, wenn eine NOTICE-Nachricht empfangen wurde.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der die NOTICE-Nachricht gesendet hat.
     * @param {String} to Der Nick eines Benutzers, oder der Namen eines Channels der die NOTICE-Nachricht empfangen hat.
     * @param {String} text Die Nachricht die der Benutzer gesendet hat.
     */
    onNotice: function(client, server, user, to, text) {},

    /**
     * Wird aufgerufen, wenn eine ACTION-Nachricht empfangen wurde.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {String} from Der Nickname des Benutzers, der die ACTION-Nachricht gesendet hat.
     * @param {String} to Der Nick eines Benutzers, oder der Namen eines Channels der die ACTION-Nachricht empfangen hat.
     * @param {String} text Die Nachricht die der Benutzer gesendet hat.
     */
    onAction: function(client, server, from, to, text) {},

    /**
     * Wird aufgerufen, wenn eine CTCP-Nachricht empfangen wurde.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {String} from Der Nickname des Benutzers, der die CTCP-Nachricht gesendet hat.
     * @param {String} to Der Nick eines Benutzers, oder der Namen eines Channels der die CTCP-Nachricht empfangen hat.
     * @param {String} text Die Nachricht die der Benutzer gesendet hat.
     * @param {String} type Der Typ der CTCP-Nachricht.
     */
    onCTCP: function(client, server, from, to, text , type) {},
    /**
     * Wird aufgerufen, wenn ein Benutzer seinen Nick ändert.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Array.String} channeles Ein Array mit Channel Namen in denen der Benutzer seinen Namen geändert hat.
     * @param {Object.User} user Eine instanz der User Klasse, repräsentiert den Benutzer der seinen Nick geändert hat.
     * @param {String} oldNick Der alte Nick des Benutzers.
     * @param {String} newNick Der neue Nick des Benutzers.
     */
    onNick: function(client, server, channels, user, oldNick, newNick) {},

    /**
     * Wird aufgerufen, wenn ein benutzer uns in einen Channel einlädt.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {String} channel Der name des Channels in den wir eingeladen wurden.
     * @param {String} from Der Nick des Benutzers der uns eingeladen hat.
     */
    onInvite: function(client, server, channel, from) {},

    /**
     * Wird aufgerufen, wenn ein Mode in einem Channel geändert wird.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object.Channel} channel Eine instanz der Channel Klasse, repräsentiert den Channel in dem der Mode geändert wurde.
     * @param {String} by Der Nick des Benutzers, der den Mode geändert hat.
     * @param {String} mode Der Mode der geändert wurde.
     * @param {Boolean} add Ob der Mode gesetzt (true) oder entfernt (false) wurde.
     * @param {String} argument Mögliche argumente die mit dem Mode verändert wurden.
     */
    onMode: function(client, server, channel, by, mode, add, argument) {},

    /**
     * Wird aufgerufen, der Server den Bot an Pingt.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     */
    onPing: function(client, server) {},

    /**
     * Wird aufgerufen, wenn der Server mit einer Fehlermeldung antwortet.
     *
     * @param {Object.IRC.Client} client Eine instanz der IRC.Client Klasse.
     * @param {Object.Server} server Eine instanz der Server Klasse.
     * @param {Object} message Ein Objekt mit allen Informationen zur Nachricht.
     */
    onIRCError: function(client, server, message) {},

    /**
     * Wird aufgerufen, wenn ein Plugin geladen wird. 
     */
    onLoad: function() {},

    /**
     * Wird aufgerufen, wenn ein Plugin entfernt wird. 
     */
    onUnload: function() {}
};
```