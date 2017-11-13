
define('PDFJS', ['/js/dist/pdf/shared/util.js'], function () { return PDFJS; });

require.config({
    paths: {
        '@':"@wall",
        async: 'dist/requirejs-plugins/src/async'   
    }
});

define( ['app', 'access', 'global.view.headerView', 'mainView', 'global.radio.loader'],

function (App, acc, Header, mainView) {

    var init = function () {

        $.ajaxSetup( {

            headers: {
                'key': $.ajaxSettings.url
            }
        });

        App.access = acc.data.Points;

        function handler() {
            Backbone.history.navigate('', { trigger: true });
        }
        
        $("header .logo").on("click", handler);
        $("header .logo").on("touchstart", handler);

        var appRouter = Mn.AppRouter.extend({
            routes: {

                '': function () {
                    dashboards.getView().showFirst('my');
                    $('head meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0');
                },

                'demo': function () {
                    dashboards.getView().showFirst('shared');
                    $('head meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0');
                },

                'new': function () {
                    dashboards.getView().options.uid = null;
                    dashboards.getView().onShow();
                    $('head meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1.0');
                },

                ':uid': function (uid) {
                    dashboards.getView().options.uid = uid;
                    dashboards.getView().onShow();
                }

            }
        });

        var app = Mn.Application.extend({

            region: 'main',

            onStart: function () {

                this.showView(new mainView());

                new Header().render();

                Backbone.history.start();
            }

        });

        new appRouter;
        var dashboards = new app;
        dashboards.start();

    };

    return {
        init: init
    };
});


