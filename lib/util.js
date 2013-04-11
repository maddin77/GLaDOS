module.exports = {
    endsWith: function(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },
    startsWith: function(str, suffix) {
        return str.lastIndexOf(suffix, 0) === 0;
    },
    getMonthName: function(date) {
        var monthNames = [ "Januar", "Februar", "März", "April", "Mai", "Juni","Juli", "August", "September", "Oktober", "November", "Dezember" ];
        return monthNames[date.getMonth()];
    },
    checkForSmilie: function(text) {
        var smiliesFound = [];
        for(var i=0; i<CONFIG.matchSmilies.length; i++) {
            var smilie = CONFIG.matchSmilies[i];
            var patsmi = "";
            for(var j=0; j<smilie.length; j++) {
                if( new RegExp("[a-z0-9]","i").test(smilie[j]) ) {
                    patsmi += smilie[j];
                }
                else {
                    patsmi += "\\"+smilie[j];
                }
            }
            var patt = new RegExp("(" + patsmi + ")", "g");
            if(patt.test(text)) {
                //console.log("SMILED => " + smilie);
                smiliesFound.push(i);
            }
        }
        return smiliesFound;
    },
    readableNumber: function(bytes) {
        var suffix = ['B','KB','MB','GB'];
        var i = 0;
        while (bytes > 1024 && i < suffix.length - 1) {
            ++i;
            bytes = Math.round((bytes / 1024) * 100) / 100;
        }
        return (bytes) + " " + suffix[i];
    },
    findUrls: function(text) {
        var source = (text || '').toString();
        var urlArray = [];
        var url;
        var matchArray;
        var regexToken = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?", "g");
        while( (matchArray = regexToken.exec( source )) !== null )
        {
            var token = matchArray[0];
            urlArray.push( token );
        }
        return urlArray;
    },
    formatTime: function(s) {
        var h=0,m=0,r='';
        while(s > 60) {
            s-=60;
            m++;
        }
        while(m > 60) {
            m-=60;
            h++;
        }
        if(h > 0) r += h+":";
        r += m+":"+s;
        return r;
    },
    ytVidId: function(url) {
        var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
        return (url.match(p)) ? RegExp.$1 : false;
    }
};

String.prototype.rmatch = function(pattern, modifier, callback) {
    var r = new RegExp(pattern, callback === undefined ? "ig" : modifier).exec(this);
    if(r !== null) {
        if(callback === undefined) {
            modifier(r);
        } else {
            callback(r);
        }
    }
};