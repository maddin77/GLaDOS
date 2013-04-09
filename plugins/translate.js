module.exports = {
	languages: {
		"af": "Afrikanisch",
		"sq": "Albanisch",
		"ar": "Arabisch",
		"az": "Aserbaidschan",
		"eu": "Baskisch",
		"bn": "Bengalisch",
		"be": "Weißrussisch",
		"bg": "Bulgarisch",
		"ca": "Katalanisch",
		"zh-CN": "Vereinfachtes Chinesisch",
		"zh-TW": "Traditionelles Chinesisch",
		"hr": "Kroatisch",
		"cs": "Tschechisch",
		"da": "Dänisch",
		"nl": "Holländisch",
		"en": "Englisch",
		"eo": "Esperanto",
		"et": "Estnisch",
		"tl": "Philippinisch",
		"fi": "Finnisch",
		"fr": "Französisch",
		"gl": "Galicisch",
		"ka": "Georgisch",
		"de": "Deutsch",
		"el": "Griechisch",
		"gu": "Gujarati",
		"ht": "Haitianisch",
		"iw": "Hebräisch",
		"hi": "Hindi",
		"hu": "Ungarisch",
		"is": "Isländisch",
		"id": "Indonesisch",
		"ga": "Irisch",
		"it": "Italienisch",
		"ja": "Japanisch",
		"kn": "Kanaresisch",
		"ko": "Koreanisch",
		"la": "Latein",
		"lv": "Lettisch",
		"lt": "Litauisch",
		"mk": "Mazedonisch",
		"ms": "Malaiisch",
		"mt": "Maltesisch",
		"no": "Norwegisch",
		"fa": "Persisch",
		"pl": "Polnisch",
		"pt": "Portugiesisch",
		"ro": "Romänisch",
		"ru": "Russisch",
		"sr": "Serbisch",
		"sk": "Slowakisch",
		"sl": "Slovenisch",
		"es": "Spanisch",
		"sw": "Swahili",
		"sv": "Schwedisch",
		"ta": "Tamilisch",
		"te": "Telugu",
		"th": "Thailändisch",
		"tr": "Türkisch",
		"uk": "Ukrainisch",
		"ur": "Urdu",
		"vi": "Vietnamesisch",
		"cy": "Walisisch",
		"yi": "Jiddisch"
	},

	onCommand: function(client, server, channel, commandChar, name, params, user, text, message) {
		if(name == "t" || name == "translate") {
			if(params.length < 3) return client.notice(user.getNick(), commandChar + name + " <Von> <Nach> <Wort/Text>");
			var origin = params[0];
			for(var l in this.languages) {
				if(l == origin || this.languages[l] == origin) origin = l;
			}
			var target = params[1];
			for(var _l in this.languages) {
				if(_l == target || this.languages[_l] == target) target = _l;
			}
			var term = text.slice(params[0].length + 1 + params[1].length + 1);
			var url = "https://translate.google.com/translate_a/t?client=t&hl=de&multires=1&sc=1&sl=" + origin + "&ssel=0&tl=" + target + "&tsel=0&uptl=de&text=" + encodeURIComponent(term);
			var that = this;
			REQUEST(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					if(body.length > 4 && body[0] == '[') {
						var parsed = eval(body);
						var language = that.languages[parsed[2]];
						parsed = parsed[0] && parsed[0][0] && parsed[0][0][0];
						if (parsed) {
							client.say(channel.getName(), user.getNick() + ": \"" + term + "\" bedeutet \"" + parsed + "\" in " + that.languages[target]);
						}
					}
				}
			});
		}
	}
};