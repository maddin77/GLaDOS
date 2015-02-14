# Server Object
#### getMotd()
#### getChannel( name )
#### getUser( nick )
#### getLastPing()

# Channel Object
#### getName()
#### getUserCount()
#### getTopic()
#### userExistInChannel( nick )
#### userHasMode( nick, mode )
#### userHasMinMode( nick, mode )
#### getModes()
#### say( message )
#### kick( nick, reason )

# User Object
#### getNick()
#### getUserName()
#### getHost()
#### getServer()
#### getRealname()
#### getInChannels()
#### getAccount()
#### getIdleTime()
#### isOnline()
#### hasPermissions()
#### say( message )
#### notice( message )
#### whois()

# Plugin
## Variables
#### glados
#### logger
#### redis
#### client
## Callbacks
#### onJoin( server, channel, user )
#### onPart( server, channel, user, reason )
#### onQuit( server, user, channels, reason )
#### onKick( server, channel, user, by, reason )
#### onKill( server, user, channels, reason )
#### onHelp( server, user, text )
#### onPrivateMessage( server, user, text )
#### onCommand( server, channel, cmdName, params, user, msg, text )
#### onResponseMessage( server, channel, user, text )
#### onChannelMessage( server, channel, user, text )
#### onNotice( server, user, to, text )
#### onPing( server )
#### onCTCP( server, from, to, text, type )
#### onNick( server, channels, user, oldnick, newnick )
#### onInvite( server, channel, user )
#### onMode( server, channel, user, mode, argument, add )
#### onLoad()
#### onUnload()