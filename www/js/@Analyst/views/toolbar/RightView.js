define([
'app',
'i18n!nls/resources.min',
'@/models/listItemModel',
'@/views/DialogView',
'text!@/templates/rightToolbarTemplate.html',
"@/views/toolbar/ToolsBar"
],
function (App,        Resources,        ListItemModel,        dialogView,        template,        Tools) {

    var panel = Backbone.View.extend({
        className: "PanelWithEars",
        data_id: "E0BEFD51-6632-415A-A30C-D8A5314DF7C5",
        events: {
            "click .AddBasket": "addBasket",
            "click .History": "viewObj",
            "click .EditItem": "editItem",
            "click .DeleteItem": "deleteItem"
        },
        initialize: function (o) {
            this.options = o;
            Backbone.on("patt:updated", this.done, this);
            this.on("select", this.selectList);
            this.calledView = this.options.parent;
            if (App.check(this.data_id)) {

                if (this.calledView.$el.prev(".PanelWithEars").get(0)) {
                    this.calledView.$el.prev(".PanelWithEars").remove();
                }

                this.position(this);

                // panel Ear
                this.earFlag = true;
                this.mout = false;
                var s = this

                function EarEx() {
                    s.$el.fadeTo(1, 1);
                    s.$(".Up").animate({ "top": -12 }, 300);
                    s.$(".Down").animate({ "bottom": -12 }, 300);
                }

                function EarCo() {
                    s.mout = true;
                    if (s.earFlag) {
                        s.$el.fadeTo(1, 0.6);
                        s.$(".Up").animate({ "top": -4 }, 300);
                        s.$(".Down").animate({ "bottom": -4 }, 300);
                    }
                }

                this.$el.fadeTo(1, .6).hover(EarEx, EarCo).draggable({
                    axis: "y",
                    start: function() { s.earFlag = false; },
                    stop: function() {
                        s.earFlag = true;
                        if (s.mout) {
                            EarCo();
                        }
                    }
                });
                // end panel Ear
            }
        },
        render: function() {
            this.$el.css({ "position": "absolute", "top": 10 }).html(_.template(template)( { Resources: Resources })).show();
            return this;
        },
        position: function() {
            var $p = this.calledView.$el;
            this.$el.insertBefore($p);
            var $ep = this.$el;
            $p.scroll(function() {
                $ep.css("top", $(this).position().top);
            });
            if (App.Select.get("detail") && App.check(this.$("#addBasket"))) {
                this.$("#addBasket").show();
            }
        },
        addBasket: function() {
            if (this.model) {
                var ids = this.model.length? _.pluck(this.model, "id"):[this.model.id];
                Backbone.trigger("basket:add", ids);
            }
        },
        checkModel: function() {
            if (this.model)
                return true;
            else {
                if (App.Select.get("detail")) {
                    this.model = new ListItemModel();
                    this.model.url = function() { return "/api/object/" + App.Select.get("detail"); }
                    this.model.fetch();
                    return true;
                } else
                    return false;
            }
        },
        done:function() {
            this.calledView.refresh();
        },

        goin:function(m) {
            var data = m.get("data"),
                links = m.get("links"),
                meta = {};
            
            for(var i = 0;i<links.length;i++) {
                var a = links[i];
                if (a.value == "True")
                    meta = a;
            }
            
            switch (meta.id) {
                case "MetaType.IsSource":
                    Tools.update({ name: "Document", data: data });
                    break;
            }

        },


        editItem: function () {
            if (this.model) {
                if (this.model.length) {
                    this.model = this.model[0];
                }
                
                if (this.model.has("type")&&this.model.get("type") == "Источник") {

                    var m = Backbone.Model.extend({
                        defaults: {
                            id: null,
                            data: [],
                            links: [],
                            href: ""
                        },
                        url: function() { return "/api/object/universal/" + this.id; }
                    });

                    var model = new m({ id: this.model.id });
                    model.on("sync", this.goin, this);
                    model.fetch({ reset: true });
                    
                }else {
                    var dialog = new dialogView({ title: (Resources.propobj + " [" + this.model.get("title") + "]"), height: 300 }).render();
                    dialog.trigger("patt:init", this.model);
                }
            }
        },
        deleteItem: function () {
            if (this.model) {
                if (this.model.length) {
                    this.model = this.model[0];
                }
                if (confirm(Resources.askyousure + "\n" + Resources.warndeleteobj + "[" + this.model.get("title") + "]")) {
                    var _id = this.model.id;
                    this.model.url = function() { return "/api/object/" + _id; }
                    this.model.destroy({
                        success: function() {
                            if (_id == App.Select.get("detail")) {
                                if (App.Select.get("list") == 0) {
                                    App.Select.set("list", null);
                                }
                                Backbone.trigger(":P", { cmd: "c" });
                                Backbone.trigger(":P", { cmd: "d" });
                            }
                        },
                        error: function() {
                            $.Error(arguments);
                        }
                    });
                }
            }
        },
        viewObj: function() {
            if (this.model) {

                if (this.model.length) {
                    this.model = this.model[0];
                }

                Backbone.trigger("general:add", { id: this.model.id, title: this.model.get("title") });
            }
        },
        selectList: function(model) {
            //if (model.length) {
            //    this.model = model[0];
            //} else {
                this.model = model;
            //}
            if (App.check(this.$("#addBasket"))) {
                this.$("#addBasket").show();
                //this.list = list;
            }
        }
    });

    return {
        get: function($el) {
            return new panel({ parent: $el });
        }
    }
});