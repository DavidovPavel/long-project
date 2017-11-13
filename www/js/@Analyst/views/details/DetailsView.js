define([
    'app',
    'i18n!nls/resources.min',
    'g/content/PropView',
    'g/semnet/LayoutView',    
    '@/views/details/furniture/ConditionsView',
    '@/views/SubnavView'
    //'g/ContentView'
],
function (App, Resources, PropView, SemNet, ConditionsView, SubMenuView, ContentView) {

    return Backbone.View.extend({
        el: $("#LoadDetails"),
        activetab: 0,
        initialize: function () {
            this.on("smd:datas", this.getProp, this);
            Backbone.on("issource", function (p) {
                if (p) this.$(".Content").show();
            });
            if (App.check(this.$el)) {
                App.show(this.$el.find("li[data-id]"));
            }
        },
        done: function (fx, ctx) {
            this.callback = fx;
            this.context = ctx;
            return this;
        },
        render: function () {
            if (this.did == App.Select.get("detail")) return this;
            this.did = App.Select.get("detail");

            if (this.$("#Details").is(":hidden")) {
                this.getProp(this.did);
            }
            var tabs = this.$el.show().tabs();
            if (!App.Select.has("detail")) {
                this.$el.hide();
                return null;
            }

            var objID = App.Select.get("detail");
            $(".Rotor").hide();
            $("#Rotor").hide();
            $("#Details").removeData("load");

            require(['@Analyst/views/details/OriginalDocView'], function (OriginalView) {
                clearInterval(OriginalView.get().si);
                this.$(".Content").hide();
            }.bind(this));

            var self = this;
            tabs.tabs({
                beforeActivate: function (event, ui) {
                    var ui = ui;
                },
                active: false,
                collapsible: true,
                activate: function (event, ui) {
                    ConditionsView.close();
                    Backbone.trigger("storage:clearPlayers");
                    $("#DocsBottom").hide();
                    var id = ui.newPanel.attr("id");
                    switch ( id ) {

                        case "Details":
                            self.activetab = 0;
                            self.getProp();
                            break;

                        case "SemNet":
                            self.activetab = 1;
                            var sn = new SemNet({ el:$('#SemNet'), model: new Backbone.Model({ id: objID }) }).render();
                            //sn.listenTo(self, "parent:resize", sn.fitWin);
                            break;

                        case "Content":
                            self.activetab = 2;
                            var cv = new ContentView({ objID: objID }).render().done(function () {
                                if (this.callback)
                                    this.callback.call(this.context, this);
                            }, self);
                            cv.listenTo(self, "parent:resize", cv.fitLoad);
                            break;

                        case "Report":
                            self.activetab = 3;
                            $("#SqlRepFrame").attr("src", (location.pathname + "/sqlreporting.aspx?pid=" + objID));

                            function byframe(iframe) {
                                var $cd = $(iframe.contentDocument);
                                $cd.find("a").each(function () {
                                    var $a = $(this);
                                    if ($a.attr("href") && $a.attr("href").indexOf("objectid") != -1) {
                                        $(this).css("color", "blue").hover(function () { $(this).css("text-decoration", "underline") }, function () { $(this).css("text-decoration", "none") });
                                        var id = $a.attr("href").split(":")[1];
                                        $a.on("click", function () {
                                            var o = { id: id, title: $a.text() };
                                            //GeneralView.render(o);
                                            Backbone.trigger("general:add", o);
                                            return null;
                                        });
                                    }
                                });
                                $(iframe.contentWindow).on("load", function () {
                                    byframe(iframe);
                                });
                                $cd.find("iframe").each(function () {
                                    byframe(this);
                                });
                                $cd.find("frame").each(function () {
                                    byframe(this);
                                });
                            }
                            $("#SqlRepFrame").on("load", function () {
                                byframe($("#SqlRepFrame").get(0));
                            });

                            break;

                        case "SearchBySource":
                            self.activetab = 4;
                            App.Select.set("sub", 0);
                            require(['@/views/details/searchrobots/DocsView',
                                '@/views/details/TaskView',
                                '@/views/details/searchrobots/FactsView',
                                'text!@/templates/details/extractTemplate.html',
                                'text!@/templates/list/extractListTemplate.html'],
                                function (DocsView, TaskView, FactsView, extractTemplate, extractListTemplate) {
                                    DocsView.get();
                                    TaskView.get();
                                    FactsView.get().setElement($("#SearchBySource .Load"));

                                    var models = [
                                        { id: 0, name: "smt:tasks", title: Resources.titleSearchRobots },
                                        { id: 1, name: "smt:docs", title: Resources.titleDocs },
                                        { id: 2, name: "smt:docs", title: Resources.titleExtract, render: { template: extractTemplate, listTemplate: extractListTemplate, api: ("/api/Docs/InfoDB/" + objID) } },
                                        { id: 3, name: "smt:facts", title: Resources.titleFacts }
                                    ];
                                    SubMenuView.get({ models: models, title: $("#SearchBySource h3") }).
                                        setElement($("#SearchBySource .Submenu")).render();
                                }.bind(this));
                            break;
                    }
                    App.Select.set("tab", self.activetab);
                    App.navigate(App.Select.fullpath());


                    if (self.callback)
                        self.callback.call(self.context, self);
                }
            });

            var ind = App.Select.get("tab") ? App.Select.get("tab") : (arguments[0] ? arguments[0].index ? arguments[0].index : this.activetab : this.activetab);
            tabs.tabs("option", "active", parseInt(ind));

            return this;
        },
        getProp: function () {
            var objID = parseInt(this.did);
            PropView.get(objID).setElement($("#Details .Load"));
            require(["@/views/details/searchrobots/FactsView"], function (FactView) {
                FactView.get().setElement($("#Details .Load"));
            });
            //require("views/details/prop/InspectorView").get(objID).setElement($("#Details .Load"));
            //require("views/details/prop/LinksView").get(objID).setElement($("#Details .Load"));
            App.Select.set("sub", 0);
            var models = [
                { id: 0, name: "smd:datas", title: Resources.titleSdata },
                { id: 1, name: "smt:facts", title: Resources.titleFacts }
                //{ id: 1, name: "smd:props", title: Resources.titleProp },
                //{ id: 2, name: "smd:links", title: Resources.titleLinks }
            ];
            SubMenuView.get({ models: models, title: $("#Details h3") }).setElement($("#Details .Submenu")).render();
        }
    });

    //var details = new detailsView;
    //return {
    //    get: function (reload) {
    //        if (App.check(details.$el)) {
    //            App.show(details.$el.find("li[data-id]"));
    //            if (reload) details.did = 0;
    //            return details.render();
    //        }
    //    }
    //};

});