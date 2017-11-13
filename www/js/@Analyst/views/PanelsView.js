define([
'app',
'@/views/query/MainButtons',
'@/views/query/QueryBottom',
'@/views/query/SearchView',
'@/views/details/DetailsView',
"@/views/query/ParametersView",
'@/views/result/DisplayListView',
'@/views/ListView',
"storage"
],
function (App,
        QueryButtons,
        BottomSector,
        SearchView,
        DetailView,
        ParamQuery,
        DisplayListView,
        ListView,
        Storage) {

    var QUERY_WIDTH = 370,
        QUERY_LEFT = 30,
        MIN_WIDTH = 400;

    var PanelModel = Backbone.Model.extend({
        defaults: function () {
            return {
                bottom: null,
                query: null,
                result: null,
                detail: null,
                Trees: {},
                $query: $("#Query section.Present"),
                $list: $("#LoadResults")
            }
        }
    });

    var PanelView = Backbone.View.extend({
        events: {
            "click div.Reduce": "view"
        },
        view: function (e) {
            var fx = "fx" + this.$el.attr("id");
            if (this.isWide) {
                this.isWide = false;
                this.trigger("fullscreen", false, fx);
            } else {
                this.isWide = true;
                this.trigger("fullscreen", true, fx);
            }
        },
        initialize: function () {
        },
        render: function () {
            return this;
        },
        done: function (fx, ctx) {
            this.feedback = fx;
            this.context = ctx;
            return this;
        }
    });

    return Backbone.View.extend({
        el: $(".wrapper"),
        initialize: function () {

            this.model = new PanelModel();

            this.initDragging();

            this.Query = new PanelView({ el: this.$("#Query") });
            this.Result = new PanelView({ el: this.$("#Result") });
            this.Detail = new PanelView({ el: this.$("#Detail") });

            this.listenTo(this.Query, "fullscreen", this.expand);
            this.listenTo(this.Result, "fullscreen", this.expand);
            this.listenTo(this.Detail, "fullscreen", this.expand);

            this.DetailView = new DetailView();
            this.$("#List").height(this.$el.height() - 32);

            Backbone.on(":P", this.action, this);
            Backbone.on("goto:object", this.gotoObject, this);

            // tree
            Backbone.on("Request:ViewParamters", function (model) {
                if (model.get("parameters"))
                    new ParamQuery({ model: model }).render();
            });
            Backbone.on("Rubric:ToID", function (model) {
                var f = App.Select.get("params") && (App.Select.get("params").title || App.Select.get("params").phrase);
                App.Select.set("list", App.addParams({ "id": model.id, "rubricid": f ? "-1" : model.id }, App.Select.get("list")));
                App.navigate(App.Select.fullpath());
                Backbone.trigger(":P", { cmd: "c", model: model });
            });

            Backbone.on("window:resizeend", this.windowResize, this);
        },

        action: function (o) {
            var cmd = o.cmd,
                model = o.model;

            this[cmd](model);
        },

        // кнопки 
        a: function () {
            this.query = QueryButtons.get();
            if (App.Select.get("query")) {
                var model = this.query.collection.get(App.Select.get("query"));
                this.query.action(model);
            }
        },

        // деревья
        b: function (model) {
            this.isInitList = false;
            //нижний сектор в панели
            var b = model.get("bottomWin");
            if (b && b.name) {
                this.model.set("bottom", BottomSector.get());
            } else {
                this.model.set("bottom", null);
            }

            var pr = model.get("present").control;
            switch (pr) {
                case "Tree":
                    var list = App.Select.get("list");
                    if (App.Select.get("query") === "Request" && App.Select.get("params")) {
                        list = App.Select.get("params").listid;
                    }

                    Storage.getTree(model.id).then(function (tree) {

                        this.tree = tree;
                        this.tree.setOptions("currentid", list)
                        .setElement(this.model.get("$query"))
                            .render()
                            .done(function (col) { this.c(col, model.id); }.bind(this));
                    }.bind(this));

                    break;
                case "Panel": SearchView.get().render();
                    break;
            }

            if (this.model.get("bottom"))
                this.model.get("bottom").render({ name: b.name });
            else {
                $("#ListBottomPanel").hide();
                this.model.get("$query").height($(window).height() - 160 - $("#Query_Buttons").height());
            }
        },

        // список
        c: function (model, r) {
            
            require(['c/EditPanelView'], function (EditPanel) {
                if (r === 'Rubric') {
                    this.tree.$el.prepend('<div class="g-dialog--toolbar"></div>');

                    this.editPanel = new EditPanel({ unvisible: 'sorting,search' }).setElement(this.tree.$(".g-dialog--toolbar")).render();

                    this.tree.listenTo(this.editPanel, "edit-panel:action", this.tree.editPanelAction);

                    this.editPanel.listenTo(this.tree, "edit-panel:action:end", function () {
                        this.editPanel.rere();
                    });
                } else if(this.editPanel&&model) {
                    this.editPanel.setCurrent(model);
                }
            }.bind(this));
            

            if (model && !model.length) {
                App.Select.set("list", model.id);
                App.navigate(App.Select.fullpath());
            }
            var $list = this.model.get("$list");
            if (!$list.get(0)) return;

            if (!App.Select.has("list")) {
                $list.find("table").empty();
                $list.next(".Paging").remove();
                return;
            }

            var template = DisplayListView.get(),
                b = this.model.get("bottom");


            var clickByTree = this.model.get("clickByTree");
            if (clickByTree) {
                clearTimeout(clickByTree);
                clickByTree = 0;
            }

            function CollectionUrl() {

                var list = App.Select.get("list"),
                    param = "",
                    query = App.Select.get("query");

                if (list && list.indexOf("=") !== -1) {
                    var p = App.Select.get("params");
                    param = list;
                    list = p && p.id ? p.id : "-1";
                }

                if (query === "Request")
                    query = "Request/Execute";

                if (parseInt(list) === 0)
                    return "/api/List/" + App.Select.get("detail");

                return ("/api/" + query + "/" + list + "?page=" + App.Select.get("page") + (param ? "&" + param : ''));
            }

            var flag = false, self = this, DetailView = this.DetailView, fitHeight = this.fitHeight;
            if (!this.listView) {
                this.listView = new ListView({
                    el: $list,
                    templ: template,
                    headerTemplate: "headItemTemplate",
                    done: function () {
                        if (b)
                            b.trigger("main:list", this);
                        DetailView.render().done(fitHeight, self);
                        fitHeight.call(self);
                    },
                    api: CollectionUrl
                });
            } else {
                flag = true;
            }

            this.listView.collection.url = CollectionUrl;

            var list = this.listView;
            clickByTree = setTimeout(function () {
                if (flag) {
                    list.currentPage = App.Select.get("page");
                    list.$el.showIndicator();
                    if (App.Select.get("query") === "MRubrics")  // не стандартный запрос, вынести в конфигурацию 
                        list.request();
                    else
                        list.collection.fetch({ reset: true });
                }
                DisplayListView.set({ list: list });
                clickByTree = 0;
            }, 500);
            this.model.set("clickByTree", clickByTree);
        },

        // детали
        d: function (id) {
            var clickByList = this.model.get("clickByList"),
                self = this,
                DetailView = this.DetailView,
                fitHeight = this.fitHeight;

            if (clickByList) {
                clearTimeout(clickByList);
                clickByList = 0;
            }
            clickByList = setTimeout(function () {
                $.xhrAbortAll();
                App.Select.set("detail", id);
                App.navigate(App.Select.fullpath(), false);
                DetailView.render().done(fitHeight, self);
                fitHeight.call(self);
                clickByList = 0;
            }, 500);
            this.model.set("clickByList", clickByList);
        },

        fitHeight: function () {
            var dh = this.$el.height();
            this.DetailView.$el.height(dh - 32);
            this.DetailView.$("div.ui-tabs-panel").height(dh - (this.DetailView.$(".ui-tabs-nav").height() + 60));
            if (this.DetailView.$(".Load:visible").get(0))
                this.DetailView.$(".Load:visible").height(dh - (this.DetailView.$(".Load:visible").position().top + 60));
            //this.DetailView.$(".Load").each(function() {
            //    $(this).height(dh - ($(this).position().top + 60));
            //});
        },

        gotoObject: function (id) {
            App.Select.set({ list: 0, detail: id });
            App.navigate(App.Select.fullpath());
            this.c();
        },

        expand: function (flag, name) {
            this[name](flag);
        },

        render: function () {

            this.Result.$el.css({ "left": QUERY_WIDTH, "width": this.$("#Drag2").position().left - QUERY_WIDTH });

            return this;
        },
        initDragging: function () {
            this.$("#Drag1 img").position({ my: "center center", of: this.$("#Drag1") });
            this.$("#Drag2 img").position({ my: "center center", of: this.$("#Drag2") });
            var s = this;

            this.$("#Drag1").draggable({
                axis: "x",
                drag: function (event, ui) { var tp = ui.position.left; if (tp <= QUERY_LEFT || tp >= QUERY_WIDTH) return false; },
                stop: function (event, ui) { s.stopDragOne(ui); }
            });

            this.$("#Drag2").draggable({
                axis: "x",
                drag: function (event, ui) {
                    var tp = ui.position.left;
                    if (tp >= ($(window).width() - QUERY_LEFT) || tp <= QUERY_LEFT)
                        return false;
                },
                stop: function (event, ui) { s.stopDragTwo(ui); }
            });
        },

        stopDragOne: function (ui) {
            var tp = ui.position.left;
            if (tp > QUERY_LEFT && tp <= QUERY_WIDTH) {
                this.$("#Query").css("width", (tp - 5) + "px");
                this.$("#Result").css({ "left": tp, "width": this.$("#Drag2").position().left - tp });
            }
            else if (tp < QUERY_LEFT)
                this.placingOne(QUERY_LEFT, QUERY_WIDTH - QUERY_LEFT);
            else this.placingOne(QUERY_WIDTH, 0);
        },
        placingOne: function (dx1, dx2) {
            if (dx1 < QUERY_LEFT || dx1 > QUERY_WIDTH) return;
            this.$("#Drag1").css({ "left": dx1 });
            this.$("#Query").css({ "width": (this.$("#Drag1").position().left - 5) + "px" });
            this.$("#Result").css({ "left": dx1, "width": this.$("#Drag2").position().left - dx1 });
        },
        fxQuery: function (flag) {
            var options = { duration: "normal", easing: "easeOutQuad", queue: false };
            if (flag) {
                this.Result.isWide = false;
                this.$("#Drag1").animate({ left: QUERY_LEFT }, options);
                this.$("#Query").animate({ width: QUERY_LEFT }, options);
                this.$("#Result").animate({ left: ("-=" + (this.$("#Drag1").position().left - QUERY_LEFT)), width: ("+=" + (this.$("#Drag1").position().left - QUERY_LEFT)) }, options);
            } else {
                this.$("#Drag1").animate({ left: QUERY_WIDTH }, options);
                this.$("#Query").animate({ width: QUERY_WIDTH }, options);
                this.$("#Result").animate({ left: QUERY_WIDTH, width: ("-=" + (QUERY_WIDTH - this.$("#Drag1").position().left)) }, options);
            }
        },

        fxResult: function (flag) {
            var s = this,
                options = {
                    duration: "normal", easing: "easeOutQuad", queue: false, complete: function () {
                        s.DetailView.trigger("parent:resize");
                    }
                };

            if (flag) {
                this.Query.isWide = false;
                this.Detail.isWide = false;
                this.$("#Drag1").animate({ left: QUERY_LEFT }, options);
                this.$("#Query").animate({ width: QUERY_LEFT }, options);
                this.$("#Result").animate({ left: QUERY_LEFT, width: ($(window).width() - QUERY_LEFT * 2) }, options);
                this.$("#Drag2").animate({ left: $(window).width() - QUERY_LEFT }, options);
                this.$("#Detail").animate({ left: $(window).width() - QUERY_LEFT }, options);
            } else {
                this.$("#Drag1").animate({ left: QUERY_WIDTH }, options);
                this.$("#Query").animate({ width: QUERY_WIDTH }, options);
                this.$("#Result").animate({ left: QUERY_WIDTH, width: ($(window).width() / 2 - QUERY_WIDTH) }, options);
                this.$("#Drag2").animate({ left: $(window).width() / 2 }, options);
                this.$("#Detail").animate({ left: $(window).width() / 2, width: $(window).width() / 2 - 5 }, options);
            }
        },

        fxDetail: function (flag) {
            var s = this,
                options = {
                    duration: "normal", easing: "easeOutQuad", queue: false, complete: function () {
                        s.DetailView.trigger("parent:resize");
                    }
                };

            if (flag) {
                this.Query.isWide = false;
                this.Result.isWide = false;
                this.$("#Drag1").animate({ left: QUERY_LEFT }, options);
                this.$("#Query").animate({ width: (this.$("#Drag1").position().left - 5) }, options);
                this.$("#Result").animate({ left: -(MIN_WIDTH - QUERY_LEFT), width: MIN_WIDTH }, options);
                this.$("#Drag2").animate({ left: QUERY_LEFT }, options);
                this.$("#Detail").animate({ left: QUERY_LEFT, width: ($(window).width() - QUERY_LEFT - 5) }, options);
            } else {
                this.$("#Drag1").animate({ left: QUERY_WIDTH }, options);
                this.$("#Query").animate({ width: QUERY_WIDTH }, options);
                this.$("#Result").animate({ left: QUERY_WIDTH, width: ($(window).width() / 2 - QUERY_WIDTH) }, options);
                this.$("#Drag2").animate({ left: $(window).width() / 2 }, options);
                this.$("#Detail").animate({ left: $(window).width() / 2, width: $(window).width() / 2 - 5 }, options);
            }

        },

        stopDragTwo: function (ui) {
            var tp = ui.position.left,
                right = $(window).width() - QUERY_LEFT;

            if (tp > (QUERY_WIDTH + QUERY_LEFT) && tp <= right) {
                this.$("#Result").css({ "left": this.$("#Drag1").position().left, "width": tp - this.$("#Drag1").position().left });
                this.$("#Detail").css({ "left": tp, "width": $(window).width() - tp - 5 });
            } else if (tp <= (QUERY_WIDTH + QUERY_LEFT) && tp > QUERY_LEFT) {
                this.$("#Drag1").css({ "left": QUERY_LEFT });
                this.$("#Result").css({ "left": QUERY_LEFT, "width": this.$("#Drag2").position().left - QUERY_LEFT });
                this.$("#Detail").css({ "left": tp, "width": $(window).width() - tp - 5 });
            } else if (tp < QUERY_LEFT) {
                this.$("#Drag2").css({ "left": QUERY_LEFT });
                this.$("#Result").css({ "left": QUERY_LEFT - MIN_WIDTH, "width": MIN_WIDTH });
                this.$("#Detail").css({ "left": QUERY_LEFT, "width": ($(window).width() - QUERY_LEFT - 5) });
            } else {
                this.$("#Drag2").css({ "left": right });
                this.$("#Result").css({ "left": this.$("#Drag1").position().left, "width": right - this.$("#Drag1").position().left });
                this.$("#Detail").css({ "left": right, "width": $(window).width() - tp - 5 });
            }
            this.DetailView.trigger("parent:resize");
        },
        windowResize: function () {

            if (this.Result.isWide) {
                this.$("#Drag2").css({ "left": $(window).width() - QUERY_LEFT });
                this.$("#Detail").css({ "left": $(window).width() - QUERY_LEFT });
                this.$("#Result").css({ "width": $(window).width() - QUERY_LEFT * 2 });
            } else {
                this.$("#Detail").css({ "width": $(window).width() - this.$("#Drag2").position().left - 5 });
                this.$("#Result").css({ "width": this.$("#Drag2").position().left - this.$("#Drag1").position().left });
            }

            var dh = this.$el.height() - 32,
                d = this.DetailView,
                dv = this.DetailView.$("div.ui-tabs-panel"),
                tb = this.DetailView.$("ui:first");

            if (this.listView) {
                this.listView.$el.height(dh);
                this.listView.trigger("parent:resize");
            }

            this.fitHeight();

            _.delay(function () {
                d.trigger("parent:resize");
            }, 1000);
        }
    });
});