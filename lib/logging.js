module.exports = {

	parseStrings: {
		'{@reset}':		'\033[0m',

		'{@bold}':		'\033[1m',
		'{@italic}':	'\033[3m',
		'{@underline}':	'\033[4m',
		'{@blink}':		'\033[5m',
		'{@inverse}':	'\033[7m',

		'{@black}':		'\033[30m',
		'{@grey}':		'\033[90m',
		'{@red}':		'\033[31m',
		'{@green}':		'\033[32m',
		'{@yellow}':	'\033[33m',
		'{@blue}':		'\033[34m',
		'{@magenta}':	'\033[35m',
		'{@cyan}':		'\033[36m',
		'{@white}':		'\033[37m',

		'{@tab}':		'\t',
		'{@nl}':		'\n'
	},

	parse: function(s) {
		for(var code in this.parseStrings) {
			var replace = this.parseStrings[code];
			var re = new RegExp(code, 'g');
			s = s.replace( re, replace);
		}
		return s;
	},

	log: function() {
		if(!CONFIG.loggin.log) return;
		if( typeof arguments[0] === "undefined") return;
		var data = this.parseObj(arguments[0]);
		for (var i=1; i<arguments.length; i++) {
			data = data.replace("%s", arguments[i]);
		}
		
		data = this.parse(data);
		
		var time = "["+this.getTime()+"]";
		console.log( '\033[0m' + time + "[" + '\033[32m' + " LOG " + '\033[0m' + "] " + data + '\033[0m');
	},
	error: function() {
		if(!CONFIG.loggin.error) return;
		if( typeof arguments[0] === "undefined") return;
		var data = this.parseObj(arguments[0]);
		for (var i=1; i<arguments.length; i++) {
			data = data.replace("%s", arguments[i]);
		}
		
		data = this.parse(data);
		
		var time = "["+this.getTime()+"]";
		console.error( '\033[0m' + time + "[" + '\033[31m' + "ERROR" + '\033[0m' + "] " + data + '\033[0m');
	},
	debug: function() {
		if(!CONFIG.loggin.debug) return;
		if( typeof arguments[0] === "undefined") return;
		var data = this.parseObj(arguments[0]);
		for (var i=1; i<arguments.length; i++) {
			data = data.replace("%s", arguments[i]);
		}
		
		data = this.parse(data);
		
		var time = "["+this.getTime()+"]";
		console.error( '\033[0m' + time + "[" + '\033[36m' + "DEBUG" + '\033[0m' + "] " + data + '\033[0m');
	},
	parseObj: function(s) {
		if(typeof s === "boolean") {
			return s?"true":"false";
		}
		else if(typeof s === "object") {
			return JSON.stringify(s);
		}
		else if(typeof s === "null") {
			return "null";
		}
		else return s;
	},
	getTime: function() {
		var
			d = new Date(),
			h = d.getHours(),
			s = d.getMinutes(),
			m = d.getSeconds()
		;
		if( h < 10 ) h = ("0" + h).slice(-2);
		if( s < 10 ) s = ("0" + s).slice(-2);
		if( m < 10 ) m = ("0" + m).slice(-2);
		else if( m > 99 ) m = ("0" + m).slice(2);
		return h + ":" + s + ":" + m;
	}
};