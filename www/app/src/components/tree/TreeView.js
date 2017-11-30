define(['app', 'storage', 'baseurl', 'i18n!nls/resources.min'], function (App, Storage, baseurl, Resources) {

    var treeElementTempalate = "<% if(status===-1){ %><span style='color:red;'><%= title %><br/><i style='color:grey'><%= msg %></i></span><% }else{ %>"+
        "<span class ='OpenClose <%= children == 0 ?\'Leaf\':(isopen?\'Open\':\'\') %> <%= isdoc?'Doc':iconexist?'':'Noicon' %>' data-id='<%= id %>'></span>"+
        "<% if(iconexist) { %><img src='<%= iconurl %>' alt=''/><% } %>&nbsp; <span class ='TreeElementTitle'><%= title %><%= linkedObjectCount?' ('+linkedObjectCount+')':'' %></span><% } %>",
        
        inputTemplate = "<div class='list-cmd-panel' style='height:auto;'><input type='text' value='<%= title %>' /><span class='cmd edit-view' data-id='<%= id %>'>"+                
                "<button type='button' class='saveitem' data-icon='icon-round-check'></button><button type='button' class='cancelitem' data-icon='icon-round-del'></button></span></div>";

    var treeElementView = Backbone.View.extend({
        className:"item-tree",
        events: {
            "click .OpenClose": "openClose1",
            "click": "viewList",
            "click span.Chbx": "SelectItem"
        },
        getParents: function (id, opened) {
            var m = this.parentview.collection.get(id);
            if (m) {
                opened.push(m);
                let pid = m.get("parentid");
                this.getParents(pid, opened);
            }
        },
        getChildren: function (id) {
            let child = this.parentview.collection.where({ parentid: id }),
                output = [];
            Array.from(child, function (m) { return output = $.merge(output, this.getChildren(m.id)); });
            return $.merge(child, output);
        },
        checkParent: function (id) {
            let child = this.getChildren(id);
            return _.some(child, function (m) { return this.parentview.selected.indexOf(m.id) !== -1 });
        },
        removeSelected: function (o, c, p) {
            Array.from(c, function (m) {
                if (m.view) {
                    m.view.$el.find(".Chbx").removeClass("Sel");
                } else {
                    m.set("isSelected", false);
                }
                let ind = this.parentview.selected.indexOf(m.id);
                this.parentview.selected.splice(ind, 1);
            });
            Array.from(p, function (m) {
                if (!this.checkParent(m.id)) {
                    m.view.$el.find(".Chbx").removeClass("Sel");
                    var ind = this.parentview.selected.indexOf(m.id);
                    if (ind !== -1)
                        this.parentview.selected.splice(ind, 1);
                }
            });
        },
        addSelected: function (o, c) {
            Array.from(c, function (m) {
                if (m.view) {
                    m.view.$el.find(".Chbx").addClass("Sel");
                } else {
                    m.set("isSelected", true);
                }
                if (this.parentview.selected.indexOf(m.id) === -1)
                    this.parentview.selected.push(m.id);
            });
        },
        SelectItem: function (e) {
            e.stopPropagation();
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
        viewList: function (e) {
            if (e.target.tagName === 'INPUT' || $(e.target).closest('.cmd').get(0)) return;
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

            this.mark();
        },
        openClose1: function (e) {
            e.stopPropagation();
            if (this.model.get("children") === 0) return;

            if (!this.$el.data("isopen")) { // rendering children
                this.$el.data("isopen", "1");
                this.renderChildren();
            }
            this.$el.children(".OpenClose").toggleClass("Open");
            this.Container.slideToggle('normal');
        },
        openClose: function () {
            if (!this.$el.data("isopen")) { // rendering children
                this.$el.data("isopen", "1");
                var ctx = this.renderChildren(this.model.id);
                //if (!this.model.get("children") || !ctx)
                //    this.$el.find(".OpenClose").addClass("Not");
            }
            //var o = this;
            //var l = o.parentview.opened;
            //if (l.length && l.indexOf(this.model.id) !== -1) {
            //    this.$el(".OpenClose").toggleClass("Open");
            //    this.Container.slideToggle('normal');
            //} else {
                this.$(".OpenClose").toggleClass("Open");
                this.Container.slideToggle('normal', function () {
                    //console.log("open-close",this.model.id);
                }.bind(this));
            //}
        },
        initialize: function (o) {
            this.options = o;
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

            //data.linktofile = `${baseurl}/files/details/${this.model.id}`;

            this.$el.append(_.template(this.template)(data));
            this.$el.attr("data-id", this.model.id);

            let current = this.parentview.currentid || (App.Select.get("list") ?
                App.Select.get("list").indexOf("=") === -1 ? App.Select.get("list") : App.Select.get("params").id : 0);
            if (this.parentview.markCurrent && current === this.model.id) {
                this.mark();
            }
            return this;
        },
        mark: function () {
            if (this.$(".list-cmd-panel").is(":visible")) return;
            //if (this.parentview.selectedModel && this.parentview.selectedModel.id === this.model.id) {
                //this.$el.removeClass("Select");
                //this.parentview.selectedModel = null;
                //this.parentview.trigger("edit-panel:action:end");
            //} else {
                this.parentview.$el.find("div.Select").removeClass("Select");
                this.$el.addClass("Select");
                this.parentview.selectedModel = this.model;
            //}
            this.parentview.cancelInputTemplate();
        },
        renderChildren: function () {
            let col = this.parentview.collection.where({ parentid: this.model.id });
            Array.from(col, function (m) {
                let el = new treeElementView({ model: m, parentView: this.parentview }).render();
                this.Container.append(el.$el);
                this.Container.append(el.Container);
            }, this);
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
        url: function() { return ("/api/" + App.Select.get("query")); }
    });

    return Backbone.View.extend({
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
        select: function() {},      // пустая функция для обработки события выбора элемента
        branch: { parentid: "0" },  // показваемая ветвь в дереве объект формат {parentid:A, id:B} - (можно добавить id элемента с которого начать показ дерева, парент не показывается)


        events: {
            "click .list-cmd-panel":"stopevent",
            "click .cancelitem": "cancelInputTemplate",
            "click .saveitem": "saveInputItem"
        },

        stopevent:function(e){
            e.stopPropagation();
        },

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

        clear: function () {
            this.$el.find("div.Select").removeClass("Select");
            App.Select.set("list", null);
            App.navigate(App.Select.fullpath());
        },
        add:function(model) {
            var el = new treeElementView({ model: model, parentView: this }).render(),
                parentid = parseInt(model.get("parentid")),
                $c = this.$el.find("div.Container[data-id=" + parentid + "]");

            if ($c.is(":hidden")) {
                $c.slideToggle('normal');
                $c.prev("div").children("span.OpenClose:first").toggleClass("Open");
            }

            $c.append(el.$el);
            $c.append(el.Container);
            //this.$el.scrollTop(el.$el.position().top);
        },
        destroy: function (model) {
            model.view.$el.remove();
            model.view.Container.remove();
        },
        change: function (model) {
            _.each(model.changed, function (v, k) {
                switch (k) {
                    case "title":
                        this.$el.find('div[data-id=' + model.id + ']').prev("div").children("span.TreeElementTitle")
                            .text(model.get("title") + (model.get("linkedObjectCount") ? " (" + model.get("linkedObjectCount") + ")" : ""));
                        break;
                    case "cdate":

                        break;
                }
            }, this);
        },

        saveInputItem: function (e) {
            //e.stopPropagation();
            var $d = $(e.target).closest(".edit-view"),
                id = $d.attr("data-id"),
                name = $.trim($d.prev("input").val());

            if (id){
                if (name && this.selectedModel.get("title") !== name) 
                    this.selectedModel.save({ "title": name });
            } else if (name) {
                var result = {};
                result["title"] = name;
                result["typeid"] = 10001;
                result["parentid"] = this.selectedModel ? this.selectedModel.id : 0;
                result["rubricid"] = this.selectedModel ? this.selectedModel.id : null;

                this.collection.create(result, { wait: true });
            }
            this.cancelInputTemplate();
        },
        addInputTemplate: function () {
            var $i = _.template(inputTemplate)({ id: null, title: "" });
            if (this.selectedModel)
                this.selectedModel.view.Container.show().prepend($i);
            else
                this.Container.prepend($i);
            setTimeout(function(){ this.$(".list-cmd-panel input").focus(); }.bind(this), 100);
        },
        toInputTemplate:function(){           
            if (this.selectedModel) {
                var $i = _.template(inputTemplate)({ id: this.selectedModel.id, title: this.selectedModel.get("title") });
                this.selectedModel.view.$(".TreeElementTitle").hide();
                this.selectedModel.view.$el.append($i);
                setTimeout(function () { this.$(".list-cmd-panel input").focus(); }.bind(this), 100);
            }
        },
        cancelInputTemplate: function (e) {
            //e.stopPropagation();
            this.Container.find(".list-cmd-panel").siblings(".TreeElementTitle").show();
            this.Container.find(".list-cmd-panel").remove();
        },

        // метод-триггер для прослушивания событий
        editPanelAction: function ($e) {
            this.cancelInputTemplate();           
            var action = $e.attr("name");

            if (action === "search") {
                var v = $e.prev("input").val().toLowerCase();
                if ($.trim(v)) {
                    var arr = this.collection.filter(function (a) {
                        return a.get("title").toLowerCase().indexOf(v) !== -1;
                    });
                    this.away(_.pluck(arr, "id"));
                } else {
                    this.away([]);
                }
            }

            if (!this.selectedModel) 
                return this;

            var pid = this.selectedModel.id,
                a = this.collection.where({ parentid: this.selectedModel.get("parentid") }),
                p = this.selectedModel.view.$el.parent().children(".item-tree").index(this.selectedModel.view.$el),
                all = a.length - 1;

            _.sortBy(a, function () { return a.cdate; });

            switch (action) {
                case "add":
                    if (!this.selectedModel.get("isdoc"))
                        this.addInputTemplate();
                    break;
                case "rename": this.toInputTemplate();break;
                case "remove":
                    Backbone.trigger("message:confirm", {
                        title: Resources.askyousure, message: $.Format(Resources.deltext, "", this.selectedModel.get("title")),
                        fx: function () {
                            this.selectedModel.destroy();
                            this.trigger("edit-panel:action:end", "remove");
                        },
                        ctx: this
                    });
                    break;
                case "up":
                    if (p) 
                        this.moveElement(a[p - 1], true);
                    break;
                case "down":
                    if (p < all) 
                        this.moveElement(a[p + 1], false);
                    break;
                case "first":
                    if (p) 
                        this.moveElement(a[0], true);
                    break;
                case "last":
                    if (p < all) 
                        this.moveElement(a[all], false);
                    break;
            }
        },

        moveElement: function (m, isUp) {
            var MIN = 600000000;
            this.selectedModel.save({ cdate: isUp ? (parseInt(m.get("cdate")) - MIN) : (parseInt(m.get("cdate")) + MIN) });
            if (isUp) {
                this.selectedModel.view.$el.insertBefore(m.view.$el);
                this.selectedModel.view.Container.insertAfter(this.selectedModel.view.$el);
            } else {                
                this.selectedModel.view.$el.insertAfter(m.view.Container);
                this.selectedModel.view.Container.insertAfter(this.selectedModel.view.$el);
            }
            this.collection.sort();
        },

        initialize: function(o) {
            this.options = o;
            this.on("clear", this.clear);
            this.opened = [];
           
            this.openLevelOf = this.options.openLevel ? this.options.openLevel : this.openLevelOf;

            if (this.model && this.model.get("present")) {
                this.openLevelOf = this.options.openLevel ? this.options.openLevel : (this.model.get("present").level || this.openLevelOf);
                this.operation = this.model.get("present").operation || this.options.operation;
                this.ajax = this.model.get("present").ajax;
                this.bottom = this.model.get("bottomWin");
            } else {
                this.openLevelOf = this.options.openLevel ? this.options.openLevel : this.openLevelOf;
                this.operation = this.options.operation;
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
            this.collection.comparator = function (m) { return m.get("cdate"); }

            this.parentid = this.options.parentid || "0";

            
            this.collection.fetch({
                reset: true,
                error: function (a, b) {
                    Backbone.trigger("message:warning", { title: Resources.alert, message: b })
                }.bind(this),
                success: function () {
                    
                    if (!filter)
                        this.render();
                    else
                        this.away(filter);
                }.bind(this)
            });
        },

        setOptions: function () {
            if($.type(arguments[0])==="object") {
             // todo:   
            }else {
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
            //this.plugins();
            
            if (this.collection.length) {
                if (this.markCurrent) {
                    // берем всех парентов для выбранного элемента
                    var current = this.currentid || App.Select.get("list");
                    this.getOpenParent(current);
                    this.opened = this.opened.reverse();
                    if (current)
                        this.opened.push(current);
                }

                this.bild(new Backbone.Collection(this.collection.where(this.branch)));

            }

            return this;
        },

        bild:function(col){
            this.total = col.length;
            this.Container.empty();
            col.each(this.buildTree, this);
        },
        getOpenParent: function(id) {
            var m = this.collection.get(id);
            if (m) {
                var pid = m.get("parentid");
                if (pid) {
                    this.opened.push(pid);
                    this.getOpenParent(pid);
                }
            }
        },
        buildTree: function(model) {
            this.counter++;
            if (this.opened.length === 1 && this.opened.indexOf(model.id) === -1) {
                this.opened = [];
            }
            var el = new treeElementView({ model: model, parentView: this }).render();
            this.Container.append(el.$el);
            this.Container.append(el.Container);
            //open level 1
            el.openClose();
            this.openlevel(el);
        },
        openlevel: function(el) {
            this.level++;
            var br = el.model.id;
            if (this.opened.indexOf(br) !== -1) {
                this._each(el);
            } else 
                if (this.level < this.openLevelOf) {
                this._each(el);
            }
            if (this.total === this.counter) {
                if (this.callback)
                    _.defer(function () { this.callback.call(this.context, this.collection) }.bind(this));

                setTimeout(function() { if (this.selectedModel) this.$el.scrollTop(this.selectedModel.view.$el.position().top); }, 500);
                this.$el.hideIndicator();
            }
        },
        counter: 0,
        total: 0,
        _each: function(el) {
            var containers = el.Container.children("div.Container");
            this.total += containers.size();
            containers.each(function (i, e) {
                var pid = $(e).attr("data-id"),
                    m = this.collection.get(pid);
                m.view.openClose();
                this.openlevel(m.view);
                this.level--;
                this.counter++;
            }.bind(this));

        },
        away: function (filter) {

            if (filter.length) {
                this.newCollection = new Backbone.Collection();
                Array.from(filter, this.setcollection, this);
                this.newCollection.add(this.collection.get("-1"));
                this.oldcollection = this.collection;
                this.collection = this.newCollection;
            }

            this.render();
            if (this.oldcollection)
                this.collection = this.oldcollection;
            return this;
        },
        setcollection: function (id) {
            if (id !== "-1") {
                var obj = this.collection.get(id);
                if (obj) {                        
                    this.newCollection.add(obj);
                    return this.setcollection(obj.get("parentid"));
                }
            }
        }
    });
});
