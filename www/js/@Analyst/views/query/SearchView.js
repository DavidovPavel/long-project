define([
'app',
'i18n!nls/resources.min',
'text!@/templates/search/globalTemplate.html'
],
function (App,        Resources,        searchTemplate) {

    var searchView = Backbone.View.extend({
        el: $("#Query section.Present"),
        events: {
            "click button[name=search]": "start",
            "click div.ViewSelect": "selectFilter",
            "click div.ClearValue": "clearFilter"
        },
        clearFilter: function() {
            this.$("input[name=typeid]").val("");
            this.$("input[name=type]").val("");
        },
        selectFilter: function () {
            
            Backbone.trigger("choice:view", this.model);
        },
        start: function () {
            let param = {
                "text": this.$("input[name=search]").val(),
                "typeid": this.$("input[name=typeid]").val(),
                "type": this.$("input[name=type]").val()
            };
            App.Select.set("list", $.param(param));

            App.navigate(App.Select.fullpath());
            Backbone.trigger(":P", { cmd: "c" });
        },
        initialize: function () {
            this.model = new Backbone.Model({ ParametrType: "Type" });
            this.model.on("choice:close", collection=> {
                if (collection.size()) {
                    this.$("input[name=type]").val(collection.pluck("title"));
                    this.$("input[name=typeid]").val(collection.pluck("id"));
                }
            });
        },
        render: function() {
            var data = { Resources: Resources };
            this.$el.html(_.template(searchTemplate)( data));
            var p = App.Select.get("params");
            if (p && p.text) {
                this.$("input[name=search]").val(decodeURIComponent(p.text).replace(/\+/g, " "));
                this.$("input[name=type]").val(decodeURIComponent(p.type ? decodeURIComponent(p.type) : ""));
                this.$("input[name=typeid]").val(p.typeid);
                Backbone.trigger(":P", { cmd: "c" });
            }
        }
    });
    var s = new searchView;
    return {
        get: function() {
            return s;
        }
    }
});