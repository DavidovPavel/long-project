define(function (require) {

    var App = require('app'),
        Resources = require('i18n!nls/resources.min'),
        PagingView = require('g/lists/pagingView');


    var listItemView = Backbone.View.extend({
        tagName: "tr",
        events: {
            "click td": "itemSelect",
            "click .ViewProperties": "viewProperties"
        },
        viewProperties: function (e) {
            e.stopPropagation();
            //GeneralView.render(this.model);
        },

        // множественный выбор в списке
        itemSelect: function (e) {
            if (this.model.id === -1) return;
            if (!e.ctrlKey)
                this.$el.siblings("tr").removeClass("ui-selected");

            this.$el.addClass("ui-selected");
            var list = this.options.list;

            if (list && list.RP)
                list.trigger("select", this.model);

            if (this.model.collection) {
                var $cbx = this.$("input[type=checkbox]");
                if ($cbx.get(0)) {
                    if ($cbx.is(":checked")) {
                        list.check(this.model.id);
                    } else {
                        list.uncheck(this.model.id);
                    }
                    list.operation.call(list, this.model, $cbx.is(":checked"));
                } else if (list && list.operation) {
                    list.operation.call(list, this.model);
                } else if (this.options && this.options.operation) {
                    this.options.operation.call(this, this.model);
                } else {
                    Backbone.trigger(":P", { cmd: "d", model: this.model.id });
                }
            }
        },
        initialize: function () {
            if (this.options.templ) this.template = this.options.templ;
            this.model.view = this;
        },
        render: function () {
            var data = this.model.toJSON();
            if (data.id == -1) {
                this.$el.css("cursor", "default");
            } else {
                data.Resources = Resources;
                this.$el.html(_.template(this.template)( data));
            }
            return this;
        }
    });

    return Backbone.View.extend({
        tools: true,                                 // панель управления для элементов списка
        el: $("#LoadResults"),
        paging: null,

        initialize: function () {
            
            this.collection = new Backbone.Collection();
            this.collection.on('add', this.add, this);
            this.collection.on('destroy', this.destroy, this);
            this.collection.on("change", this.change, this);
            this.collection.on("reset", this.addAll, this);

            if (this.options.api) this.collection.url = this.options.api;
            if (this.options.operation) this.operation = this.options.operation;
            if ("tools" in this.options) this.tools = this.options.tools;
            
            
            this.paging = new PagingView();
            this.listenTo(this.paging, "list:topage", this.topage);

            this.$el.showIndicator();
            this.collection.fetch({ reset: true, error: this.$el.hideIndicator });

            if (this.tools)
                Backbone.trigger("list:toolkit", this);
        },

        topage: function(index) {
            var ps = this.collection.url().split("?");
            var p = "";
            if (ps[1]) {
                p = App.addParams({ "page": index }, ps[1]);
            } else {
                p = App.addParams({ "page": index });
            }
            this.collection.url = function() {
                return ps[0] + "?" + p;
            };
            this.refresh(index);
        },
        refresh: function(page) {
            this.$el.showIndicator();
            this.collection.fetch({ reset: true });
        },
       
        addAll: function() {
            this.$el.hideIndicator();
            if (this.collection.length == 1 && this.collection.at(0).get("feed")) {

                if (!this.$el.find("table.List").get(0)) {
                    this.$el.html($('<div class="List"><table class="List"></table></div>'));
                    var $p = $("<div class='Paging'></div>");
                    this.$("div.List").after($p);
                } else {
                    this.$("table.List").empty();
                }

                var data = this.collection.at(0).get("feed"),
                    view = data.render,
                    head = data.head,
                    items = data.items;

                this.$el.css("background", "none");

                if (view == "Table") {
                    this.addPaging = true;
                    var collection = [],
                        itemTemplate = "",
                        header = "";
                    _.each(items, function(item) {
                        var m = {},
                            tr = "",
                            th = "<tr>",
                            flag = false;
                        _.each(head, function(h) {

                            var val = _.findWhere(item.data, { systemName: h.systemName }).value,
                                d = new Date(val),
                                hsn = h.systemName.replace(" ", "_");

                            if (d.toString() !== "Invalid Date") {
                                var options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
                                val = d.toLocaleString("ru-RU", options);
                            }

                            th += ("<th>" + h.displayName + "</th>");
                            if (!flag) {
                                var id = parseInt(_.findWhere(item.data, { systemName: "Object_ID" }).value);
                                tr += ("<td data-id='<%= id %>'><%= " + hsn + " %></td>");
                                m.id = id;
                                flag = true;
                            } else
                                tr += ("<td><%= " + hsn + " %></td>");
                            
                            m[hsn] = val;
                            
                        }, this);

                        collection.push(m);
                        th += "</tr>";
                        header = !header ? th : header;
                        itemTemplate = tr;
                    }, this);

                    this.$el.find("table.List").append($(header));

                    _.each(collection, function(m) {
                        var li = new listItemView({ model: new Backbone.Model(m), templ: itemTemplate, list: this });
                        m.view = li;
                        this.$("table").append(li.render().el);
                        if (this.currentid == m.id) {
                            li.$el.addClass("ui-selected");
                            this.trigger("select", m);
                        }
                    }, this);

                    this.paging.totalItems = data.pagination.totalItems;
                    this.paging.current = data.pagination.currentPage;
                    this.paging.setElement(this.$(".Paging")).render();
                }
            }

            this.$("tr:nth-child(even)").addClass("Zebra");
            this.initMultySelect();
            
            if (this.feedback)
                this.feedback.call(this.context);
        },
        initMultySelect: function() {
            var self = this;
            this.$("tbody").selectable({
                stop: function() {
                    var m = $(this).find("tr.ui-selected:not(.Paging)"),
                        selected = [];
                    
                    m.each(function() {
                        var $e = $(this).find("td[data-id]");
                        if ($e.get(0)) {
                            var _id = $e.attr("data-id");
                            selected.push(parseInt(_id));
                        }
                    });
                    
                    self.selected = selected;
                }
            });
        },
       
        selected: [],
        clearselect: function() {
            this.selected = [];
            this.$el.find("tr.ui-selected").removeClass("ui-selected");
        },
        check: function(id) {
            if (this.selected.indexOf(id) === -1)
                this.selected.push(id);
        },
        uncheck: function(id) {
            var ind = this.selected.indexOf(id);
            if (ind != -1)
                this.selected.splice(ind, 1);
        },
        done: function(fx, ctx) {
            this.feedback = fx;
            this.context = ctx || this;
        }
    });
});