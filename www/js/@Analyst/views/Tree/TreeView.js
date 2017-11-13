define(['app', 'baseurl'], function (App, baseurl) {

    var treeElementTempalate = "<% if(status===-1){ %><span style='color:red;'><%= title %><br/><i style='color:grey'><%= msg %></i></span><% }else{ %><span class='OpenClose <%= children == 0 ?'Leaf':(isopen?'Open':'') %> <%= isdoc?'Doc':iconexist?'':'Noicon' %>' data-id='<%= id %>'></span><% if(iconexist){ %><img src='<%= linktofile %>' alt=''/><% } %>&nbsp;<span class='TreeElementTitle'><%= title %></span><% } %>";

    var treeElementView = Backbone.View.extend({
        events: {
            "click .OpenClose": "openClose1",
            "mousedown span.TreeElementTitle": "viewList",
            //"click span.pChbx": "SelectChildren",
            "click span.Chbx": "SelectItem"
        },
        panel: "",

        /// создание и кеширование дерева в storage
        //addTree: function (id) {
        //    var TreeView = require('views/Tree/TreeView'),
        //          model = Storage.getModelForTree(id),
        //          nt = new TreeView({ model: model, api: function () { return ("/api/" + id); }, markCurrent: true });
        //    Backbone.trigger("storage:addTree", nt, id);
        //},

        edit: function () {

        },
        getParents: function (id, opened) {
            var m = this.parentview.collection.get(id);
            if (m) {
                opened.push(m);
                var pid = m.get("parentid");
                this.getParents(pid, opened);
            }
        },
        getChildren: function (id) {
            var child = this.parentview.collection.where({ parentid: id });
            var output = [];
            _.each(child, function (m) {
                output = $.merge(output, this.getChildren(m.id));
            }, this);
            return $.merge(child, output);
        },
        checkParent: function (id) {
            var child = this.getChildren(id);
            var flag = false;
            for (var i = 0; i < child.length; i++) {
                var chx = child[i];
                if (this.parentview.selected.indexOf(chx.id) != -1) {
                    flag = true;
                    break;
                }
            }
            return flag;
        },
        removeSelected: function (o, c, p) {
            _.each(c, function (m) {
                if (m.view) {
                    m.view.$el.find(".Chbx").removeClass("Sel");
                } else {
                    m.set("isSelected", false);
                }
                var ind = this.parentview.selected.indexOf(m.id);
                this.parentview.selected.splice(ind, 1);
            }, this);
            _.each(p, function (m) {
                if (!this.checkParent(m.id)) {
                    m.view.$el.find(".Chbx").removeClass("Sel");
                    var ind = this.parentview.selected.indexOf(m.id);
                    if (ind != -1)
                        this.parentview.selected.splice(ind, 1);
                }
            }, this);
        },
        addSelected: function (o, c) {
            _.each(c, function (m) {
                if (m.view) {
                    m.view.$el.find(".Chbx").addClass("Sel");
                } else {
                    m.set("isSelected", true);
                }
                if (this.parentview.selected.indexOf(m.id) == -1)
                    this.parentview.selected.push(m.id);
            }, this);
        },
        SelectItem: function () {
            var $cbx = this.model.view.$el.find(".Chbx");
            if ($cbx.hasClass("Sel2")) return;
            var id = this.model.id;
            var parents = [];
            this.getParents(id, parents);
            var children = this.getChildren(id);

            var flag = $cbx.hasClass("Sel"); // checked
            if (flag) {
                $cbx.removeClass("Sel");
                this.removeSelected(this.model.id, children, parents);
            } else {
                $cbx.addClass("Sel");
                this.addSelected(this.model.id, $.merge(children, parents));
            }
            this.parentview.select(this.parentview.selected);
        },
        selectcollection: function (v, add) {
            if (add) {
                this.parentview.selected.push(v);
            } else {
                var ind = this.parentview.selected.indexOf(v);
                this.parentview.selected.splice(ind, 1);
            }
            this.parentview.selected = $.unique(this.parentview.selected);
        },
        viewList: function () {
            if (this.parentview.operation) {
                if ($.type(this.parentview.operation) === "string") {
                    // in PanelModel
                    Backbone.trigger(this.parentview.operation, this.model);
                } else if ($.type(this.parentview.operation) === "function") {
                    this.parentview.operation.call(this, this.model);
                }
            } else {
                Backbone.trigger(":P", { cmd: "c", model: this.model });
            }
            this.parentview.$el.find("div.Select").removeClass("Select");
            this.$el.addClass("Select");
            // это для инициализации панели редактирования
            this.parentview.trigger("mark", this.model);
        },
        openClose1: function () {
            if (this.model.get("children") == 0) return;

            if (!this.$el.data("isopen")) { // rendering children
                this.$el.data("isopen", "1");
                this.renderChildren();
            }
            this.$el.children("span.OpenClose:first").toggleClass("Open");
            this.Container.slideToggle('normal');
        },
        openClose: function () {
            if (!this.$el.data("isopen")) { // rendering children
                this.$el.data("isopen", "1");
                var ctx = this.renderChildren(this.model.id);
                //if (!this.model.get("children") || !ctx)
                //    this.$el.find(".OpenClose").addClass("Not");
            }
            var o = this;
            var l = o.parentview.opened;
            if (l.length) {
                if (l.indexOf(this.model.id) != -1) {
                    this.$el.children("span.OpenClose:first").toggleClass("Open");
                    this.Container.slideToggle('normal');
                }
            } else {
                this.$el.children("span.OpenClose:first").toggleClass("Open");
                this.Container.slideToggle('normal');
            }
        },
        initialize: function (o) {
            this.parentview = o.parentView;
            if (this.parentview.itemtemplate) this.template = this.parentview.itemtemplate;
            else this.template = treeElementTempalate;
            this.ajax = this.parentview.ajax;
            this.isedit = this.parentview.isedit;
            this.Container = $("<div class='Container'></div>");
            this.Container.attr("data-id", this.model.id);
            this.model.view = this;
        },

        render: function () {

            var data = this.model.toJSON();
            data.linktofile = baseurl + '/files/details/' + this.model.id;
            this.$el.html(_.template(this.template)(data));

            var current = this.parentview.currentid || (App.Select.get("list") ? App.Select.get("list").indexOf("=") == -1 ? App.Select.get("list") : App.Select.get("params").id : 0);

            if (this.parentview.markCurrent && current == this.model.id) {
                this.$el.addClass("Select");
                this.parentview.trigger("mark", this.model);
            }
            return this;
        },

        renderChildren: function () {
            var col = this.parentview.collection.where({ parentid: this.model.id });
            for (var i = 0; i < col.length; i++) {
                var m = col[i];
                var el = new treeElementView({ model: m, parentView: this.parentview }).render();
                this.Container.append(el.$el);
                this.Container.append(el.Container);
            }
            return col.length;
        }
    });


    var treeElement = Backbone.Model.extend({
        defaults: function () {
            return {
                title: "",
                id: null,
                parentid: 0,
                isopen: false,
                isset: false,
                children: 0,
                iconexist: false,
                isdoc: false,
                parameters: []
            };
        }
    });

    var treeCollection = Backbone.Collection.extend({
        model: treeElement,
        url: function () { return ("/api/" + App.Select.get("query")); }
    });

    var treeView = Backbone.View.extend({
        el: $("#Query .Present"),
        level: 1,
        Container: $(),
        viewparameters: false,
        openLevelOf: 1,
        itemtemplate: null,
        selectedModel: null,        // выделенная модель
        markCurrent: false,         // раскрытие до уровня текущего объекта и выделение его 
        operation: "",              // выполнить операцию, передается название функции, если не пустая аякс не отправляется
        opened: [],                 // массив расскрытых элементов в дереве
        selected: [],               // масив для выбранных элементов, деревья с возможностью выбора (checkbox, radio)
        select: function () { },      // пустая функция для обработки события выбора элемента
        branch: { parentid: "0" },  // показваемая ветвь в дереве объект формат {parentid:A, id:B} - (можно добавить id элемента с которого начать показ дерева, парент не показывается)


        complete: function (model) {     // окончание построения дерева
            return this;
        },
        done: function (fn, ctx) {
            this.callback = fn;
            this.context = ctx || this;
            if (this.collection.length && fn) {
                this.callback.call(this.context, this.collection);
            }
            return this;
        },
        plugins: function () {
            if (this.model) {
                var isedit = this.model.get("present").isedit || false;
                if (isedit && App.check(this.model.get("present").edit_id)) {
                    //
                    //
                    //
                    require(['@/views/toolbar/EditPanel'], function (EditPanel) {
                        this.EP = new EditPanel({ view: this });
                        this.Container.prepend(this.EP.$el.css({ "position": "absolute", "top": 0 }));
                        this.$el.scroll(function () { this.EP.$el.css("top", $(this).scrollTop()); }.bind(this));
                    }.bind(this));
                }
            }
        },
        mark: function (model) {
            if (this.EP)
                this.EP.Select(model);
            this.selectedModel = model;
        },
        clear: function () {
            this.$el.find("div.Select").removeClass("Select");
            App.Select.set("list", null);
            App.navigate(App.Select.fullpath());
        },
        add: function (model) {
            var el = new treeElementView({ model: model, parentView: this }).render();
            var parentid = model.get("parentid");
            var $c = parentid == "0" ? this.Container : this.$el.find("div[data-id=" + model.get("parentid") + "]");
            if ($c.is(":hidden")) {
                $c.slideToggle('normal');
                $c.prev("div").children("span.OpenClose:first").toggleClass("Open");
            }
            $c.append(el.$el);
            $c.append(el.Container);
            this.$el.scrollTop(el.$el.position().top);
        },
        destroy: function (model) {
            model.view.$el.remove();
            model.view.Container.remove();
            var p = this.collection.get(model.get("parentid"));
            if (p) {
                p.view.$el.addClass("Select");
                this.trigger("mark", p);
            }
            this.EP.clear();
        },
        change: function (model) {
            var $c = this.$el.find("div[data-id=" + model.id + "]");
            $c.prev("div").children("span.TreeElementTitle").text(model.get("title"));
        },
        initialize: function (o) {
            this.options = o || {};
            this.on("mark", this.mark);
            this.on("clear", this.clear);
            this.opened = [];

            this.openLevelOf = this.options.openLevel ? this.options.openLevel : this.openLevelOf;
            if (this.model) {
                this.openLevelOf = this.options.openLevel ? this.options.openLevel : (this.model.get("present").level || this.openLevelOf);
                this.operation = this.model.get("present").operation || this.options.operation;
                this.ajax = this.model.get("present").ajax;
                this.bottom = this.model.get("bottomWin") || null;
            }

            if (this.options.markCurrent)
                this.markCurrent = this.options.markCurrent;
            else {
                this.markCurrent = false;
            }

            var filter = this.options.filter;
            this.collection = new treeCollection();
            if (this.options.api) this.collection.url = this.options.api;
            if (this.options.itemtemplate) this.itemtemplate = this.options.itemtemplate;
            if (this.options.branch) this.branch = this.options.branch;
            if (this.options.currentid) this.currentid = this.options.currentid;

            this.collection.on('add', this.add, this);
            this.collection.on('destroy', this.destroy, this);
            this.collection.on("change", this.change, this);

            this.parentid = this.options.parentid || "0";
            if (!filter) {
                this.collection.on('reset', this.render, this);
            }

            //this.$el.showIndicator();
            var s = this;
            this.collection.fetch({
                reset: true,
                error: function (model, response) {
                    $.Error(response);
                },
                success: function () {
                    if (filter) {
                        s.away(filter, s);
                    }
                }
            });
        },
        setOptions: function () {
            if ($.type(arguments[0]) == "object") {
                // todo:   
            } else {
                this[arguments[0]] = arguments[1];
            }
            return this;
        },

        render: function () {
            this.level = 0;
            this.$el.empty();
            this.opened = [];
            this.Container = $("<div class='Tree'></div>");
            this.$el.append(this.Container);
            this.plugins();

            if (this.collection.length) {
                if (this.markCurrent) {
                    // берем всех парентов для выбранного элемента
                    var current = this.currentid || App.Select.get("list");
                    this.getOpenParent(current);
                    this.opened = this.opened.reverse();
                    if (current)
                        this.opened.push(current);
                }

                var col = new Backbone.Collection(this.collection.where(this.branch));
                this.total = col.length;
                col.each(this.buildTree, this);

            } else this.$el.hideIndicator();
            return this;
        },
        getOpenParent: function (id) {
            var m = this.collection.get(id);
            if (m) {
                var pid = m.get("parentid");
                if (pid) {
                    this.opened.push(pid);
                    this.getOpenParent(pid);
                }
            }
        },
        buildTree: function (model) {
            this.counter++;
            if (this.opened.length == 1 && this.opened.indexOf(model.id) == -1) {
                this.opened = [];
            }
            var el = new treeElementView({ model: model, parentView: this }).render();
            this.Container.append(el.$el);
            this.Container.append(el.Container);
            //open level 1
            el.openClose();
            this.openlevel(el);
        },
        openlevel: function (el) {
            this.level++;
            var br = el.model.id;
            if (this.opened.indexOf(br) != -1) {
                this._each(el);
            } else
                if (this.level < this.openLevelOf) {
                    this._each(el);
                }
            if (this.total === this.counter) {
                var s = this;
                if (this.callback) {
                    _.defer(function () {
                        s.callback.call(s.context, s);
                    });
                }

                setTimeout(function () {
                    if (s.selectedModel) {
                        s.$el.scrollTop(s.selectedModel.view.$el.position().top);
                    }
                }, 500);

                this.$el.hideIndicator();
            }
        },
        counter: 0,
        total: 0,
        _each: function (el) {
            var s = this;
            var containers = el.Container.children("div.Container");
            this.total += containers.size();
            containers.each(function () {
                var pid = $(this).attr("data-id");
                var m = s.collection.get(pid);
                m.view.openClose();
                s.openlevel(m.view);
                s.level--;
                s.counter++;
            });

        },
        away: function (filter, self) {
            if (!self) self = this;
            if (self.collection.length) {
                self.newCollection = new Backbone.Collection();
                for (var i = 0; i < filter.length; i++) {
                    self._filter(filter[i]);
                }
                self.collection = self.newCollection;
                self.render();
            }
            return this;
        },
        // не вызывать на прямую!
        _filter: function (typeid) {
            if (typeid != 0) {
                if (!this.newCollection.where({ id: typeid.toString() })[0]) {
                    var obj = this.collection.where({ id: typeid.toString() })[0];
                    if (obj) {
                        this.newCollection.add(obj);
                        return this._filter(obj.get("parentid"));
                    }
                }
            }
        }
    });

    return treeView;
});
