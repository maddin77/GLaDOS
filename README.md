# James

## ToDo
============
moar plugins

## Installation
============

1. Installiere [node.js](http://nodejs.org/).
2. `$ git clone https://github.com/maddin77/James.git`
3. `$ cd James`
4. Installiere alle abhängigkeiten mit npm:
<pre>$ npm install</pre>
5. Eine neue MySQL-Datenbank für James erstellen. 
6. Unter `config/` die Datei `default.config.json` in `config.json` umbenennen und den Wünschen nach anpassen (siehe [konfiguration](#konfiguration)).
7. per `node daemon.js` *(innerhalb des Ordner)* starten.
8. ...
9. profit.

## Konfiguration
============
```javascript
{
    "commandChar": "!", //Char zum erkennen von Befehlen
    "permissions": [], //Benutzer die Spezielle Rechte haben (update, exit, etc.)
    "quitMSG": "bye", //Nachricht die beim Beenden gesendet wird (quit: )
    "version": "1337^drölf", //antwort auf ctcp-version

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
    },

    "mysql": {
        "host": "127.0.0.1", //host des MySQL-Servers
        "user": "", //MySQL Benutzer
        "pass": "", //MySQL Passwort
        "database": "James" //MySQL Datenbank Name
    }
}
```
## Plugin-Entwicklung
============
[Look here.](https://github.com/maddin77/James/tree/master/plugins)

## Changelog
============
### Version 0.1.3 *(13.04.2013)*
* Per `!plugin enable/disable` können einzelne Plugins nun nur für bestimmte Channel de-/aktiviert werden. Das entfernen aus dem Speicher (`!plugin load/unload`) sollte nur benutzt werden um defekte Plugins zu entfernen bzw. neue zu laden. Per `!plugin listenabled` werden alle Plugins aufgelistet die im moment im Channel aktiviert sind.
* Es werden nun automatisch alle Plugins im `/plugins` Ordner geladen. Der Eintrag aus der `config.json` wurde entfernt bzw wird ignoriert sofern noch vorhanden.
* MySQL anstelle von Files. Weil wegen isso. Tabellen werden automatisch erstellt.
* Erkennen von Usermodes innerhalb eines Channels gefixxt.
* [bitcoin](https://github.com/maddin77/James/blob/master/plugins/bitcoin.js) Plugin auf andere API geändert.
* [intelligenTs](https://github.com/maddin77/James/blob/master/plugins/intelligenTs.js) entfernt.
* **Neues Plugin**: [karma](https://github.com/maddin77/James/blob/master/plugins/karma.js)
* **Neues Plugin**: [wikipedia](https://github.com/maddin77/James/blob/master/plugins/wikipedia.js)
* Hilfe eingebaut. Per `/msg James HELP` bekommt man nun genaue Hilfe, auch zu den einzelnen Plugins (sofern vorhanden).
* Neues Event für Plugins: `onHelpRequest: function(client, server, user, message, parts)`. Siehe [Plugin-Entwicklung](#plugin-entwicklung) für mehr Informationen.
* Die ausgabe der einzelnen commits bei `!update` wurde entfernt.
* Bugfix [723884](http://paste.kde.org/723884/)

### Version 0.1.2 *(11.04.2013)*
* daemon eingebaut. (siehe [Installation Punkt 7](#installation)). DUrch den Daemon wird James bei einem Crash/Exit automatisch neugestartet.
* **Neues Plugin**: [control](https://github.com/maddin77/James/blob/master/plugins/control.js)

### Version 0.1.1 *(10.04.2013)*
* **Neues Plugin**: [domain](https://github.com/maddin77/James/blob/master/plugins/domain.js)
* `index.js` heisst nun `james.js`. (siehe [Installation Punkt 7](#installation))
* Plugin [urltitle](https://github.com/maddin77/James/blob/master/plugins/urltitle.js) gefixxt.
* Sonderbehandlung für YouTube-Links beim Posten der URL-Titel.
* Befehl `!fact` für das Plugin [facts](https://github.com/maddin77/James/blob/master/plugins/facts.js) hinzugefügt.
* Befehl `!btc` für das Plugin [bitcoin](https://github.com/maddin77/James/blob/master/plugins/bitcoin.js) hinzugefügt.