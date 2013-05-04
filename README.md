# James
Installation, Konfiguration und weitere Infos gibts [hier](http://maddin77.github.io/James/).

## Lizenz
============
Everyone is permitted to copy and distribute verbatim or modified 
copies of this software and associated documentation files, and 
changing it is allowed as long as the name is changed.

You just DO WHAT THE FUCK YOU WANT TO. 

This program is free software. It comes without any warranty, to
the extent permitted by applicable law. You can redistribute it
and/or modify it under the terms of the Do What The Fuck You Want
To Public License, Version 2, as published by Sam Hocevar. See
http://sam.zoy.org/wtfpl/COPYING for more details

## Bekannte Fehler
============
* Beim beenden kann es manchmal zu Fehlermeldungen bei Queries kommen. Ist aber nicht weiter tragisch.

## Changelog
============
### Version 0.2.0 *(04.05.2013)*
* [domain](https://github.com/maddin77/James/blob/master/plugins/domain) entfernt.
* **Neues Plugin**: [dns](https://github.com/maddin77/James/blob/master/plugins/dns)
* **Neues Plugin**: [quiz](https://github.com/maddin77/James/blob/master/plugins/quiz)
* Für zukünftige updates werden nun joins, parts, kick, quits, sowie PN's und Channel-Nachrichten in der Datenbank gespeichert.
* Befehle in einem Plugin erwarten nun die Rückgabe von ```true``` wenn der Befehl verarbeitet wurde.
* Verarbeitung von WHOIS-Abfragen deutlich verbessert. Der Verarbeitung dauert nun wesentlich kürzer (5-10ms). Ändert allerdings nichts an den laggs.
* [control](https://github.com/maddin77/James/blob/master/plugins/control) Hat nun 2 neue Befehle: `part [Channel]` und `join <Channel>`.

### Version 0.1.7 *(01.05.2013)*
* Plugins haben nun einen Eigenen Unterordner.
* **Neues Plugin**: [google](https://github.com/maddin77/James/blob/master/plugins/google)
* Plugins die mit einem "_" anfangen werden nicht geladen.
* HELP gefixxt.
* **Neues Plugin**: [wolfram](https://github.com/maddin77/James/blob/master/plugins/wolfram)

### Version 0.1.6 *(17.04.2013)*
* Plugin [urltitle](https://github.com/maddin77/James/blob/master/plugins/urltitle) gefixxt.

### Version 0.1.5 *(17.04.2013)*
* Config umgestellt auf [nconf](https://github.com/flatiron/nconf).
* Welche Plugins in welchem Channel deaktiviert sind wird nun gespeichert und nach einem neustart wieder geladen.
* Bei `!exit`, `!restart` & `!update` wird nun bei zu wenig Rechten eine entsprechende Nachricht ausgegeben.

### Version 0.1.4 *(17.04.2013)*
* [bitcoin](https://github.com/maddin77/James/blob/master/plugins/bitcoin) Plugin wieder auf alte API geändert.
* Bei Unbehandelten Exceptions wird James nun versuchen "sicher" zu beenden, d.h alle Plugins zu entladen und dann abschalten.

### Version 0.1.3 *(13.04.2013)*
* Per `!plugin enable/disable` können einzelne Plugins nun nur für bestimmte Channel de-/aktiviert werden. Das entfernen aus dem Speicher (`!plugin load/unload`) sollte nur benutzt werden um defekte Plugins zu entfernen bzw. neue zu laden. Per `!plugin listenabled` werden alle Plugins aufgelistet die im moment im Channel aktiviert sind.
* Es werden nun automatisch alle Plugins im `/plugins` Ordner geladen. Der Eintrag aus der `config.json` wurde entfernt bzw wird ignoriert sofern noch vorhanden.
* MySQL anstelle von Files. Weil wegen isso. Tabellen werden automatisch erstellt.
* Erkennen von Usermodes innerhalb eines Channels gefixxt.
* [bitcoin](https://github.com/maddin77/James/blob/master/plugins/bitcoin) Plugin auf andere API geändert.
* [intelligenTs](https://github.com/maddin77/James/blob/master/plugins/intelligenTs) entfernt.
* **Neues Plugin**: [karma](https://github.com/maddin77/James/blob/master/plugins/karma)
* **Neues Plugin**: [wikipedia](https://github.com/maddin77/James/blob/master/plugins/wikipedia)
* Hilfe eingebaut. Per `/msg James HELP` bekommt man nun genaue Hilfe, auch zu den einzelnen Plugins (sofern vorhanden).
* Neues Event für Plugins: `onHelpRequest: function(client, server, user, message, parts)`. Siehe [Plugin-Entwicklung](#plugin-entwicklung) für mehr Informationen.
* Die ausgabe der einzelnen commits bei `!update` wurde entfernt.
* Bugfix [723884](http://paste.kde.org/723884/)

### Version 0.1.2 *(11.04.2013)*
* daemon eingebaut. (siehe [Installation Punkt 7](#installation)). DUrch den Daemon wird James bei einem Crash/Exit automatisch neugestartet.
* **Neues Plugin**: [control](https://github.com/maddin77/James/blob/master/plugins/control)

### Version 0.1.1 *(10.04.2013)*
* **Neues Plugin**: [domain](https://github.com/maddin77/James/blob/master/plugins/domain)
* `index.js` heisst nun `james.js`. (siehe [Installation Punkt 7](#installation))
* Plugin [urltitle](https://github.com/maddin77/James/blob/master/plugins/urltitle) gefixxt.
* Sonderbehandlung für YouTube-Links beim Posten der URL-Titel.
* Befehl `!fact` für das Plugin [facts](https://github.com/maddin77/James/blob/master/plugins/facts) hinzugefügt.
* Befehl `!btc` für das Plugin [bitcoin](https://github.com/maddin77/James/blob/master/plugins/bitcoin) hinzugefügt.