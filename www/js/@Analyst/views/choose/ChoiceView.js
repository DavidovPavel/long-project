define(function(require) {

    var App = require('app'),
        Resources = require('i18n!nls/resources.min'),
        Storage = require("storage"),
        lotTemplate = require('text!templates/selected/lotTemplate.html'),
        listSelectItemTemplate = "<td style='width:26px;' data-id='<%= id %>'><input type='checkbox' style='width:auto;height:auto;padding:0;min-width:0;' /></td><td><div id='<%= id %>' title='<%= Resources.browseproperties %>' class='ViewProperties btn'></div><%= title %></td><td><%= type %></td>";

    var SelectedItemView = Backbone.View.extend({
        tagName: "tr",
        render: function () {
            this.$el.html(_.template("<td style='width: 100%'><%= title %></td><td><span class='ui-icon ui-icon-circle-close Clear' style='cursor: pointer;'></span></td>")
                (this.model.toJSON()));
            return this;
        },
        events: {
            "click .Clear": "remove"
        },
        remove: function () {
            this.collection.remove(this.model);
        }
    });

    return Backbone.View.extend({
        asTree: false,
        onlyOne: false,
        title: Resources.selectingObj,
        treeName: "Tree",
        events: {
            "click #TypesFilter": "showTypes",
            "click #SearchInWin": "search",
            "click #ClearInWin": "clear",
            "click .ViewProperties": "viewProperties"
        },
        viewProperties: function() {
            //var id = $(arguments[0].currentTarget).attr("id");
            //this.$("#WinProp").empty().css({ "position": "relative", "background-color": "#ccc", "top": this.$el.scrollTop() });
            //new PropView({ el: this.$("#WinProp"), id: id });
        },
        SelectParameters: function(model, flag) {
            if (flag) {
                this.collection.add(model);
            } else {
                this.collection.remove(model);
            }
        },
        SelectOneParameter: function() {
            this.selectedCollection.reset();
            this.selectedCollection.add(this.model);
            this.$el.dialog("close");
        },
        initialize: function() {
            this.collection = new Backbone.Collection();
            this.collection.on("remove", this.renderSectionRemove, this);
            this.collection.on("add", this.renderSection, this);
            Backbone.on("choice:view", this.render, this);
        },
        render: function (model) {
            this.model = model;
            this.collection.reset();

            if (!this.$el.get(0)) {
                this.$el = $("<div></div>");
                $(document).append($d);
            }

            this.$el.empty();
            var type = this.model.get("ParametrType");
            switch (type) {
                case "Request":
                    this.viewAsTree({ treeName: "Request", title: Resources.selectRequest });
                    break;
                case "Rubric":
                    this.viewAsTree({ treeName: "Rubrics", title: Resources.selectRubric });
                    break;
                case "Type":
                    this.viewAsTree({ treeName: "Tree", title: Resources.selectTree });
                    break;
                case "Object":
                case "IdList":
                    this.viewAsList();
                    this.renderSection();
                    break;
                default:
                    this.viewAsList();
                    this.renderSection();
            }
            return this;
        },
        renderSectionRemove: function (model) {
            this.$("#ResultSearch .List td[data-id=" + model.id + "] input").get(0).checked = false;
            this.renderSection();
        },
        renderSection:function () {
            this.$("#SelectedParameters").empty();
            this.collection.each(function (m) {
                var p = new SelectedItemView({ model: m, collection: this.collection });
                this.$("#SelectedParameters").append(p.render().el);
            }, this);
        },
        viewAsTree: function(data) {
            this.$el.dialog({
                width: 720,
                height: $(window).height() - 100,
                modal: true,
                title: data.title
            });
            var flag = this.model.get("IsMultyValues");
            if (flag) {
                this.$el.dialog({
                    buttons: {
                        "Ok": function() {
                            $(this).dialog("close");
                        }
                    }
                });
            } else
                this.$el.dialog({ buttons: {} });
            
            var t = Storage.getTree(data.treeName).then(tree=> { tree.setElement(this.$el).render(); });
            var s = this;
            t.operation = function () {
                s.collection.add(this.model);
                if (!flag)
                    s.$el.dialog("close");
            };
            this.$el.dialog({
                close: function () {
                    s.model.trigger("choice:close", s.collection);
                    $(this).dialog("destroy");
                    t.operation = null;
                }
            })
        },
        viewAsList: function () {
            var s = this;
            this.$el.html(_.template(lotTemplate)( { Resources: Resources })).dialog({
                width: $(window).width() - 200,
                height: $(window).height() - 200,
                title: this.title,
                modal: true,
                //resizable: false,
                buttons: {
                    "Ok": function() {$(this).dialog("close");}
                },
                close: function () {
                    s.model.trigger("choice:close", s.collection);
                    $(this).dialog("destroy");
                }
            });

            this.$("#SearchInWin").button({ icons: { primary: "ui-icon-search" }, text: false });
            this.$("#ClearInWin").button({ icons: { primary: "ui-icon-refresh" }, text: false });
            this.$("table.ResultSearch").height(this.$el.height() - 24);

            this.initList();
                        
            //$(window).resize(function () {
            //        d.dialog("option", "width", $(window).width() - 200);
            //        d.dialog("option", "height", $(window).height() - 200);
            //        s.selectList.$el.height(d.dialog("option", "height") - 180);
            //});
        },
        initList: function () {
            var s = this;
            var List = require("views/ListView");
            this.selectList = new List({
                autoStart:false,
                el: this.$("#ResultSearch"),
                api: "/api/Tree/10001",
                templ: listSelectItemTemplate,
                headerTemplate: "headSelectTemplate",
                operation: function (model, flag) {
                    if (flag)
                        s.collection.add(model);
                    else
                        s.collection.remove(model);
                },
                done:function () {
                    this.$el.height(s.$el.dialog("option", "height") - 180);
                }
            });
            this.selectList.topage = function (index) {
                this.paging.current = index;
                var qs = this.collection.url.split("?");
                this.collection.url = (qs[0] +"?"+ App.addParams({ "page": index }, qs[1]));
                this.refresh();
            };
            this.TypeSelectID = 0;
        },
        clear: function() {
            var txt = this.$("#SearchInWinValue").val();
            if (txt) {
                this.$("#SearchInWinValue").val("");
                this.selectList.collection.url = "/api/Tree/10001";
                this.selectList.refresh();
            }
            this.$("div[class=Select]", "#ViewTypesTree").removeClass("Select");
        },
        search: function() {
            var txt = this.$("#SearchInWinValue").val();
            if (txt) {
                //this.selectList.paging.current = 1;
                this.selectList.collection.url = ("/api/List/?page=1&" + $.param({ "text": txt, "typeid": (this.TypeSelectID ? this.TypeSelectID : "10001") }));
                this.selectList.refresh();
            } else $.Error("Пустая строка для поиска!");
        },
        showTypes: function() {
            if (this.$("#ViewTypesTree").is(":visible")) {
                this.$("#TypesFilter").text("Фильтр по типам").removeClass("Red");
                this.$("#ViewTypesTree").hide();
            } else {
                this.$("#TypesFilter").text("Скрыть типы").addClass("Red");
                this.$("#ViewTypesTree").show();

                if (!this.$("#ViewTypesTree div").is("div.Tree")) {
                    var co = this;
                    var t = Storage.getTree("Tree").then(tree=> { tree.setElement(this.$("#ViewTypesTree")).render(); });
                    t.operation = function() {
                        co.TypeSelectID = this.model.id;
                        var txt = co.$("#SearchInWinValue").val();
                        if (co.selectList.paging)
                            co.selectList.paging.current = 1;
                        co.selectList.collection.url = ("/api/List/?page=1&" + $.param({ "text": txt, "typeid": (this.model.id ? this.model.id : "10001") }));
                        co.selectList.refresh();
                    }
                }
            }
        }
    });
});