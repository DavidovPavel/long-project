define(['app'],function(App) {
    "use strict";
    return Backbone.View.extend({
        originalEvents: {
            "click .sources":"sources",
            "click .check": "check",
            "click .search": "search",
            "click .create": "create",
            "click .clear": "clear",
            "click label": "label",
            "click .Rbtn": "rbtn",
            "click .Cbx": "chbx"
        },
        addEvents: {},
        events:function() {
            return _.extend({ }, this.originalEvents, this.addEvents);
        },
        initialize: function () {
            this.model.on("invalid", this.markError, this);
        },
        getlist:function(o) {
            var List = require("@/views/ListView");
            this.result = new List({
                el: o.$el,
                api: function () { return ("/api/List/?" + o.param); },
                templ: o.templ,
                headerTemplate: o.head,
                operation: function (model) {
                    //Backbone.trigger("goto:object", model.id);
                }
            });
        },
        sources: function () {
            this.model.set($.GetData(this.$el));

            if (App.Select.get("detail"))
                this.model.set("id", parseInt(App.Select.get("detail")));
            
            if (this.model.isValid())
                Backbone.trigger("toolsbar:sources", this.model);
        },
        check: function () {
            this.model.set($.GetData(this.$el));
            if (this.model.isValid()) {
                // for expressdossier
                //Backbone.trigger("navigate:check", this.model.toJSON());
                //Backbone.trigger("toolsbar:created");
            }
        },
        update: function () {
            var s = this;
            this.model.save([], {
                success: function (model) {
                    Backbone.trigger("toolsbar:created");
                    Backbone.trigger("patt:updated", model.id);
                    s.clear();
                }
            });
        },
        create: function (flag) {
            var s = this;
            var data = {};
            if ($.type(flag) === "object") {
                data = $.GetData(this.$el);
            } else if(!flag) {
                data = $.GetData(this.$el);
            }
            this.model.save(data, {
                success: function(model, response) {
                    Backbone.trigger("toolsbar:created");
                    Backbone.trigger("goto:object", response);
                    s.clear();
                }
            });
        },
        clear: function () {
            this.$("#SearchResult table.List").empty();
            this.$(".Paging").remove();
            this.$("input").each(function () {
                $(this).css("border-color", "").val("");
            });
            this.$("textarea").each(function () {
                $(this).css("border-color", "").val("");
            });
            var s = this;
            this.$("span.checked").each(function () {
                s.checkBox($(this));
            });
            this.$('#status').html("");
        },
        markError: function (model, error) {
            this.$el.hideIndicator();
            this.$("#info").text("");
            this.$("input").css("border-color", "");
            this.$("textarea").css("border-color", "");
            _.each(error, function (data) {
                if (data.text) {
                    this.$("#info").text(data.text);
                }
                this.$("[name='" + data.name + "']").css("border-color", "red");
            }, this);
        },
        rbtn: function () {
            this.radioButton($(arguments[0].target));
        },
        chbx: function () {
            this.checkBox($(arguments[0].target));
        },
        label: function () {
            var $cbx = $(arguments[0].target).prev("span");
            if ($cbx.get(0)) {
                if ($cbx.hasClass("Cbx"))
                    this.checkBox($cbx);
                else if ($cbx.hasClass("Rbtn"))
                    this.radioButton($cbx);
            }
        },
        checkBox: function ($c) {
            var $p = $c.parent("div");
            if ($c.hasClass("checked")) {
                $c.removeClass("checked");
                $c.find("input").val(false);
                if ($p.hasClass("Parent")) {
                    $p.next("div").find(".Cbx").removeClass("checked");
                }
            } else {
                $c.addClass("checked");
                $c.find("input").val(true);
                if ($p.hasClass("Parent")) {
                    $p.next("div").find(".Cbx").addClass("checked");
                }
            }
        },
        radioButton: function ($r) {
            if (!$r.hasClass("selected")) {
                var name = $r.attr("data-name"), m = $(document).find(".Rbtn[data-name='" + name + "']");
                m.each(function () {
                    $(this).removeClass("selected");
                });
                $r.addClass("selected");
            }
        }
    });

});