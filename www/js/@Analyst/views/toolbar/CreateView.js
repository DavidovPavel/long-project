define(function(require) {

    var App = require('app'),
        Resources = require('i18n!nls/resources.min'),
        List = require("@/views/ListView"),
        DialogView = require('@/views/DialogView'),
        createTemplate = require('text!@/templates/edit/createTemplate.html'),
        searchTemplate = require('text!@/templates/list/listSelectItemTemplate.html'),
        linkTemplate = require('text!@/templates/list/listSelectOneItemTemplate.html');

    var panel = Backbone.View.extend({
        events: {
            "click .Search": "search",
            "click .Add": "create",
            "click #linkToObj": "link"
        },
        link: function() {
            this.flagLink = this.$("#linkToObj").is(":checked");
        },
        create: function() {
            var title = this.$("textarea").val();
            if (!$.trim(title)) {
                $.Error("Введите наименование");
                return;
            }
            var result = {
                "title": title,
                "typeid": parseInt(this.typeid),
                "linkid": this.flagLink ? parseInt(this.linkid) : null,
                "linktoid": this.flagLink ? parseInt(this.linktoid) : null,
                "rubricid": (App.Select.get("query") === "Rubrics" ? App.Select.get("list") : 0)
            };
            this.model = new Backbone.Model(result);
            this.model.url = function() {
                return "/api/Object/";
            }
            var s = this;
            this.model.save(result, {
                success: function(model, response) {
                    s.dialog.dialog("close");
                    App.navigate(App.Select.get("present") + "|" + App.Select.get("query") + "/0/1/" + response, { trigger: true });
                },
                error: function(model, response) {
                    $.Error(response);
                }
            });
        },
        search: function() {
            var str = { "text": this.$("textarea").val(), "typeid": this.typeid };
            this.result = new List({
                el: this.$("#searchResult"),
                api: function() { return ("/api/List/?" + $.param(str)); },
                templ: searchTemplate,
                operation: function() {
                    App.navigate(App.Select.get("present") + "|Tree/0/1/" + this.model.id, { trigger: true });
                }
            });
        },
        initialize: function() {

        },
        render: function(branch) {
            this.$el.html(_.template(createTemplate)( { Resources: Resources }));
            
            var dialog = new DialogView({ title: Resources.addObject }).render();
            dialog.fill(this.$el);

            if (!App.Select.get("detail")) {
                this.$("input[type=checkbox]").attr("disabled", "disabled");
                this.$(".soObjTitle").text(Resources.notselected);
            } else {
                this.linktoid = App.Select.get("detail");
                this.$("#linkToObj").removeAttr("disabled");
                var so = $("#List table.List td[data-id=" + App.Select.get("detail") + "]");
                this.$(".soObjTitle").text(so.eq(0) ? so.text() : Resources.notselected);
            }

            var s = this;
            this.typeid = branch ? branch.id : (App.Select.get("list") || "10001");
            var Tree = require("@/views/Tree/TreeView");
            var st = new Tree({ modelName: "Tree", api: "/api/Tree", branch: branch, markCurrent: true, currentid: this.typeid })
                .done(function(v) {
                    var model = v.selectedModel;
                    if (model) {
                        s.getLinksType(model);
                    }
                });
            st.setElement(this.$(".loadTree"));
            st.operation = function() {
                s.getLinksType(this.model);
            }
        },
        getLinksType: function(model) {
            var s = this;
            this.typeid = model.id;
            this.$(".titleType").text(model.get("title"));
            if (App.Select.get("detail")) {
                new List({
                    tools: false,
                    el: s.$("#linkList"),
                    api: function() { return ("/api/Links/fortype/?typeid=" + s.typeid + "&objid=" + App.Select.get("detail")); },
                    templ: linkTemplate,
                    operation: function(m) {
                        s.linkid = m.id;
                    }
                });
            }
        }
    });
    return panel;
});