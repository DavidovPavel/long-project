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
    'global.radio.loader'
],
function (App, acc, Resources, Header, sourcesManager) {

    var init = function () {

        App.access = acc.data.Points;
        App.baseType = acc.data.Kind;

        $.ajaxSetup({
            headers: {
                'key': $.ajaxSettings.url
            }
        });

        var appS = Mn.Application.extend({

            region: 'main',

            onStart: function () {

                $(document).find("head>title").text(Resources.titleSearchRobots);

                this.getRegion().show(new sourcesManager({ model: new Backbone.Model({ "BySaType": null, "SelectedCountries": [Resources.Lang] }) }));

                new Header().render();

            }
        });

        var AppS = new appS();
        AppS.start();

        $(".logo").on("click", function () {
            location.href = location.pathname;
        });
    }

    return {
        init: init
    }
});