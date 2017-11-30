"use strict";

define('includeModules', ['access'], function (a) {

    var output = [],
        isDev = a.data.IsDev,
        all = [
            { name: 'dashboard', show: 1 },
            { name: 'compliance', show: 0 },
            { name: 'analyst', show: 0 },
            { name: 'wiki', show: -1 },
            { name: 'check', show: -1 },
            { name: 'monitoring', show: -1 },
            { name: 'text', show: -1 },             //"TextMiner"
            { name: 'ontology', show: -1 },         //"Ontology Editor"
            { name: 'global', show: -1 },
            { name: "enterprise", show: -1 },
            { name: 'request', show: 0 },          //"Request Library"
            { name: 'robot', show: 0 }             //"Robot's collection"
        ];

    //return _.chain(all).filter(function (e) { return isDev ? e.show !== -1 : e.show !== -1 && e.show !== 0; }).map(function (e) { return e.name; }).toArray().value();
    return _.chain(all).map(function (e) { return e.name; }).toArray().value();
});

define( 'jquery', [], function () { return jQuery; });

// signalR wrap
define( 'SJ', [], function () { return SJ; });

define( 'underscore', [], function () { return _; });

define( 'backbone', [], function () { return Backbone; });

define( 'Mn', [], function () { return Marionette; });

define('syncfusion', ['/js/dist/jsrender.min.js', '/js/dist/ej.web.all.min.js'], function (r, ej) { return ej; });

var segments = _.compact(location.pathname.split("/")),
    length = segments.length - 1,
    point = 'main';

if (length === 1)
    point = segments[length].indexOf('db') !== -1 ? 'analyst' : segments[1].toLocaleLowerCase();
else if (length > 1)
    point = segments[length].toLocaleLowerCase();

var mobileAndTabletcheck = function () {
    var check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};
var isMobile = mobileAndTabletcheck();

require.config({
    urlArgs: 'v=5.0884',
    baseUrl: '/js',
    waitSeconds: 120,
    paths: {
        glo: '/frontend/public/js/global.min',
        point: '/frontend/public/js/' + point + '/index.min',
        i18n: 'dist/i18n.min',
        text: 'dist/text.min',
        g: '@global/views',
        localText: 'nls/ej.localetexts.ru-RU.min',
        RU: 'nls/ej.culture.ru-RU'
    },
    shim: {
        localText: { deps: ['syncfusion'] },
        'RU': {
            deps: ['syncfusion', 'localText'],
            exports: 'RU'
        }
    }
});

//'/signalr/hubs', '/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'

require( ['i18n!nls/resources.min', 'glo','/signalr/hubs', 'SJ'],
    function ( access, Resources, global ) {

        require( ['/scripts/IWC-SignalR-master/signalr-patch.js', '/scripts/IWC-SignalR-master/iwc-signalr.js'], function () {

            require( ['point'], function ( module ) {
                module.init();
            });

            //var hub = SJ.iwc.SignalR.getHubProxy( 'Ticker', {

            //    client: {

            //        //log: function ( kind, message ) {
            //        //    var connectionID = SJ.iwc.SignalR.getConnectionId(),
            //        //        encodedMsg = $( '<div />' ).text( kind + " : " + message ).html();

            //        //    $( "#cid" ).text( connectionID );
            //        //    $( "#wid" ).text( SJ.iwc.WindowMonitor.getThisWindowId() );

            //        //    $( '#discussion' ).html( '<li> status[' + SJ.iwc.SignalR.getState() + "] " + encodedMsg + '</li>' );

            //        //    if ( SJ.iwc.SignalR.isConnectionOwner() ) {
            //        //        $( "#isc" ).text( "true" );
            //        //        $( "#co" ).text( SJ.iwc.SignalR.getConnectionOwnerWindowId() );
            //        //    } else {
            //        //        $( "#isc" ).text( "false" );
            //        //        $( "#co" ).text( "not me" );
            //        //    }
            //        //}
            //    }
            //});

            //SJ.iwc.WindowMonitor.onWindowsChanged( function ( openWindows, closedWindows ) {
            //    if ( openWindows.length ) {
            //        log( "Open Window - " + openWindows );//'openWindow'
            //    } else if ( closedWindows.length ) {
            //        log( "Close Window - " + closedWindows );//'closedWindowId'
            //    }
            //});

        });


        //if (SJ.iwc.SignalR.getState() === 4) {
        //    console.log("SignalR > State = 4 (Start Listning)");
        //    hub.server.startListening();
        //    console.log("SianalR Hub", { hub: hub });
        //}

        //var tryingReconnect = false;
        //SJ.iwc.SignalR.on("reconnected", function () {
        //    tryingReconnect = false;
        //});

        //SJ.iwc.SignalR.on("reconnecting", function () {
        //    tryingReconnect = true;
        //});

        //SJ.iwc.WindowMonitor.onWindowsChanged(function (openWindows, closedWindows) {
        //    if (openWindows.length) {
        //        console.log("SignalR Open Window " + openWindows);//'openWindow'
        //    } else if (closedWindows.length) {
        //        console.log("SignalR Close Window " + closedWindows);//'closedWindowId'
        //    }
        //});

        //if (SJ.iwc.WindowMonitor.isReady()) {
        //    console.log("SignalR This WindowID "+SJ.iwc.WindowMonitor.getThisWindowId());
        //}

        //SJ.iwc.SignalR.on( "disconnected", function () {
        //    if ( tryingReconnect ) {
        //        console.log( "SignalR Hub Disconnected ... Starting" );
        //        clearTimeout( tout );
        //        tout = setTimeout( start, 5000 ); // Restart connection after 5 seconds.
        //    }
        //});

        window.onerror = function () {
            Backbone.trigger( "message:hide" );
            $( ".loader-indicator" ).remove();
        };

        if ( mobileAndTabletcheck() ) {
            // todo:
        } else {

            var isOpera = !!window.opera || navigator.userAgent.indexOf( ' OPR/' ) >= 0,
                isChrome = !!window.chrome && !isOpera;

            // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
            var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
            var isSafari = Object.prototype.toString.call( window.HTMLElement ).indexOf( 'Constructor' ) > 0;
            var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

            if ( !isChrome ) {
                $( "body" ).append( $( "<div id='check-browser'><p><span>:(</span><br/><span>" + Resources.chrome +
                    "</span><a href='https://www.google.ru/chrome/browser/desktop/' target='_blank'><img src='/images/icon_gc.png' alt='' />&nbsp; &nbsp;<span>" + Resources.loadGC +
                    "</span></a><span class ='icon-close' title='" + Resources.skip +
                    "' onclick='this.parentNode.parentNode.setAttribute(\"style\",\"display:none\")'><svg><use xlink:href='#icon-close' /></svg></span></p></div>" ) );
            }
        }

    });