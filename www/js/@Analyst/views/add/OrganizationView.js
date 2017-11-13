define(function(require) {

    var Add = require("@/views/add/AddView"),
        Resources = require('i18n!nls/resources.min');

    return Add.extend({
        el: $("#NextPage .Organization"),
        addEvents: {
            "click .search": "search"
        },
        search: function () {
            this.model.set($.GetData(this.$el));
            if (this.model.isValid()) {
                var str = { "typeid": this.model.get("typeid"), "text": this.model.get("title") };
                var templ = require('text!@/templates/search/listOrgTemplate.html');
                this.getlist({ $el: this.$("#SearchResult"), param: $.param(str), templ:templ, head: "" });
            }
        },
        render:function() {
            var template = require("text!@/templates/add/organization.html");
            this.$el.html(_.template(template)( { Resources: Resources }));
            return this;
        }
    });
});