define([
    'app',
        'i18n!nls/resources.min',
        '@/views/result/pagingView',
        '@/views/result/listItemView',
        '@/views/toolbar/RightView',
        "storage"
],
function (App, Resources, PagingView, listItemView, RightView, Storage) {

    var listItemTemplate = "<td><%= num %></td><td data-id='<%= id %>'><%= title %></td><td><%= type %></td><td><%= date %></td>";

    var ListItemModel = Backbone.Model.extend({
        defaults: function () {
            return {
                id: -1,
                uid: "",
                num: "",
                title: Resources.notfound,
                description: "",
                type: "",
                typeid: 0,
                date: "",
                source: "",
                sel: "",
                bdate: "",
                inn: "",
                ogrn: "",
                ogrnip: "",
                okpo: "",
                pass: ""
            };
        }
    });
    var listItemCollection = Backbone.Collection.extend({
        model: ListItemModel
    });

    return Backbone.View.extend({
        tools: true,                                 // панель управления для элементов списка
        el: $("#LoadResults"),
        counter: 0,
        paging: null,
        done: function () {
            return this;
        },
        add: function (model) {
            var li = new listItemView({ model: model, templ: this.templateItem, list: this });
            model.view = li;
            this.$("table").append(li.render().el);
        },
        destroy: function (model) {
            model.view.$el.remove();
        },
        change: function (model) {
            model.view.$el.find("[data-id=" + model.id + "]").text(model.get("title"));
        },
        initialize: function (o) {
            this.options = o;
            this.currentid = App.Select.get("list");
            this.currentPage = 1;
            this.RP = null;
            this.collection = new listItemCollection();
            if (this.options.api) this.collection.url = this.options.api;
            if (this.options.collectionmodel) this.collection.model = this.options.collectionmodel;
            if (this.options.operation) this.operation = this.options.operation;
            if (this.options.templ) this.templateItem = this.options.templ;
            else this.templateItem = listItemTemplate;
            this.autoStart = true;
            if (this.options.autoStart !== undefined) this.autoStart = this.options.autoStart;

            if ("tools" in this.options) this.tools = this.options.tools;

            if (this.options.done) this.done = this.options.done;

            this.collection.on('add', this.add, this);
            this.collection.on('destroy', this.destroy, this);
            this.collection.on("change", this.change, this);

            var s = this;

            // TODO: 
            if (App.Select.get("query") === "MRubrics") { // не стандартный запрос, вынести в конфигурацию 
                this.request();
            } else {
                this.collection.on("reset", this.addAll, this);
                if (this.autoStart) {
                    this.$el.showIndicator();
                    this.collection.fetch({ reset: true, error: function () { s.$el.hideIndicator(); } });
                }
            }
            if (this.tools) {
                this.RP = RightView.get(this);
                this.RP.render();
            }

        },
        request: function (page) {
            var s = this,
                tree = Storage.getTree("MRubrics").then(function(tree) {

                    tree.done(function () {
                        var _id = App.Select.get("list"),
                            model = tree.collection.get(_id),
                            data = model.view.getChildren(_id),
                            ids = new Backbone.Collection(data).pluck("id");

                        if (model.get("isdoc")) {
                            ids.push(_id);
                        }

                        s.$el.showIndicator();
                        $.ajax({
                            type: "POST",
                            contentType: 'application/json; charset=utf-8',
                            url: "/api/mrubrics",
                            data: JSON.stringify({ TaskIds: ids, PageNum: page || App.Select.get("page") })
                        }).done(function (response) {
                            s.$el.hideIndicator();
                            s.collection = new Backbone.Collection(response);
                            s.collection.on("reset", s.addAll, s);
                            s.collection.on('add', s.add, s);
                            s.collection.on('destroy', s.destroy, s);
                            s.collection.on("change", s.change, s);
                            s.collection.url = function () {
                                return "/api/mrubrics";
                            }
                            s.addAll();
                        });
                    });
                });
        },
        topage: function (index) {
            if (this.$el.selector === "#LoadResults") {
                App.Select.set("page", index);
                App.navigate(App.Select.fullpath());
            }

            var ps = this.collection.url().split("?");
            var p = "";
            if (ps[1]) {
                p = App.addParams({ "page": index }, ps[1]);
            } else {
                p = App.addParams({ "page": index });
            }
            this.collection.url = function () {
                return ps[0] + "?" + p;
            };

            this.refresh(index);
        },
        refresh: function (page) {
            this.currentPage = page;
            this.counter = 0;
            if (App.Select.get("query") === "MRubrics") {
                this.request(page);
            } else {
                this.$el.showIndicator();
                this.collection.fetch({ reset: true });
            }
        },
        addHeader: function () {

            if (!this.headerTemplate && !this.$el.find("tr:has(th)").get(0)) {
                this.headerTemplate = $(this.templateItem).eq(0).attr("data-headtemplatename");
            }

            if (!this.headerTemplate) {
                // если нужен хедер для таблицы вывода списка, задается в этом параметре (строка - название html файла в /templates/list/head)
                this.headerTemplate = this.options.headerTemplate ? this.options.headerTemplate : "";
            }

            if (this.headerTemplate) {
                var s = this;
                require(["jquery", "text!@/templates/list/head/" + this.headerTemplate + ".html"], function ($, head) {
                    s.$("table").prepend(_.template(head)({ Resources: Resources }));
                    s.$("table").find("tr:has(th)").addClass("ui-widget-header");
                    s.done.call(s);
                });
            }
            //else {
            //    this.$("table").append("<tr><td>"+ Resources.N +"</td></tr>");
            //}

        },

        addAll: function () {
            this.counter = 0;
            this.$el.hideIndicator();
            this.$("table").empty();
            this.checked = [];

            if (this.$el.parent().height())
                this.$el.height(this.$el.parent().height());

            var $p = this.$el.next(".Paging");
            if (!$p.get(0)) {
                $p = $("<div class='Paging'></div>");
                this.$el.after($p);
            } else {
                $p.empty();
            }

            //$(".DisplayResult").show();

            if (this.collection.length) {
                var n = this.collection.get(0);
                if (this.collection.length === 1 && n) {
                    this.addOne(new ListItemModel());
                } else {

                    var totalItems = n ? n.get("num") : 0;

                    // add <table class="List"></table>
                    if (!this.$el.find("table.List").get(0))
                        this.$el.html($('<table class="List"></table>'));

                    if (this.collection.length == 1 && this.collection.at(0).get("feed")) {

                        var data = this.collection.at(0).get("feed"),
                            view = data.render,
                            head = data.head,
                            items = data.items;

                        this.$el.css("background", "none");

                        switch (view) {
                            case "Map":
                                this.$el.next(".Paging").hide();
                                $(".DisplayResult").hide();
                                require(["g/GeoMapGoogleView"], function (GeoMap) {
                                    this.geoMap = new GeoMap({
                                        feed: { data: data },
                                        el: this.$el,
                                        widget: { model: new Backbone.Model({ "requestParameters": { rid: 0 }, "Zoom": 0, "CenterLat": 0, "CenterLong": 0 }) }
                                    }).render();
                                }.bind(this));
                                break;
                            case "Graph":
                                $(".DisplayResult").hide();
                                this.$el.next(".Paging").hide();
                                require(["g/ChartView"], function (Histogram) {
                                    this.wGraph = new Histogram(items).setElement(this.$el).render();
                                }.bind(this));
                                break;
                            case "Table":
                                this.addPaging = true;
                                var collection = [], itemTemplate = "", header = "";
                                _.each(items, function (item) {
                                    var m = {}, tr = "", th = "<tr>", flag = false;
                                    _.each(head, function (h) {

                                        var val = _.findWhere(item.data, { systemName: h.systemName }).value,
                                            d = new Date(val),
                                            hsn = h.systemName.replace(" ", "_");

                                        if (d.toString() != "Invalid Date") {
                                            var options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
                                            val = d.toLocaleString("ru-RU", options);
                                        }

                                        th += "<th>" + h.displayName + "</th>";
                                        if (!flag) {
                                            var id = parseInt(_.findWhere(item.data, { systemName: "Object_ID" }).value);
                                            tr += "<td data-id='<%= id %>'><%= " + hsn + " %></td>";
                                            m.id = id;
                                            flag = true;
                                        } else
                                            tr += "<td><%= " + hsn + " %></td>";
                                        m[hsn] = val;
                                    }, this);
                                    collection.push(m);
                                    th += "</tr>";
                                    header = !header ? th : header;
                                    itemTemplate = !itemTemplate ? tr : itemTemplate;
                                }, this);

                                this.$el.find("table.List").append($(header));

                                this.collection.reset(collection, { silent: true });

                                _.each(this.collection.models, function (m) {
                                    var li = new listItemView({ model: m, templ: itemTemplate, list: this });
                                    m.view = li;
                                    this.$("table").append(li.render().el);
                                    if (App.Select.get("detail") == m.id) {
                                        li.$el.addClass("ui-selected");
                                        if (this.RP) {
                                            this.RP.trigger("select", m);
                                        }
                                    }
                                }, this);

                                this.done.call(this);

                                this.$("tr:not(th):nth-child(even)").addClass("Zebra");
                                this.initMultySelect();
                                this.load.call();

                                totalItems = data.pagination.totalItems;
                                this.pagingInit($p, totalItems);

                                break;
                        }

                        return;
                    }

                    this.collection.each(this.addOne, this);
                    this.pagingInit($p, totalItems);
                }
            } else {
                this.counter = -1;
                this.addOne(new ListItemModel());
            }

            this.$("tr:nth-child(even)").addClass("Zebra");
            this.initMultySelect();
            this.load.call();
        },
        pagingInit: function ($p, totalItems) {
            if (!this.paging) {
                this.stopListening(PagingView);
                this.paging = new PagingView().setElement($p).render({ $list: this.$el, totalItems: totalItems });
                this.listenTo(this.paging, "list:topage", this.topage);
                this.paging.listenTo(this, "parent:resize", function () {
                    this.$list.height(this.$list.height() - 55);
                });
            } else
                this.paging.setElement($p).render({ current: this.currentPage, $list: this.$el, totalItems: totalItems });
        },
        initMultySelect: function () {
            var self = this;
            this.$("tbody").selectable({
                stop: function () {
                    var m = $(this).find("tr.ui-selected:not(.Paging)");
                    var selected = [];
                    m.each(function () {
                        var $e = $(this).find("td[data-id]");
                        if ($e.get(0)) {
                            var _id = $e.attr("data-id");
                            selected.push(parseInt(_id));
                        }
                    });
                    self.selected = selected;
                    var id = self.selected[0];
                    if (id && id !== -1 && self.goToCurrent(id))
                        Backbone.trigger(":P", { cmd: "d", model: id });
                }
            });
        },
        goToCurrent: function (id) {
            if (id) {
                var s = this.selected;
                var models = _.filter(this.collection.models, function (m) { return s.indexOf(parseInt(m.id)) != -1; });
                if (this.RP)
                    this.RP.trigger("select", models);

                this.select(id);
                var model = this.collection.get(id);

                if (this.operation) {
                    this.operation.call(this, model);
                    return false;
                }
                return true;
            } else {
                return false;
            }
        },
        addOne: function (m) {
            if (m.id != 0) {
                var li = new listItemView({ model: m, templ: this.templateItem, list: this });
                m.view = li;
                this.$("table").append(li.render().el);
                if (App.Select.get("detail") == m.id) {
                    li.$el.addClass("ui-selected");
                    if (this.RP) {
                        var model = this.collection.get(m.id);
                        this.RP.trigger("select", model);
                    }
                }
            }
            this.counter++;
            if (this.counter === this.collection.length) {
                this.addHeader();
                this.$el.hideIndicator();
            }
        },
        render: function () {
            return this;
        },
        clearselect: function () {
            this.$el.find("tr.ui-selected").removeClass("ui-selected");
        },
        checked: [],
        check: function (id) {
            if (this.checked.indexOf(id) === -1)
                this.checked.push(id);
        },
        uncheck: function (id) {
            var ind = this.checked.indexOf(id);
            if (ind != -1)
                this.checked.splice(ind, 1);
        },
        selected: [],
        select: function () {
        },
        load: function () {
        }
    });
});