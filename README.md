# James

## ToDo
moar plugins

## Installation

1. Installiere [node.js](http://nodejs.org/).
2. `$ git clone git@github.com:maddin77/James.git`
3. `$ cd James`
4. Installiere alle abhängigkeiten mit npm:
<pre>$ npm install</pre>
5. unter `config/` die Datei `default.config.json` in `config.json` umbenennen und den Wünschen nach anpassen (siehe [konfiguration](#konfiguration)).
6. Den Ordner `data/` erstellen. 
7. per `node pfad/zu/james` bzw. `node index.js`(innerhalb des Ordner) starten.
8. ...
9. profit.

## Konfiguration
```javascript
{
    "commandChar": "!", //Char zum erkennen von Befehlen
    "permissions": [], //Benutzer die Spezielle Rechte haben (update, exit, etc.)
    "quitMSG": "bye", //Nachricht die beim Beenden gesendet wird (quit: )
    "version": "1337^drölf", //antwort auf ctcp-version

    "plugins": [], //Plugins die beim start geladen werden sollen.

    "loggin": {
        "log": true, //standard ausgabe an/aus
        "debug": true, //debug ausgabe an/aus
        "error": true //fehler ausgabe an/aus
    },

    "irc": {
        "server": "chat.kerat.net", //host des irc-servers
        "nick": "", //nick des bots
        "userName": "", //name des bots
        "realName": "", //realname des bots
        "password": "", //passwort des bots (nickserv)
        "port": 6667, //port des irc-servers
        "debug": false, //irc debug an/aus
        "showErrors": false, //selbsterklärend...
        "autoRejoin": true, //selbsterklärend...
        "autoConnect": true, //selbsterklärend...
        "channels": ["#dev"], //selbsterklärend...
        "secure": false, //ssl ja/nein
        "selfSigned": false, //selbst signierte zertifikate erlauben ja/nein
        "certExpired": false, //abgelaufene zertifikate erlauben ja/nein
        "floodProtection": false, //verhindert, das zu viele nachrichten auf einmal an den server gesendet werden
        "floodProtectionDelay": 1000 //s.o
    }
}
```