define(function(require) {

    var Add = require("@/views/add/AddView"),
        App = require("app"),
        Resources = require('i18n!nls/resources.min'),
        List = require("@/views/ListView");

    return Add.extend({

        el: $("#NextPage .Element"),

        addEvents: {
            "click .search": "search",
            "click .create": "save",
            "click #linkToObj": "link",
        },

        link: function () {
            this.flagLink = this.$("#linkToObj").val();
        },

        save: function () {
            this.model.set({
                    title: this.$("textarea").val(),
                    linkid: this.flagLink ? parseInt(this.linkid) : null,
                    linktoid: this.flagLink ? parseInt(this.linktoid) : null
            });
            this.create();
        },

        search: function () {
            var str = { "text": this.$("textarea").val(), "typeid": this.model.get("typeid") },
                searchTemplate = require('text!@/templates/list/listSelectItemTemplate.html');
            this.getlist({ $el: this.$("#SearchResult"), param: $.param(str), templ: searchTemplate, head: "headSelectTemplate" });
        },

        render: function () {

            var template = require("text!@/templates/add/element.html");
            this.$el.html(_.template(template)( { Resources: Resources }));

            if (!App.Select.get("detail")) {
                this.$("input[type=checkbox]").attr("disabled", "disabled");
                this.$(".soObjTitle").text(Resources.notselected);
            } else {
                this.linktoid = App.Select.get("detail");
                this.$("#linkToObj").removeAttr("disabled");
                var so = $("#Details h1");
                this.$(".soObjTitle").text(so.eq(0) ? so.text() : Resources.notselected);
            }

            var s = this;
            var Tree = require("@/views/Tree/TreeView");
            var st = new Tree({el:this.$(".loadTree"), modelName: "Tree", api: "/api/Tree", branch: this.model.get("branch"), markCurrent: true, currentid: this.model.get("typeid").toString() })
                .done(function (v) {
                    var model = v.selectedModel;
                    if (model) {
                        s.getLinksType(model);
                    }
                }).operation = function () {
                    s.getLinksType(this.model);
                }

            this.$el.show();
            return this;
        },
        getLinksType: function (model) {
            var linkTemplate = require('text!@/templates/list/listSelectOneItemTemplate.html');
            this.model.set("typeid", model.id);
            this.$(".titleType").text(model.get("title"));
            if (App.Select.get("detail")) {
                new List({
                    tools: false,
                    el: this.$("#linkList"),
                    api: function () { return ("/api/Links/fortype/?typeid=" + model.id + "&objid=" + App.Select.get("detail")); },
                    templ: linkTemplate,
                    operation: function(m) {
                        this.linkid = m.id;
                    }.bind(this)
                });
            }
        }
    });
});