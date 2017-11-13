require.config({
    paths: {
        '@': "@Express"
    }
});

define(['app',
        'access',
        'i18n!nls/resources.min',
        'g/Dom',
        '@/views/NavigateView',
        'g/alerts/alerts',
        'g/ChoiceView',
        'g/header/HeaderView'],
function (App, acc, Resources, dom, NavView, AlertsBar, Choose, Header) {

    var init = function () {

        App.access = acc.data.Points;
        App.baseType = acc.data.Kind;

        $.ajaxSetup({
            headers: {
                'key': location.href+'/wg-'+acc.data.WGID
            }
        });

        var nav = new NavView,
            h = new Header,
            a = new AlertsBar,          
            flag = false;

        function after() {
            if (!flag) {
                flag = true;
                h.render();
                a.monitoring();              
                Backbone.trigger("message:hide");
                new Choose;
            }
        }

        var AppRouter = Backbone.Router.extend({
            routes: {
                ":pre|*path": "todo",
                "id=:objid": "todetail",
                ":r!sid=:id&id=:objid": "content",
                ":r!sid=:id": "content",
                "": "default"
            }
        });

        var app_router = new AppRouter;
        App.router = app_router;

        app_router.on("route:default", function () {
            App.Select.set("query", "CheckList");
            App.navigate(App.Select.fullpath(), { trigger: true });
        });

        app_router.on("route:todo", function (p, path) {
            App.Select.fill(path);
            $("#Navigation").show();
            nav.render().done(after);
        });

        app_router.on("route:todetail", function (objid) {
            $("#ResultDetails").show();
            $("#module-navigation").hide();
            Backbone.trigger("message:modal", { title: Resources.wait2, message: Resources.message1 });
            require(['@/views/result/ResultView'], function (ResultView) {
                var s = new ResultView({ id: objid }).done(function () {
                    after();
                    $(document).find("head>title").text(s.model.get("title") + " :: " + Resources.resultTitle);
                });

            });
        });

        app_router.on("route:content", function (r, id, objid) {
            $("#module-navigation").hide();
            $("#DetailContent").show();
            require(['@/views/result/ContentView'], function (ContentView) {
                new ContentView({ id: id, mode: r, objid: objid }).done(after).render();
            });
        });

        $(".logo").on("click", function () {
            location.href = location.pathname;
        });

        Backbone.history.start();
    }

    return {
        init: init
    }
});