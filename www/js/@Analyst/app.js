require.config({
    paths: {
        d3: 'dist/d3.min',
        c3: 'dist/c3.min',
        async: 'dist/requirejs-plugins/src/async',
        "@": "@Analyst"
    },
    shim: {
        'c3': {
            deps: ['d3'],
            exports: 'c3'
        }
    }
});

define([
    'i18n!nls/resources.min',
        'app',
        'access',
        '@/views/PanelsView',
        'g/DetailsView',
        '@/views/toolbar/ToolsBar'        
],
function (Resources, App, acc, PageInitView, DetailsInWindow) {

    var init = function () {

        App.access = acc.data.Points;
        App.baseType = acc.data.Kind;
        App.workGroupID = acc.data.WGID;
        App.startPoint = acc.data.StartPoint;
        App.netVersion = acc.data.NetVersion;

        var analystRouter = Mn.AppRouter.extend({
            routes: {

                "": function () {
                    App.navigate(App.Select.get("present") + "|" + App.startPoint, { trigger: true });
                },

                ':pre|*path': function () {

                    var page = new PageInitView().render();

                    if (!this.init) {
                        this.init = true;
                        var h = location.hash.split("|");
                        App.Select.fill(h[1]);
                        // инизиализируем загрузку панелей
                        if (!App.isMini)
                            Backbone.trigger(":P", { cmd: "a" });
                    }

                    if (App.Select.get("query") === "All") {
                        App.navigate(App.Select.get("present") + "|Rubric", { trigger: true });
                        return;
                    }

                    if (App.Select.get("present") === "2") {
                        if (App.Select.get("detail"))
                            page.viewObject();
                        else page.viewResult();
                    }

                    new DetailsInWindow().render();

                    app.after();

                    //if (App.baseType !== "DeepInternet")
                    //    new ExcelView;
                },

                "Cart": function () {
                    app.after({ showBasket: true });
                }

            }
        });

        var analystApp = Mn.Application.extend( {

            region: 'body',

            initialize: function () {

                this.route = new analystRouter;

                Backbone.Radio.channel('Notify').reply('add:dialog', function (dialog) {
                    main.attachHtml(dialog);
                });

            },

            onStart: function () {

                var mode = acc.data.Mode,
                    pid = location.search.split("=");

                if (mode && pid.length <= 1) {

                    // база работает с проектами
                    var Notice = Mn.View.extend({
                        template: _.template('<div id="List"><div id="List">' +
                        '<ul class="nav nav-tabs" role="tablist">' +
                            '<li role="presentation"><a href="#my-checks" aria-controls="my-checks" role="tab" data-toggle="tab"><%- Resources.mycheck %>&nbsp;<span>(0)</span></a></li>' +
                           '<li role="presentation"><a href="#all-checks" aria-controls="all-checks" role="tab" data-toggle="tab"><%- Resources.all %>&nbsp;<span>(0)</span></a></li>' +
                            '<li role="presentation"><a href="#search-checks" aria-controls="search-checks" role="tab" data-toggle="tab"><%- Resources.search %></a></li>' +
                        '</ul>' +
                        '<div class="tab-content">' +
                            '<div role="tabpanel" class="tab-pane active" id="my-checks"></div>' +
                            '<div role="tabpanel" class="tab-pane" id="all-checks"></div>' +
                            '<div role="tabpanel" class="tab-pane" id="search-checks"></div>' +
                       '</div>' +
                            '</div></div>' ),

                        onRender: function () {

                            Backbone.Radio.channel('Notify')
                                .trigger('dialog:standart', { kind: "info", content: Resources.prj });

                            require(['@Inquiry/views/ProjectsView'], function (CheckListView) {
                                new CheckListView({ el: $("#List"), interceptLink: true }).render();
                            });

                        }
                    });

                    if (!$('.view-projects').get(0)) {
                        $('body').prepend('<div class="view-projects"></div>');
                    }

                    require(['c/HeaderView'], function (Header) {
                        new Header().render();
                        new Notice({ el: $('.view-projects'), model: new Backbone.Model({ Resources: Resources }) }).render();
                    });
                    return this;
                }

                Backbone.history.start();
            },

            after: function (o) {

                require(['c/HeaderView'], function (Header) {

                    var header = new Header().render();

                    if (o && o.showBasket)
                        header.getChildView('case').$el.show();

                }.bind(this));
            }
        });

        var app = new analystApp;
        app.start();

    };


    //var f = true
    //var tick = setInterval(function () {
    //    if (f) {
    //        f = false;
    //        $.get("/api/state/tick").done(function(a) {
    //            if (!parseInt(a.AuthState)) {
    //                clearInterval(tick);
    //                location.href = "/";
    //            }

    //            if (!parseInt(a.MMCSState)) {
    //                // модуль управления пользовательским сервисом недоступен
    //                // аварийная ситуация, - выводим сообщение о недоступности сервиса, в рамках блока вывода баланса, делаем недоступными внешние роботы.
    //                //Backbone.trigger("mmcsstate:disabled");
    //            } else {
    //                //Backbone.trigger("mmcsstate:enabled");
    //            }

    //            if (!a.IsMBFStandAlone) {
    //                // скрываем блок платежного сервиса. Внешние поисковые задачи убираем (Kind=1). 
    //                //Backbone.trigger("mbfstand:disabled");
    //            } else {
    //                //Backbone.trigger("mbfstand:enabled");
    //            }
    //            f = true;
    //        });
    //    }
    //}, 100000);

    return {
        init: init
    };
});
