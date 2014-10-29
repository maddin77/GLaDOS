var _ = require('underscore');

module.exports = function (scriptLoader) {
    var phrases = [
        'Habe 2 SAMP Projeke wo das lezte auch am Anfang erst ausgelacht wurden ist', // http://sa-mp.de/B++/p1984980-/
        'Mir kommt hier echt so vor alles was ich im Netz mache ist totaler mist', // http://sa-mp.de/B++/p1984964-/
        'bin 3 Schicht Arbeiter und noch ein Nebengewerbe also mir reicht es', // http://sa-mp.de/B++/p1915416-/
        'habe vor 12 Jahren das anglerboard mitgegründet da gab es halt noch kein zweites ist halt die macht im Netz', // http://sa-mp.de/B++/p1915701-/
        'Ich habe manche Foren an die Wand gefahren aber egal Juckt mich doch nicht ;)', // http://sa-mp.de/B++/p1915207-/
        'Henner On Air !', // http://sa-mp.de/B++/p1863731-/
        'Danke an die samp community das ich hier Werbung schreiben darf', // http://sa-mp.de/B++/p1393617-/
        'Der Mann aus Nordhessen', // http://forum.sa-mp.de/index.php?page=User&userID=23377
        'Ich war bei TV Total Stock Car und bin bei Elton mitgefahren', // http://forum.sa-mp.de/index.php?page=User&userID=23377
        'TV Total Stock Car 2010 - ich war dabei', // http://forum.sa-mp.de/index.php?page=User&userID=23377
        'Soo ich bin der Henner alias Kai bin fast 33 und verheiratet und habe 2 Kinder', // http://sa-mp.de/B++/p1150653-/
        'wenn man brennt hat man pech dabei sein ist doch alles manche würden sich freuen das mal mit zuerleben', //http://sa-mp.de/B++/p1150721-/
        'Ein Forum das Online ist ohne Impressum ist gefährlich', //http://forum.sa-mp.de/gta-fremdes/werbung-und-events/homepage-werbung/210872-die-deutsche-epoch-community/#post1985231
        'ich finde es hier lustig ich bleibe', //http://forum.sa-mp.de/gta-fremdes/off-topic/smalltalk/208895-smalltalk-226#post1985116
        'bin schon viel zu alt für die Samp Szene', //http://forum.sa-mp.de/gta-fremdes/off-topic/smalltalk/208895-smalltalk-225#post1985020
        'man redet doch immer seine eigene Projekte gut', //http://forum.sa-mp.de/gta-fremdes/off-topic/smalltalk/208895-smalltalk-186#post1981636
        'Naja sagen wir mal soo Ich habe da so ein Gefühl kenne je auch viele RP Server', //http://forum.sa-mp.de/gta-fremdes/off-topic/smalltalk/208895-smalltalk-180#post1981182
        'Its henner Time', //sagt er zu oft für eine Quelle. Eine: https://www.youtube.com/watch?feature=player_detailpage&v=J_nzc-dpqAQ&list=UUsdf_os0T0MizL_GRDYsLDQ#t=173
    ];

    scriptLoader.on('command', 'henner', function (event) {
        var text = _.sample(phrases).toLowerCase().replace(/[^\w\s]|_/g, ''); //Für die extra Portion Henner (alles klein -> satzezeichen entfernen)
        event.channel.say('"' + text + '" — Henner');
    });
};
