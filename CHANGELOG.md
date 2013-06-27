# Version 0.2.5 (27.06.2013)
* QUIZ-Plugin: Das Quiz kann nun nur noch im Channel #quiz gespielt werden.
* QUIZ-Plugin: der Channel #quiz wird nun automatisch betreten/verlassen.
* RSS-Plugin: der Channel #rss wird nun automatisch betreten/verlassen.
* PING-Plugin: entfernt. !ping wurde im CONTROL-Plugin untergebracht.
* CONTROL-Plugin: Channel die Betreten/Verlassen werden, werden nun auch in der Config übernommen.


# Version 0.2.4 (27.06.2013)
* Neues Plugin: RSS.
* COMMAND-Plugin: !raw hinzugefügt.
* MySQL Fehler beim beenden möglicherweise behoben.
* GOOGLE-Plugin gefixxt.
* DUDEN-Plugin auf andere API umgeschrieben.
* 9GAG-Plugin auf das neue Seitenlayout von 9gag.com angepasst.
* !ping funktioniert jetzt wieder.
* daemon (hoffentlich) gefixxt.

# Version 0.2.3 (15.05.2013)
* HASH-Plugin gefixxt.
* QUIZ Tip gefixxt.

# Version 0.2.2 (14.05.2013)
* MEMORY-Plugin entfernt und den Befehl im CONTROL-Plugin unter gebracht.
* Quiz-Tipp gefixxt.
* EIn paar kleinigkeiten am webserver verbessert.

# Version 0.2.1 (10.05.2013)
* Ein Fehler wurde behoben, bei dem es beim beenden manchmal zu Fehlermeldungen bei Queries kam.
* Unnötige Abhängigkeit entfernt.
* Tabellen Layout für Channel- und Private Nachrichten geändert.
* DNS-Plugin entfernt. Die Funktionen wurde im NET-Plugin zusammen gefasst.
* GEO-Plugin entfernt. Die Funktionen wurde im NET-Plugin zusammen gefasst.
* Neues Plugin: NET.
* Neues Plugin: WEBSERVER. Der Update Intervall für den Cache kann während der Laufzeit über einen Befehl geändert werden, wird allerdings nicht gespeichert. Der Port muss vor dem starten in der Datei selbst geändert werden.
* bing entfernt.
* Help-System überarbeitet.
* Bug iim GOOGLE-Plugin entfernt.
* QUIZ-Plugin: Revolte eingebaut.
* QUIZ-Plugin: James postet nun nach 5 Fragen die Top Quizzer im Channel.
* QUIZ-Plugin: Bereits beantwortete Fragen sollten nun nicht noch einmal gestellt werden.

# Version 0.2.0 (04.05.2013)
* DOMAIN-Plugin entfernt.
* Neues Plugin: DNS-Plugin.
* Neues Plugin: QUIZ-Plugin.
* Für zukünftige updates werden nun joins, parts, kick, quits, sowie PN's und Channel-Nachrichten in der Datenbank gespeichert.
* Befehle in einem Plugin erwarten nun die Rückgabe von true wenn der Befehl verarbeitet wurde.
* Verarbeitung von WHOIS-Abfragen deutlich verbessert. Der Verarbeitung dauert nun wesentlich kürzer (5-10ms). Ändert allerdings nichts an den laggs.
* CONTROL-Plugin Hat nun 2 neue Befehle: part [Channel] und join <Channel>.

# Version 0.1.7 (01.05.2013)
* Plugins haben nun einen Eigenen Unterordner.
* Neues Plugin: GOOGLE.
* Plugins die mit einem "_" anfangen werden nicht geladen.
* HELP gefixxt.
* Neues Plugin: WOLFRAM.

# Version 0.1.6 (17.04.2013)
* Bug im URLTITLE-Plugin gefixxt.

# Version 0.1.5 (17.04.2013)
* Config umgestellt auf nconf.
* Welche Plugins in welchem Channel deaktiviert sind wird nun gespeichert und nach einem neustart wieder geladen.
* Bei !exit, !restart & !update wird nun bei zu wenig Rechten eine entsprechende Nachricht ausgegeben.

# Version 0.1.4 (17.04.2013)
* BITCOIN-Plugin wieder auf alte API geändert.
* Bei Unbehandelten Exceptions wird James nun versuchen "sicher" zu beenden, d.h alle Plugins zu entladen und dann abschalten.

# Version 0.1.3 (13.04.2013)
* Per !plugin enable/disable können einzelne Plugins nun nur für bestimmte Channel de-/aktiviert werden. Das entfernen aus dem Speicher (!plugin load/unload) sollte nur benutzt werden um defekte Plugins zu entfernen bzw. neue zu laden. Per !plugin listenabled werden alle Plugins aufgelistet die im moment im Channel aktiviert sind.
* Es werden nun automatisch alle Plugins im /plugins Ordner geladen. Der Eintrag aus der config.json wurde entfernt bzw wird ignoriert sofern noch vorhanden.
* MySQL anstelle von Files. Weil wegen isso. Tabellen werden automatisch erstellt.
* Erkennen von Usermodes innerhalb eines Channels gefixxt.
* BITCOIN-Plugin auf andere API geändert.
* INTELLIGENTS-Plugin entfernt.
* Neues Plugin: KARMA
* Neues Plugin: WIKIPEDIA
* Hilfe eingebaut. Per /msg James HELP bekommt man nun genaue Hilfe, auch zu den einzelnen Plugins (sofern vorhanden).
* Neues Event für Plugins: onHelpRequest: function(client, server, user, message, parts). Siehe Plugin-Entwicklung für mehr Informationen.
* Die ausgabe der einzelnen commits bei !update wurde entfernt.

# Version 0.1.2 (11.04.2013)
* daemon eingebaut. (siehe Installation Punkt 7). DUrch den Daemon wird James bei einem Crash/Exit automatisch neugestartet.
* Neues Plugin: CONTROL

# Version 0.1.1 (10.04.2013)
* Neues Plugin: DOMAIN
* index.js heisst nun james.js. (siehe Installation Punkt 7)
* Bug im URLTITLE-Plugin gefixxt.
* Sonderbehandlung für YouTube-Links beim Posten der URL-Titel.
* Befehl !fact für das FACTS-Plugin hinzugefügt.
* Befehl !btc für das BITCOIN-Plugin hinzugefügt.