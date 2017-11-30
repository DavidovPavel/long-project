require.config({
    paths: {
        '@': "@Services/sources"
    }
});

define([
    'app',
    'access',
    'i18n!nls/resources.min',
    'global.view.headerView',
    'services.sources.mainView',
    'services.sources.mainView_new',
    'global.radio.loader'
],
    function (App, acc, Resources, Header, sourcesManager, sourcesManager_new)
    {

        var init = function ()
        {

            App.access = acc.data.Points;
            App.baseType = acc.data.Kind;

            $.ajaxSetup({
                headers: {
                    'key': $.ajaxSettings.url
                }
            });

            var appS = Mn.Application.extend({

                region: 'main',

                onStart: function ()
                {
                    if (Backbone.history) {
                         Backbone.history.start()
                    }

                    if (Backbone.history.fragment === "NEW")
                    {
                        Backbone.history.navigate("NEW");
                    }
                }
            });

            var AppRouter = Mn.AppRouter.extend({
                routes: {

                    '': function ()
                    {
                        $(document).find("head>title").text(Resources.titleSearchRobots);
                        AppS.getRegion().show(new sourcesManager({ model: new Backbone.Model({ "BySaType": null, "SelectedCountries": [Resources.Lang] }) }));

                        new Header().render();
                    },

                    'NEW': function ()
                    {
                        AppS.getRegion().show(new sourcesManager_new());

                        new Header().render();
                    },
                }
            });


            var AppS = new appS();
            var app_router = new AppRouter;
            AppS.router = app_router;

            AppS.start();

            $(".logo").on("click", function ()
            {
                location.href = location.pathname;
            });
        }

        return {
            init: init
        }
    });