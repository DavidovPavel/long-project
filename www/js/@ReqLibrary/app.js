
require.config({
    paths: {
        '@': "@Services/library"
    }
});

define(['app', 'access', 'i18n!nls/resources.min', 'global.view.headerView', 'library.mainView'],

function (App, acc, Resources, Header, MainView) {


    var init = function () {

        App.access = acc.data.Points;
        App.baseType = acc.data.Kind;

        $.ajaxSetup({
            headers: {
                'key': $.ajaxSettings.url
            }
        });

        $(document).find("head>title").text(Resources.titleReqLib);


        $(".logo").on("click", function () {
            location.href = location.pathname;
        });


        var app = Mn.Application.extend({

            region: 'main',

            onStart: function () {

                this.getRegion().show(new MainView);

                new Header().render();

            }
        });

        new app().start();

    }

    return {
        init: init
    }
});